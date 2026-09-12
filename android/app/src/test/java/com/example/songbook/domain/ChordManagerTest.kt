package com.example.songbook.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
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

    @Test
    fun testSnapCenteredChords() {
        val input = "ve[C]nues and lo[C]ved and fi[F]nally and sl[F]ipping and di[F]stant but neče[Am]ká"
        val expected = "[C]venues and [C]loved and [F]finally and [F]slipping and [F]distant but neče[Am]ká"
        assertEquals(expected, ChordManager.snapCenteredChords(input))
    }

    @Test
    fun testNormalizeSongLinesHealing() {
        val broken = """
            A [G]white and golden wedding theme is fi-
            [F]nally coming true
            But that love is getting blurry and you're sl
            [F]ipping out of view
            Where your last
            words rip through my heart
        """.trimIndent()

        val healed = ChordManager.normalizeSongLines(broken)
        assertTrue("Should heal hyphenated line", healed.contains("wedding theme is [F]finally coming true"))
        assertTrue("Should heal mid-word split line", healed.contains("blurry and you're [F]slipping out of view"))
        assertTrue("Should heal lowercase continuation line", healed.contains("Where your last words rip through my heart"))
    }

    @Test
    fun testSameQuestionsVerseAndChorusConversion() {
        val tab = """
            [Verse 1]
                       [Am]             [C]
            Few months back, choosing venues
              [G]                                 [F]
            A white and golden wedding theme is finally coming true
                     [Am]          [C]
            You were mine, and I loved you
                     [G]                                 [F]
            But that love is getting blurry and you're slipping out of view
            
            [Chorus]
                    [C]
            Well, I hope this ain't the part
                            [Em]
            Where your last words rip through my heart
                       [Am]
            And then I lose you
                       [F]
            And then I have to
                  [C]
            Start over with some small talk
              [Em]
            A fake smile at the bar
        """.trimIndent()

        val parsed = ChordManager.parseSongContent(tab)
        val chordLyricLines = parsed.filterIsInstance<ParsedLine.ChordLyrics>().map { it.rawText }

        assertTrue("Should snap [C]venues", chordLyricLines.any { it.contains("[C]venues") })
        assertFalse("Should not contain ve[C]nues", chordLyricLines.any { it.contains("ve[C]nues") })

        assertTrue("Should snap [F]finally", chordLyricLines.any { it.contains("[F]finally") })
        assertFalse("Should not contain fi[F]nally", chordLyricLines.any { it.contains("fi[F]nally") })

        assertTrue("Should snap [C]loved", chordLyricLines.any { it.contains("[C]loved") })
        assertFalse("Should not contain lo[C]ved", chordLyricLines.any { it.contains("lo[C]ved") })

        assertTrue("Should snap [F]slipping", chordLyricLines.any { it.contains("[F]slipping") })
        assertFalse("Should not contain sl[F]ipping", chordLyricLines.any { it.contains("sl[F]ipping") })

        assertTrue("Chorus line 1", chordLyricLines.any { it.contains("Well, I [C]hope this ain't the part") })
        assertTrue("Chorus line 2", chordLyricLines.any { it.contains("Where your last [Em]words rip through my heart") })
        assertTrue("Chorus line 3", chordLyricLines.any { it.contains("And then I [Am]lose you") })
        assertTrue("Chorus line 4", chordLyricLines.any { it.contains("And then I [F]have to") })
        assertTrue("Chorus line 5", chordLyricLines.any { it.contains("Start [C]over with some small talk") })
        assertTrue("Chorus line 6", chordLyricLines.any { it.contains("A [Em]fake smile at the bar") })
    }
}
