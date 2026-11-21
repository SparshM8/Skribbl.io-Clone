export type Phase = 'LOBBY' | 'WORD_PICK' | 'DRAWING' | 'ROUND_END' | 'GAME_OVER';
export type WordMode = 'normal' | 'hidden' | 'combination';

export interface RoomSettings {
  maxPlayers: number; // 2-20
  rounds: number;     // 2-10
  drawTime: number;   // 15-240 s
  wordCount: number;  // 1-5
  hints: number;      // 0-5
  wordMode: WordMode;
  isPrivate: boolean;
}

export const DEFAULT_SETTINGS: RoomSettings = {
  maxPlayers: 8,
  rounds: 3,
  drawTime: 80,
  wordCount: 3,
  hints: 2,
  wordMode: 'normal',
  isPrivate: true,
};

export const clamp = (n: unknown, min: number, max: number, fallback: number) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback;
};

export const clamp01 = (n: unknown, fallback = 0) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback;
};

export type Tool = 'brush' | 'eraser';

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  tool: Tool;
  color: string;
  size: number;
  points: Point[];
}

/** Never trust client settings: clamp every field to the allowed range. */
export function sanitizeSettings(input: any, base: RoomSettings = DEFAULT_SETTINGS): RoomSettings {
  const s = input ?? {};
  const modes: WordMode[] = ['normal', 'hidden', 'combination'];
  return {
    maxPlayers: clamp(s.maxPlayers, 2, 20, base.maxPlayers),
    rounds: clamp(s.rounds, 2, 10, base.rounds),
    drawTime: clamp(s.drawTime, 15, 240, base.drawTime),
    wordCount: clamp(s.wordCount, 1, 5, base.wordCount),
    hints: clamp(s.hints, 0, 5, base.hints),
    wordMode: modes.includes(s.wordMode) ? s.wordMode : base.wordMode,
    isPrivate: typeof s.isPrivate === 'boolean' ? s.isPrivate : base.isPrivate,
  };
}

/** Wire format: every message is { type, payload } */
export interface Envelope {
  type: string;
  payload?: any;
}

/** Host-supplied words: lowercase, 2-24 chars, letters/digits/spaces only, max 100. */
export function sanitizeCustomWords(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const out = new Set<string>();
  for (const item of input) {
    const w = String(item ?? '').toLowerCase().trim().replace(/\s+/g, ' ');
    if (w.length >= 2 && w.length <= 24 && /^[\p{L}\p{N} ]+$/u.test(w)) out.add(w);
    if (out.size >= 100) break;
  }
  return [...out];
}
