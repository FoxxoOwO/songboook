package com.example.songbook.ui.screens.songdetail

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.MutatePriority
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Fullscreen
import androidx.compose.material.icons.filled.MusicVideo
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.FilledTonalIconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.songbook.data.repository.SongRepository
import com.example.songbook.domain.ChordManager
import com.example.songbook.domain.ChordSegment
import com.example.songbook.domain.ParsedLine
import com.example.songbook.domain.splitIntoWordUnits
import com.example.songbook.ui.components.ChordDetailBottomSheet
import com.example.songbook.ui.components.ZoomLevelBadge
import com.example.songbook.ui.components.pinchToZoom
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun SongDetailScreen(
    songId: String,
    repository: SongRepository,
    onBack: () -> Unit,
    onOpenStageMode: (String) -> Unit
) {
    val songs by repository.songs.collectAsState()
    val song = songs.find { it.id == songId }
    val uriHandler = LocalUriHandler.current

    if (song == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Píseň nenalezena", style = MaterialTheme.typography.bodyLarge)
        }
        return
    }

    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("songbook_prefs", Context.MODE_PRIVATE) }
    var fontScale by remember {
        mutableFloatStateOf(prefs.getFloat("song_font_scale", 1.0f))
    }
    var isZooming by remember { mutableStateOf(false) }

    LaunchedEffect(fontScale) {
        delay(300)
        prefs.edit().putFloat("song_font_scale", fontScale).apply()
    }

    LaunchedEffect(isZooming, fontScale) {
        if (isZooming) {
            delay(2500)
            isZooming = false
        }
    }

    var semitones by remember { mutableIntStateOf(0) }
    var preferFlats by remember { mutableStateOf(false) }
    var capo by remember { mutableIntStateOf(song.capo) }
    var autoscrollSpeed by remember { mutableIntStateOf(song.autoscroll_speed.coerceIn(1, 60)) }
    var isAutoscrolling by remember { mutableStateOf(false) }
    var selectedChordForDetail by remember { mutableStateOf<String?>(null) }
    var showDeleteDialog by remember { mutableStateOf(false) }

    val scrollState = rememberScrollState()

    // Smooth per-frame autoscroll loop (60 / 120 FPS vsync synchronized)
    val density = LocalDensity.current
    LaunchedEffect(isAutoscrolling, autoscrollSpeed, density) {
        if (!isAutoscrolling) return@LaunchedEffect
        val pxPerSec = with(density) { (autoscrollSpeed * 1.6f).dp.toPx() }
        var lastNanos = 0L
        scrollState.scroll(MutatePriority.UserInput) {
            while (isAutoscrolling && scrollState.value < scrollState.maxValue) {
                withFrameNanos { frameNanos ->
                    if (lastNanos != 0L) {
                        val dt = (frameNanos - lastNanos) / 1_000_000_000f
                        val clampedDt = dt.coerceAtMost(0.1f)
                        scrollBy(pxPerSec * clampedDt)
                    }
                    lastNanos = frameNanos
                }
            }
        }
        if (scrollState.value >= scrollState.maxValue) {
            isAutoscrolling = false
        }
    }

    val parsedLines = remember(song.content, semitones, preferFlats) {
        ChordManager.parseSongContent(song.content, semitones, preferFlats)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = song.title,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            maxLines = 1
                        )
                        Text(
                            text = song.artist,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.secondary,
                            maxLines = 1
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Zpět")
                    }
                },
                actions = {
                    IconButton(onClick = { showDeleteDialog = true }) {
                        Icon(Icons.Default.Delete, contentDescription = "Smazat píseň")
                    }
                    IconButton(onClick = { onOpenStageMode(song.id) }) {
                        Icon(Icons.Default.Fullscreen, contentDescription = "Pódiový režim")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                    titleContentColor = MaterialTheme.colorScheme.onBackground
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .pinchToZoom { zoom ->
                    fontScale = (fontScale * zoom).coerceIn(0.65f, 2.5f)
                    isZooming = true
                }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(scrollState)
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                // Header Info Bar: Transposition & Capo controls
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Transpose
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "Transpozice: ",
                                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold)
                                )
                                FilledTonalIconButton(
                                    onClick = { semitones -= 1 },
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(Icons.Default.Remove, contentDescription = "-1", modifier = Modifier.size(16.dp))
                                }
                                Text(
                                    text = if (semitones > 0) "+$semitones" else "$semitones",
                                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                                    modifier = Modifier.padding(horizontal = 8.dp)
                                )
                                FilledTonalIconButton(
                                    onClick = { semitones += 1 },
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(Icons.Default.Add, contentDescription = "+1", modifier = Modifier.size(16.dp))
                                }
                            }

                            // Flat / Sharp toggle
                            FilledTonalButton(
                                onClick = { preferFlats = !preferFlats },
                                modifier = Modifier.height(32.dp)
                            ) {
                                Text(if (preferFlats) "♭ Béčka" else "♯ Křížky", style = MaterialTheme.typography.labelSmall)
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        // Capo
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "Kapodastr: pražec $capo",
                                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold)
                                )
                            }
                            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                FilledTonalIconButton(
                                    onClick = {
                                        if (capo > 0) {
                                            capo -= 1
                                            repository.updateSong(song.copy(capo = capo))
                                        }
                                    },
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(Icons.Default.Remove, contentDescription = "-1 capo", modifier = Modifier.size(16.dp))
                                }
                                FilledTonalIconButton(
                                    onClick = {
                                        if (capo < 9) {
                                            capo += 1
                                            repository.updateSong(song.copy(capo = capo))
                                        }
                                    },
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(Icons.Default.Add, contentDescription = "+1 capo", modifier = Modifier.size(16.dp))
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Song Lyrics & Chords Body
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    parsedLines.forEach { line ->
                        when (line) {
                            is ParsedLine.Empty -> {
                                Spacer(modifier = Modifier.height(12.dp))
                            }
                            is ParsedLine.Directive -> {
                                // Ignore title/artist directives as they are in header
                                if (line.name.lowercase() != "title" && line.name.lowercase() != "artist") {
                                    Text(
                                        text = line.rawText,
                                        style = MaterialTheme.typography.labelMedium.copy(
                                            fontSize = (13 * fontScale).sp
                                        ),
                                        color = MaterialTheme.colorScheme.secondary
                                    )
                                }
                            }
                            is ParsedLine.SectionHeader -> {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = line.rawText,
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = (16 * fontScale).sp
                                    ),
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                            is ParsedLine.ChordLyrics -> {
                                val hasAnyChords = line.segments.any { !it.chord.isNullOrBlank() }
                                val hasAnyLyrics = line.segments.any { it.lyric.isNotBlank() }

                                if (!hasAnyChords && hasAnyLyrics) {
                                    Text(
                                        text = line.rawText,
                                        style = MaterialTheme.typography.bodyLarge.copy(
                                            fontFamily = FontFamily.Monospace,
                                            fontSize = (16 * fontScale).sp
                                        ),
                                        color = MaterialTheme.colorScheme.onBackground
                                    )
                                } else {
                                    FlowRow(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.Start,
                                        verticalArrangement = Arrangement.Top
                                    ) {
                                        line.displaySegments.forEach { segment ->
                                            ChordLyricSegmentView(
                                                segment = segment,
                                                isChordOnlyLine = hasAnyChords && !hasAnyLyrics,
                                                isLyricOnlyLine = false,
                                                fontScale = fontScale,
                                                onChordClick = { chord -> selectedChordForDetail = chord }
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Music links
                if (song.youtube_url.isNotEmpty() || song.spotify_url.isNotEmpty()) {
                    Text(
                        text = "Poslech a originální nahrávka:",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        if (song.youtube_url.isNotEmpty()) {
                            OutlinedButton(onClick = { uriHandler.openUri(song.youtube_url) }) {
                                Icon(Icons.Default.MusicVideo, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("YouTube")
                            }
                        }
                        if (song.spotify_url.isNotEmpty()) {
                            OutlinedButton(onClick = { uriHandler.openUri(song.spotify_url) }) {
                                Text("Spotify")
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(120.dp))
            }

            // Floating Autoscroll Control Bar
            Surface(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 16.dp),
                shape = CircleShape,
                color = MaterialTheme.colorScheme.surface,
                tonalElevation = 6.dp,
                shadowElevation = 8.dp,
                border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    IconButton(
                        onClick = { isAutoscrolling = !isAutoscrolling },
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primary)
                    ) {
                        Icon(
                            if (isAutoscrolling) Icons.Default.Pause else Icons.Default.PlayArrow,
                            contentDescription = if (isAutoscrolling) "Pauza" else "Spustit posun",
                            tint = MaterialTheme.colorScheme.onPrimary
                        )
                    }

                    Text(
                        text = "Posun: ${autoscrollSpeed}px/s",
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        FilledTonalIconButton(
                            onClick = {
                                if (autoscrollSpeed > 1) {
                                    val newSpeed = when {
                                        autoscrollSpeed <= 1 -> 1
                                        autoscrollSpeed <= 10 -> autoscrollSpeed - 1
                                        else -> ((autoscrollSpeed - 1) / 5) * 5
                                    }
                                    autoscrollSpeed = newSpeed
                                    repository.updateSong(song.copy(autoscroll_speed = autoscrollSpeed))
                                }
                            },
                            enabled = autoscrollSpeed > 1,
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(Icons.Default.Remove, contentDescription = "Zpomalit", modifier = Modifier.size(16.dp))
                        }
                        Spacer(modifier = Modifier.width(4.dp))
                        FilledTonalIconButton(
                            onClick = {
                                if (autoscrollSpeed < 60) {
                                    val newSpeed = when {
                                        autoscrollSpeed < 10 -> autoscrollSpeed + 1
                                        else -> (autoscrollSpeed + 5).coerceAtMost(60)
                                    }
                                    autoscrollSpeed = newSpeed
                                    repository.updateSong(song.copy(autoscroll_speed = autoscrollSpeed))
                                }
                            },
                            enabled = autoscrollSpeed < 60,
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = "Zrychlit", modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }

            // Floating Zoom Indicator (placed after Column and autoscroll so it sits on top in Z-order!)
            ZoomLevelBadge(
                visible = isZooming,
                fontScale = fontScale,
                onReset = {
                    fontScale = 1.0f
                    isZooming = true
                },
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = 16.dp)
            )
        }
    }

    selectedChordForDetail?.let { chord ->
        ChordDetailBottomSheet(
            chordName = chord,
            onDismiss = { selectedChordForDetail = null }
        )
    }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Smazat píseň") },
            text = { Text("Opravdu chcete smazat píseň „${song.title}“? Změna se synchronizuje i se serverem.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDeleteDialog = false
                        repository.deleteSong(song.id)
                        onBack()
                    }
                ) {
                    Text("Smazat", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Zrušit")
                }
            }
        )
    }
}

@Composable
fun ChordLyricSegmentView(
    segment: ChordSegment,
    isChordOnlyLine: Boolean = false,
    isLyricOnlyLine: Boolean = false,
    fontScale: Float = 1.0f,
    onChordClick: (String) -> Unit
) {
    val chordSlotHeight = (22 * fontScale).dp

    Column(
        horizontalAlignment = Alignment.Start
    ) {
        // Chord above word
        if (!segment.chord.isNullOrBlank()) {
            Box(
                modifier = Modifier
                    .height(chordSlotHeight)
                    .clip(RoundedCornerShape(4.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant)
                    .clickable { onChordClick(segment.chord) }
                    .padding(horizontal = 4.dp, vertical = 1.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = segment.chord,
                    style = MaterialTheme.typography.labelMedium.copy(
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold
                    ),
                    color = MaterialTheme.colorScheme.primary,
                    fontSize = (13 * fontScale).sp
                )
            }
        } else if (!isLyricOnlyLine) {
            Spacer(modifier = Modifier.height(chordSlotHeight))
        }

        // Lyric text below
        if (!isChordOnlyLine) {
            Text(
                text = segment.lyric.ifEmpty { " " },
                style = MaterialTheme.typography.bodyLarge.copy(
                    fontFamily = FontFamily.Monospace,
                    fontSize = (16 * fontScale).sp
                ),
                color = MaterialTheme.colorScheme.onBackground,
                softWrap = false
            )
        }
    }
}
