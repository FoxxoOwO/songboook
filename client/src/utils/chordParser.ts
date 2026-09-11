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
  const clean = token.replace(/[()[\]]/g, '').trim();
  return CHORD_CANDIDATE_REGEX.test(clean);
}

/**
 * Checks if a line is a section header (e.g. [Verse 1], [Chorus], Verse 1:, R:, etc.)
 */
export function isSectionHeaderLine(line: string): boolean {
  const trimmed = line.trim();
  const clean = trimmed.startsWith('[') && trimmed.endsWith(']')
    ? trimmed.substring(1, trimmed.length - 1).trim()
    : trimmed;
  return /^(?:R:|Ref(?:r[eé]n)?.*|Chorus.*|Verse\s*\d+.*|Sloka\s*\d+.*|Bridge.*|Outro.*|Intro.*|Solo.*|Pre-Chorus.*|\d+\..*)$/i.test(clean);
}

/**
 * Checks if a line consists predominantly of chords and whitespace
 */
export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (isSectionHeaderLine(trimmed)) return false;
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return false;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;

  const chordCount = tokens.filter(isChord).length;
  // If at least 50% of tokens look like chords, treat as a chord line
  return chordCount / tokens.length >= 0.5;
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

    if (isChordLine(currentLine)) {
      // Look ahead for next non-empty line
      let nextNonEmptyIdx = i + 1;
      while (nextNonEmptyIdx < lines.length && lines[nextNonEmptyIdx].trim().length === 0) {
        nextNonEmptyIdx++;
      }

      if (nextNonEmptyIdx < lines.length) {
        const nextLine = lines[nextNonEmptyIdx];
        if (
          !isChordLine(nextLine) &&
          !isSectionHeaderLine(nextLine) &&
          !nextLine.trim().startsWith('{')
        ) {
          // Extract chords (both unbracketed Am and bracketed [Am]) with their column indices
          const chordMatches = currentLine.matchAll(/(?:\[([^\]]+)\]|\S+)/g);
          const chordsWithIndex: { chord: string; index: number }[] = [];
          for (const match of chordMatches) {
            const clean = match[0].replace(/[()[\]]/g, '').trim();
            if (isChord(clean)) {
              chordsWithIndex.push({ chord: clean, index: match.index ?? 0 });
            }
          }

          if (chordsWithIndex.length > 0) {
            let merged = '';
            let lastLyricIdx = 0;

            for (const { chord, index } of chordsWithIndex) {
              const targetIndex = Math.min(Math.max(0, index), nextLine.length);
              if (targetIndex > lastLyricIdx) {
                merged += nextLine.slice(lastLyricIdx, targetIndex);
                lastLyricIdx = targetIndex;
              }
              merged += `[${chord}]`;
            }
            if (lastLyricIdx < nextLine.length) {
              merged += nextLine.slice(lastLyricIdx);
            }

            result.push(merged);
            i = nextNonEmptyIdx + 1;
            continue;
          }
        }
      }
    }

    result.push(currentLine);
    i++;
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
  const normalized = convertTwoLineToChordPro(content);

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

    // Section headers: [Verse 1], [Chorus], Verse 1:, R:, etc.
    if (isSectionHeaderLine(trimmed)) {
      const cleanHeader = trimmed.startsWith('[') && trimmed.endsWith(']')
        ? trimmed.substring(1, trimmed.length - 1).trim()
        : trimmed;
      return {
        type: 'section-header',
        rawText: cleanHeader,
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
