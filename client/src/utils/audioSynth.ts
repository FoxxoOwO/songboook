import type { ChordDefinition, InstrumentType } from '../types/index.js';
import { getChordDefinition } from './chordDatabase.js';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

const GUITAR_OPEN_FREQS = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63]; // E2, A2, D3, G3, B3, E4
const UKULELE_OPEN_FREQS = [392.0, 261.63, 329.63, 440.0]; // G4, C4, E4, A4

function getFretFrequency(baseFreq: number, fret: number): number {
  return baseFreq * Math.pow(2, fret / 12);
}

function playPluckedString(ctx: AudioContext, freq: number, startTime: number, duration = 1.6) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, startTime);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 3.5, startTime);
  filter.frequency.exponentialRampToValueAtTime(freq * 1.2, startTime + duration);

  gainNode.gain.setValueAtTime(0.001, startTime);
  gainNode.gain.linearRampToValueAtTime(0.18, startTime + 0.015);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

export function playChordAudio(chordName: string, instrument: InstrumentType = 'guitar'): void {
  try {
    const ctx = getAudioContext();
    const chordDef: ChordDefinition | null = getChordDefinition(chordName, instrument);

    const baseFreqs = instrument === 'guitar' ? GUITAR_OPEN_FREQS : UKULELE_OPEN_FREQS;
    const now = ctx.currentTime;

    if (chordDef) {
      let stringIdx = 0;
      chordDef.frets.forEach((fret, i) => {
        if (fret >= 0) {
          const freq = getFretFrequency(baseFreqs[i], fret);
          const strumDelay = stringIdx * 0.035;
          playPluckedString(ctx, freq, now + strumDelay, 1.8);
          stringIdx++;
        }
      });
    } else {
      playPluckedString(ctx, 220, now, 1.0);
      playPluckedString(ctx, 277.18, now + 0.04, 1.0);
      playPluckedString(ctx, 329.63, now + 0.08, 1.0);
    }
  } catch (err) {
    console.error('Audio playback error:', err);
  }
}

export function playMetronomeClick(isDownbeat = false): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = isDownbeat ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isDownbeat ? 1200 : 800, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.05);

    gainNode.gain.setValueAtTime(isDownbeat ? 0.35 : 0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  } catch (err) {
    console.error('Metronome audio error:', err);
  }
}

export function playReferenceTone(frequency: number, duration = 1.5): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, now);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  } catch (err) {
    console.error('Tone audio error:', err);
  }
}
