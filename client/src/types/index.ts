export type Phase = 'LOBBY' | 'WORD_PICK' | 'DRAWING' | 'ROUND_END' | 'GAME_OVER';
export type WordMode = 'normal' | 'hidden' | 'combination';
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

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  wordCount: number;
  hints: number;
  wordMode: WordMode;
  isPrivate: boolean;
}

export interface AvatarConfig {
  colorIndex: number;
  eyesIndex: number;
  mouthIndex: number;
  skinIndex?: number;
  hairStyle?: number;
  hairColor?: number;
  eyesStyle?: number;
  eyewearStyle?: number;
  outfitStyle?: number;
  outfitColor?: number;
}

export interface PublicPlayer {
  id: string;
  name: string;
  score: number;
  ready: boolean;
  connected: boolean;
  isHost: boolean;
  avatar?: AvatarConfig;
}

export interface RoomSnapshot {
  code: string;
  phase: Phase;
  hostId: string;
  settings: RoomSettings;
  customWordCount?: number;
  players: PublicPlayer[];
}

export interface ChatMessage {
  id: string;
  playerId?: string;
  playerName?: string;
  text: string;
  type: 'chat' | 'system' | 'guess_correct' | 'close' | 'join' | 'leave';
  channel?: 'all' | 'guessed' | 'self';
}

export interface RoundEndData {
  word: string | null;
  reason: 'all_guessed' | 'time_up' | 'drawer_left';
  gains: Record<string, number>;
  scores: Record<string, number>;
  nextDrawerId: string | null;
}

export interface GameOverData {
  reason: 'completed' | 'not_enough_players';
  winner: PublicPlayer | null;
  winners: PublicPlayer[];
  leaderboard: PublicPlayer[];
}
