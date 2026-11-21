import { Game } from './Game.js';
import type { Player } from './Player.js';
import type { Phase, RoomSettings } from './types.js';

export class Room {
  phase: Phase = 'LOBBY';
  hostId: string;
  customWords: string[] = [];
  game: Game | null = null;
  private players = new Map<string, Player>();

  constructor(
    public readonly code: string,
    host: Player,
    public settings: RoomSettings,
  ) {
    this.hostId = host.id;
    this.players.set(host.id, host);
  }

  get size() { return this.players.size; }
  get isFull() { return this.size >= this.settings.maxPlayers; }
  get isEmpty() { return this.size === 0; }
  get list(): Player[] { return [...this.players.values()]; }
  get connectedCount() { return this.list.filter(p => p.connected).length; }

  getPlayer(id: string) { return this.players.get(id); }
  findByToken(token: string) { return this.list.find(p => p.token === token); }
  nameTaken(name: string) {
    return this.list.some(p => p.name.toLowerCase() === name.toLowerCase());
  }

  addPlayer(p: Player) { this.players.set(p.id, p); }

  private kickVotes = new Map<string, Set<string>>();

  /** Removes a player and hands host to the next connected player if needed. */
  removePlayer(id: string) {
    this.players.delete(id);
    this.kickVotes.delete(id);
    for (const voters of this.kickVotes.values()) {
      voters.delete(id);
    }
    if (id === this.hostId) {
      const next = this.list.find(p => p.connected) ?? this.list[0];
      if (next) this.hostId = next.id;
    }
  }

  voteKick(voterId: string, targetId: string): { kicked: boolean; votes: number; needed: number } {
    if (voterId === targetId) return { kicked: false, votes: 0, needed: 0 };
    if (!this.players.has(targetId)) return { kicked: false, votes: 0, needed: 0 };

    let voters = this.kickVotes.get(targetId);
    if (!voters) {
      voters = new Set();
      this.kickVotes.set(targetId, voters);
    }
    voters.add(voterId);

    const needed = Math.floor(this.connectedCount / 2) + 1;
    if (voters.size >= needed) {
      this.kickVotes.delete(targetId);
      return { kicked: true, votes: voters.size, needed };
    }
    return { kicked: false, votes: voters.size, needed };
  }

  getKickVotes(targetId: string): { votes: number; needed: number } {
    const voters = this.kickVotes.get(targetId);
    const votes = voters ? voters.size : 0;
    const needed = Math.floor(this.connectedCount / 2) + 1;
    return { votes, needed };
  }

  /** Permanent leave: remove, then let the running game react. */
  leave(id: string) {
    this.removePlayer(id);
    this.game?.onPlayerRemoved(id);
  }

  startGame() {
    this.game?.dispose();
    this.game = new Game(this);
    this.game.start();
  }

  /** After GAME_OVER: back to the lobby with fresh scores. */
  resetToLobby() {
    this.dispose();
    this.phase = 'LOBBY';
    for (const p of this.list) { p.score = 0; p.ready = false; }
    this.broadcast('lobby_update', { room: this.snapshot() });
  }

  /** Stop timers. Call before discarding the room. */
  dispose() {
    this.game?.dispose();
    this.game = null;
  }

  broadcast(type: string, payload: unknown = {}, exceptId?: string) {
    for (const p of this.players.values()) {
      if (p.id !== exceptId) p.send(type, payload);
    }
  }

  snapshot() {
    return {
      code: this.code,
      phase: this.phase,
      hostId: this.hostId,
      settings: this.settings,
      customWordCount: this.customWords.length, // the words themselves stay private
      players: this.list.map(p => p.toPublic(this.hostId)),
    };
  }
}
