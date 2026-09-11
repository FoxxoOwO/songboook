package com.example.songbook.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ChordManagerTest {

    @Test
    fun testBasicTransposition() {
        assertEquals("D", ChordManager.transposeChord("C", 2))
        assertEquals("G", ChordManager.transposeChord("C", 7))
        assertEquals("C", ChordManager.transposeChord("G", 5))
        assertEquals("Am", ChordManager.transposeChord("Em", 5))
        assertEquals("Em", ChordManager.transposeChord("Am", 7))
        assertEquals("B", ChordManager.transposeChord("A", 2))
    }

    @Test
    fun testSlashChords() {
        assertEquals("E/G#", ChordManager.transposeChord("D/F#", 2))
        assertEquals("C/E", ChordManager.transposeChord("G/B", 5))
    }

    @Test
    fun testComplexExtensions() {
        assertEquals("Esus4", ChordManager.transposeChord("Dsus4", 2))
        assertEquals("B7sus4", ChordManager.transposeChord("A7sus4", 2))
        assertEquals("Dadd9", ChordManager.transposeChord("Cadd9", 2))
    }

    @Test
    fun testParseChordProLine() {
        val segments = ChordManager.parseChordProLine("[G]U stánků [C]na levnou [D]krásu")
        assertEquals(3, segments.size)
        assertEquals("G", segments[0].chord)
        assertEquals("U stánků ", segments[0].lyric)
        assertEquals("C", segments[1].chord)
        assertEquals("na levnou ", segments[1].lyric)
        assertEquals("D", segments[2].chord)
        assertEquals("krásu", segments[2].lyric)
    }

    @Test
    fun testTwoLineConversion() {
        val twoLine = """
            G         C
            U stánků  na levnou
        """.trimIndent()
        val converted = ChordManager.convertTwoLineToChordPro(twoLine)
        assertTrue(converted.contains("[G]"))
        assertTrue(converted.contains("[C]"))
    }
}
