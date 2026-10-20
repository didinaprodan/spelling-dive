// Small synthesized sounds (no audio files). iOS needs a tap before audio can start.

let ctx = null;

export function unlockAudio() {
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    ctx = null;
  }
}

function tone(freq, start, dur, { type = 'sine', gain = 0.12, to = null } = {}) {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

export const sfx = {
  tap: () => tone(1200, 0, 0.05, { type: 'triangle', gain: 0.04 }),
  correct: () => {
    tone(880, 0, 0.18);
    tone(1320, 0.12, 0.28);
  },
  wrong: () => tone(260, 0, 0.3, { type: 'triangle', gain: 0.09, to: 180 }),
  scan: () => tone(420, 0, 0.7, { gain: 0.06, to: 1600 }),
  unlock: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.35, { gain: 0.1 })),
  sonar: () => {
    tone(1500, 0, 0.5, { gain: 0.06, to: 1400 });
    tone(1500, 0.9, 0.5, { gain: 0.035, to: 1400 });
  },

  /** A low growl for the Reaper. */
  roar() {
    if (!ctx) return;
    const dur = 2.8;
    const t0 = ctx.currentTime;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      last = (last + 0.04 * (Math.random() * 2 - 1)) / 1.04; // brown-ish noise
      data[i] = last * 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, t0);
    lp.frequency.exponentialRampToValueAtTime(220, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.9, t0 + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    // wobble for the growl
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 9;
    lfoGain.gain.value = 0.35;
    lfo.connect(lfoGain).connect(g.gain);
    noise.connect(lp).connect(g).connect(ctx.destination);
    tone(110, 0, dur * 0.9, { type: 'sawtooth', gain: 0.07, to: 55 });
    noise.start(t0);
    lfo.start(t0);
    noise.stop(t0 + dur);
    lfo.stop(t0 + dur);
  },
};
