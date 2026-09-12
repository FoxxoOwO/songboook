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

    @Test
    fun testSectionHeaderDetection() {
        assertTrue(ChordManager.isSectionHeaderLine("[Verse 1]"))
        assertTrue(ChordManager.isSectionHeaderLine("[Chorus]"))
        assertTrue(ChordManager.isSectionHeaderLine("Chorus:"))
        assertTrue(ChordManager.isSectionHeaderLine("Bridge"))
        assertTrue(ChordManager.isSectionHeaderLine("R:"))
        org.junit.Assert.assertFalse(ChordManager.isChordLine("[Verse 1]"))
        org.junit.Assert.assertFalse(ChordManager.isChordLine("[Chorus]"))
    }

    @Test
    fun testTwoLineConversionWithSectionHeaders() {
        val twoLine = """
            [Verse 1]
            Am               C
            Few months back, choosing venues
        """.trimIndent()
        val converted = ChordManager.convertTwoLineToChordPro(twoLine)
        assertTrue(converted.contains("[Verse 1]"))
        assertTrue(converted.contains("[Am]"))
        assertTrue(converted.contains("[C]"))
        assertTrue(converted.contains("[Am]Few months back, [C]choosing venues"))
    }

    @Test
    fun testTwoLineConversionWithPickupLyrics() {
        val tabWithPickups = """
            [Verse 1]
            Few months
                       Am             C
                       back, choosing venues
            A
              G
              white and golden wedding theme is fi
            F
            nally coming true
            Where your last
                           Em
                           words rip through my heart
            A
             Em
             fake
        """.trimIndent()

        val converted = ChordManager.convertTwoLineToChordPro(tabWithPickups)
        assertTrue("Should contain merged Few months line", converted.contains("Few months [Am]back, choosing [C]venues"))
        assertTrue("Should contain merged A line", converted.contains("A [G]white and golden wedding theme is fi"))
        assertTrue("Should contain [F]nally", converted.contains("[F]nally coming true"))
        assertTrue("Should contain merged Where your last line", converted.contains("Where your last [Em]words rip through my heart"))
        assertTrue("Should contain merged A fake line", converted.contains("A [Em]fake"))
    }

    @Test
    fun testIndentedChordProContinuation() {
        val chordProWithIndent = """
            Few months
                      [Am]back, choosing [C]venues
        """.trimIndent()
        val converted = ChordManager.convertTwoLineToChordPro(chordProWithIndent)
        assertEquals("Few months [Am]back, choosing [C]venues", converted.trim())
    }

    @Test
    fun testSplitIntoWordUnits() {
        val segment = ChordSegment("G", "white and golden ")
        val words = segment.splitIntoWordUnits()
        assertEquals(3, words.size)
        assertEquals("G", words[0].chord)
        assertEquals("white ", words[0].lyric)
        org.junit.Assert.assertNull(words[1].chord)
        assertEquals("and ", words[1].lyric)
        org.junit.Assert.assertNull(words[2].chord)
        assertEquals("golden ", words[2].lyric)
    }

    @Test
    fun testFormatBaseUrl() {
        assertEquals("http://192.168.1.50:3000", com.example.songbook.data.remote.ServerApiClient.formatBaseUrl("192.168.1.50:3000"))
        assertEquals("http://192.168.1.50:3000", com.example.songbook.data.remote.ServerApiClient.formatBaseUrl("http://192.168.1.50:3000/"))
        assertEquals("https://my-songbook.cz", com.example.songbook.data.remote.ServerApiClient.formatBaseUrl("https://my-songbook.cz/"))
    }
}
