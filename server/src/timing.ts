/**
 * Every server timer goes through ms(). Set TIME_SCALE=0.1 to run a whole game
 * ten times faster (used by the scripted tests). Defaults to real time.
 */
const raw = Number(process.env.TIME_SCALE ?? 1);
const SCALE = Number.isFinite(raw) && raw > 0 ? raw : 1;
export const ms = (n: number) => Math.max(1, Math.round(n * SCALE));
