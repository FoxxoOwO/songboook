import type { TuningPreset } from '../types/index.js';

export interface PitchDetectionResult {
  frequency: number;
  noteName: string;
  octave: number;
  cents: number;
  targetFreq: number;
  inTune: boolean;
  clarity: number;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const TUNING_PRESETS: TuningPreset[] = [
  {
    id: 'guitar-std',
    name: 'Kytara (Standard EADGBE)',
    instrument: 'guitar',
    strings: [
      { name: 'E2', freq: 82.41, stringIndex: 6 },
      { name: 'A2', freq: 110.0, stringIndex: 5 },
      { name: 'D3', freq: 146.83, stringIndex: 4 },
      { name: 'G3', freq: 196.0, stringIndex: 3 },
      { name: 'B3', freq: 246.94, stringIndex: 2 },
      { name: 'E4', freq: 329.63, stringIndex: 1 },
    ],
  },
  {
    id: 'guitar-drop-d',
    name: 'Kytara (Drop D)',
    instrument: 'guitar',
    strings: [
      { name: 'D2', freq: 73.42, stringIndex: 6 },
      { name: 'A2', freq: 110.0, stringIndex: 5 },
      { name: 'D3', freq: 146.83, stringIndex: 4 },
      { name: 'G3', freq: 196.0, stringIndex: 3 },
      { name: 'B3', freq: 246.94, stringIndex: 2 },
      { name: 'E4', freq: 329.63, stringIndex: 1 },
    ],
  },
  {
    id: 'ukulele-std',
    name: 'Ukulele (Standard GCEA)',
    instrument: 'ukulele',
    strings: [
      { name: 'G4', freq: 392.0, stringIndex: 4 },
      { name: 'C4', freq: 261.63, stringIndex: 3 },
      { name: 'E4', freq: 329.63, stringIndex: 2 },
      { name: 'A4', freq: 440.0, stringIndex: 1 },
    ],
  },
];

export function autoCorrelate(buffer: Float32Array, sampleRate: number): { freq: number; clarity: number } | null {
  const SIZE = buffer.length;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);

  if (rms < 0.01) {
    return null;
  }

  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }
  }

  const trimmed = buffer.subarray(r1, r2);
  const trimmedLen = trimmed.length;

  const c = new Float32Array(trimmedLen);
  for (let i = 0; i < trimmedLen; i++) {
    for (let j = 0; j < trimmedLen - i; j++) {
      c[i] = c[i] + trimmed[j] * trimmed[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) {
    d++;
  }

  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < trimmedLen; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }

  let T0 = maxpos;

  if (T0 > 0 && T0 < trimmedLen - 1) {
    const x1 = c[T0 - 1];
    const x2 = c[T0];
    const x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) {
      T0 = T0 - b / (2 * a);
    }
  }

  const freq = sampleRate / T0;
  const clarity = maxval / c[0];

  if (freq >= 50 && freq <= 1200 && clarity > 0.6) {
    return { freq, clarity };
  }

  return null;
}

export function getPitchDetails(freq: number): PitchDetectionResult {
  const midi = Math.round(12 * Math.log2(freq / 440) + 69);
  const noteIndex = (midi % 12 + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const noteName = NOTE_NAMES[noteIndex];

  const targetFreq = 440 * Math.pow(2, (midi - 69) / 12);
  const cents = Math.round(1200 * Math.log2(freq / targetFreq));

  return {
    frequency: Math.round(freq * 10) / 10,
    noteName,
    octave,
    cents,
    targetFreq: Math.round(targetFreq * 10) / 10,
    inTune: Math.abs(cents) <= 4,
    clarity: 1,
  };
}
