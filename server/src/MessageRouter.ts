import type { WebSocket } from 'ws';
import { Player } from './Player.js';
import type { Room } from './Room.js';
import type { RoomStore } from './RoomStore.js';
import { ms } from './timing.js';
import { DEFAULT_SETTINGS, sanitizeCustomWords, sanitizeSettings, clamp, clamp01, type Envelope, type Point, type Tool } from './types.js';

/** Per-connection context. */
export interface Ctx {
  player: Player | null;
  room: Room | null;
}

const GRACE_MS = 30_000; // scaled by TIME_SCALE in tests
const cleanName = (n: unknown) => String(n ?? '').trim().replace(/\s+/g, ' ').slice(0, 20);
const raw = (ws: WebSocket, type: string, payload: unknown = {}) => {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type, payload }));
};

type Handler = (ws: WebSocket, ctx: Ctx, payload: any) => void;

export class MessageRouter {
  private handlers: Record<string, Handler> = {
    create_room: (ws, ctx, p) => this.createRoom(ws, ctx, p),
    join_room: (ws, ctx, p) => this.joinRoom(ws, ctx, p),
    leave_room: (ws, ctx) => this.leaveRoom(ws, ctx),
    kick_player: (ws, ctx, p) => this.kickPlayer(ws, ctx, p),
    vote_kick: (ws, ctx, p) => this.voteKick(ws, ctx, p),
    update_avatar: (ws, ctx, p) => this.updateAvatar(ws, ctx, p),
    rejoin: (ws, ctx, p) => this.rejoin(ws, ctx, p),
    list_public_rooms: (ws) => raw(ws, 'public_rooms', {
      rooms: this.store.listPublic().map(r => ({
        code: r.code, players: r.size, max: r.settings.maxPlayers, rounds: r.settings.rounds,
      })),
    }),
    set_ready: (ws, ctx, p) => this.setReady(ws, ctx, p),
    update_settings: (ws, ctx, p) => this.updateSettings(ws, ctx, p),
    start_game: (ws, ctx) => this.startGame(ws, ctx),
    word_chosen: (ws, ctx, p) => this.wordChosen(ws, ctx, p),
    play_again: (ws, ctx) => this.playAgain(ws, ctx),
    chat: (ws, ctx, p) => this.chat(ws, ctx, p),
    guess: (ws, ctx, p) => this.chat(ws, ctx, p), // same pipeline: the Game decides if it is a guess
    draw_start: (ws, ctx, p) => this.drawStart(ws, ctx, p),
    draw_move: (ws, ctx, p) => this.drawMove(ws, ctx, p),
    draw_end: (ws, ctx, p) => this.drawEnd(ws, ctx, p),
    draw_undo: (ws, ctx) => this.drawUndo(ws, ctx),
    canvas_clear: (ws, ctx) => this.canvasClear(ws, ctx),
  };

  constructor(private store: RoomStore) {}

  handle(ws: WebSocket, ctx: Ctx, data: string) {
    let msg: Envelope;
    try { msg = JSON.parse(data); } catch { return raw(ws, 'error', { message: 'Invalid JSON' }); }
    if (!msg || typeof msg.type !== 'string') return raw(ws, 'error', { message: 'Missing type' });
    const h = this.handlers[msg.type];
    if (!h) return raw(ws, 'error', { message: `Unknown type: ${msg.type}` });
    try { h(ws, ctx, msg.payload ?? {}); }
    catch (e) { console.error(e); raw(ws, 'error', { message: 'Server error' }); }
  }

  /** Called when a socket closes. Keeps the seat for a grace period. */
  onDisconnect(ctx: Ctx) {
    const { player, room } = ctx;
    if (!player || !room) return;
    player.detach();
    room.broadcast('player_left', { playerId: player.id, temporary: true, room: room.snapshot() });
    player.graceTimer = setTimeout(() => {
      if (player.connected) return;
      room.leave(player.id);
      if (room.isEmpty) {
        room.dispose();
        this.store.delete(room.code);
      } else {
        room.broadcast('player_left', { playerId: player.id, temporary: false, room: room.snapshot() });
      }
    }, ms(GRACE_MS));
  }

  // ---------- handlers ----------

  private need(ws: WebSocket, ctx: Ctx): { player: Player; room: Room } | null {
    if (!ctx.player || !ctx.room) { raw(ws, 'error', { message: 'Join a room first' }); return null; }
    return { player: ctx.player, room: ctx.room };
  }

  private createRoom(ws: WebSocket, ctx: Ctx, p: any) {
    if (ctx.room) return raw(ws, 'error', { message: 'Already in a room' });
    const name = cleanName(p.hostName);
    if (!name) return raw(ws, 'error', { message: 'Name required' });
    const player = new Player(name, ws, p.avatar);
    const room = this.store.create(player, sanitizeSettings(p.settings, DEFAULT_SETTINGS));
    room.customWords = sanitizeCustomWords(p.customWords);
    ctx.player = player; ctx.room = room;
    raw(ws, 'room_joined', { you: player.id, token: player.token, room: room.snapshot() });
  }

  private joinRoom(ws: WebSocket, ctx: Ctx, p: any) {
    if (ctx.room) return raw(ws, 'error', { message: 'Already in a room' });
    const room = this.store.get(String(p.roomCode ?? '').trim());
    if (!room) return raw(ws, 'error', { message: 'Room not found' });
    if (room.phase !== 'LOBBY') return raw(ws, 'error', { message: 'Game already started' });
    if (room.isFull) return raw(ws, 'error', { message: 'Room is full' });
    const name = cleanName(p.playerName);
    if (!name) return raw(ws, 'error', { message: 'Name required' });
    if (room.nameTaken(name)) return raw(ws, 'error', { message: 'Name already taken' });

    const player = new Player(name, ws, p.avatar);
    room.addPlayer(player);
    ctx.player = player; ctx.room = room;
    raw(ws, 'room_joined', { you: player.id, token: player.token, room: room.snapshot() });
    room.broadcast('player_joined', { player: player.toPublic(room.hostId), room: room.snapshot() }, player.id);
  }

  private rejoin(ws: WebSocket, ctx: Ctx, p: any) {
    const room = this.store.get(String(p.roomCode ?? ''));
    const player = room?.findByToken(String(p.token ?? ''));
    if (!room || !player) return raw(ws, 'rejoin_failed', {});
    player.attach(ws);
    ctx.player = player; ctx.room = room;
    raw(ws, 'room_joined', { you: player.id, token: player.token, room: room.snapshot() });
    room.broadcast('player_reconnected', { playerId: player.id, room: room.snapshot() }, player.id);
    room.game?.sendStateTo(player);
  }

  private setReady(ws: WebSocket, ctx: Ctx, p: any) {
    const c = this.need(ws, ctx); if (!c) return;
    if (c.room.phase !== 'LOBBY') return;
    c.player.ready = !!p.ready;
    c.room.broadcast('lobby_update', { room: c.room.snapshot() });
  }

  private updateSettings(ws: WebSocket, ctx: Ctx, p: any) {
    const c = this.need(ws, ctx); if (!c) return;
    if (c.player.id !== c.room.hostId) return raw(ws, 'error', { message: 'Host only' });
    if (c.room.phase !== 'LOBBY') return raw(ws, 'error', { message: 'Game in progress' });
    const next = sanitizeSettings(p.settings, c.room.settings);
    next.maxPlayers = Math.max(next.maxPlayers, c.room.size); // can't kick people by lowering the cap
    c.room.settings = next;
    if (p.customWords !== undefined) c.room.customWords = sanitizeCustomWords(p.customWords);
    c.room.broadcast('lobby_update', { room: c.room.snapshot() });
  }

  private startGame(ws: WebSocket, ctx: Ctx) {
    const c = this.need(ws, ctx); if (!c) return;
    if (c.player.id !== c.room.hostId) return raw(ws, 'error', { message: 'Host only' });
    if (c.room.phase !== 'LOBBY') return;
    if (c.room.connectedCount < 2) return raw(ws, 'error', { message: 'Need at least 2 players' });
    const waiting = c.room.list.filter(p => p.id !== c.room.hostId && !p.ready);
    if (waiting.length) return raw(ws, 'error', { message: 'Everyone must be ready' });
    c.room.startGame();
  }

  private wordChosen(ws: WebSocket, ctx: Ctx, p: any) {
    const c = this.need(ws, ctx); if (!c) return;
    if (!c.room.game?.chooseWord(c.player, p.word)) raw(ws, 'error', { message: 'Cannot choose that word' });
  }

  private playAgain(ws: WebSocket, ctx: Ctx) {
    const c = this.need(ws, ctx); if (!c) return;
    if (c.player.id !== c.room.hostId) return raw(ws, 'error', { message: 'Host only' });
    if (c.room.phase !== 'GAME_OVER') return;
    c.room.resetToLobby();
  }

  private chat(ws: WebSocket, ctx: Ctx, p: any) {
    const c = this.need(ws, ctx); if (!c) return;
    const text = String(p.text ?? '').trim().slice(0, 200);
    if (!text) return;
    if (c.room.phase === 'DRAWING' && c.room.game) return c.room.game.handleChat(c.player, text);
    c.room.broadcast('chat_message', { playerId: c.player.id, playerName: c.player.name, text, channel: 'all' });
  }

  private drawStart(ws: WebSocket, ctx: Ctx, p: any) {
    const c = this.need(ws, ctx); if (!c) return;
    const game = c.room.game;
    if (c.room.phase !== 'DRAWING' || !game || c.player.id !== game.currentDrawerId) return;

    const strokeId = String(p.strokeId ?? '').trim().slice(0, 64);
    if (!strokeId) return;
    const tool: Tool = p.tool === 'eraser' ? 'eraser' : 'brush';
    const color = typeof p.color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(p.color) ? p.color : '#000000';
    const size = clamp(p.size, 1, 40, 4);
    const x = clamp01(p.x, 0);
    const y = clamp01(p.y, 0);

    game.handleDrawStart(c.player, strokeId, tool, color, size, { x, y });
  }

  private drawMove(ws: WebSocket, ctx: Ctx, p: any) {
    const c = this.need(ws, ctx); if (!c) return;
    const game = c.room.game;
    if (c.room.phase !== 'DRAWING' || !game || c.player.id !== game.currentDrawerId) return;

    const strokeId = String(p.strokeId ?? '').trim().slice(0, 64);
    if (!strokeId || !Array.isArray(p.points)) return;
    const points: Point[] = p.points.slice(0, 100).map((pt: any) => ({
      x: clamp01(pt?.x, 0),
      y: clamp01(pt?.y, 0),
    }));
    if (points.length === 0) return;

    game.handleDrawMove(c.player, strokeId, points);
  }

  private drawEnd(ws: WebSocket, ctx: Ctx, p: any) {
    const c = this.need(ws, ctx); if (!c) return;
    const game = c.room.game;
    if (c.room.phase !== 'DRAWING' || !game || c.player.id !== game.currentDrawerId) return;

    const strokeId = String(p.strokeId ?? '').trim().slice(0, 64);
    if (!strokeId) return;

    game.handleDrawEnd(c.player, strokeId);
  }

  private drawUndo(ws: WebSocket, ctx: Ctx) {
    const c = this.need(ws, ctx); if (!c) return;
    const game = c.room.game;
    if (c.room.phase !== 'DRAWING' || !game || c.player.id !== game.currentDrawerId) return;

    game.handleDrawUndo(c.player);
  }

  private canvasClear(ws: WebSocket, ctx: Ctx) {
    const c = this.need(ws, ctx); if (!c) return;
    const game = c.room.game;
    if (c.room.phase !== 'DRAWING' || !game || c.player.id !== game.currentDrawerId) return;

    game.handleCanvasClear(c.player);
  }

  private leaveRoom(ws: WebSocket, ctx: Ctx) {
    const { player, room } = ctx;
    if (!player || !room) return;
    room.leave(player.id);
    ctx.player = undefined as any;
    ctx.room = undefined as any;
    if (room.isEmpty) {
      room.dispose();
      this.store.delete(room.code);
    } else {
      room.broadcast('player_left', { playerId: player.id, temporary: false, room: room.snapshot() });
    }
  }

  private updateAvatar(ws: WebSocket, ctx: Ctx, p: any) {
    const c = this.need(ws, ctx); if (!c) return;
    if (p.avatar) {
      c.player.avatar = p.avatar;
      c.room.broadcast('lobby_update', { room: c.room.snapshot() });
    }
  }

  private kickPlayer(ws: WebSocket, ctx: Ctx, p: any) {
    const c = this.need(ws, ctx); if (!c) return;
    if (c.player.id !== c.room.hostId) return raw(ws, 'error', { message: 'Host only' });
    const targetId = String(p.playerId ?? '');
    if (targetId === c.player.id) return raw(ws, 'error', { message: 'Cannot kick yourself' });
    const target = c.room.getPlayer(targetId);
    if (!target) return;

    target.send('kicked', { message: 'You were kicked from the room by the host.' });
    c.room.leave(targetId);
    if (c.room.isEmpty) {
      c.room.dispose();
      this.store.delete(c.room.code);
    } else {
      c.room.broadcast('player_left', { playerId: targetId, temporary: false, room: c.room.snapshot() });
      c.room.broadcast('chat_message', {
        id: Math.random().toString(),
        playerId: '',
        playerName: '',
        text: `${target.name} was kicked by the host.`,
        type: 'system',
        channel: 'all',
      });
    }
  }

  private voteKick(ws: WebSocket, ctx: Ctx, p: any) {
    const c = this.need(ws, ctx); if (!c) return;
    const targetId = String(p.playerId ?? '');
    if (targetId === c.player.id) return raw(ws, 'error', { message: 'Cannot vote kick yourself' });
    const target = c.room.getPlayer(targetId);
    if (!target) return;

    if (c.player.id === c.room.hostId) {
      return this.kickPlayer(ws, ctx, p);
    }

    const res = c.room.voteKick(c.player.id, targetId);
    if (res.kicked) {
      target.send('kicked', { message: 'You were votekicked from the room.' });
      c.room.leave(targetId);
      if (c.room.isEmpty) {
        c.room.dispose();
        this.store.delete(c.room.code);
      } else {
        c.room.broadcast('player_left', { playerId: targetId, temporary: false, room: c.room.snapshot() });
        c.room.broadcast('chat_message', {
          id: Math.random().toString(),
          playerId: '',
          playerName: '',
          text: `${target.name} was votekicked by majority vote.`,
          type: 'system',
          channel: 'all',
        });
      }
    } else {
      c.room.broadcast('vote_kick_update', {
        targetId,
        targetName: target.name,
        votes: res.votes,
        needed: res.needed,
      });
    }
  }
}
