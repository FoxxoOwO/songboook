package com.example.songbook.ui.screens.metronome

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.TouchApp
import androidx.compose.material.icons.automirrored.filled.VolumeMute
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalIconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
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
import com.example.songbook.audio.SoundEngine
import kotlinx.coroutines.delay

enum class TimeSignature(val label: String, val beats: Int) {
    FOUR_FOUR("4/4", 4),
    THREE_FOUR("3/4", 3),
    TWO_FOUR("2/4", 2),
    SIX_EIGHT("6/8", 6)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MetronomeScreen() {
    var bpm by remember { mutableIntStateOf(120) }
    var timeSignature by remember { mutableStateOf(TimeSignature.FOUR_FOUR) }
    var isRunning by remember { mutableStateOf(false) }
    var soundEnabled by remember { mutableStateOf(true) }
    var currentBeat by remember { mutableIntStateOf(0) }

    val tapTimes = remember { mutableStateListOf<Long>() }

    fun handleTap() {
        val now = System.currentTimeMillis()
        tapTimes.add(now)
        // Keep only taps in last 3 seconds
        while (tapTimes.isNotEmpty() && now - tapTimes.first() > 3000) {
            tapTimes.removeAt(0)
        }
        if (tapTimes.size >= 2) {
            val intervals = mutableListOf<Long>()
            for (i in 1 until tapTimes.size) {
                intervals.add(tapTimes[i] - tapTimes[i - 1])
            }
            val avgInterval = intervals.average()
            if (avgInterval > 100) {
                val calculatedBpm = (60000.0 / avgInterval).toInt().coerceIn(30, 260)
                bpm = calculatedBpm
            }
        }
    }

    LaunchedEffect(isRunning, bpm, timeSignature, soundEnabled) {
        if (!isRunning) {
            currentBeat = 0
            return@LaunchedEffect
        }
        val intervalMs = (60000.0 / bpm).toLong()
        var beatIndex = 0

        while (isRunning) {
            currentBeat = beatIndex
            val isDownbeat = beatIndex == 0
            if (soundEnabled) {
                SoundEngine.playMetronomeClick(isDownbeat)
            }
            delay(intervalMs)
            beatIndex = (beatIndex + 1) % timeSignature.beats
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            isRunning = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Metronom & Tap Tempo",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
                },
                actions = {
                    IconButton(onClick = { soundEnabled = !soundEnabled }) {
                        Icon(
                            if (soundEnabled) Icons.AutoMirrored.Filled.VolumeUp else Icons.AutoMirrored.Filled.VolumeMute,
                            contentDescription = "Zvuk"
                        )
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 24.dp, vertical = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Time Signature Selector
            SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                TimeSignature.values().forEachIndexed { index, sig ->
                    SegmentedButton(
                        selected = timeSignature == sig,
                        onClick = { timeSignature = sig },
                        shape = SegmentedButtonDefaults.itemShape(index = index, count = TimeSignature.values().size)
                    ) {
                        Text(sig.label, fontWeight = FontWeight.SemiBold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Beat Indicator Dots
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                for (b in 0 until timeSignature.beats) {
                    val isCurrent = isRunning && currentBeat == b
                    val isDownbeat = b == 0
                    val dotColor by animateColorAsState(
                        targetValue = when {
                            isCurrent && isDownbeat -> MaterialTheme.colorScheme.primary
                            isCurrent -> MaterialTheme.colorScheme.secondary
                            else -> MaterialTheme.colorScheme.surfaceVariant
                        },
                        animationSpec = tween(durationMillis = 100),
                        label = "beatDotAnimation"
                    )

                    Box(
                        modifier = Modifier
                            .padding(horizontal = 8.dp)
                            .size(if (isDownbeat) 24.dp else 18.dp)
                            .clip(CircleShape)
                            .background(dotColor)
                            .border(1.dp, MaterialTheme.colorScheme.outlineVariant, CircleShape)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // BPM Display Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(20.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "$bpm",
                        fontSize = 80.sp,
                        fontWeight = FontWeight.ExtraBold,
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "BPM (údery za minutu)",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.secondary
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // +/- Stepper Controls
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        FilledTonalIconButton(onClick = { bpm = (bpm - 5).coerceAtLeast(30) }) {
                            Text("-5", fontWeight = FontWeight.Bold)
                        }
                        FilledTonalIconButton(onClick = { bpm = (bpm - 1).coerceAtLeast(30) }) {
                            Icon(Icons.Default.Remove, contentDescription = "-1")
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        FilledTonalIconButton(onClick = { bpm = (bpm + 1).coerceAtMost(260) }) {
                            Icon(Icons.Default.Add, contentDescription = "+1")
                        }
                        FilledTonalIconButton(onClick = { bpm = (bpm + 5).coerceAtMost(260) }) {
                            Text("+5", fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Slider
                    Slider(
                        value = bpm.toFloat(),
                        onValueChange = { bpm = it.toInt() },
                        valueRange = 30f..260f,
                        colors = SliderDefaults.colors(
                            thumbColor = MaterialTheme.colorScheme.primary,
                            activeTrackColor = MaterialTheme.colorScheme.primary
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Tap Tempo Button
            OutlinedButton(
                onClick = { handleTap() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(14.dp)
            ) {
                Icon(Icons.Default.TouchApp, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("TAP TEMPO (vyťukat rytmus)", fontWeight = FontWeight.Bold)
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Start / Stop Primary Button
            Button(
                onClick = { isRunning = !isRunning },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary
                )
            ) {
                Icon(
                    if (isRunning) Icons.Default.Pause else Icons.Default.PlayArrow,
                    contentDescription = null,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = if (isRunning) "Zastavit metronom" else "Spustit metronom",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}
