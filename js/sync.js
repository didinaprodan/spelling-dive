// Sends practice events to the parent's own Google Sheet (an Apps Script web app).
// The web-app address is pasted on the parent screen and stays on this phone only.
// Events wait in an outbox, so practice without internet is sent later.

import { store, dayKey } from './store.js';
import { CREATURES } from './data.js';

const OUTBOX = 'spelling-dive.outbox';
const MAX_OUTBOX = 3000;
let sending = false;

function readOutbox() {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX) || '[]');
  } catch {
    return [];
  }
}

function writeOutbox(list) {
  try {
    localStorage.setItem(OUTBOX, JSON.stringify(list.slice(-MAX_OUTBOX)));
  } catch {
    /* storage full or blocked: drop silently */
  }
}

function deviceId() {
  const s = store.get().settings;
  if (!s.deviceId) store.setSetting('deviceId', Math.random().toString(36).slice(2, 10));
  return store.get().settings.deviceId;
}

function todayMinutes() {
  return Math.round(((store.get().days[dayKey()] || 0) / 60) * 10) / 10;
}

export const sync = {
  url: () => store.get().settings.syncUrl || '',
  pending: () => readOutbox().length,
  lastSent: () => store.get().settings.syncLastSent || 0,

  /** Queue one event; it is sent right away when a sheet is connected. */
  send(event) {
    if (!sync.url()) return;
    const at = event.at || Date.now();
    const list = readOutbox();
    list.push({ day: dayKey(new Date(at)), minutes: todayMinutes(), ...event, at });
    writeOutbox(list);
    sync.flush();
  },

  async flush() {
    const url = sync.url();
    if (!url || sending || !navigator.onLine) return;
    const batch = readOutbox().slice(0, 200);
    if (!batch.length) return;
    sending = true;
    try {
      // no-cors + text/plain: a "simple" request Apps Script accepts without a preflight.
      // The response is opaque, so a resolved fetch counts as delivered.
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ device: deviceId(), events: batch }),
      });
      const rest = readOutbox().slice(batch.length);
      writeOutbox(rest);
      store.setSetting('syncLastSent', Date.now());
      sending = false;
      if (rest.length) sync.flush();
    } catch {
      sending = false; // offline or blocked: try again later
    }
  },

  /** Save the sheet address and send everything already learned on this phone. */
  connect(url) {
    const clean = String(url || '').trim();
    const wasEmpty = !sync.url();
    store.setSetting('syncUrl', clean);
    if (!clean) {
      writeOutbox([]);
      return;
    }
    if (wasEmpty) sync.backfill();
    sync.send({ type: 'ping', detail: 'connected' });
  },

  /** History from before the sheet was connected. */
  backfill() {
    const s = store.get();
    const events = [];
    for (const [word, at] of Object.entries(s.mastered)) {
      events.push({ type: 'answer', word, ok: true, mode: 'scan', at, detail: 'history' });
    }
    for (const [word, st] of Object.entries(s.stats)) {
      for (let i = 0; i < (st.bad || 0); i++) {
        events.push({ type: 'answer', word, ok: false, mode: 'scan', at: st.last || Date.now(), detail: 'history' });
      }
    }
    for (const [id, at] of Object.entries(s.creatures)) {
      events.push({ type: 'creature', word: CREATURES[id]?.name || id, at, detail: 'history' });
    }
    for (const t of s.tests) {
      events.push({ type: 'test', at: t.at, detail: `${t.score}/${t.total}${t.wrong?.length ? ' · ' + t.wrong.join(', ') : ''}` });
    }
    const list = readOutbox();
    for (const e of events) list.push({ day: dayKey(new Date(e.at)), ...e });
    for (const [day, sec] of Object.entries(s.days)) {
      list.push({ type: 'day', day, minutes: Math.round((sec / 60) * 10) / 10, at: new Date(`${day}T12:00:00`).getTime(), detail: 'history' });
    }
    writeOutbox(list);
  },
};

window.addEventListener('online', () => sync.flush());
