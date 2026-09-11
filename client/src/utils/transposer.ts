import type { NotationSystem } from '../types/index.js';

// Standard chromatic scale (12 semitones)
const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Map of all possible note names to chromatic pitch index (0-11)
const NOTE_TO_SEMITONE: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10, 'Hb': 10,
  'B': 11, 'Cb': 11, 'H': 11,
};

export function normalizeNoteName(note: string, notation: NotationSystem = 'international'): string {
  if (notation === 'european') {
    if (note === 'B') return 'Bb';
    if (note === 'H') return 'B';
  }
  return note;
}

export function formatNoteName(note: string, notation: NotationSystem = 'international'): string {
  if (notation === 'european') {
    if (note === 'B') return 'H';
    if (note === 'Bb') return 'B';
  }
  return note;
}

const CHORD_REGEX = /^([A-Ga-g][#b]?)([^/]*)(?:\/([A-Ga-g][#b]?))?$/;

export function transposeNote(
  note: string,
  semitones: number,
  preferFlats = false,
  notation: NotationSystem = 'international'
): string {
  const norm = normalizeNoteName(note, notation);
  const semitone = NOTE_TO_SEMITONE[norm.toUpperCase()];
  if (semitone === undefined) return note;

  let newSemitone = (semitone + semitones) % 12;
  if (newSemitone < 0) newSemitone += 12;

  const scale = preferFlats ? FLATS : SHARPS;
  const transposed = scale[newSemitone];
  return formatNoteName(transposed, notation);
}

export function transposeChord(
  chord: string,
  semitones: number,
  preferFlats = false,
  notation: NotationSystem = 'international'
): string {
  if (!chord || semitones === 0) return chord;

  const match = chord.trim().match(CHORD_REGEX);
  if (!match) return chord;

  const root = match[1];
  const modifier = match[2] || '';
  const bass = match[3];

  const transposedRoot = transposeNote(root, semitones, preferFlats, notation);
  if (bass) {
    const transposedBass = transposeNote(bass, semitones, preferFlats, notation);
    return `${transposedRoot}${modifier}/${transposedBass}`;
  }

  return `${transposedRoot}${modifier}`;
}

export function transposeChordProText(
  text: string,
  semitones: number,
  preferFlats = false,
  notation: NotationSystem = 'international'
): string {
  if (semitones === 0) return text;

  return text.replace(/\[([A-Ga-gHh][^\]]*)\]/g, (_match, chordContent) => {
    const parts = chordContent.split(/\s+/);
    const transposedParts = parts.map((part: string) =>
      transposeChord(part, semitones, preferFlats, notation)
    );
    return `[${transposedParts.join(' ')}]`;
  });
}

export function getCapoTransposedChord(
  chord: string,
  capoFret: number,
  preferFlats = false,
  notation: NotationSystem = 'international'
): string {
  return transposeChord(chord, -capoFret, preferFlats, notation);
}
