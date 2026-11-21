import wordsData from './words/words.json' with { type: 'json' };
import type { WordMode } from './types.js';

type Difficulty = 1 | 2 | 3;
interface Entry { word: string; difficulty: Difficulty }

const BUILTIN: Entry[] = Object.values(
  wordsData as Record<string, { word: string; difficulty: number }[]>,
).flat().map(e => ({ word: e.word.toLowerCase(), difficulty: e.difficulty as Difficulty }));

const rand = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Hint shown to guessers: unrevealed letters are "_", spaces are kept, revealed letters
 * (by index in the word) are shown. Hidden mode shows only "?".
 */
export function maskWord(word: string, mode: WordMode, revealed: ReadonlySet<number> = new Set()): string {
  if (mode === 'hidden') return '?';
  return word.split('').map((c, i) => (c === ' ' ? ' ' : revealed.has(i) ? c : '_')).join(' ');
}

/** One instance per game: remembers which words were already used so they don't repeat. */
export class WordService {
  private pool: Entry[];
  private used = new Set<string>();

  constructor(customWords: string[] = []) {
    const byWord = new Map<string, Entry>();
    for (const e of BUILTIN) byWord.set(e.word, e);
    for (const w of customWords) byWord.set(w, { word: w, difficulty: 2 });
    this.pool = [...byWord.values()];
  }

  /**
   * Returns `count` distinct options. Difficulty cycles easy → medium → hard so the
   * drawer always has a mix to choose from. Combination mode joins two easy/medium words.
   */
  pick(count: number, mode: WordMode): string[] {
    const options: string[] = [];
    const taken = new Set<string>();
    for (let i = 0; i < count; i++) {
      if (mode === 'combination') {
        const simple = (e: Entry) => e.difficulty <= 2 && !e.word.includes(' ');
        const a = this.draw(simple, taken);
        const b = this.draw(simple, taken);
        options.push(`${a} ${b}`);
      } else {
        const diff = ((i % 3) + 1) as Difficulty;
        options.push(this.draw(e => e.difficulty === diff, taken));
      }
    }
    return options;
  }

  markUsed(word: string) {
    this.used.add(word);
    word.split(' ').forEach(part => this.used.add(part));
  }

  /** Random unused entry matching `prefer`; falls back to any unused, then resets history. */
  private draw(prefer: (e: Entry) => boolean, taken: Set<string>): string {
    const free = (e: Entry) => !this.used.has(e.word) && !taken.has(e.word);
    let candidates = this.pool.filter(e => free(e) && prefer(e));
    if (!candidates.length) candidates = this.pool.filter(free);
    if (!candidates.length) {
      this.used.clear();
      candidates = this.pool.filter(e => !taken.has(e.word));
    }
    const word = rand(candidates.length ? candidates : this.pool).word;
    taken.add(word);
    return word;
  }
}
