import test from 'node:test';
import assert from 'node:assert/strict';
import { classify, containsWord, levenshtein, normalize } from '../src/GuessMatcher.js';

test('normalize: case, trim, whitespace, accents, punctuation', () => {
  assert.equal(normalize('  Ice   CREAM '), 'ice cream');
  assert.equal(normalize('Café'), 'cafe');
  assert.equal(normalize('ice-cream!'), 'ice cream');
});

test('classify: correct', () => {
  assert.equal(classify('cat', 'cat'), 'correct');
  assert.equal(classify('  CaT  ', 'cat'), 'correct');
  assert.equal(classify('ice-cream', 'ice cream'), 'correct');
  assert.equal(classify('icecream', 'ice cream'), 'correct');
  assert.equal(classify('cafe', 'café'), 'correct');
});

test('classify: close needs exactly one edit and a 4+ letter word', () => {
  assert.equal(classify('hose', 'house'), 'close');   // deletion
  assert.equal(classify('houses', 'house'), 'close'); // insertion
  assert.equal(classify('mouse', 'house'), 'close');  // substitution
  assert.equal(classify('cats', 'cat'), 'wrong');     // word too short
  assert.equal(classify('hoses', 'house'), 'wrong');  // two edits
});

test('classify: wrong, including empty input', () => {
  assert.equal(classify('dog', 'cat'), 'wrong');
  assert.equal(classify('   ', 'cat'), 'wrong');
  assert.equal(classify('', 'cat'), 'wrong');
});

test('containsWord: whole word inside a sentence only', () => {
  assert.equal(containsWord('is it a cat?', 'cat'), true);
  assert.equal(containsWord('category', 'cat'), false);
  assert.equal(containsWord('cat', 'cat'), false); // exact match is "correct", not "contains"
  assert.equal(containsWord('is it ice cream', 'ice cream'), true);
});

test('levenshtein', () => {
  assert.equal(levenshtein('abc', 'abc'), 0);
  assert.equal(levenshtein('abc', 'abd'), 1);
  assert.equal(levenshtein('abc', 'abcd'), 1);
  assert.equal(levenshtein('abc', 'xyz'), 2); // capped: "more than one"
});
