package com.example.songbook.domain

data class ChordSegment(
    val chord: String? = null,
    val lyric: String = ""
)

private val WORD_SPLIT_REGEX = Regex("""\S+\s*|\s+""")

fun ChordSegment.splitIntoWordUnits(): List<ChordSegment> {
    if (lyric.isEmpty()) return listOf(this)
    val wordMatches = WORD_SPLIT_REGEX.findAll(lyric).toList()
    if (wordMatches.size <= 1) return listOf(this)

    return wordMatches.mapIndexed { index, match ->
        ChordSegment(
            chord = if (index == 0) this.chord else null,
            lyric = match.value
        )
    }
}

sealed class ParsedLine {
    data object Empty : ParsedLine()
    data class Directive(val name: String, val value: String, val rawText: String) : ParsedLine()
    data class SectionHeader(val rawText: String) : ParsedLine()
    data class ChordLyrics(
        val segments: List<ChordSegment>,
        val rawText: String,
        val displaySegments: List<ChordSegment> = segments.flatMap { it.splitIntoWordUnits() }
    ) : ParsedLine()
}

object ChordManager {
    private val SHARPS = listOf("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")
    private val FLATS = listOf("C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B")

    private val NOTE_TO_SEMITONE = mapOf(
        "C" to 0, "B#" to 0,
        "C#" to 1, "Db" to 1,
        "D" to 2,
        "D#" to 3, "Eb" to 3,
        "E" to 4, "Fb" to 4,
        "F" to 5, "E#" to 5,
        "F#" to 6, "Gb" to 6,
        "G" to 7,
        "G#" to 8, "Ab" to 8,
        "A" to 9,
        "A#" to 10, "Bb" to 10, "Hb" to 10,
        "B" to 11, "Cb" to 11, "H" to 11
    )

    private val CHORD_REGEX = Regex("""^([A-Ga-gHh][#b]?)([^/]*)(?:/([A-Ga-gHh][#b]?))?$""")
    private val CHORD_CANDIDATE_REGEX = Regex("""^[A-Ga-gHh][#b]?(?:m|min|maj|dim|aug|sus\d?|\d|\+|add\d?)*(?:/[A-Ga-gHh][#b]?)?$""")
    private val SECTION_HEADER_REGEX = Regex(
        """^(?:R:|Ref(?:r[eé]n)?.*|Chorus.*|Verse\s*\d+.*|Sloka\s*\d+.*|Bridge.*|Outro.*|Intro.*|Solo.*|Pre-Chorus.*|\d+\..*)$""",
        RegexOption.IGNORE_CASE
    )
    private val WHITESPACE_REGEX = Regex("""\s+""")
    private val CHORD_PRO_BRACKET_REGEX = Regex("""\[([^\]]+)\]""")
    private val CHORD_LINE_MATCHES_REGEX = Regex("""(?:\[([^\]]+)\]|\S+)""")
    private val STRIP_BRACKETS_REGEX = Regex("""\[[^\]]+\]""")

    fun isChord(token: String): Boolean {
        if (token.isBlank()) return false
        val clean = token.replace("(", "").replace(")", "").replace("[", "").replace("]", "").trim()
        return CHORD_CANDIDATE_REGEX.matches(clean)
    }

    fun isSectionHeaderLine(line: String): Boolean {
        val trimmed = line.trim()
        val clean = if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            trimmed.substring(1, trimmed.length - 1).trim()
        } else {
            trimmed
        }
        return SECTION_HEADER_REGEX.matches(clean)
    }

    fun isChordLine(line: String): Boolean {
        val trimmed = line.trim()
        if (trimmed.isEmpty()) return false
        if (isSectionHeaderLine(trimmed)) return false
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) return false
        val tokens = trimmed.split(WHITESPACE_REGEX).filter { it.isNotEmpty() }
        if (tokens.isEmpty()) return false
        val chordCount = tokens.count { isChord(it) }
        return (chordCount.toDouble() / tokens.size) >= 0.5
    }

    fun transposeNote(note: String, semitones: Int, preferFlats: Boolean = false): String {
        val upper = note.uppercase()
        val semitone = NOTE_TO_SEMITONE[upper] ?: return note

        var newSemitone = (semitone + semitones) % 12
        if (newSemitone < 0) newSemitone += 12

        val scale = if (preferFlats) FLATS else SHARPS
        return scale[newSemitone]
    }

    fun transposeChord(chord: String, semitones: Int, preferFlats: Boolean = false): String {
        if (chord.isBlank() || semitones == 0) return chord
        val match = CHORD_REGEX.matchEntire(chord.trim()) ?: return chord

        val root = match.groupValues[1]
        val modifier = match.groupValues[2]
        val bass = match.groupValues.getOrNull(3).orEmpty()

        val transposedRoot = transposeNote(root, semitones, preferFlats)
        return if (bass.isNotEmpty()) {
            val transposedBass = transposeNote(bass, semitones, preferFlats)
            "$transposedRoot$modifier/$transposedBass"
        } else {
            "$transposedRoot$modifier"
        }
    }

    fun parseChordProLine(line: String, semitones: Int = 0, preferFlats: Boolean = false): List<ChordSegment> {
        val segments = mutableListOf<ChordSegment>()
        var lastIndex = 0
        var currentChord: String? = null

        val matches = CHORD_PRO_BRACKET_REGEX.findAll(line)
        for (match in matches) {
            val textBefore = line.substring(lastIndex, match.range.first)
            if (textBefore.isNotEmpty() || currentChord != null) {
                segments.add(ChordSegment(chord = currentChord, lyric = textBefore))
                currentChord = null
            }
            val rawChord = match.groupValues[1].trim()
            currentChord = if (semitones != 0) transposeChord(rawChord, semitones, preferFlats) else rawChord
            lastIndex = match.range.last + 1
        }

        val remainingText = line.substring(lastIndex)
        if (remainingText.isNotEmpty() || currentChord != null) {
            segments.add(ChordSegment(chord = currentChord, lyric = remainingText))
        }

        return segments
    }

    fun convertTwoLineToChordPro(text: String): String {
        val lines = text.lines()
        val result = mutableListOf<String>()
        var i = 0

        while (i < lines.size) {
            val currentLine = lines[i]

            if (isChordLine(currentLine)) {
                var nextNonEmptyIdx = i + 1
                while (nextNonEmptyIdx < lines.size && lines[nextNonEmptyIdx].trim().isEmpty()) {
                    nextNonEmptyIdx++
                }

                if (nextNonEmptyIdx < lines.size) {
                    val nextLine = lines[nextNonEmptyIdx]
                    if (!isChordLine(nextLine) && !isSectionHeaderLine(nextLine) && !nextLine.trim().startsWith("{")) {
                        val chordMatches = CHORD_LINE_MATCHES_REGEX.findAll(currentLine)
                        val chordsWithIndex = mutableListOf<Pair<String, Int>>()
                        for (match in chordMatches) {
                            val clean = match.value.replace("[", "").replace("]", "").replace("(", "").replace(")", "").trim()
                            if (isChord(clean)) {
                                chordsWithIndex.add(Pair(clean, match.range.first))
                            }
                        }

                        if (chordsWithIndex.isNotEmpty()) {
                            val chordIndent = currentLine.takeWhile { it == ' ' }.length
                            val lyricIndent = nextLine.takeWhile { it == ' ' }.length
                            val prevLine = result.lastOrNull()?.trim()

                            // Check if the previous line was a short pick-up lyric line that belongs with this line.
                            // Note: 'A' is both a chord and the English article "A", so if followed by a chord line, it's a pick-up lyric.
                            val isPrevLyric = prevLine != null &&
                                (!isChordLine(prevLine) || prevLine == "A") &&
                                !isSectionHeaderLine(prevLine) &&
                                !prevLine.startsWith("{") &&
                                prevLine.isNotEmpty()

                            val isPickupContinuation = isPrevLyric && prevLine != null &&
                                (chordIndent >= 1 || lyricIndent >= 1) &&
                                (lyricIndent >= prevLine.length - 2 || chordIndent >= prevLine.length - 2)

                            var prefix = ""
                            if (isPickupContinuation && prevLine != null) {
                                result.removeAt(result.size - 1)
                                prefix = "$prevLine "
                            }

                            val cleanNextLine = if (isPickupContinuation) {
                                nextLine.trimStart()
                            } else {
                                nextLine
                            }

                            val merged = StringBuilder()
                            if (prefix.isNotEmpty()) {
                                merged.append(prefix)
                            }

                            var lastLyricIdx = 0

                            for ((chord, index) in chordsWithIndex) {
                                val effectiveIndex = if (isPickupContinuation) {
                                    val relIndex = (index - chordIndent).coerceAtLeast(0)
                                    relIndex.coerceIn(0, cleanNextLine.length)
                                } else {
                                    index.coerceIn(0, cleanNextLine.length)
                                }

                                var snappedIndex = effectiveIndex
                                if (snappedIndex in 1 until cleanNextLine.length &&
                                    cleanNextLine[snappedIndex].isLetterOrDigit() &&
                                    cleanNextLine[snappedIndex - 1].isLetterOrDigit()
                                ) {
                                    var wordStart = snappedIndex
                                    while (wordStart > 0 && cleanNextLine[wordStart - 1].isLetterOrDigit()) {
                                        wordStart--
                                    }
                                    if (snappedIndex - wordStart <= 2) {
                                        snappedIndex = wordStart
                                    }
                                }

                                val targetIdx = maxOf(snappedIndex, lastLyricIdx)
                                if (targetIdx > lastLyricIdx) {
                                    merged.append(cleanNextLine.substring(lastLyricIdx, targetIdx))
                                    lastLyricIdx = targetIdx
                                }
                                merged.append("[$chord]")
                            }
                            if (lastLyricIdx < cleanNextLine.length) {
                                merged.append(cleanNextLine.substring(lastLyricIdx))
                            }

                            result.add(merged.toString())
                            i = nextNonEmptyIdx + 1
                            continue
                        }
                    }
                }
            }

            // Also check if currentLine is an indented line following a pick-up line that was split
            val prevLine = result.lastOrNull()?.trim()
            val currentIndent = currentLine.takeWhile { it == ' ' }.length
            val isPrevLyric = prevLine != null &&
                (!isChordLine(prevLine) || prevLine == "A") &&
                !isSectionHeaderLine(prevLine) &&
                !prevLine.startsWith("{") &&
                prevLine.isNotEmpty()
            if (isPrevLyric &&
                prevLine != null &&
                currentIndent >= 1 &&
                currentIndent >= prevLine.length - 2 &&
                !isSectionHeaderLine(currentLine) &&
                !currentLine.trim().startsWith("{")
            ) {
                result.removeAt(result.size - 1)
                result.add("$prevLine ${currentLine.trim()}")
                i++
                continue
            }

            result.add(currentLine)
            i++
        }
        return result.joinToString("\n")
    }

    private val CHORD_CENTERING_REGEX = Regex("""(^|[\s\p{P}])([\p{L}]{1,2})\[([A-Ga-gHh][^\]]*)\]([\p{L}]+)""")

    fun snapCenteredChords(text: String): String {
        return text.replace(CHORD_CENTERING_REGEX) { match ->
            val prefix = match.groupValues[1]
            val wordStart = match.groupValues[2]
            val chord = match.groupValues[3]
            val wordEnd = match.groupValues[4]
            "$prefix[$chord]$wordStart$wordEnd"
        }
    }

    fun normalizeSongLines(text: String): String {
        val lines = text.lines()
        val result = mutableListOf<String>()
        var i = 0

        while (i < lines.size) {
            var line = lines[i]

            while (i + 1 < lines.size) {
                val nextLine = lines[i + 1].trim()
                val currentTrimmed = line.trim()
                if (nextLine.isEmpty() || currentTrimmed.isEmpty()) break
                if (nextLine.startsWith("{") || isSectionHeaderLine(nextLine)) break
                if (isChordLine(nextLine)) break

                val strippedNext = nextLine.replace(STRIP_BRACKETS_REGEX, "").trim()
                val nextStartsWithLower = strippedNext.isNotEmpty() && strippedNext.first().isLowerCase()
                val endsWithHyphen = currentTrimmed.endsWith("-")
                val endsWithPunct = currentTrimmed.isNotEmpty() && currentTrimmed.last() in ".!?:"

                val trailingLetters = currentTrimmed.takeLastWhile { it.isLetter() }.length
                val isMidWordSplit = nextLine.startsWith("[") && trailingLetters in 1..2

                if (endsWithHyphen) {
                    line = line.trimEnd().removeSuffix("-") + nextLine
                    i++
                } else if (nextStartsWithLower && !endsWithPunct) {
                    line = if (isMidWordSplit) {
                        line.trimEnd() + nextLine
                    } else {
                        line.trimEnd() + " " + nextLine
                    }
                    i++
                } else {
                    break
                }
            }

            result.add(snapCenteredChords(line))
            i++
        }

        return result.joinToString("\n")
    }

    fun parseSongContent(content: String, semitones: Int = 0, preferFlats: Boolean = false): List<ParsedLine> {
        val converted = convertTwoLineToChordPro(content)
        val normalized = normalizeSongLines(converted)

        return normalized.lines().map { line ->
            val trimmed = line.trim()
            when {
                trimmed.isEmpty() -> ParsedLine.Empty
                trimmed.startsWith("{") && trimmed.endsWith("}") -> {
                    val inside = trimmed.substring(1, trimmed.length - 1)
                    val colonIdx = inside.indexOf(':')
                    if (colonIdx != -1) {
                        val name = inside.substring(0, colonIdx).trim()
                        val value = inside.substring(colonIdx + 1).trim()
                        ParsedLine.Directive(name, value, trimmed)
                    } else {
                        ParsedLine.Directive(inside, "", trimmed)
                    }
                }
                isSectionHeaderLine(trimmed) -> {
                    val cleanHeader = if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                        trimmed.substring(1, trimmed.length - 1).trim()
                    } else {
                        trimmed
                    }
                    ParsedLine.SectionHeader(cleanHeader)
                }
                else -> {
                    val segments = parseChordProLine(line, semitones, preferFlats)
                    ParsedLine.ChordLyrics(segments, line)
                }
            }
        }
    }
}
