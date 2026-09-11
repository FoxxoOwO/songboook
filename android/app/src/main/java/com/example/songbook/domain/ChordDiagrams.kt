package com.example.songbook.domain

enum class InstrumentType {
    GUITAR,
    UKULELE
}

data class ChordDiagramData(
    val name: String,
    val instrument: InstrumentType,
    val frets: List<Int>, // -1 for muted (X), 0 for open (O), 1+ for fret number
    val fingers: List<Int> = emptyList(), // 0 for none, 1-4 for index/middle/ring/pinky
    val baseFret: Int = 1,
    val barreFret: Int? = null,
    val barreFrom: Int? = null,
    val barreTo: Int? = null
)

object ChordDiagramDatabase {

    private val GUITAR_CHORDS = mapOf(
        "C" to ChordDiagramData("C", InstrumentType.GUITAR, listOf(-1, 3, 2, 0, 1, 0), listOf(0, 3, 2, 0, 1, 0)),
        "Cm" to ChordDiagramData("Cm", InstrumentType.GUITAR, listOf(-1, 3, 5, 5, 4, 3), listOf(0, 1, 3, 4, 2, 1), baseFret = 3, barreFret = 3, barreFrom = 2, barreTo = 6),
        "C7" to ChordDiagramData("C7", InstrumentType.GUITAR, listOf(-1, 3, 2, 3, 1, 0), listOf(0, 3, 2, 4, 1, 0)),
        "Cmaj7" to ChordDiagramData("Cmaj7", InstrumentType.GUITAR, listOf(-1, 3, 2, 0, 0, 0), listOf(0, 3, 2, 0, 0, 0)),
        "Cadd9" to ChordDiagramData("Cadd9", InstrumentType.GUITAR, listOf(-1, 3, 2, 0, 3, 3), listOf(0, 2, 1, 0, 3, 4)),
        "Csus4" to ChordDiagramData("Csus4", InstrumentType.GUITAR, listOf(-1, 3, 3, 0, 1, 1), listOf(0, 3, 4, 0, 1, 1)),

        "D" to ChordDiagramData("D", InstrumentType.GUITAR, listOf(-1, -1, 0, 2, 3, 2), listOf(0, 0, 0, 1, 3, 2)),
        "Dm" to ChordDiagramData("Dm", InstrumentType.GUITAR, listOf(-1, -1, 0, 2, 3, 1), listOf(0, 0, 0, 2, 3, 1)),
        "D7" to ChordDiagramData("D7", InstrumentType.GUITAR, listOf(-1, -1, 0, 2, 1, 2), listOf(0, 0, 0, 2, 1, 3)),
        "Dmaj7" to ChordDiagramData("Dmaj7", InstrumentType.GUITAR, listOf(-1, -1, 0, 2, 2, 2), listOf(0, 0, 0, 1, 1, 1)),
        "Dsus2" to ChordDiagramData("Dsus2", InstrumentType.GUITAR, listOf(-1, -1, 0, 2, 3, 0), listOf(0, 0, 0, 1, 2, 0)),
        "Dsus4" to ChordDiagramData("Dsus4", InstrumentType.GUITAR, listOf(-1, -1, 0, 2, 3, 3), listOf(0, 0, 0, 1, 2, 3)),
        "D/F#" to ChordDiagramData("D/F#", InstrumentType.GUITAR, listOf(2, 0, 0, 2, 3, 2), listOf(1, 0, 0, 2, 4, 3)),

        "E" to ChordDiagramData("E", InstrumentType.GUITAR, listOf(0, 2, 2, 1, 0, 0), listOf(0, 2, 3, 1, 0, 0)),
        "Em" to ChordDiagramData("Em", InstrumentType.GUITAR, listOf(0, 2, 2, 0, 0, 0), listOf(0, 2, 3, 0, 0, 0)),
        "E7" to ChordDiagramData("E7", InstrumentType.GUITAR, listOf(0, 2, 0, 1, 0, 0), listOf(0, 2, 0, 1, 0, 0)),
        "Em7" to ChordDiagramData("Em7", InstrumentType.GUITAR, listOf(0, 2, 2, 0, 3, 3), listOf(0, 1, 2, 0, 3, 4)),
        "Esus4" to ChordDiagramData("Esus4", InstrumentType.GUITAR, listOf(0, 2, 2, 2, 0, 0), listOf(0, 2, 3, 4, 0, 0)),

        "F" to ChordDiagramData("F", InstrumentType.GUITAR, listOf(1, 3, 3, 2, 1, 1), listOf(1, 3, 4, 2, 1, 1), barreFret = 1, barreFrom = 1, barreTo = 6),
        "Fm" to ChordDiagramData("Fm", InstrumentType.GUITAR, listOf(1, 3, 3, 1, 1, 1), listOf(1, 3, 4, 1, 1, 1), barreFret = 1, barreFrom = 1, barreTo = 6),
        "Fmaj7" to ChordDiagramData("Fmaj7", InstrumentType.GUITAR, listOf(-1, -1, 3, 2, 1, 0), listOf(0, 0, 3, 2, 1, 0)),
        "F#m" to ChordDiagramData("F#m", InstrumentType.GUITAR, listOf(2, 4, 4, 2, 2, 2), listOf(1, 3, 4, 1, 1, 1), baseFret = 2, barreFret = 2, barreFrom = 1, barreTo = 6),

        "G" to ChordDiagramData("G", InstrumentType.GUITAR, listOf(3, 2, 0, 0, 0, 3), listOf(2, 1, 0, 0, 0, 3)),
        "Gm" to ChordDiagramData("Gm", InstrumentType.GUITAR, listOf(3, 5, 5, 3, 3, 3), listOf(1, 3, 4, 1, 1, 1), baseFret = 3, barreFret = 3, barreFrom = 1, barreTo = 6),
        "G7" to ChordDiagramData("G7", InstrumentType.GUITAR, listOf(3, 2, 0, 0, 0, 1), listOf(3, 2, 0, 0, 0, 1)),
        "Gsus4" to ChordDiagramData("Gsus4", InstrumentType.GUITAR, listOf(3, 2, 0, 0, 1, 3), listOf(3, 2, 0, 0, 1, 4)),

        "A" to ChordDiagramData("A", InstrumentType.GUITAR, listOf(-1, 0, 2, 2, 2, 0), listOf(0, 0, 1, 2, 3, 0)),
        "Am" to ChordDiagramData("Am", InstrumentType.GUITAR, listOf(-1, 0, 2, 2, 1, 0), listOf(0, 0, 2, 3, 1, 0)),
        "A7" to ChordDiagramData("A7", InstrumentType.GUITAR, listOf(-1, 0, 2, 0, 2, 0), listOf(0, 0, 2, 0, 3, 0)),
        "A7sus4" to ChordDiagramData("A7sus4", InstrumentType.GUITAR, listOf(-1, 0, 2, 0, 3, 0), listOf(0, 0, 2, 0, 3, 0)),
        "Am7" to ChordDiagramData("Am7", InstrumentType.GUITAR, listOf(-1, 0, 2, 0, 1, 0), listOf(0, 0, 2, 0, 1, 0)),

        "B" to ChordDiagramData("B", InstrumentType.GUITAR, listOf(-1, 2, 4, 4, 4, 2), listOf(0, 1, 2, 3, 4, 1), baseFret = 2, barreFret = 2, barreFrom = 2, barreTo = 6),
        "Bm" to ChordDiagramData("Bm", InstrumentType.GUITAR, listOf(-1, 2, 4, 4, 3, 2), listOf(0, 1, 3, 4, 2, 1), baseFret = 2, barreFret = 2, barreFrom = 2, barreTo = 6),
        "B7" to ChordDiagramData("B7", InstrumentType.GUITAR, listOf(-1, 2, 1, 2, 0, 2), listOf(0, 2, 1, 3, 0, 4)),
        "H" to ChordDiagramData("H", InstrumentType.GUITAR, listOf(-1, 2, 4, 4, 4, 2), listOf(0, 1, 2, 3, 4, 1), baseFret = 2, barreFret = 2, barreFrom = 2, barreTo = 6),
        "Hm" to ChordDiagramData("Hm", InstrumentType.GUITAR, listOf(-1, 2, 4, 4, 3, 2), listOf(0, 1, 3, 4, 2, 1), baseFret = 2, barreFret = 2, barreFrom = 2, barreTo = 6)
    )

    private val UKULELE_CHORDS = mapOf(
        "C" to ChordDiagramData("C", InstrumentType.UKULELE, listOf(0, 0, 0, 3), listOf(0, 0, 0, 3)),
        "Cm" to ChordDiagramData("Cm", InstrumentType.UKULELE, listOf(0, 3, 3, 3), listOf(0, 1, 2, 3)),
        "C7" to ChordDiagramData("C7", InstrumentType.UKULELE, listOf(0, 0, 0, 1), listOf(0, 0, 0, 1)),
        "D" to ChordDiagramData("D", InstrumentType.UKULELE, listOf(2, 2, 2, 0), listOf(1, 2, 3, 0)),
        "Dm" to ChordDiagramData("Dm", InstrumentType.UKULELE, listOf(2, 2, 1, 0), listOf(2, 3, 1, 0)),
        "E" to ChordDiagramData("E", InstrumentType.UKULELE, listOf(4, 4, 4, 2), listOf(2, 3, 4, 1)),
        "Em" to ChordDiagramData("Em", InstrumentType.UKULELE, listOf(0, 4, 3, 2), listOf(0, 3, 2, 1)),
        "F" to ChordDiagramData("F", InstrumentType.UKULELE, listOf(2, 0, 1, 0), listOf(2, 0, 1, 0)),
        "G" to ChordDiagramData("G", InstrumentType.UKULELE, listOf(0, 2, 3, 2), listOf(0, 1, 3, 2)),
        "A" to ChordDiagramData("A", InstrumentType.UKULELE, listOf(2, 1, 0, 0), listOf(2, 1, 0, 0)),
        "Am" to ChordDiagramData("Am", InstrumentType.UKULELE, listOf(2, 0, 0, 0), listOf(2, 0, 0, 0)),
        "B" to ChordDiagramData("B", InstrumentType.UKULELE, listOf(4, 3, 2, 2), listOf(3, 2, 1, 1)),
        "H" to ChordDiagramData("H", InstrumentType.UKULELE, listOf(4, 3, 2, 2), listOf(3, 2, 1, 1))
    )

    fun getChord(chordName: String, instrument: InstrumentType): ChordDiagramData? {
        val clean = chordName.trim()
        val map = if (instrument == InstrumentType.GUITAR) GUITAR_CHORDS else UKULELE_CHORDS
        return map[clean] ?: run {
            // Try normalized root
            if (clean.startsWith("H")) {
                map["B" + clean.substring(1)]
            } else null
        }
    }
}
