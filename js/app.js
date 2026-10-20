import { WORDS, MISSIONS, CREATURES, BONUS_CREATURE, FUTURE_SIGNALS, ALL_WORDS } from './data.js';
import { creatureSvg, unknownSvg } from './creatures.js';
import { store, dayKey } from './store.js';
import { speak, spellAloud, sayLetter, stopSpeaking, listen, canListen, setRate } from './speech.js';
import { lettersFromTranscript } from './letters.js';
import { sfx, unlockAudio } from './sfx.js';
import { sync } from './sync.js';

const app = document.getElementById('app');
const overlay = document.getElementById('overlay');

const state = {
  screen: 'home',
  dive: null,
  afterOverlay: null,
  micBlocked: false,
};

setRate(store.get().settings.rate);

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const PRAISE = ['Great job!', 'Awesome!', 'Perfect!', 'You got it!', 'Super speller!', 'Excellent!'];
const KEY_ROWS = ['abcdefg', 'hijklmn', 'opqrstu', 'vwxyz'];
const CREATURE_ORDER = [BONUS_CREATURE, ...MISSIONS.map((m) => m.creature)];
// In the PDA the leviathan gets the wide card at the top.
const PDA_ORDER = [...CREATURE_ORDER.filter((id) => CREATURES[id].leviathan), ...CREATURE_ORDER.filter((id) => !CREATURES[id].leviathan)];

// ---------- helpers ----------

function missionIndexOf(m) {
  return MISSIONS.indexOf(m);
}

function currentMissionIndex() {
  const i = MISSIONS.findIndex((m) => !m.words.every((w) => store.isMastered(w)));
  return i === -1 ? MISSIONS.length : i;
}

function missionPct(m) {
  return Math.round((100 * m.words.filter((w) => store.isMastered(w)).length) / m.words.length);
}

function isIOS() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

function isStandalone() {
  return navigator.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches;
}

function localFlag(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch {
    return null;
  }
  return null;
}

function stopAll() {
  stopSpeaking();
  state.dive?.mic?.stop();
}

function go(screen) {
  stopAll();
  if (state.screen === 'dive' && screen !== 'dive') sync.send({ type: 'day' });
  state.screen = screen;
  render();
  window.scrollTo(0, 0);
}

// ---------- rendering ----------

function render() {
  if (state.screen === 'home') renderHome();
  else if (state.screen === 'dive') renderDive();
  else if (state.screen === 'pda') renderPda();
  else if (state.screen === 'parent') renderParent();
}

function renderHome() {
  const cur = currentMissionIndex();
  const learned = store.masteredCount();
  const total = ALL_WORDS.length;
  const best = store.get().tests.reduce((b, t) => Math.max(b, Math.round((100 * t.score) / t.total)), -1);
  const canTest = learned >= 5;

  const missions = MISSIONS.map((m, i) => {
    const done = m.words.every((w) => store.isMastered(w));
    const status = done ? 'done' : i === cur ? 'current' : 'locked';
    const c = CREATURES[m.creature];
    const dots = m.words.map((w) => `<i class="${store.isMastered(w) ? 'on' : ''}"></i>`).join('');
    const action =
      status === 'locked'
        ? '<span class="lock" aria-label="Locked">🔒</span>'
        : `<button class="go ${status === 'current' ? 'primary' : 'ghost'}" data-act="dive" data-id="${m.id}" aria-label="${done ? 'Replay' : 'Dive'} ${m.name}">${done ? '↻' : '▶'}</button>`;
    return `
      <li class="mission ${status}${m.boss ? ' boss' : ''}" style="--hue:${m.hue}">
        <div class="m-icon">${m.icon}</div>
        <div class="m-body">
          <div class="m-title"><span class="m-num">${i + 1}</span>${m.name}</div>
          <div class="m-sub">${m.boss ? '⚠ Leviathan signal' : `${m.words.length} words`}</div>
          <div class="dots">${dots}</div>
        </div>
        <div class="m-art">${creatureSvg(m.creature, c.color, { locked: !store.hasCreature(m.creature) })}</div>
        ${action}
      </li>`;
  }).join('');

  const showInstall = isIOS() && !isStandalone() && !localFlag('sd-install-dismissed');

  app.innerHTML = `
    <header class="topbar">
      <div class="brand"><span class="brand-dot"></span><div><b>SPELLING DIVE</b><small>Planet 4546B</small></div></div>
      <button class="pda-btn" data-act="pda" aria-label="Open PDA">PDA <b>${store.creatureCount()}/${CREATURE_ORDER.length}</b></button>
    </header>

    ${showInstall ? `
      <div class="install panel">
        <p>Чтобы игра открывалась как приложение: <b>Поделиться → На экран «Домой»</b>. Играйте всегда с иконки: прогресс хранится там.</p>
        <button class="icon-btn" data-act="dismiss-install" aria-label="Close">✕</button>
      </div>` : ''}

    <section class="hero panel">
      <p class="hud">Mission log</p>
      <h1>Spell words.<br>Scan sea creatures.</h1>
      <p class="hero-sub">📖 <b>Learn</b> the words, then 🎯 <b>Scan dive</b>: spell them from memory to scan creatures for your PDA.</p>
      <div class="meter" role="img" aria-label="${learned} of ${total} words learned">
        <div class="meter-fill" style="width:${(100 * learned) / total}%"></div>
      </div>
      <p class="meter-label"><b>${learned}</b> / ${total} words learned</p>
    </section>

    <ol class="dive-path">${missions}</ol>

    <section class="bee panel">
      <div>
        <p class="hud">Practice</p>
        <h2>🐝 Bee Test</h2>
        <p class="hero-sub">${canTest ? 'Like the real Spelling Bee: hear a word, spell it.' : 'Opens after you learn 5 words.'}${best >= 0 ? ` Best: <b>${best}%</b>` : ''}</p>
      </div>
      <button class="btn ${canTest ? 'primary' : 'ghost'}" data-act="test" ${canTest ? '' : 'disabled'}>Start</button>
    </section>

    <button class="parent-btn" data-hold="parent"><span class="hold-fill"></span>Для родителей · удерживайте</button>
    <p class="fanmade">Fan-made learning game. Not affiliated with Unknown Worlds.</p>
  `;
}

function scanRevealHtml(id, pct) {
  const c = CREATURES[id];
  return `
    <div class="scan-reveal" style="--p:${pct}%">
      <div class="layer">${creatureSvg(id, c.color, { locked: true })}</div>
      <div class="layer top">${creatureSvg(id, c.color)}</div>
      ${pct > 0 && pct < 100 ? '<div class="beam"></div>' : ''}
    </div>`;
}

function boxesHtml(word, typed, mode) {
  const n = Math.max(word.length, typed.length);
  let html = '';
  for (let i = 0; i < n; i++) {
    const ch = typed[i] || '';
    let cls = 'box';
    if (mode === 'input') {
      if (ch) cls += ' filled';
      if (i === typed.length) cls += ' cur';
      if (i >= word.length) cls += ' extra';
    } else if (mode === 'ok') {
      cls += ' ok';
    } else {
      cls += ch === word[i] ? ' ok' : ' bad';
    }
    html += `<span class="${cls}">${esc(ch)}</span>`;
  }
  return `<div class="boxes${n > 7 ? ' long' : ''}${n > 9 ? ' xlong' : ''}" id="boxes">${html}</div>`;
}

function wordHtml(word, parts) {
  const letters = [...word].map((ch) => `<span class="ltr">${ch}</span>`).join('');
  const split = parts ? `<p class="parts">${parts.map((p) => `<span>${p}</span>`).join(' + ')}</p>` : '';
  return `<div class="word${word.length > 7 ? ' long' : ''}${word.length > 9 ? ' xlong' : ''}" id="word">${letters}</div>${split}`;
}

function keyboardHtml() {
  return `<div class="keyboard">${KEY_ROWS.map(
    (row) =>
      `<div class="krow">${[...row].map((k) => `<button class="key" data-act="key" data-k="${k}">${k}</button>`).join('')}${
        row === 'vwxyz' ? '<button class="key del" data-act="del" aria-label="Delete last letter">⌫</button>' : ''
      }</div>`,
  ).join('')}</div>`;
}

function renderDive() {
  const d = state.dive;
  const w = d.word;
  const info = WORDS[w];
  const isTest = d.mode === 'test';
  const isLearn = d.mode === 'learn';
  const m = d.mission;

  const title = isTest
    ? `<small>Practice</small>Bee Test`
    : `<small>${isLearn ? '📖 Learn' : '🎯 Scan dive'} · Mission ${missionIndexOf(m) + 1}</small>${m.name}`;
  const counter = isLearn ? '' : `<div class="counter">${Math.min(d.done + 1, d.total)}/${d.total}</div>`;

  const scan = isTest
    ? ''
    : (() => {
        const id = m.creature;
        const has = store.hasCreature(id);
        const pct = has ? 100 : missionPct(m);
        const label = has
          ? `${CREATURES[id].name} · in your PDA`
          : isLearn
            ? 'Practice · scans in Scan dive'
            : m.boss
            ? '⚠ Leviathan signal'
            : `Scanning: ${pct >= 40 ? CREATURES[id].name : '???'}`;
        return `
          <div class="scan panel${m.boss && !has ? ' boss' : ''}" style="--hue:${m.hue}">
            ${scanRevealHtml(id, pct)}
            <div class="scan-info">
              <p class="hud">${label}</p>
              <div class="scan-bar"><div class="scan-fill" style="width:${pct}%"></div></div>
              <p class="scan-pct">${pct}%</p>
            </div>
          </div>`;
      })();

  let card = '';
  let tools = '';
  let main = '';

  if (d.phase === 'learn') {
    card = `
      <div class="emoji">${info.emoji}</div>
      ${wordHtml(w, info.parts)}
      <p class="card-note">Look. Listen. Remember!</p>`;
    tools = `
      <button class="tool" data-act="say-word">🔊<span>Word</span></button>
      <button class="tool" data-act="say-letters">🔤<span>Letters</span></button>
      <button class="tool" data-act="say-sentence">💬<span>Sentence</span></button>`;
    main = `<button class="btn primary big" data-act="ready">I'm ready, hide it! ✍️</button>`;
  } else if (d.phase === 'spell') {
    card = `
      <div class="emoji">${info.emoji}</div>
      ${boxesHtml(w, d.typed, 'input')}
      <p class="card-note" id="note">${d.note ? d.note : canListen && !state.micBlocked ? 'Say the letters or tap them.' : 'Tap the letters.'}</p>`;
    tools = `
      <button class="tool" data-act="say-word">🔊<span>Word</span></button>
      <button class="tool" data-act="say-sentence">💬<span>Sentence</span></button>
      ${isLearn && !d.hinted ? '<button class="tool" data-act="hint">💡<span>Hint</span></button>' : ''}
      ${d.audioUrl ? '<button class="tool" data-act="play-voice">▶<span>My voice</span></button>' : ''}`;
    const mic =
      canListen && !state.micBlocked
        ? `<button class="mic${d.listening ? ' on' : ''}" data-act="mic" aria-label="${d.listening ? 'Stop listening' : 'Say the letters'}">
             <span class="mic-icon">🎤</span><span>${d.listening ? 'Listening… tap to stop' : 'Say the letters'}</span>
           </button>`
        : '';
    const full = d.typed.length >= w.length;
    main = `
      ${mic}
      ${keyboardHtml()}
      <button class="btn primary big" data-act="check" ${full ? '' : 'disabled'}>Check ✔</button>`;
  } else if (d.phase === 'ok') {
    card = `
      <div class="emoji">${info.emoji}</div>
      ${boxesHtml(w, [...w], 'ok')}
      <p class="card-note good">${esc(d.praise)}</p>`;
    tools = `
      <button class="tool" data-act="say-word">🔊<span>Word</span></button>
      <button class="tool" data-act="say-letters">🔤<span>Letters</span></button>
      ${d.audioUrl ? '<button class="tool" data-act="play-voice">▶<span>My voice</span></button>' : ''}`;
    main = `<button class="btn primary big" data-act="next">Next ▶</button>`;
  } else if (d.phase === 'bad') {
    card = `
      <div class="emoji">${info.emoji}</div>
      ${boxesHtml(w, d.typed, 'bad')}
      <p class="card-note">It is spelled:</p>
      ${wordHtml(w, info.parts)}`;
    tools = `
      <button class="tool" data-act="say-word">🔊<span>Word</span></button>
      <button class="tool" data-act="say-letters">🔤<span>Letters</span></button>
      ${d.audioUrl ? '<button class="tool" data-act="play-voice">▶<span>My voice</span></button>' : ''}`;
    main = `<button class="btn primary big" data-act="next">${isLearn ? 'Got it ▶' : 'Next ▶'}</button>`;
  }

  app.innerHTML = `
    <header class="dive-top">
      <button class="icon-btn" data-act="home" aria-label="Back to map">‹</button>
      <div class="dive-title">${title}</div>
      ${counter}
    </header>
    ${scan}
    <section class="card panel phase-${d.phase}">${card}</section>
    <div class="tools">${tools}</div>
    <div class="main-actions">${main}</div>
  `;
}

function renderPda() {
  const cards = PDA_ORDER.map((id) => {
    const c = CREATURES[id];
    const has = store.hasCreature(id);
    const mi = MISSIONS.findIndex((m) => m.creature === id);
    const hint = id === BONUS_CREATURE ? 'Scan your first word' : `Mission ${mi + 1}`;
    return `
      <button class="pda-card${has ? '' : ' locked'}${c.leviathan ? ' lev' : ''}" data-act="creature" data-id="${id}" ${has ? '' : 'disabled'} style="--c:${c.color}">
        <div class="pda-art">${creatureSvg(id, c.color, { locked: !has })}</div>
        <div class="pda-name">${has ? c.name : '???'}</div>
        <div class="pda-kind">${has ? c.kind : hint}</div>
      </button>`;
  }).join('');
  const signals = Array.from(
    { length: FUTURE_SIGNALS },
    () => `
      <div class="pda-card signal">
        <div class="pda-art">${unknownSvg()}</div>
        <div class="pda-name">Unknown signal</div>
        <div class="pda-kind">Next homework</div>
      </div>`,
  ).join('');

  app.innerHTML = `
    <header class="dive-top">
      <button class="icon-btn" data-act="home" aria-label="Back to map">‹</button>
      <div class="dive-title"><small>PDA</small>Databank</div>
      <div class="counter">${store.creatureCount()}/${CREATURE_ORDER.length}</div>
    </header>
    <p class="pda-intro">Tap a creature to read its databank entry.</p>
    <div class="pda-grid">${cards}${signals}</div>
  `;
}

function fmtMin(sec) {
  if (!sec) return '0 мин';
  const m = Math.round(sec / 60);
  if (m < 1) return '<1 мин';
  if (m < 60) return `${m} мин`;
  return `${Math.floor(m / 60)} ч ${m % 60} мин`;
}

function fmtDate(ms) {
  return new Date(ms).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function syncStatus() {
  if (!sync.url()) return 'Не подключено.';
  const last = sync.lastSent();
  const when = last
    ? new Date(last).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'ещё не было';
  return `Подключено. Последняя отправка: ${when}. Ждут отправки: ${sync.pending()}.`;
}

function renderParent() {
  const s = store.get();
  const today = new Date();
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const k = dayKey(d);
    days.push({ k, d, sec: s.days[k] || 0 });
  }
  const maxSec = Math.max(60, ...days.map((x) => x.sec));
  const week = days.slice(-7).reduce((a, x) => a + x.sec, 0);
  const activeDays = days.filter((x) => x.sec >= 30).length;
  const totalSec = Object.values(s.days).reduce((a, x) => a + x, 0);

  const bars = days.map((x) => {
    const h = Math.round((100 * x.sec) / maxSec);
    const label = x.d.toLocaleDateString('ru-RU', { weekday: 'short' }).slice(0, 2);
    return `<div class="bar" title="${fmtDate(x.d)}: ${fmtMin(x.sec)}"><div class="bar-fill" style="height:${h}%"></div><span>${label}</span></div>`;
  }).join('');

  const hard = ALL_WORDS.map((w) => ({ w, ...(s.stats[w] || { ok: 0, bad: 0, voiceOk: 0 }) }))
    .filter((x) => x.bad > 0)
    .sort((a, b) => b.bad - a.bad || a.ok - b.ok)
    .slice(0, 6);

  const wordRows = MISSIONS.map((m, i) => {
    const rows = m.words.map((w) => {
      const st = s.stats[w] || { ok: 0, bad: 0, voiceOk: 0 };
      const when = s.mastered[w];
      return `<tr>
        <td class="w">${w}</td>
        <td>${when ? `✅ ${fmtDate(when)}` : '—'}</td>
        <td class="${st.bad ? 'warn' : ''}">${st.bad}</td>
        <td>${st.voiceOk ? `🎤 ${st.voiceOk}` : ''}</td>
      </tr>`;
    }).join('');
    return `<tr class="grp"><td colspan="4">${i + 1}. ${m.name}</td></tr>${rows}`;
  }).join('');

  const tests = s.tests.slice(-6).reverse().map(
    (t) => `<li><b>${t.score}/${t.total}</b> · ${fmtDate(t.at)}${t.wrong?.length ? ` · ошибки: ${t.wrong.map(esc).join(', ')}` : ''}</li>`,
  ).join('');

  const rate = s.settings.rate;
  app.innerHTML = `
    <header class="dive-top">
      <button class="icon-btn" data-act="home" aria-label="Назад">‹</button>
      <div class="dive-title"><small>Для родителей</small>Прогресс</div>
    </header>

    <section class="panel stats">
      <div class="stat"><b>${store.masteredCount()}<small>/${ALL_WORDS.length}</small></b><span>слов выучено</span></div>
      <div class="stat"><b>${store.creatureCount()}<small>/${CREATURE_ORDER.length}</small></b><span>существ</span></div>
      <div class="stat"><b>${activeDays}</b><span>дней с занятиями за 2 недели</span></div>
      <div class="stat"><b>${fmtMin(week)}</b><span>за 7 дней</span></div>
    </section>

    <section class="panel">
      <h3>Время занятий, 14 дней</h3>
      <div class="bars">${bars}</div>
      <p class="muted">Всего: ${fmtMin(totalSec)}. Считается время между нажатиями, но не больше 30 секунд подряд.</p>
    </section>

    <section class="panel">
      <h3>Где чаще ошибается</h3>
      ${hard.length ? `<ul class="hard">${hard.map((x) => `<li><b>${x.w}</b><span>ошибок: ${x.bad}, верно: ${x.ok}</span></li>`).join('')}</ul>` : '<p class="muted">Ошибок пока нет.</p>'}
    </section>

    <section class="panel">
      <h3>Пробные экзамены (Bee Test)</h3>
      ${tests ? `<ul class="tests">${tests}</ul>` : '<p class="muted">Ещё не проходил.</p>'}
    </section>

    <section class="panel">
      <h3>Все слова</h3>
      <table class="words">
        <thead><tr><th>Слово</th><th>Выучено</th><th>Ошибок</th><th>Голосом</th></tr></thead>
        <tbody>${wordRows}</tbody>
      </table>
    </section>

    <section class="panel settings">
      <h3>Статистика на вашем телефоне</h3>
      <p class="muted">Ответы, время занятий и трофеи сами уходят в вашу Google-таблицу. <a href="https://github.com/didinaprodan/spelling-dive/blob/main/sheets/README.md" target="_blank" rel="noopener">Как настроить</a></p>
      <input class="url" id="sync-url" type="url" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false"
        placeholder="https://script.google.com/macros/s/…/exec" value="${esc(sync.url())}">
      <div class="row-btns">
        <button class="btn primary small" data-act="save-sync">Сохранить</button>
        <button class="btn ghost small" data-act="ping-sync" ${sync.url() ? '' : 'disabled'}>Проверить связь</button>
      </div>
      <p class="muted">${syncStatus()}</p>
    </section>

    <section class="panel settings">
      <h3>Настройки</h3>
      <div class="row">
        <span>Скорость голоса</span>
        <div class="seg">
          <button class="${rate <= 0.7 ? 'on' : ''}" data-act="rate" data-v="0.65">медленно</button>
          <button class="${rate > 0.7 && rate < 0.9 ? 'on' : ''}" data-act="rate" data-v="0.8">средне</button>
          <button class="${rate >= 0.9 ? 'on' : ''}" data-act="rate" data-v="0.95">быстро</button>
        </div>
      </div>
      <div class="row">
        <span>Записывать голос, чтобы он мог себя послушать${s.settings.recordConflict ? ' <em>(на этом телефоне запись мешала распознаванию — выключена)</em>' : ''}</span>
        <button class="toggle ${s.settings.record && !s.settings.recordConflict ? 'on' : ''}" data-act="record" aria-label="Запись голоса"></button>
      </div>
      <div class="row">
        <span>Распознавание голоса: ${canListen ? 'поддерживается' : 'не поддерживается в этом браузере (откройте в Safari)'}</span>
        <button class="btn ghost small" data-act="test-voice">Проверить звук</button>
      </div>
      <div class="row">
        <span>Сбросить весь прогресс (трофеи и статистику)</span>
        <button class="btn danger small" data-act="reset">Сбросить</button>
      </div>
    </section>
  `;
}

// ---------- dive flow ----------

function newDive(extra) {
  return {
    queue: [],
    word: null,
    phase: 'learn',
    typed: [],
    hinted: false,
    note: '',
    audioUrl: null,
    listening: false,
    mic: null,
    voiceUsed: false,
    praise: '',
    ...extra,
  };
}

/**
 * mode 'learn': see, hear, then spell; practice only, no scans.
 * mode 'scan': hear the word and spell it from memory; only here words are scanned and creatures unlocked.
 * words: optional subset (for example the words missed in the last scan dive).
 */
function startDive(missionId, mode = 'scan', words = null) {
  const m = MISSIONS.find((x) => x.id === missionId);
  if (!m) return;
  const practice = m.words.every((w) => store.isMastered(w));
  let queue;
  if (words?.length) queue = [...words];
  else if (mode === 'learn' || practice) queue = shuffle([...m.words]);
  else queue = shuffle(m.words.filter((w) => !store.isMastered(w)));
  state.dive = newDive({ mode, mission: m, queue, practice, total: queue.length, done: 0, missed: [] });
  state.screen = 'dive';
  if (mode === 'scan' && m.boss && !practice) {
    showBossIntro();
    return;
  }
  nextWord();
}

function startTest() {
  const pool = ALL_WORDS.filter((w) => store.isMastered(w));
  if (pool.length < 5) return;
  const stats = store.get().stats;
  // Words with more mistakes come up more often.
  const weighted = pool
    .map((w) => ({ w, score: (stats[w]?.bad || 0) * 1.5 + Math.random() * 3 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((x) => x.w);
  state.dive = newDive({ mode: 'test', mission: null, queue: shuffle(weighted), total: weighted.length, done: 0, correct: 0, wrong: [] });
  state.screen = 'dive';
  nextWord();
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function resetWordState(d) {
  d.typed = [];
  d.hinted = false;
  d.note = '';
  d.audioUrl = null;
  d.listening = false;
  d.voiceUsed = false;
}

function nextWord() {
  const d = state.dive;
  stopAll();
  if (!d.queue.length) {
    finishDive();
    return;
  }
  d.word = d.queue.shift();
  resetWordState(d);
  if (d.mode !== 'learn') {
    // From memory: he only hears the word, like at the real spelling bee.
    d.phase = 'spell';
    render();
    window.scrollTo(0, 0);
    speak(`Your word is: ${d.word}. ${d.word}.`);
    return;
  }
  d.phase = 'learn';
  render();
  window.scrollTo(0, 0);
  spellAloud(d.word, lightLetter);
}

function lightLetter(i, sel = '#word .ltr') {
  document.querySelectorAll(sel).forEach((el, j) => el.classList.toggle('lit', j === i));
}

function toSpell() {
  const d = state.dive;
  stopAll();
  d.phase = 'spell';
  resetWordState(d);
  render();
  speak(`Spell: ${d.word}.`);
}

function typeLetter(k) {
  const d = state.dive;
  if (d.phase !== 'spell' || d.listening) return;
  if (d.typed.length >= d.word.length + 2) return;
  d.typed.push(k);
  d.note = '';
  sfx.tap();
  sayLetter(k);
  render();
}

function backspace() {
  const d = state.dive;
  if (d.phase !== 'spell' || d.listening) return;
  d.typed.pop();
  d.note = '';
  render();
}

function hint() {
  const d = state.dive;
  if (d.hinted) return;
  d.hinted = true;
  d.typed = [d.word[0]];
  d.note = `It starts with “${d.word[0]}”.`;
  render();
  sayLetter(d.word[0]);
}

function check() {
  const d = state.dive;
  if (d.phase !== 'spell' || d.typed.length < d.word.length) return;
  d.mic?.stop();
  const ok = d.typed.join('') === d.word;
  // Only a word spelled from memory in a scan dive counts as learned.
  const firstEver = store.recordAnswer(d.word, ok, { voice: d.voiceUsed, fromMemory: d.mode === 'scan' });
  sync.send({
    type: 'answer',
    word: d.word,
    ok,
    voice: d.voiceUsed,
    mode: d.mode,
    mission: d.mode === 'test' ? 'Bee Test' : d.mission.name,
  });

  if (d.mode === 'test') {
    if (ok) d.correct++;
    else d.wrong.push(d.word);
  }
  if (d.mode !== 'learn') d.done++;
  if (d.mode === 'scan' && !ok) d.missed.push(d.word);

  if (ok) {
    d.phase = 'ok';
    d.praise = d.mode === 'scan' && !d.practice ? `Scanned! ${pick(PRAISE)}` : pick(PRAISE);
    render();
    sfx.correct();
    if (d.mode === 'scan' && !d.practice) {
      // Show the new scan percentage with a little sweep.
      sfx.scan();
    }
    // The welcome bonus opens when he taps Next, so it never talks over a new word.
    if (firstEver && store.unlockCreature(BONUS_CREATURE)) {
      d.pendingBonus = true;
      sync.send({ type: 'creature', word: CREATURES[BONUS_CREATURE].name });
    }
    (async () => {
      const finished = await spellAloud(d.word, (i) => lightLetter(i, '#boxes .box'), { sayWord: false });
      if (finished && state.dive === d && d.phase === 'ok') await speak(d.praise);
    })();
  } else {
    d.phase = 'bad';
    // Learning: the word comes back later. Scan dive: it stays unscanned until the next dive.
    if (d.mode === 'learn') d.queue.push(d.word);
    render();
    sfx.wrong();
    (async () => {
      const ok2 = await speak('Almost! It is spelled');
      if (ok2 && state.dive === d) spellAloud(d.word, lightLetter);
    })();
  }
}

function toggleMic() {
  const d = state.dive;
  if (d.listening) {
    d.mic?.stop();
    return;
  }
  startMic(true);
}

function startMic(allowRecord) {
  const d = state.dive;
  const settings = store.get().settings;
  const record = allowRecord && settings.record && !settings.recordConflict;
  d.listening = true;
  d.typed = [];
  d.note = 'Listening… say each letter.';
  d.audioUrl = null;
  render();
  d.mic = listen({
    record,
    onText: (text) => {
      if (state.dive !== d) return;
      const r = lettersFromTranscript(text, d.word);
      d.typed = r.letters.slice(0, d.word.length + 2);
      d.note = `I hear: “${text}”`;
      updateLive();
    },
    onDone: ({ transcript, audioUrl, error }) => {
      if (state.dive !== d) return;
      d.listening = false;
      d.mic = null;
      d.audioUrl = audioUrl;
      if (error === 'audio-capture' && record) {
        // Recording and recognition fight over the microphone on this phone: keep recognition only.
        store.setSetting('recordConflict', true);
        startMic(false);
        return;
      }
      if (error === 'not-allowed' || error === 'service-not-allowed') {
        state.micBlocked = true;
        d.note = 'The microphone is off. Use the letters below.';
        render();
        return;
      }
      if (!transcript) {
        d.note = error === 'network' ? 'Voice needs the internet. Use the letters.' : 'I did not hear you. Tap 🎤 and say the letters.';
        render();
        return;
      }
      const r = lettersFromTranscript(transcript, d.word);
      d.voiceUsed = true;
      if (r.heardWholeWord) {
        d.typed = [];
        d.note = `I heard the word “${d.word}”. Now say the letters one by one!`;
        render();
        return;
      }
      d.typed = r.letters.slice(0, d.word.length + 2);
      if (d.typed.join('') === d.word) {
        check();
        return;
      }
      d.note = d.typed.length
        ? `I heard: ${d.typed.join(' ').toUpperCase()}. Fix it with the letters or tap 🎤 again.`
        : `I heard “${transcript}”. Say the letters one by one.`;
      render();
    },
  });
}

/** While listening, update only the boxes and note so the mic button keeps its state. */
function updateLive() {
  const d = state.dive;
  const boxes = document.getElementById('boxes');
  const note = document.getElementById('note');
  if (boxes) boxes.outerHTML = boxesHtml(d.word, d.typed, 'input');
  if (note) note.textContent = d.note;
}

function playVoice() {
  const url = state.dive?.audioUrl;
  if (!url) return;
  stopSpeaking();
  new Audio(url).play().catch(() => {});
}

function finishDive() {
  const d = state.dive;
  if (d.mode === 'test') {
    finishTest();
    return;
  }
  const m = d.mission;
  const allScanned = m.words.every((w) => store.isMastered(w));
  const home = { label: 'Back to map', act: 'overlay-home' };

  if (d.mode === 'scan' && allScanned && store.unlockCreature(m.creature)) {
    sync.send({ type: 'creature', word: CREATURES[m.creature].name, mission: m.name });
    showCreatureReward(m.creature, { after: () => go('home') });
    return;
  }

  if (d.mode === 'learn') {
    showChoice({
      hud: 'Practice complete',
      title: `📖 ${m.name}`,
      text: allScanned
        ? 'Great practice! These words are already scanned.'
        : 'Great practice! Now dive and spell the words from memory to scan the creature.',
      buttons: allScanned
        ? [{ ...home, cls: 'primary' }]
        : [{ label: m.boss ? '🎯 Face the Leviathan' : '🎯 Scan dive', act: 'start-mode', mode: 'scan', id: m.id, cls: 'primary' }, home],
    });
    speak(allScanned ? 'Practice complete. Great job!' : 'Practice complete. Now dive and scan!');
    return;
  }

  const right = d.total - d.missed.length;
  if (d.practice || !d.missed.length) {
    showChoice({
      hud: 'Dive complete',
      title: `🎯 ${right} / ${d.total}`,
      text: d.missed.length ? `Practice these words: <b>${d.missed.map(esc).join(', ')}</b>` : 'All correct from memory. Strong diver!',
      buttons: [{ ...home, cls: 'primary' }],
    });
    speak(d.missed.length ? `You spelled ${right} out of ${d.total}.` : 'All correct! Great memory!');
    return;
  }

  const left = m.words.filter((w) => !store.isMastered(w));
  showChoice({
    hud: 'Scan incomplete',
    title: `Scanned ${right} of ${d.total}`,
    text: `Learn these words, then dive again: <b>${left.map(esc).join(', ')}</b>`,
    buttons: [{ label: '📖 Learn these words', act: 'start-mode', mode: 'learn', id: m.id, words: left, cls: 'primary' }, home],
  });
  speak(`You scanned ${right} of ${d.total} words. Learn the others and dive again!`);
}

function finishTest() {
  const d = state.dive;
  store.addTest({ score: d.correct, total: d.total, wrong: d.wrong });
  sync.send({ type: 'test', detail: `${d.correct}/${d.total}${d.wrong.length ? ' · ' + d.wrong.join(', ') : ''}` });
  const perfect = d.correct === d.total;
  showMessage({
    hud: 'Bee Test result',
    title: `${perfect ? '🏆 ' : '🐝 '}${d.correct} / ${d.total}`,
    text: d.wrong.length
      ? `Practice these words: <b>${d.wrong.map(esc).join(', ')}</b>`
      : 'Every word correct. You are a Super Speller!',
    button: 'Back to map ▶',
    after: () => go('home'),
  });
  if (perfect) sfx.unlock();
  speak(perfect ? 'Perfect score! You are a super speller!' : `You spelled ${d.correct} out of ${d.total}. Great try!`);
}

// ---------- overlays ----------

function openOverlay(html, after) {
  state.afterOverlay = after || null;
  overlay.innerHTML = `<div class="overlay-inner">${html}</div>`;
  overlay.hidden = false;
}

function closeOverlay() {
  const after = state.afterOverlay;
  hideOverlay();
  after?.();
}

function hideOverlay() {
  overlay.hidden = true;
  overlay.innerHTML = '';
  state.afterOverlay = null;
}

/** A panel with any number of buttons; each button names its own action. */
function showChoice({ hud, title, text = '', art = '', buttons, cls = '' }) {
  const btn = (b) =>
    b.html ||
    `<button class="btn ${b.cls || 'ghost'} big" data-act="${b.act}"${b.id ? ` data-id="${b.id}"` : ''}${
      b.mode ? ` data-mode="${b.mode}"` : ''
    }${b.words ? ` data-words="${b.words.join(',')}"` : ''}>${b.label}</button>`;
  openOverlay(
    `<div class="reward panel ${cls}">
      <p class="hud">${hud}</p>
      ${art}
      <h2>${title}</h2>
      ${text ? `<p class="fact">${text}</p>` : ''}
      <div class="choice-btns">${buttons.map(btn).join('')}</div>
    </div>`,
  );
}

function modeButton(mode, m, icon, title, sub, primary) {
  return `
    <button class="mode-btn${primary ? ' primary' : ''}" data-act="start-mode" data-mode="${mode}" data-id="${m.id}">
      <span class="mode-icon">${icon}</span>
      <span class="mode-text"><b>${title}</b><small>${sub}</small></span>
    </button>`;
}

/** Tapping a mission on the map: pick Learn (practice) or Scan dive (from memory, earns the creature). */
function showMissionChooser(id) {
  const m = MISSIONS.find((x) => x.id === id);
  if (!m) return;
  const c = CREATURES[m.creature];
  const has = store.hasCreature(m.creature);
  const scanned = m.words.filter((w) => store.isMastered(w)).length;
  const done = scanned === m.words.length;
  const status = done
    ? `${has ? c.name : 'Creature'} scanned ✓`
    : m.boss
      ? '⚠ Leviathan signal. One very long word.'
      : `Scanned ${scanned} of ${m.words.length} words`;
  showChoice({
    hud: `Mission ${missionIndexOf(m) + 1}`,
    title: `${m.icon} ${m.name}`,
    text: status,
    art: `<div class="chooser-art">${scanRevealHtml(m.creature, has ? 100 : missionPct(m))}</div>`,
    cls: m.boss && !done ? 'alert' : '',
    buttons: [
      { html: modeButton('learn', m, '📖', 'Learn', 'See and hear the words. Practice, no scans.', false) },
      {
        html: modeButton(
          'scan',
          m,
          '🎯',
          m.boss && !done ? 'Face the Leviathan' : 'Scan dive',
          done ? 'Spell from memory again. Already scanned.' : 'Hear a word, spell it from memory. Only here you scan!',
          !done,
        ),
      },
      { label: 'Close', act: 'overlay-close', cls: 'ghost' },
    ],
  });
}

function showMessage({ hud, title, text, button, after }) {
  openOverlay(
    `<div class="reward panel">
      <p class="hud">${hud}</p>
      <h2>${title}</h2>
      <p class="fact">${text}</p>
      <button class="btn primary big" data-act="overlay-ok">${button}</button>
    </div>`,
    after,
  );
}

function showCreatureReward(id, { bonus = false, after } = {}) {
  const c = CREATURES[id];
  openOverlay(
    `<div class="reward panel${c.leviathan ? ' leviathan' : ''}" style="--c:${c.color}">
      <p class="hud">${bonus ? 'Bonus scan' : 'Scan complete'}</p>
      <div class="reward-art">${creatureSvg(id, c.color)}<div class="beam sweep"></div></div>
      <h2>${c.name}</h2>
      <p class="kind">${c.kind}</p>
      <p class="fact">${c.fact}</p>
      <button class="btn primary big" data-act="overlay-ok">Add to PDA ▶</button>
    </div>`,
    after,
  );
  if (c.leviathan) {
    document.body.classList.add('shake');
    sfx.roar();
    setTimeout(() => document.body.classList.remove('shake'), 1400);
    setTimeout(() => speak('Leviathan class lifeform. Reaper Leviathan. Databank entry added.', { pitch: 0.9 }), 2400);
  } else {
    sfx.scan();
    setTimeout(() => {
      sfx.unlock();
      speak(`Scan complete. New databank entry: ${c.name}.`, { pitch: 0.95 });
    }, 700);
  }
}

function showBossIntro() {
  const c = CREATURES.reaper;
  openOverlay(
    `<div class="reward panel alert">
      <p class="hud warn">⚠ Warning</p>
      <div class="reward-art pulse">${creatureSvg('reaper', c.color, { locked: true })}</div>
      <h2>Leviathan class lifeform detected</h2>
      <p class="fact">One very long word guards the Crash Zone. Spell it from memory to scan the leviathan!</p>
      <button class="btn danger big" data-act="overlay-ok">Dive in ▶</button>
    </div>`,
    () => nextWord(),
  );
  sfx.sonar();
  speak('Warning. Leviathan class lifeform detected.', { pitch: 0.9 });
}

function showCreatureDetail(id) {
  const c = CREATURES[id];
  openOverlay(
    `<div class="reward panel${c.leviathan ? ' leviathan' : ''}" style="--c:${c.color}">
      <p class="hud">Databank · ${c.kind}</p>
      <div class="reward-art">${creatureSvg(id, c.color)}</div>
      <h2>${c.name}</h2>
      <p class="fact">${c.fact}</p>
      <div class="row-btns">
        <button class="btn ghost" data-act="read-fact" data-id="${id}">🔊 Read</button>
        <button class="btn primary" data-act="overlay-ok">Close</button>
      </div>
    </div>`,
  );
}

// ---------- events ----------

document.addEventListener(
  'pointerdown',
  () => {
    unlockAudio();
    if (state.screen === 'dive') store.touch();
  },
  { passive: true },
);

let ignoreClicksUntil = 0;

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled || Date.now() < ignoreClicksUntil) return;
  const act = el.dataset.act;
  const d = state.dive;

  switch (act) {
    case 'dive':
      showMissionChooser(el.dataset.id);
      break;
    case 'start-mode': {
      const { id, mode, words } = el.dataset;
      hideOverlay();
      startDive(id, mode, words ? words.split(',') : null);
      break;
    }
    case 'overlay-close':
      stopSpeaking();
      hideOverlay();
      break;
    case 'overlay-home':
      hideOverlay();
      go('home');
      break;
    case 'test':
      startTest();
      break;
    case 'home':
      go('home');
      break;
    case 'pda':
      go('pda');
      break;
    case 'dismiss-install':
      localFlag('sd-install-dismissed', '1');
      render();
      break;
    case 'say-word':
      speak(d.word);
      break;
    case 'say-letters':
      spellAloud(d.word, (i) => lightLetter(i, d.phase === 'ok' ? '#boxes .box' : '#word .ltr'));
      break;
    case 'say-sentence':
      speak(WORDS[d.word].sentence);
      break;
    case 'ready':
      toSpell();
      break;
    case 'key':
      typeLetter(el.dataset.k);
      break;
    case 'del':
      backspace();
      break;
    case 'hint':
      hint();
      break;
    case 'check':
      check();
      break;
    case 'mic':
      toggleMic();
      break;
    case 'play-voice':
      playVoice();
      break;
    case 'next':
      if (d.pendingBonus) {
        d.pendingBonus = false;
        stopSpeaking();
        showCreatureReward(BONUS_CREATURE, { bonus: true, after: () => nextWord() });
      } else {
        nextWord();
      }
      break;
    case 'creature':
      showCreatureDetail(el.dataset.id);
      break;
    case 'read-fact': {
      const c = CREATURES[el.dataset.id];
      speak(`${c.name}. ${c.fact}`);
      break;
    }
    case 'overlay-ok':
      stopSpeaking();
      closeOverlay();
      break;
    case 'rate': {
      const v = Number(el.dataset.v);
      store.setSetting('rate', v);
      setRate(v);
      render();
      speak('This is how fast I will talk.');
      break;
    }
    case 'record': {
      const s = store.get().settings;
      const on = s.record && !s.recordConflict;
      store.setSetting('record', !on);
      store.setSetting('recordConflict', false);
      render();
      break;
    }
    case 'save-sync': {
      const url = document.getElementById('sync-url').value.trim();
      if (url && !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) {
        alert('Это не похоже на адрес веб-приложения. Он начинается с https://script.google.com/macros/s/ и заканчивается на /exec');
        break;
      }
      sync.connect(url);
      render();
      setTimeout(() => state.screen === 'parent' && render(), 3000);
      break;
    }
    case 'ping-sync':
      sync.send({ type: 'ping', detail: 'test' });
      setTimeout(() => state.screen === 'parent' && render(), 3000);
      break;
    case 'test-voice':
      spellAloud('chair');
      break;
    case 'reset':
      if (confirm('Сбросить все слова, трофеи и статистику? Это нельзя отменить.')) {
        store.reset();
        setRate(store.get().settings.rate);
        go('home');
      }
      break;
    default:
      break;
  }
});

// Hold the parent button so a curious first grader does not reset everything.
let holdTimer = null;
document.addEventListener('pointerdown', (e) => {
  const el = e.target.closest('[data-hold]');
  if (!el) return;
  el.classList.add('holding');
  holdTimer = setTimeout(() => {
    el.classList.remove('holding');
    // The finger is still down: ignore the click it makes on the new screen.
    ignoreClicksUntil = Date.now() + 600;
    go(el.dataset.hold);
  }, 1500);
});
['pointerup', 'pointercancel', 'pointerleave'].forEach((t) =>
  document.addEventListener(t, () => {
    clearTimeout(holdTimer);
    document.querySelectorAll('.holding').forEach((x) => x.classList.remove('holding'));
  }),
);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopAll();
});

// Send anything practiced while offline.
sync.flush();

// Ask the browser to keep progress safe from storage cleanup.
navigator.storage?.persist?.().catch(() => {});

render();
