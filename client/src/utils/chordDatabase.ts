import type { ChordDefinition, InstrumentType } from '../types/index.js';

const GUITAR_CHORDS: Record<string, Omit<ChordDefinition, 'name' | 'instrument'>> = {
  // C
  'C': { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  'Cm': { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], baseFret: 3, barre: { fret: 3, fromString: 2, toString: 6 } },
  'C7': { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  'Cmaj7': { frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
  'Cadd9': { frets: [-1, 3, 2, 0, 3, 3], fingers: [0, 2, 1, 0, 3, 4] },
  'Csus4': { frets: [-1, 3, 3, 0, 1, 1], fingers: [0, 3, 4, 0, 1, 1] },

  // C# / Db
  'C#': { frets: [-1, 4, 6, 6, 6, 4], fingers: [0, 1, 2, 3, 4, 1], baseFret: 4, barre: { fret: 4, fromString: 2, toString: 6 } },
  'Db': { frets: [-1, 4, 6, 6, 6, 4], fingers: [0, 1, 2, 3, 4, 1], baseFret: 4, barre: { fret: 4, fromString: 2, toString: 6 } },
  'C#m': { frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], baseFret: 4, barre: { fret: 4, fromString: 2, toString: 6 } },
  'Dbm': { frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], baseFret: 4, barre: { fret: 4, fromString: 2, toString: 6 } },
  'C#7': { frets: [-1, 4, 6, 4, 6, 4], fingers: [0, 1, 3, 1, 4, 1], baseFret: 4, barre: { fret: 4, fromString: 2, toString: 6 } },

  // D
  'D': { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  'Dm': { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  'D7': { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  'Dmaj7': { frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1], barre: { fret: 2, fromString: 4, toString: 6 } },
  'Dsus2': { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0] },
  'Dsus4': { frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3] },
  'D/F#': { frets: [2, 0, 0, 2, 3, 2], fingers: [1, 0, 0, 2, 4, 3] },

  // D# / Eb
  'D#': { frets: [-1, 6, 8, 8, 8, 6], fingers: [0, 1, 2, 3, 4, 1], baseFret: 6, barre: { fret: 6, fromString: 2, toString: 6 } },
  'Eb': { frets: [-1, 6, 8, 8, 8, 6], fingers: [0, 1, 2, 3, 4, 1], baseFret: 6, barre: { fret: 6, fromString: 2, toString: 6 } },
  'D#m': { frets: [-1, 6, 8, 8, 7, 6], fingers: [0, 1, 3, 4, 2, 1], baseFret: 6, barre: { fret: 6, fromString: 2, toString: 6 } },
  'Ebm': { frets: [-1, 6, 8, 8, 7, 6], fingers: [0, 1, 3, 4, 2, 1], baseFret: 6, barre: { fret: 6, fromString: 2, toString: 6 } },

  // E
  'E': { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  'Em': { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  'E7': { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  'Em7': { frets: [0, 2, 2, 0, 3, 3], fingers: [0, 1, 2, 0, 3, 4] },
  'Emaj7': { frets: [0, 2, 1, 1, 0, 0], fingers: [0, 3, 1, 2, 0, 0] },
  'Esus4': { frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0] },

  // F
  'F': { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: { fret: 1, fromString: 1, toString: 6 } },
  'Fm': { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], barre: { fret: 1, fromString: 1, toString: 6 } },
  'F7': { frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], barre: { fret: 1, fromString: 1, toString: 6 } },
  'Fmaj7': { frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0] },

  // F# / Gb
  'F#': { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], baseFret: 2, barre: { fret: 2, fromString: 1, toString: 6 } },
  'Gb': { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], baseFret: 2, barre: { fret: 2, fromString: 1, toString: 6 } },
  'F#m': { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], baseFret: 2, barre: { fret: 2, fromString: 1, toString: 6 } },
  'Gbm': { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], baseFret: 2, barre: { fret: 2, fromString: 1, toString: 6 } },
  'F#7': { frets: [2, 4, 2, 3, 2, 2], fingers: [1, 3, 1, 2, 1, 1], baseFret: 2, barre: { fret: 2, fromString: 1, toString: 6 } },

  // G
  'G': { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  'Gm': { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 3, barre: { fret: 3, fromString: 1, toString: 6 } },
  'G7': { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  'Gmaj7': { frets: [3, 2, 0, 0, 0, 2], fingers: [2, 1, 0, 0, 0, 3] },
  'Gsus4': { frets: [3, 2, 0, 0, 1, 3], fingers: [3, 2, 0, 0, 1, 4] },

  // G# / Ab
  'G#': { frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], baseFret: 4, barre: { fret: 4, fromString: 1, toString: 6 } },
  'Ab': { frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], baseFret: 4, barre: { fret: 4, fromString: 1, toString: 6 } },
  'G#m': { frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], baseFret: 4, barre: { fret: 4, fromString: 1, toString: 6 } },
  'Abm': { frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], baseFret: 4, barre: { fret: 4, fromString: 1, toString: 6 } },

  // A
  'A': { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  'Am': { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  'A7': { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
  'Am7': { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
  'Amaj7': { frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0] },
  'Asus2': { frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0] },
  'Asus4': { frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0] },
  'A7sus4': { frets: [-1, 0, 2, 0, 3, 0], fingers: [0, 0, 1, 0, 2, 0] },

  // A# / Bb
  'A#': { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], barre: { fret: 1, fromString: 2, toString: 6 } },
  'Bb': { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], barre: { fret: 1, fromString: 2, toString: 6 } },
  'A#m': { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 1, fromString: 2, toString: 6 } },
  'Bbm': { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 1, fromString: 2, toString: 6 } },

  // B / H
  'B': { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], baseFret: 2, barre: { fret: 2, fromString: 2, toString: 6 } },
  'H': { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], baseFret: 2, barre: { fret: 2, fromString: 2, toString: 6 } },
  'Bm': { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 2, barre: { fret: 2, fromString: 2, toString: 6 } },
  'Hm': { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 2, barre: { fret: 2, fromString: 2, toString: 6 } },
  'B7': { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  'H7': { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  'Bm7': { frets: [-1, 2, 4, 2, 3, 2], fingers: [0, 1, 3, 1, 2, 1], baseFret: 2, barre: { fret: 2, fromString: 2, toString: 6 } },
  'Hm7': { frets: [-1, 2, 4, 2, 3, 2], fingers: [0, 1, 3, 1, 2, 1], baseFret: 2, barre: { fret: 2, fromString: 2, toString: 6 } },
};

const UKULELE_CHORDS: Record<string, Omit<ChordDefinition, 'name' | 'instrument'>> = {
  // C
  'C': { frets: [0, 0, 0, 3], fingers: [0, 0, 0, 3] },
  'Cm': { frets: [0, 3, 3, 3], fingers: [0, 1, 2, 3] },
  'C7': { frets: [0, 0, 0, 1], fingers: [0, 0, 0, 1] },
  'Cmaj7': { frets: [0, 0, 0, 2], fingers: [0, 0, 0, 2] },

  // D
  'D': { frets: [2, 2, 2, 0], fingers: [1, 2, 3, 0] },
  'Dm': { frets: [2, 2, 1, 0], fingers: [2, 3, 1, 0] },
  'D7': { frets: [2, 0, 2, 0], fingers: [2, 0, 3, 0] },
  'Dsus4': { frets: [2, 2, 3, 0], fingers: [1, 2, 3, 0] },

  // E
  'E': { frets: [4, 4, 4, 2], fingers: [2, 3, 4, 1], baseFret: 2 },
  'Em': { frets: [0, 4, 3, 2], fingers: [0, 3, 2, 1] },
  'E7': { frets: [1, 2, 0, 2], fingers: [1, 2, 0, 3] },

  // F
  'F': { frets: [2, 0, 1, 0], fingers: [2, 0, 1, 0] },
  'Fm': { frets: [1, 0, 1, 3], fingers: [1, 0, 2, 4] },
  'F7': { frets: [2, 3, 1, 0], fingers: [2, 3, 1, 0] },

  // G
  'G': { frets: [0, 2, 3, 2], fingers: [0, 1, 3, 2] },
  'Gm': { frets: [0, 2, 3, 1], fingers: [0, 2, 3, 1] },
  'G7': { frets: [0, 2, 1, 2], fingers: [0, 2, 1, 3] },

  // A
  'A': { frets: [2, 1, 0, 0], fingers: [2, 1, 0, 0] },
  'Am': { frets: [2, 0, 0, 0], fingers: [2, 0, 0, 0] },
  'A7': { frets: [1, 0, 0, 0], fingers: [1, 0, 0, 0] },

  // B / H / Bb
  'B': { frets: [4, 3, 2, 2], fingers: [3, 2, 1, 1], barre: { fret: 2, fromString: 3, toString: 4 } },
  'H': { frets: [4, 3, 2, 2], fingers: [3, 2, 1, 1], barre: { fret: 2, fromString: 3, toString: 4 } },
  'Bb': { frets: [3, 2, 1, 1], fingers: [3, 2, 1, 1], barre: { fret: 1, fromString: 3, toString: 4 } },
  'Bm': { frets: [4, 2, 2, 2], fingers: [3, 1, 1, 1], barre: { fret: 2, fromString: 2, toString: 4 } },
  'Hm': { frets: [4, 2, 2, 2], fingers: [3, 1, 1, 1], barre: { fret: 2, fromString: 2, toString: 4 } },
  'B7': { frets: [2, 3, 2, 2], fingers: [1, 2, 1, 1], barre: { fret: 2, fromString: 1, toString: 4 } },
  'H7': { frets: [2, 3, 2, 2], fingers: [1, 2, 1, 1], barre: { fret: 2, fromString: 1, toString: 4 } },
};

export function cleanChordName(name: string): string {
  if (!name) return '';
  return name.trim().replace(/[()]/g, '');
}

export function getChordDefinition(chordName: string, instrument: InstrumentType = 'guitar'): ChordDefinition | null {
  const clean = cleanChordName(chordName);
  if (!clean) return null;

  const db: Record<string, Omit<ChordDefinition, 'name' | 'instrument'>> =
    instrument === 'guitar' ? GUITAR_CHORDS : UKULELE_CHORDS;

  const found = db[clean];
  if (found) {
    return {
      name: clean,
      instrument,
      ...found,
    };
  }

  if (clean.includes('/')) {
    const [baseChord] = clean.split('/');
    const baseFound = db[baseChord];
    if (baseFound) {
      return {
        name: clean,
        instrument,
        ...baseFound,
      };
    }
  }

  if (clean.startsWith('H')) {
    const equiv = 'B' + clean.slice(1);
    const equivFound = db[equiv];
    if (equivFound) {
      return {
        name: clean,
        instrument,
        ...equivFound,
      };
    }
  }

  return null;
}
