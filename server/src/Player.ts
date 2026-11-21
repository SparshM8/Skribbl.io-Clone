import { randomUUID } from 'node:crypto';
import type { WebSocket } from 'ws';

export class Player {
  readonly id = randomUUID();
  /** Secret used to rejoin after a dropped connection. */
  readonly token = randomUUID();
  score = 0;
  ready = false;
  connected = true;
  avatar?: any;
  graceTimer: NodeJS.Timeout | null = null;

  constructor(public name: string, public socket: WebSocket | null, avatar?: any) {
    this.avatar = avatar;
  }

  send(type: string, payload: unknown = {}) {
    if (this.socket && this.socket.readyState === this.socket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
    }
  }

  attach(socket: WebSocket) {
    this.socket = socket;
    this.connected = true;
    if (this.graceTimer) clearTimeout(this.graceTimer);
    this.graceTimer = null;
  }

  detach() {
    this.socket = null;
    this.connected = false;
  }

  /** Safe to send to other players (no token). */
  toPublic(hostId?: string) {
    return {
      id: this.id,
      name: this.name,
      score: this.score,
      ready: this.ready,
      connected: this.connected,
      isHost: this.id === hostId,
      avatar: this.avatar,
    };
  }
}
