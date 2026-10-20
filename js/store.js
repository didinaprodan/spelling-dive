// Progress lives on the phone (localStorage). Everything is wrapped in try/catch:
// a private window or blocked storage must not break the game.

const KEY = 'spelling-dive.v1';
const MAX_GAP_MS = 30_000; // time between taps counted as practice, at most

function fresh() {
  return {
    v: 1,
    mastered: {},   // word -> first time spelled right from memory (ms)
    stats: {},      // word -> { ok, bad, voiceOk, last }
    creatures: {},  // creature id -> unlocked at (ms)
    days: {},       // 'YYYY-MM-DD' -> practice seconds
    tests: [],      // { at, score, total, wrong: [] }
    settings: { rate: 0.8, record: true, recordConflict: false },
  };
}

let state = load();
let lastActive = 0;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const parsed = JSON.parse(raw);
    const base = fresh();
    return { ...base, ...parsed, settings: { ...base.settings, ...(parsed.settings || {}) } };
  } catch {
    return fresh();
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: keep playing in memory */
  }
}

export function dayKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const store = {
  get: () => state,

  /** Count practice time: the gap since the previous tap, capped. */
  touch() {
    const now = Date.now();
    if (lastActive) {
      const gap = Math.min(now - lastActive, MAX_GAP_MS);
      const k = dayKey();
      state.days[k] = (state.days[k] || 0) + gap / 1000;
    }
    lastActive = now;
    save();
  },

  isMastered: (word) => Boolean(state.mastered[word]),
  hasCreature: (id) => Boolean(state.creatures[id]),
  creatureCount: () => Object.keys(state.creatures).length,
  masteredCount: () => Object.keys(state.mastered).length,

  /** Returns true when this was the first word ever spelled right. */
  recordAnswer(word, ok, { voice = false, fromMemory = true } = {}) {
    const s = (state.stats[word] ||= { ok: 0, bad: 0, voiceOk: 0, last: 0 });
    s.last = Date.now();
    let firstEver = false;
    if (ok) {
      s.ok++;
      if (voice) s.voiceOk++;
      if (fromMemory && !state.mastered[word]) {
        firstEver = Object.keys(state.mastered).length === 0;
        state.mastered[word] = Date.now();
      }
    } else {
      s.bad++;
    }
    save();
    return firstEver;
  },

  unlockCreature(id) {
    if (state.creatures[id]) return false;
    state.creatures[id] = Date.now();
    save();
    return true;
  },

  addTest(result) {
    state.tests.push({ at: Date.now(), ...result });
    save();
  },

  setSetting(key, value) {
    state.settings[key] = value;
    save();
  },

  reset() {
    state = fresh();
    save();
  },
};
