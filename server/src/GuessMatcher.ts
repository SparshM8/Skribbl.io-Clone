export type Verdict = 'correct' | 'close' | 'wrong';

/**
 * Canonical form used for comparing guesses: no accents, lowercase,
 * punctuation turned into spaces, whitespace collapsed ("Ice-Cream " → "ice cream").
 */
export function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const compact = (s: string) => s.replace(/ /g, '');

/** Edit distance capped at 2 (meaning "two or more"): we only care whether it is 0, 1, or more. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 1) return 2;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return Math.min(prev[b.length], 2);
}

/**
 * correct: same after normalizing (also ignoring spaces, so "icecream" = "ice cream")
 * close:   exactly one edit away, and the word is at least 4 letters (short words are too easy to hit by luck)
 * wrong:   anything else
 */
export function classify(guess: string, word: string): Verdict {
  const g = normalize(guess);
  const w = normalize(word);
  if (!g) return 'wrong';
  if (g === w || compact(g) === compact(w)) return 'correct';
  if (w.length >= 4 && levenshtein(g, w) === 1) return 'close';
  return 'wrong';
}

/** True if the guess contains the whole word inside a longer sentence ("is it a cat?"). */
export function containsWord(guess: string, word: string): boolean {
  const g = normalize(guess);
  const w = normalize(word);
  if (!w || g === w) return false;
  return ` ${g} `.includes(` ${w} `);
}
