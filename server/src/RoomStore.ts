import type { Player } from './Player.js';
import { Room } from './Room.js';
import type { RoomSettings } from './types.js';

/** Swap this interface's implementation (e.g. Redis) to scale beyond one process. */
export interface RoomStore {
  create(host: Player, settings: RoomSettings): Room;
  get(code: string): Room | undefined;
  delete(code: string): void;
  listPublic(): Room[];
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

export class InMemoryRoomStore implements RoomStore {
  private rooms = new Map<string, Room>();

  private makeCode(): string {
    for (;;) {
      let code = '';
      for (let i = 0; i < 5; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      if (!this.rooms.has(code)) return code;
    }
  }

  create(host: Player, settings: RoomSettings) {
    const room = new Room(this.makeCode(), host, settings);
    this.rooms.set(room.code, room);
    return room;
  }
  get(code: string) {
    const clean = String(code ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return this.rooms.get(clean);
  }
  delete(code: string) {
    const clean = String(code ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    this.rooms.delete(clean);
  }
  listPublic() {
    return [...this.rooms.values()].filter(r => !r.settings.isPrivate && r.phase === 'LOBBY' && !r.isFull);
  }
}
