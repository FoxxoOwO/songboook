export interface ChordSegment {
  chord?: string;
  lyric: string;
}

export interface ParsedLine {
  type: 'directive' | 'section-header' | 'chord-lyrics' | 'empty' | 'comment';
  segments?: ChordSegment[];
  rawText?: string;
  directiveName?: string;
  directiveValue?: string;
}

const CHORD_CANDIDATE_REGEX = /^[A-Ga-gHh][#b]?(?:m|min|maj|dim|aug|sus\d?|\d|\+|add\d?)*(?:\/[A-Ga-gHh][#b]?)?$/;

/**
 * Checks if a token looks like a chord
 */
export function isChord(token: string): boolean {
  if (!token) return false;
  const clean = token.replace(/[()]/g, '').trim();
  return CHORD_CANDIDATE_REGEX.test(clean);
}

/**
 * Checks if a line consists predominantly of chords and whitespace
 */
export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;

  const chordCount = tokens.filter(isChord).length;
  // If at least 70% of tokens look like chords, treat as a chord line
  return chordCount / tokens.length >= 0.7;
}

/**
 * Converts two-line format (chords above lyrics) into ChordPro format [Am]lyric
 */
export function convertTwoLineToChordPro(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const currentLine = lines[i];
    const nextLine = i + 1 < lines.length ? lines[i + 1] : null;

    if (isChordLine(currentLine) && nextLine !== null && !isChordLine(nextLine) && nextLine.trim().length > 0) {
      // Merge chord line and lyric line based on character positions
      const chordLine = currentLine;
      const lyricLine = nextLine;

      // Extract chords and their 0-based column indices
      const chordsWithIndex: { chord: string; index: number }[] = [];
      const regex = /\S+/g;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(chordLine)) !== null) {
        if (isChord(match[0])) {
          chordsWithIndex.push({ chord: match[0], index: match.index });
        }
      }

      // Interleave into lyric line
      let merged = '';
      let lastLyricIdx = 0;

      for (const { chord, index } of chordsWithIndex) {
        if (index > lastLyricIdx) {
          merged += lyricLine.slice(lastLyricIdx, index);
          lastLyricIdx = index;
        }
        merged += `[${chord}]`;
      }
      merged += lyricLine.slice(lastLyricIdx);

      result.push(merged);
      i += 2; // Skipped both lines
    } else {
      result.push(currentLine);
      i += 1;
    }
  }

  return result.join('\n');
}

/**
 * Parses a single line in ChordPro format into ChordSegments
 */
export function parseChordProLine(line: string): ChordSegment[] {
  const segments: ChordSegment[] = [];
  const regex = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let currentChord: string | undefined = undefined;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    const textBefore = line.substring(lastIndex, match.index);
    if (textBefore.length > 0 || currentChord) {
      segments.push({
        chord: currentChord,
        lyric: textBefore,
      });
      currentChord = undefined;
    }
    currentChord = match[1];
    lastIndex = regex.lastIndex;
  }

  // Trailing lyric after the last chord
  const remainingText = line.substring(lastIndex);
  if (remainingText.length > 0 || currentChord) {
    segments.push({
      chord: currentChord,
      lyric: remainingText,
    });
  }

  return segments;
}

/**
 * Parses full song content into structured lines for rendering
 */
export function parseSongContent(content: string): ParsedLine[] {
  // If user pasted raw text where chords are on line above lyrics, auto-convert it
  const isChordPro = /\[[A-Ga-gHh][^\]]*\]/.test(content);
  const normalized = isChordPro ? content : convertTwoLineToChordPro(content);

  const lines = normalized.split('\n');
  return lines.map((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return { type: 'empty' };
    }

    // Directives: {title: ...} or {c: Chorus}
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const inside = trimmed.slice(1, -1);
      const colonIdx = inside.indexOf(':');
      if (colonIdx !== -1) {
        const name = inside.substring(0, colonIdx).trim();
        const value = inside.substring(colonIdx + 1).trim();
        return {
          type: 'directive',
          directiveName: name,
          directiveValue: value,
          rawText: trimmed,
        };
      }
      return { type: 'directive', directiveName: inside, rawText: trimmed };
    }

    // Section headers: R:, Ref:, Chorus:, Verse 1:, 1., [Chorus]
    const isSectionHeader =
      /^(?:R:|Ref(?:r[eé]n)?:|Chorus:|Verse\s*\d+:|Sloka\s*\d+:|Bridge:|Outro:|Intro:|\d+\.)/i.test(trimmed);
    if (isSectionHeader) {
      return {
        type: 'section-header',
        rawText: line,
      };
    }

    // Chord + lyric line
    const segments = parseChordProLine(line);
    return {
      type: 'chord-lyrics',
      segments,
      rawText: line,
    };
  });
}
