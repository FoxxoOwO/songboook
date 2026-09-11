import test from 'node:test';
import assert from 'node:assert/strict';

const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const NOTE_TO_SEMITONE = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10, 'B': 11, 'H': 11
};

function transposeChord(chord, semitones, preferFlats = false) {
  if (!chord || semitones === 0) return chord;
  const match = chord.trim().match(/^([A-Ga-gHh][#b]?)([^/]*)(?:\/([A-Ga-gHh][#b]?))?$/);
  if (!match) return chord;

  const root = match[1];
  const mod = match[2] || '';
  const bass = match[3];

  const transposeNote = (note) => {
    let s = NOTE_TO_SEMITONE[note.toUpperCase()];
    if (s === undefined) return note;
    let n = (s + semitones) % 12;
    if (n < 0) n += 12;
    return preferFlats ? FLATS[n] : SHARPS[n];
  };

  const transposedRoot = transposeNote(root);
  if (bass) {
    return `${transposedRoot}${mod}/${transposeNote(bass)}`;
  }
  return `${transposedRoot}${mod}`;
}

test('Transposition of basic chords', () => {
  assert.equal(transposeChord('C', 2), 'D');
  assert.equal(transposeChord('G', 2), 'A');
  assert.equal(transposeChord('Am', 2), 'Bm');
  assert.equal(transposeChord('E7', 1), 'F7');
  assert.equal(transposeChord('F#m', 1), 'Gm');
  assert.equal(transposeChord('F#m', 2), 'G#m');
  assert.equal(transposeChord('C', -2), 'A#');
  assert.equal(transposeChord('C', -2, true), 'Bb');
});

test('Transposition of slash chords', () => {
  assert.equal(transposeChord('D/F#', 2), 'E/G#');
  assert.equal(transposeChord('C/G', 2), 'D/A');
});

test('Transposition of complex chord extensions', () => {
  assert.equal(transposeChord('Cadd9', 2), 'Dadd9');
  assert.equal(transposeChord('Asus4', 2), 'Bsus4');
  assert.equal(transposeChord('Em7', 3), 'Gm7');
});

test('Two-line parser converter', () => {
  const CHORD_CANDIDATE_REGEX = /^[A-Ga-gHh][#b]?(?:m|min|maj|dim|aug|sus\d?|\d|\+|add\d?)*(?:\/[A-Ga-gHh][#b]?)?$/;
  const isChord = (tok) => {
    if (!tok) return false;
    const clean = tok.replace(/[()[\]]/g, '').trim();
    return CHORD_CANDIDATE_REGEX.test(clean);
  };
  const isSectionHeaderLine = (line) => {
    const trimmed = line.trim();
    const clean = trimmed.startsWith('[') && trimmed.endsWith(']')
      ? trimmed.substring(1, trimmed.length - 1).trim()
      : trimmed;
    return /^(?:R:|Ref(?:r[eé]n)?.*|Chorus.*|Verse\s*\d+.*|Sloka\s*\d+.*|Bridge.*|Outro.*|Intro.*|Solo.*|Pre-Chorus.*|\d+\..*)$/i.test(clean);
  };
  const isChordLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (isSectionHeaderLine(trimmed)) return false;
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) return false;
    const toks = trimmed.split(/\s+/).filter(Boolean);
    return toks.length > 0 && toks.filter(isChord).length / toks.length >= 0.5;
  };

  assert.equal(isChordLine('Am    C    G'), true);
  assert.equal(isChordLine('[Am]    [C]    [G]'), true);
  assert.equal(isChordLine('U stánků na levnou krásu'), false);
  assert.equal(isChordLine('[Verse 1]'), false);
  assert.equal(isChordLine('[Chorus]'), false);
  assert.equal(isChordLine('R:'), false);
  assert.equal(isSectionHeaderLine('[Verse 1]'), true);
  assert.equal(isSectionHeaderLine('[Chorus]'), true);
  assert.equal(isSectionHeaderLine('Bridge'), true);
});
