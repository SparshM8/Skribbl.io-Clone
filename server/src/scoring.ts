/** Pure scoring functions. See docs/GAME_RULES.md for the formulas. */

export const ORDER_BONUS = [50, 30, 15]; // 1st, 2nd, 3rd correct guesser
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export interface GuessScoreInput {
  timeLeftRatio: number; // 0..1, fraction of draw time still left
  guessOrder: number;    // how many players guessed before this one
  streak: number;        // consecutive turns this player guessed correctly before this one
  hidden: boolean;       // hidden word mode is harder, so it pays more
}

export function guesserPoints({ timeLeftRatio, guessOrder, streak, hidden }: GuessScoreInput): number {
  const base = 100 + Math.round(300 * clamp01(timeLeftRatio));
  const order = ORDER_BONUS[guessOrder] ?? 0;
  const streakBonus = Math.min(Math.max(streak, 0), 3) * 10;
  return Math.round((base + order + streakBonus) * (hidden ? 1.25 : 1));
}

/** Drawer earns this for every correct guesser; a fully guessed drawing is worth ~300. */
export const drawerPointsPerGuess = (guesserCount: number) => Math.round(300 / Math.max(1, guesserCount));

/** Flat bonus when at least half the guessers got it. */
export const drawerBonus = (correct: number, guesserCount: number) =>
  correct > 0 && correct * 2 >= guesserCount ? 25 : 0;
