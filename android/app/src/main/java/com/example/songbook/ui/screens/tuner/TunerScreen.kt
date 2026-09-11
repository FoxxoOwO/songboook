package com.example.songbook.ui.screens.tuner

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
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
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.example.songbook.audio.PitchDetector
import com.example.songbook.audio.PitchResult
import com.example.songbook.audio.SoundEngine
import com.example.songbook.theme.SuccessGreen
import com.example.songbook.theme.WarningRed
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlin.math.cos
import kotlin.math.sin

enum class TunerPreset(val label: String, val strings: List<Pair<String, Double>>) {
    GUITAR_STANDARD(
        "Kytara (EADGBE)",
        listOf(
            "E2" to 82.41,
            "A2" to 110.00,
            "D3" to 146.83,
            "G3" to 196.00,
            "B3" to 246.94,
            "E4" to 329.63
        )
    ),
    GUITAR_DROP_D(
        "Drop D",
        listOf(
            "D2" to 73.42,
            "A2" to 110.00,
            "D3" to 146.83,
            "G3" to 196.00,
            "B3" to 246.94,
            "E4" to 329.63
        )
    ),
    UKULELE(
        "Ukulele (GCEA)",
        listOf(
            "G4" to 392.00,
            "C4" to 261.63,
            "E4" to 329.63,
            "A4" to 440.00
        )
    ),
    CHROMATIC("Chromatická", emptyList())
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TunerScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var hasPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
        )
    }

    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission(),
        onResult = { granted -> hasPermission = granted }
    )

    var isListening by remember { mutableStateOf(false) }
    var currentPitch by remember { mutableStateOf<PitchResult?>(null) }
    var selectedPreset by remember { mutableStateOf(TunerPreset.GUITAR_STANDARD) }
    var listeningJob by remember { mutableStateOf<Job?>(null) }

    fun startTuning() {
        if (!hasPermission) {
            launcher.launch(Manifest.permission.RECORD_AUDIO)
            return
        }
        isListening = true
        listeningJob?.cancel()
        listeningJob = scope.launch {
            PitchDetector.startListening { result ->
                currentPitch = result
            }
        }
    }

    fun stopTuning() {
        isListening = false
        listeningJob?.cancel()
        listeningJob = null
        currentPitch = null
    }

    DisposableEffect(Unit) {
        onDispose {
            stopTuning()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Chromatická ladička",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
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
                .padding(horizontal = 20.dp, vertical = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Preset Selector
            SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                TunerPreset.values().forEachIndexed { index, preset ->
                    SegmentedButton(
                        selected = selectedPreset == preset,
                        onClick = { selectedPreset = preset },
                        shape = SegmentedButtonDefaults.itemShape(index = index, count = TunerPreset.values().size)
                    ) {
                        Text(preset.label.substringBefore(" "), fontSize = 12.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Tuner Meter Gauge Display
            val cents = currentPitch?.centsDeviation ?: 0.0
            val animatedCents by animateFloatAsState(targetValue = cents.toFloat(), label = "centsAnimation")
            val isTuned = currentPitch?.isTuned == true

            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(270.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(20.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    // Needle Gauge Canvas
                    TunerGaugeCanvas(
                        cents = animatedCents,
                        isTuned = isTuned,
                        modifier = Modifier.size(width = 240.dp, height = 120.dp)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Detected Note & Cents
                    if (currentPitch != null) {
                        Text(
                            text = "${currentPitch!!.noteName}${currentPitch!!.octave}",
                            fontSize = 54.sp,
                            fontWeight = FontWeight.ExtraBold,
                            fontFamily = FontFamily.Monospace,
                            color = if (isTuned) SuccessGreen else MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = String.format("%.1f Hz (%.0f centů)", currentPitch!!.frequency, cents),
                            fontSize = 14.sp,
                            color = if (isTuned) SuccessGreen else MaterialTheme.colorScheme.secondary,
                            fontWeight = FontWeight.SemiBold
                        )
                    } else {
                        Text(
                            text = if (isListening) "Zahrajte tón..." else "Ladička je vypnutá",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.secondary
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (isListening) "Poslouchám mikrofon" else "Klepněte na Zapnout",
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.secondary
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Reference Pitch Pipe (play tone for preset strings)
            if (selectedPreset.strings.isNotEmpty()) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "Referenční tóny (Pitch Pipe):",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.secondary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        selectedPreset.strings.forEach { (name, freq) ->
                            OutlinedButton(
                                onClick = {
                                    scope.launch { SoundEngine.playTone(freq, 900) }
                                },
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.height(38.dp)
                            ) {
                                Text(name, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Main Microphone Toggle Button
            Button(
                onClick = {
                    if (isListening) stopTuning() else startTuning()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isListening) MaterialTheme.colorScheme.surfaceVariant else MaterialTheme.colorScheme.primary,
                    contentColor = if (isListening) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onPrimary
                )
            ) {
                Icon(
                    if (isListening) Icons.Default.MicOff else Icons.Default.Mic,
                    contentDescription = null,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = if (isListening) "Zastavit snímání" else "Zapnout ladičku",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(12.dp))
        }
    }
}

@Composable
fun TunerGaugeCanvas(
    cents: Float,
    isTuned: Boolean,
    modifier: Modifier = Modifier
) {
    val needleColor = if (isTuned) SuccessGreen else MaterialTheme.colorScheme.primary
    val trackColor = MaterialTheme.colorScheme.outlineVariant

    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val centerX = w / 2f
        val centerY = h

        // Gauge arc background
        drawArc(
            color = trackColor,
            startAngle = 180f,
            sweepAngle = 180f,
            useCenter = false,
            style = Stroke(width = 4.dp.toPx(), cap = StrokeCap.Round)
        )

        // Center in-tune target notch
        drawLine(
            color = SuccessGreen,
            start = Offset(centerX, 10.dp.toPx()),
            end = Offset(centerX, 25.dp.toPx()),
            strokeWidth = 3.dp.toPx(),
            cap = StrokeCap.Round
        )

        // Needle angle: -50 cents = 180deg + 45deg = 225deg, 0 cents = 270deg, +50 cents = 315deg
        val angleDeg = 270f + (cents.coerceIn(-50f, 50f) / 50f) * 45f
        val angleRad = Math.toRadians(angleDeg.toDouble())

        val needleLength = h - 20.dp.toPx()
        val endX = (centerX + needleLength * cos(angleRad)).toFloat()
        val endY = (centerY + needleLength * sin(angleRad)).toFloat()

        drawLine(
            color = needleColor,
            start = Offset(centerX, centerY),
            end = Offset(endX, endY),
            strokeWidth = 3.dp.toPx(),
            cap = StrokeCap.Round
        )

        drawCircle(
            color = needleColor,
            radius = 6.dp.toPx(),
            center = Offset(centerX, centerY)
        )
    }
}
