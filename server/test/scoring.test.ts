import test from 'node:test';
import assert from 'node:assert/strict';
import { drawerBonus, drawerPointsPerGuess, guesserPoints } from '../src/scoring.js';

const base = { timeLeftRatio: 1, guessOrder: 0, streak: 0, hidden: false };

test('guesser: time pays, first guess gets the biggest order bonus', () => {
  assert.equal(guesserPoints(base), 450);                          // 100+300 +50
  assert.equal(guesserPoints({ ...base, timeLeftRatio: 0 }), 150); // 100 +50
  assert.equal(guesserPoints({ ...base, timeLeftRatio: 0.5, guessOrder: 1 }), 280); // 100+150 +30
  assert.equal(guesserPoints({ ...base, guessOrder: 3 }), 400);    // no order bonus after 3rd
});

test('guesser: streak bonus is capped at 3 turns', () => {
  assert.equal(guesserPoints({ ...base, streak: 2 }), 470);
  assert.equal(guesserPoints({ ...base, streak: 9 }), 480);
  assert.equal(guesserPoints({ ...base, streak: -4 }), 450);
});

test('guesser: hidden mode multiplies by 1.25, ratio is clamped', () => {
  assert.equal(guesserPoints({ ...base, hidden: true }), 563);
  assert.equal(guesserPoints({ ...base, timeLeftRatio: 7 }), 450);
  assert.equal(guesserPoints({ ...base, timeLeftRatio: -1 }), 150);
});

test('drawer: share per guess and the half-guessed bonus', () => {
  assert.equal(drawerPointsPerGuess(3), 100);
  assert.equal(drawerPointsPerGuess(4), 75);
  assert.equal(drawerPointsPerGuess(0), 300);
  assert.equal(drawerBonus(0, 5), 0);
  assert.equal(drawerBonus(1, 4), 0);
  assert.equal(drawerBonus(2, 4), 25);
  assert.equal(drawerBonus(3, 5), 25);
});
