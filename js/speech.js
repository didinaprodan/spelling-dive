// Voice out (speechSynthesis) and voice in (webkitSpeechRecognition + optional recording).
// Both are built into Safari on iPhone: no keys, no servers of ours.

const synth = window.speechSynthesis;
let voice = null;
let rate = 0.8;
let playId = 0;
const alive = new Set(); // iOS drops utterances that are garbage-collected mid-speech

const PREFERRED = ['Samantha', 'Ava', 'Allison', 'Susan', 'Nicky', 'Karen', 'Moira', 'Daniel'];

function pickVoice() {
  if (!synth) return;
  const voices = synth.getVoices();
  const en = voices.filter((v) => /^en[-_]/i.test(v.lang));
  voice =
    PREFERRED.map((n) => en.find((v) => v.name.startsWith(n) && /US/i.test(v.lang))).find(Boolean) ||
    PREFERRED.map((n) => en.find((v) => v.name.startsWith(n))).find(Boolean) ||
    en.find((v) => /US/i.test(v.lang)) ||
    en[0] ||
    null;
}
if (synth) {
  pickVoice();
  synth.addEventListener?.('voiceschanged', pickVoice);
}

export const canSpeak = Boolean(synth);

export function setRate(r) {
  rate = r;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function say(text, opts = {}) {
  if (!synth) return wait(300);
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    if (voice) u.voice = voice;
    u.rate = opts.rate ?? rate;
    u.pitch = opts.pitch ?? 1;
    alive.add(u);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      alive.delete(u);
      resolve();
    };
    u.onend = finish;
    u.onerror = finish;
    // Safety net: some iOS versions never fire onend.
    setTimeout(finish, 1500 + (text.length * 160) / u.rate);
    synth.speak(u);
  });
}

/** Stop whatever is being said and start a new line of speech. */
export function stopSpeaking() {
  playId++;
  if (synth) synth.cancel();
}

export async function speak(text, opts) {
  stopSpeaking();
  const id = playId;
  await say(text, opts);
  return id === playId;
}

/**
 * Says the word, then each letter (calling onLetter with its index), then the word again.
 * Returns false if something else interrupted it.
 */
export async function spellAloud(word, onLetter = () => {}, { sayWord = true } = {}) {
  stopSpeaking();
  const id = playId;
  if (sayWord) {
    await say(word);
    if (id !== playId) return false;
    await wait(250);
  }
  for (let i = 0; i < word.length; i++) {
    if (id !== playId) return false;
    onLetter(i);
    await say(letterName(word[i]), { rate: Math.max(0.7, rate) });
    await wait(120);
  }
  onLetter(-1);
  if (id !== playId) return false;
  if (sayWord) {
    await wait(200);
    await say(word);
  }
  return id === playId;
}

/**
 * Text that makes the voice say just the letter name, like at a spelling bee.
 * A capital letter on its own is read as "capital E", so letters stay lowercase.
 */
export function letterName(letter) {
  return letter.toLowerCase();
}

/** A quick letter name when a key is tapped. */
export function sayLetter(letter) {
  stopSpeaking();
  say(letterName(letter), { rate: 1 });
}

// ---------- listening ----------

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const canListen = Boolean(SR);

/**
 * Start listening for spelled letters.
 * onText(fullTranscript) fires while he speaks; onDone({transcript, audioUrl, error}) once at the end.
 * record: also keep the audio so he can hear himself.
 */
export function listen({ onText, onDone, record = false }) {
  stopSpeaking();
  const rec = new SR();
  rec.lang = 'en-US';
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  let transcript = '';
  let error = null;
  let finished = false;
  let silenceTimer = null;
  let stream = null;
  let recorder = null;
  const chunks = [];
  let audioUrl = null;

  const armSilence = (ms) => {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => stop(), ms);
  };

  const stopRecording = () =>
    new Promise((resolve) => {
      if (!recorder || recorder.state === 'inactive') {
        stream?.getTracks().forEach((t) => t.stop());
        return resolve();
      }
      recorder.onstop = () => {
        stream?.getTracks().forEach((t) => t.stop());
        if (chunks.length) {
          audioUrl = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || 'audio/mp4' }));
        }
        resolve();
      };
      try {
        recorder.stop();
      } catch {
        resolve();
      }
    });

  rec.onresult = (e) => {
    transcript = Array.from(e.results)
      .map((r) => r[0].transcript)
      .join(' ')
      .trim();
    onText?.(transcript);
    // He spells slowly; stop after a quiet moment.
    armSilence(2600);
  };
  rec.onerror = (e) => {
    error = e.error || 'error';
  };
  rec.onend = async () => {
    if (finished) return;
    finished = true;
    clearTimeout(silenceTimer);
    await stopRecording();
    onDone?.({ transcript, audioUrl, error });
  };

  function stop() {
    clearTimeout(silenceTimer);
    try {
      rec.stop();
    } catch {
      /* already stopped */
    }
  }

  async function startRecording() {
    if (!record || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (ev) => ev.data?.size && chunks.push(ev.data);
      recorder.start();
    } catch {
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      recorder = null;
    }
  }

  try {
    rec.start();
  } catch (e) {
    error = 'start-failed';
    setTimeout(() => onDone?.({ transcript: '', audioUrl: null, error }), 0);
    return { stop() {} };
  }
  startRecording();
  armSilence(9000);
  return { stop };
}
