package com.example.songbook.ui.screens.stagemode

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.SkipPrevious
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.songbook.data.repository.SongRepository
import com.example.songbook.domain.ChordManager
import com.example.songbook.domain.ChordSegment
import com.example.songbook.domain.ParsedLine
import kotlinx.coroutines.delay

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun StageModeScreen(
    songId: String,
    repository: SongRepository,
    onClose: () -> Unit,
    onNavigateSong: (String) -> Unit
) {
    val songs by repository.songs.collectAsState()
    val currentIndex = songs.indexOfFirst { it.id == songId }
    val song = songs.getOrNull(currentIndex)

    if (song == null) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black),
            contentAlignment = Alignment.Center
        ) {
            Text("Píseň nenalezena", color = Color.White)
        }
        return
    }

    val scrollState = rememberScrollState()
    var isAutoscrolling by remember { mutableStateOf(false) }
    var speed by remember { mutableIntStateOf(song.autoscroll_speed.coerceIn(5, 60)) }

    LaunchedEffect(isAutoscrolling, speed) {
        while (isAutoscrolling) {
            delay(50)
            val step = (speed * 0.05f).toInt().coerceAtLeast(1)
            scrollState.scrollTo((scrollState.value + step).coerceAtMost(scrollState.maxValue))
            if (scrollState.value >= scrollState.maxValue) {
                isAutoscrolling = false
            }
        }
    }

    val parsedLines = remember(song.content) {
        ChordManager.parseSongContent(song.content)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(horizontal = 24.dp, vertical = 36.dp)
        ) {
            // Stage Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = song.title,
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = song.artist + if (song.capo > 0) " • Capo ${song.capo}" else "",
                        fontSize = 18.sp,
                        color = Color(0xFFA1A1AA)
                    )
                }

                IconButton(
                    onClick = onClose,
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF27272A))
                ) {
                    Icon(Icons.Default.Close, contentDescription = "Zavřít", tint = Color.White)
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            // Stage Lyrics & Chords (Huge Font)
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                parsedLines.forEach { line ->
                    when (line) {
                        is ParsedLine.Empty -> {
                            Spacer(modifier = Modifier.height(18.dp))
                        }
                        is ParsedLine.Directive -> {
                            // Skipped in stage mode
                        }
                        is ParsedLine.SectionHeader -> {
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = line.rawText,
                                fontSize = 24.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color(0xFFE4E4E7),
                                fontFamily = FontFamily.Monospace
                            )
                        }
                        is ParsedLine.ChordLyrics -> {
                            FlowRow(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.Start
                            ) {
                                line.segments.forEach { segment ->
                                    StageChordSegmentView(segment = segment)
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(140.dp))
        }

        // Floating Stage Controls
        Surface(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 24.dp),
            shape = CircleShape,
            color = Color(0xFF18181B),
            shadowElevation = 12.dp
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Prev Song
                IconButton(
                    onClick = {
                        if (currentIndex > 0) {
                            onNavigateSong(songs[currentIndex - 1].id)
                        }
                    },
                    enabled = currentIndex > 0
                ) {
                    Icon(
                        Icons.Default.SkipPrevious,
                        contentDescription = "Předchozí píseň",
                        tint = if (currentIndex > 0) Color.White else Color(0xFF52525B)
                    )
                }

                // Autoscroll Toggle
                IconButton(
                    onClick = { isAutoscrolling = !isAutoscrolling },
                    modifier = Modifier
                        .size(52.dp)
                        .clip(CircleShape)
                        .background(Color.White)
                ) {
                    Icon(
                        if (isAutoscrolling) Icons.Default.Pause else Icons.Default.PlayArrow,
                        contentDescription = "Posun",
                        tint = Color.Black,
                        modifier = Modifier.size(28.dp)
                    )
                }

                // Next Song
                IconButton(
                    onClick = {
                        if (currentIndex < songs.size - 1) {
                            onNavigateSong(songs[currentIndex + 1].id)
                        }
                    },
                    enabled = currentIndex < songs.size - 1
                ) {
                    Icon(
                        Icons.Default.SkipNext,
                        contentDescription = "Další píseň",
                        tint = if (currentIndex < songs.size - 1) Color.White else Color(0xFF52525B)
                    )
                }
            }
        }
    }
}

@Composable
fun StageChordSegmentView(segment: ChordSegment) {
    Column(
        modifier = Modifier.width(IntrinsicSize.Min),
        horizontalAlignment = Alignment.Start
    ) {
        if (!segment.chord.isNullOrBlank()) {
            Text(
                text = segment.chord,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                color = Color.White
            )
        } else {
            Spacer(modifier = Modifier.height(24.dp))
        }

        Text(
            text = segment.lyric.ifEmpty { " " },
            fontSize = 22.sp,
            fontFamily = FontFamily.Monospace,
            color = Color(0xFFD4D4D8)
        )
    }
}
