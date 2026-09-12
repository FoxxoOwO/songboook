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
 * Splits a ChordSegment into word-level sub-segments so multi-word lyrics can wrap smoothly.
 */
export function splitSegmentIntoWordUnits(segment: ChordSegment): ChordSegment[] {
  if (!segment.lyric) return [segment];
  const wordMatches = segment.lyric.match(/\S+\s*|\s+/g);
  if (!wordMatches || wordMatches.length <= 1) return [segment];

  return wordMatches.map((word, idx) => ({
    chord: idx === 0 ? segment.chord : undefined,
    lyric: word,
  }));
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
            const chordIndent = currentLine.match(/^ */)?.[0].length ?? 0;
            const lyricIndent = nextLine.match(/^ */)?.[0].length ?? 0;
            const prevLine = result.length > 0 ? result[result.length - 1].trim() : null;

            // Check if the previous line was a short pick-up lyric line that belongs with this line
            const isPrevLyric =
              prevLine !== null &&
              (!isChordLine(prevLine) || prevLine === 'A') &&
              !isSectionHeaderLine(prevLine) &&
              !prevLine.startsWith('{') &&
              prevLine.length > 0;

            const isPickupContinuation =
              isPrevLyric &&
              prevLine !== null &&
              (chordIndent >= 1 || lyricIndent >= 1) &&
              (lyricIndent >= prevLine.length - 2 || chordIndent >= prevLine.length - 2);

            let prefix = '';
            if (isPickupContinuation && prevLine !== null) {
              result.pop();
              prefix = `${prevLine} `;
            }

            const cleanNextLine = isPickupContinuation ? nextLine.trimStart() : nextLine;

            let merged = prefix;
            let lastLyricIdx = 0;

            for (const { chord, index } of chordsWithIndex) {
              const effectiveIndex = isPickupContinuation
                ? Math.min(Math.max(0, index - chordIndent), cleanNextLine.length)
                : Math.min(Math.max(0, index), cleanNextLine.length);

              let snappedIndex = effectiveIndex;
              if (
                snappedIndex > 0 &&
                snappedIndex < cleanNextLine.length &&
                /\p{L}|\p{N}/u.test(cleanNextLine[snappedIndex]) &&
                /\p{L}|\p{N}/u.test(cleanNextLine[snappedIndex - 1])
              ) {
                let wordStart = snappedIndex;
                while (wordStart > 0 && /\p{L}|\p{N}/u.test(cleanNextLine[wordStart - 1])) {
                  wordStart--;
                }
                if (snappedIndex - wordStart <= 2) {
                  snappedIndex = wordStart;
                }
              }

              const targetIdx = Math.max(snappedIndex, lastLyricIdx);
              if (targetIdx > lastLyricIdx) {
                merged += cleanNextLine.slice(lastLyricIdx, targetIdx);
                lastLyricIdx = targetIdx;
              }
              merged += `[${chord}]`;
            }
            if (lastLyricIdx < cleanNextLine.length) {
              merged += cleanNextLine.slice(lastLyricIdx);
            }

            result.push(merged);
            i = nextNonEmptyIdx + 1;
            continue;
          }
        }
      }
    }

    // Also check if currentLine is an indented line following a pick-up line that was split
    const prevLine = result.length > 0 ? result[result.length - 1].trim() : null;
    const currentIndent = currentLine.match(/^ */)?.[0].length ?? 0;
    const isPrevLyric =
      prevLine !== null &&
      (!isChordLine(prevLine) || prevLine === 'A') &&
      !isSectionHeaderLine(prevLine) &&
      !prevLine.startsWith('{') &&
      prevLine.length > 0;

    if (
      isPrevLyric &&
      prevLine !== null &&
      currentIndent >= 1 &&
      currentIndent >= prevLine.length - 2 &&
      !isSectionHeaderLine(currentLine) &&
      !currentLine.trim().startsWith('{')
    ) {
      result.pop();
      result.push(`${prevLine} ${currentLine.trim()}`);
      i++;
      continue;
    }

    result.push(currentLine);
    i++;
  }

  return result.join('\n');
}

const CHORD_CENTERING_REGEX = /(^|[\s\p{P}])([\p{L}]{1,2})\[([A-Ga-gHh][^\]]*)\]([\p{L}]+)/gu;

export function snapCenteredChords(text: string): string {
  return text.replace(CHORD_CENTERING_REGEX, '$1[$3]$2$4');
}

export function normalizeSongLines(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    let line = lines[i];

    while (i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      const currentTrimmed = line.trim();
      if (!nextLine || !currentTrimmed) break;
      if (nextLine.startsWith('{') || isSectionHeaderLine(nextLine)) break;
      if (isChordLine(nextLine)) break;

      const strippedNext = nextLine.replace(/\[[^\]]+\]/g, '').trim();
      const nextStartsWithLower = /^[\p{Ll}]/u.test(strippedNext);
      const endsWithHyphen = currentTrimmed.endsWith('-');
      const endsWithPunct = /[.!?:]$/.test(currentTrimmed);

      const trailingLetters = (currentTrimmed.match(/[\p{L}]+$/u)?.[0] || '').length;
      const isMidWordSplit = nextLine.startsWith('[') && trailingLetters >= 1 && trailingLetters <= 2;

      if (endsWithHyphen) {
        line = line.trimEnd().replace(/-$/, '') + nextLine;
        i++;
      } else if (nextStartsWithLower && !endsWithPunct) {
        line = isMidWordSplit ? line.trimEnd() + nextLine : line.trimEnd() + ' ' + nextLine;
        i++;
      } else {
        break;
      }
    }

    result.push(snapCenteredChords(line));
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
  const converted = convertTwoLineToChordPro(content);
  const normalized = normalizeSongLines(converted);

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
