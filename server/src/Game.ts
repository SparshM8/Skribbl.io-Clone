import { classify, containsWord } from './GuessMatcher.js';
import type { Player } from './Player.js';
import type { Room } from './Room.js';
import { drawerBonus, drawerPointsPerGuess, guesserPoints } from './scoring.js';
import { StrokeBuffer } from './StrokeBuffer.js';
import { ms } from './timing.js';
import type { Point, Tool } from './types.js';
import { WordService, maskWord } from './WordService.js';

export type EndReason = 'time_up' | 'drawer_left' | 'all_guessed';
export type GameOverReason = 'completed' | 'not_enough_players';
type Channel = 'all' | 'guessed' | 'self';

const PICK_MS = 15_000;
const ROUND_END_MS = 5_000;

const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Game state machine for one room. It never touches sockets: it talks to players
 * through Room.broadcast and Player.send.
 *
 *   WORD_PICK → DRAWING → ROUND_END → (next turn) WORD_PICK … → GAME_OVER
 *
 * One "phase timer" is alive at a time (pick timeout → draw timeout → round-end pause).
 * Hint reveals use their own small list of timers, cleared whenever a turn ends.
 *
 * Turn order is a snapshot of the connected players at start. Turn i is drawn by
 * order[i % n]. Players who left (or are offline) are skipped.
 */
export class Game {
  private readonly words: WordService;
  private readonly order: string[];
  private readonly totalTurns: number;
  private turnIndex = 0;
  private drawerId: string | null = null;
  private word: string | null = null;
  private wordOptions: string[] = [];
  private hint = '';
  private endsAt = 0;
  private drawMs = 0;
  private timer: NodeJS.Timeout | null = null;
  private hintTimers: NodeJS.Timeout[] = [];

  // per-turn state
  private guessed = new Set<string>();
  private gains: Record<string, number> = {};
  private revealed = new Set<number>();
  private strokes = new StrokeBuffer();

  // per-game state
  private streaks = new Map<string, number>();      // consecutive turns guessed correctly
  private firstGuesses = new Map<string, number>(); // tie-breaker

  constructor(private readonly room: Room) {
    this.words = new WordService(room.customWords);
    this.order = room.list.filter(p => p.connected).map(p => p.id);
    this.totalTurns = room.settings.rounds * this.order.length;
  }

  private get settings() { return this.room.settings; }

  // ---------- public API (called by Room / MessageRouter) ----------

  start() {
    this.room.list.forEach(p => { p.score = 0; });
    this.nextTurn();
  }

  /** Drawer picks one of the offered words. Returns false if the request is invalid. */
  chooseWord(player: Player, word: unknown): boolean {
    if (this.room.phase !== 'WORD_PICK' || player.id !== this.drawerId) return false;
    const choice = String(word ?? '').trim().toLowerCase();
    if (!this.wordOptions.includes(choice)) return false;
    this.beginDrawing(choice);
    return true;
  }

  /**
   * Every text message from a player during DRAWING lands here.
   *  - drawer / players who already guessed: private "guessed" channel (no spoilers)
   *  - correct guess: points, announced without the text
   *  - close guess: private "so close" to that player only
   *  - sentence containing the word: swallowed, echoed to the sender only
   *  - anything else: normal chat for everyone
   */
  handleChat(player: Player, text: string) {
    const word = this.word;
    if (this.room.phase !== 'DRAWING' || !word) return this.say(player, text, 'all');

    if (player.id === this.drawerId || this.guessed.has(player.id)) {
      return this.say(player, text, 'guessed');
    }
    switch (classify(text, word)) {
      case 'correct':
        return this.award(player, word);
      case 'close':
        return player.send('close_guess', { text });
      default:
        return this.say(player, text, containsWord(text, word) ? 'self' : 'all');
    }
  }

  /** A player was permanently removed (grace period over). */
  onPlayerRemoved(playerId: string) {
    const phase = this.room.phase;
    if (phase === 'LOBBY' || phase === 'GAME_OVER') return;
    if (this.room.size < 2) return this.endGame('not_enough_players');
    if (playerId === this.drawerId && (phase === 'WORD_PICK' || phase === 'DRAWING')) {
      this.endTurn('drawer_left');
    } else {
      this.checkAllGuessed(); // the missing player may have been the last one we were waiting for
    }
  }

  /** Full state for a player who reconnected. */
  sendStateTo(player: Player) {
    const isDrawer = player.id === this.drawerId;
    const phase = this.room.phase;
    player.send('game_state', {
      phase,
      ...this.turnInfo(),
      drawerId: this.drawerId,
      hint: this.hint,
      endsAt: this.endsAt,
      scores: this.scores(),
      guessedIds: [...this.guessed],
      ...(isDrawer && phase === 'WORD_PICK' ? { wordOptions: this.wordOptions } : {}),
      ...((isDrawer || this.guessed.has(player.id)) && phase === 'DRAWING' ? { word: this.word } : {}),
    });
    if (phase === 'DRAWING') {
      player.send('canvas_sync', { strokes: this.strokes.snapshot() });
    }
  }

  get currentDrawerId(): string | null {
    return this.drawerId;
  }

  handleDrawStart(player: Player, strokeId: string, tool: Tool, color: string, size: number, point: Point): boolean {
    if (this.room.phase !== 'DRAWING' || player.id !== this.drawerId) return false;
    const stroke = this.strokes.addStart(strokeId, tool, color, size, point);
    if (!stroke) return false;
    this.room.broadcast('draw_data', { op: 'start', stroke }, this.drawerId);
    return true;
  }

  handleDrawMove(player: Player, strokeId: string, points: Point[]): boolean {
    if (this.room.phase !== 'DRAWING' || player.id !== this.drawerId) return false;
    if (!this.strokes.addPoints(strokeId, points)) return false;
    this.room.broadcast('draw_data', { op: 'move', strokeId, points }, this.drawerId);
    return true;
  }

  handleDrawEnd(player: Player, strokeId: string): boolean {
    if (this.room.phase !== 'DRAWING' || player.id !== this.drawerId) return false;
    this.room.broadcast('draw_data', { op: 'end', strokeId }, this.drawerId);
    return true;
  }

  handleDrawUndo(player: Player): boolean {
    if (this.room.phase !== 'DRAWING' || player.id !== this.drawerId) return false;
    const undone = this.strokes.undo();
    if (!undone) return false;
    this.room.broadcast('stroke_undone', { strokeId: undone.id });
    return true;
  }

  handleCanvasClear(player: Player): boolean {
    if (this.room.phase !== 'DRAWING' || player.id !== this.drawerId) return false;
    this.strokes.clear();
    this.room.broadcast('canvas_clear', {}, this.drawerId);
    return true;
  }

  dispose() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.clearHints();
  }

  // ---------- state transitions ----------

  private nextTurn() {
    while (this.turnIndex < this.totalTurns) {
      const drawer = this.room.getPlayer(this.order[this.turnIndex % this.order.length]);
      if (drawer?.connected) return this.beginWordPick(drawer);
      this.turnIndex++;
    }
    this.endGame('completed');
  }

  private beginWordPick(drawer: Player) {
    this.drawerId = drawer.id;
    this.word = null;
    this.hint = '';
    this.guessed = new Set();
    this.gains = {};
    this.revealed = new Set();
    this.wordOptions = this.words.pick(this.settings.wordCount, this.settings.wordMode);
    this.room.phase = 'WORD_PICK';
    this.schedule(PICK_MS, () => this.beginDrawing(this.randomOption()));

    const base = { ...this.turnInfo(), drawerId: drawer.id, endsAt: this.endsAt };
    for (const p of this.room.list) {
      // Only the drawer ever receives the options.
      p.send('round_start', p.id === drawer.id ? { ...base, wordOptions: this.wordOptions } : base);
    }
  }

  private beginDrawing(word: string) {
    if (this.room.phase !== 'WORD_PICK') return;
    this.word = word;
    this.words.markUsed(word);
    this.hint = maskWord(word, this.settings.wordMode);
    this.room.phase = 'DRAWING';
    this.strokes.clear();
    this.drawMs = this.schedule(this.settings.drawTime * 1000, () => this.endTurn('time_up'));
    this.scheduleHints(word);

    const base = { drawerId: this.drawerId, hint: this.hint, endsAt: this.endsAt };
    for (const p of this.room.list) {
      p.send('drawing_start', p.id === this.drawerId ? { ...base, word } : base);
    }
  }

  private endTurn(reason: EndReason) {
    const wasDrawing = this.room.phase === 'DRAWING';
    if (!wasDrawing && this.room.phase !== 'WORD_PICK') return;
    this.room.phase = 'ROUND_END';
    this.clearHints();
    if (wasDrawing) this.settleTurn(reason);

    this.room.broadcast('round_end', {
      word: this.word, // null if the drawer left before choosing
      reason,
      gains: this.gains,
      scores: this.scores(),
      nextDrawerId: this.peekNextDrawer(),
    });
    this.schedule(ROUND_END_MS, () => { this.turnIndex++; this.nextTurn(); });
  }

  /** End-of-turn bookkeeping: drawer bonus and guess streaks. */
  private settleTurn(reason: EndReason) {
    const guessers = this.room.list.filter(p => p.id !== this.drawerId);
    const drawer = this.drawerId ? this.room.getPlayer(this.drawerId) : undefined;
    if (drawer && reason !== 'drawer_left') {
      this.addPoints(drawer, drawerBonus(this.guessed.size, guessers.length));
    }
    for (const p of guessers) {
      this.streaks.set(p.id, this.guessed.has(p.id) ? (this.streaks.get(p.id) ?? 0) + 1 : 0);
    }
  }

  private endGame(reason: GameOverReason) {
    this.dispose();
    this.room.phase = 'GAME_OVER';
    const leaderboard = [...this.room.list].sort(
      (a, b) =>
        b.score - a.score ||
        (this.firstGuesses.get(b.id) ?? 0) - (this.firstGuesses.get(a.id) ?? 0) ||
        a.name.localeCompare(b.name),
    );
    const top = leaderboard[0]?.score ?? 0;
    const hostId = this.room.hostId;
    this.room.broadcast('game_over', {
      reason,
      winner: leaderboard[0]?.toPublic(hostId) ?? null,
      winners: leaderboard.filter(p => p.score === top).map(p => p.toPublic(hostId)),
      leaderboard: leaderboard.map(p => p.toPublic(hostId)),
    });
  }

  // ---------- guessing ----------

  private award(player: Player, word: string) {
    const order = this.guessed.size;
    const ratio = this.drawMs > 0 ? (this.endsAt - Date.now()) / this.drawMs : 0;
    const points = guesserPoints({
      timeLeftRatio: ratio,
      guessOrder: order,
      streak: this.streaks.get(player.id) ?? 0,
      hidden: this.settings.wordMode === 'hidden',
    });
    this.guessed.add(player.id);
    if (order === 0) this.firstGuesses.set(player.id, (this.firstGuesses.get(player.id) ?? 0) + 1);
    this.addPoints(player, points);

    const drawer = this.drawerId ? this.room.getPlayer(this.drawerId) : undefined;
    if (drawer) {
      const guesserCount = this.room.list.filter(p => p.id !== this.drawerId).length;
      this.addPoints(drawer, drawerPointsPerGuess(guesserCount));
    }

    // Announce without the guess text. Only the guesser is told the word.
    const base = { correct: true, playerId: player.id, playerName: player.name, points, scores: this.scores() };
    for (const p of this.room.list) {
      p.send('guess_result', p.id === player.id ? { ...base, word } : base);
    }
    this.checkAllGuessed();
  }

  private checkAllGuessed() {
    if (this.room.phase !== 'DRAWING') return;
    const guessers = this.room.list.filter(p => p.id !== this.drawerId && p.connected);
    if (guessers.length > 0 && guessers.every(p => this.guessed.has(p.id))) {
      this.endTurn('all_guessed');
    }
  }

  private addPoints(player: Player, points: number) {
    if (points <= 0) return;
    player.score += points;
    this.gains[player.id] = (this.gains[player.id] ?? 0) + points;
  }

  private say(player: Player, text: string, channel: Channel) {
    const payload = { playerId: player.id, playerName: player.name, text, channel };
    if (channel === 'self') return player.send('chat_message', payload);
    for (const p of this.room.list) {
      const insider = p.id === this.drawerId || this.guessed.has(p.id);
      if (channel === 'all' || insider) p.send('chat_message', payload);
    }
  }

  // ---------- hints ----------

  /** Reveals `hints` letters at evenly spaced times, never more than half the letters. */
  private scheduleHints(word: string) {
    const { hints, wordMode, drawTime } = this.settings;
    if (!hints || wordMode === 'hidden') return;
    const positions = [...word].flatMap((c, i) => (c === ' ' ? [] : [i]));
    const count = Math.min(hints, Math.floor(positions.length / 2));
    const order = shuffle(positions);
    for (let i = 1; i <= count; i++) {
      const at = ms((drawTime * 1000 * i) / (hints + 1));
      this.hintTimers.push(setTimeout(() => this.revealLetter(word, order[i - 1]), at));
    }
  }

  private revealLetter(word: string, position: number) {
    if (this.room.phase !== 'DRAWING') return;
    this.revealed.add(position);
    this.hint = maskWord(word, this.settings.wordMode, this.revealed);
    for (const p of this.room.list) {
      if (p.id !== this.drawerId) p.send('hint_update', { hint: this.hint });
    }
  }

  private clearHints() {
    this.hintTimers.forEach(clearTimeout);
    this.hintTimers = [];
  }

  // ---------- helpers ----------

  /** Replaces the phase timer. Duration is scaled by TIME_SCALE. Sets endsAt, returns the scaled duration. */
  private schedule(durationMs: number, fn: () => void): number {
    if (this.timer) clearTimeout(this.timer);
    const d = ms(durationMs);
    this.endsAt = Date.now() + d;
    this.timer = setTimeout(fn, d);
    return d;
  }

  private randomOption() {
    return this.wordOptions[Math.floor(Math.random() * this.wordOptions.length)];
  }

  private peekNextDrawer(): string | null {
    for (let i = this.turnIndex + 1; i < this.totalTurns; i++) {
      const p = this.room.getPlayer(this.order[i % this.order.length]);
      if (p?.connected) return p.id;
    }
    return null;
  }

  private turnInfo() {
    return {
      round: Math.floor(this.turnIndex / this.order.length) + 1,
      totalRounds: this.settings.rounds,
      turn: this.turnIndex + 1,
      totalTurns: this.totalTurns,
    };
  }

  private scores(): Record<string, number> {
    return Object.fromEntries(this.room.list.map(p => [p.id, p.score]));
  }
}
