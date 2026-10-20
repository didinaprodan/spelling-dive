// Turns what the iPhone heard into letters.
// Speech recognition often writes a spoken letter as a word
// ("C" -> "see", "R" -> "are", "Y" -> "why"), so we map those back.

const SOUND_ALIKES = {
  a: ['a', 'ay', 'eh', 'hey'],
  b: ['b', 'be', 'bee', 'bea'],
  c: ['c', 'see', 'sea', 'si', 'cee'],
  d: ['d', 'dee', 'de'],
  e: ['e', 'ee'],
  f: ['f', 'ef', 'eff'],
  g: ['g', 'gee', 'jee', 'ji'],
  h: ['h', 'aitch', 'haitch', 'each', 'ach'],
  i: ['i', 'eye', 'aye', 'ai'],
  j: ['j', 'jay'],
  k: ['k', 'kay', 'okay', 'ok'],
  l: ['l', 'el', 'ell', 'elle'],
  m: ['m', 'em'],
  n: ['n', 'en'],
  o: ['o', 'oh', 'owe'],
  p: ['p', 'pee', 'pea'],
  q: ['q', 'cue', 'queue', 'kew'],
  r: ['r', 'are', 'ar'],
  s: ['s', 'es', 'ess'],
  t: ['t', 'tee', 'tea', 'ti'],
  u: ['u', 'you', 'yu', 'ewe'],
  v: ['v', 'vee'],
  w: ['w'],
  x: ['x', 'ex'],
  y: ['y', 'why', 'wye'],
  z: ['z', 'zee', 'zed'],
};

const LETTER_OF = new Map();
for (const [letter, words] of Object.entries(SOUND_ALIKES)) {
  for (const w of words) LETTER_OF.set(w, letter);
}

/**
 * @param {string} transcript what speech recognition returned
 * @param {string} target the word he is spelling
 * @returns {{letters: string[], heardWholeWord: boolean, unknown: string[]}}
 */
export function lettersFromTranscript(transcript, target) {
  const word = String(target || '').toLowerCase();
  const tokens = String(transcript || '')
    .replace(/[^A-Za-z']+/g, ' ')
    .replace(/'/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const letters = [];
  const unknown = [];
  let sawWord = false;

  for (let i = 0; i < tokens.length; i++) {
    const raw = tokens[i];
    const low = raw.toLowerCase();

    if (low === 'double' && /^(u|you|yu)$/i.test(tokens[i + 1] || '')) {
      letters.push('w');
      i++;
      continue;
    }
    if (low === 'doubleu' || low === 'doubleyou') {
      letters.push('w');
      continue;
    }
    if (LETTER_OF.has(low)) {
      letters.push(LETTER_OF.get(low));
      continue;
    }
    // Dictation writes a run of spoken letters in capitals: "CHAIR", "WH".
    if (raw.length > 1 && raw === raw.toUpperCase()) {
      letters.push(...low.split(''));
      continue;
    }
    if (low === word) {
      sawWord = true;
      continue;
    }
    unknown.push(low);
  }

  return {
    letters,
    heardWholeWord: sawWord && letters.length === 0 && unknown.length === 0,
    unknown,
  };
}
