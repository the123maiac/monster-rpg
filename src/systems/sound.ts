// Procedural sound effects via Web Audio API. No external asset files.

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let volume = 0.6;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = volume;
      masterGain.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  // Browsers require user gesture to resume
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export function setSfxVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  if (masterGain) masterGain.gain.value = volume;
}

function tone(freq: number, duration: number, type: OscillatorType = 'square', startGain = 0.18, decay = 0.9) {
  const c = getCtx();
  if (!c || !masterGain) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = startGain;
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration * decay);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(c.currentTime + duration);
}

function sweep(fromFreq: number, toFreq: number, duration: number, type: OscillatorType = 'square', startGain = 0.18) {
  const c = getCtx();
  if (!c || !masterGain) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(fromFreq, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(toFreq, c.currentTime + duration);
  gain.gain.value = startGain;
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(c.currentTime + duration + 0.05);
}

function noiseBurst(duration: number, volume = 0.18, filterFreq = 2000) {
  const c = getCtx();
  if (!c || !masterGain) return;
  const buffer = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const gain = c.createGain();
  gain.gain.value = volume;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  src.start();
}

export const sfx = {
  click() {
    tone(660, 0.08, 'square', 0.12);
  },
  hover() {
    tone(880, 0.04, 'sine', 0.08);
  },
  confirm() {
    tone(523, 0.08, 'square', 0.16);
    setTimeout(() => tone(784, 0.12, 'square', 0.16), 80);
  },
  cancel() {
    sweep(440, 220, 0.15, 'square', 0.14);
  },
  hit() {
    noiseBurst(0.12, 0.22, 1500);
    tone(120, 0.1, 'sawtooth', 0.18);
  },
  superHit() {
    noiseBurst(0.18, 0.28, 2400);
    sweep(880, 220, 0.22, 'sawtooth', 0.2);
  },
  miss() {
    sweep(330, 200, 0.18, 'triangle', 0.12);
  },
  faint() {
    sweep(523, 110, 0.6, 'sawtooth', 0.18);
  },
  capture() {
    tone(523, 0.12, 'square', 0.15);
    setTimeout(() => tone(659, 0.12, 'square', 0.15), 100);
    setTimeout(() => tone(784, 0.16, 'square', 0.15), 220);
  },
  captureSuccess() {
    tone(523, 0.12, 'square', 0.18);
    setTimeout(() => tone(659, 0.12, 'square', 0.18), 100);
    setTimeout(() => tone(784, 0.12, 'square', 0.18), 200);
    setTimeout(() => tone(1047, 0.3, 'square', 0.2), 300);
  },
  levelUp() {
    tone(523, 0.1, 'square', 0.16);
    setTimeout(() => tone(659, 0.1, 'square', 0.16), 90);
    setTimeout(() => tone(784, 0.1, 'square', 0.16), 180);
    setTimeout(() => tone(1047, 0.25, 'square', 0.18), 270);
  },
  evolve() {
    sweep(220, 880, 0.6, 'sine', 0.18);
    setTimeout(() => sweep(440, 1320, 0.5, 'sine', 0.14), 200);
  },
  encounter() {
    sweep(880, 1320, 0.18, 'sawtooth', 0.16);
    setTimeout(() => sweep(880, 1320, 0.18, 'sawtooth', 0.16), 200);
  },
  menu() {
    tone(440, 0.06, 'square', 0.1);
    setTimeout(() => tone(660, 0.06, 'square', 0.1), 50);
  },
  achievement() {
    tone(523, 0.1, 'sine', 0.18);
    setTimeout(() => tone(784, 0.1, 'sine', 0.18), 90);
    setTimeout(() => tone(1047, 0.2, 'sine', 0.2), 180);
  },
  step() {
    tone(80 + Math.random() * 30, 0.04, 'square', 0.04);
  },
};
