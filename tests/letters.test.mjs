import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lettersFromTranscript } from '../js/letters.js';

const L = (t, target = 'chair') => lettersFromTranscript(t, target).letters.join('');

test('plain spaced letters', () => {
  assert.equal(L('C H A I R'), 'chair');
  assert.equal(L('s k y', 'sky'), 'sky');
});

test('letters heard as sound-alike words', () => {
  assert.equal(L('see h a eye are'), 'chair');
  assert.equal(L('Bee oh oh kay', 'book'), 'book');
  assert.equal(L('tea double you oh', 'two'), 'two');
  assert.equal(L('ess kay why', 'sky'), 'sky');
  assert.equal(L('Gee are e e n', 'green'), 'green');
  assert.equal(L('b l you e', 'blue'), 'blue');
  assert.equal(L('each'), 'h');
  assert.equal(L('okay', 'k'), 'k');
});

test('dots, hyphens and commas between letters', () => {
  assert.equal(L('T. W. O.', 'two'), 'two');
  assert.equal(L('b-o-o-k', 'book'), 'book');
  assert.equal(L('c, h, a, i, r'), 'chair');
});

test('the word said before and after the spelling is ignored', () => {
  assert.equal(L('chair C H A I R chair'), 'chair');
  assert.equal(L('Chair. C H A I R.'), 'chair');
});

test('uppercase run is dictation of spelled letters', () => {
  assert.equal(L('CHAIR'), 'chair');
  assert.equal(L('WH I T E', 'white'), 'white');
});

test('only the word itself means he said the word, not the letters', () => {
  const r = lettersFromTranscript('chair', 'chair');
  assert.deepEqual(r.letters, []);
  assert.equal(r.heardWholeWord, true);
  assert.equal(lettersFromTranscript('Chair', 'chair').heardWholeWord, true);
});

test('unknown words are reported, not turned into letters', () => {
  const r = lettersFromTranscript('c hair', 'chair');
  assert.deepEqual(r.letters, ['c']);
  assert.deepEqual(r.unknown, ['hair']);
  assert.equal(r.heardWholeWord, false);
});

test('double u in two words', () => {
  assert.equal(L('double you h i t e', 'white'), 'white');
  assert.equal(L('double u i n d o double u', 'window'), 'window');
});

test('empty transcript', () => {
  const r = lettersFromTranscript('', 'chair');
  assert.deepEqual(r.letters, []);
  assert.equal(r.heardWholeWord, false);
});
