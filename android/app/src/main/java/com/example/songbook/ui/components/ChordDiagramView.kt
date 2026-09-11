package com.example.songbook.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.songbook.audio.SoundEngine
import com.example.songbook.domain.ChordDiagramData
import com.example.songbook.domain.ChordDiagramDatabase
import com.example.songbook.domain.InstrumentType
import kotlinx.coroutines.launch

@Composable
fun ChordDiagramView(
    data: ChordDiagramData,
    modifier: Modifier = Modifier,
    lineColor: Color = MaterialTheme.colorScheme.onSurface,
    dotColor: Color = MaterialTheme.colorScheme.primary,
    dotTextColor: Color = MaterialTheme.colorScheme.onPrimary
) {
    val textMeasurer = rememberTextMeasurer()
    val numStrings = if (data.instrument == InstrumentType.GUITAR) 6 else 4
    val numFrets = 5

    Canvas(modifier = modifier.size(width = 180.dp, height = 210.dp)) {
        val width = size.width
        val height = size.height

        val leftMargin = 32.dp.toPx()
        val rightMargin = 20.dp.toPx()
        val topMargin = 36.dp.toPx()
        val bottomMargin = 20.dp.toPx()

        val gridWidth = width - leftMargin - rightMargin
        val gridHeight = height - topMargin - bottomMargin

        val stringSpacing = gridWidth / (numStrings - 1)
        val fretSpacing = gridHeight / numFrets

        // Base fret label if > 1
        if (data.baseFret > 1) {
            val baseFretText = "${data.baseFret}fr"
            val textLayout = textMeasurer.measure(
                text = baseFretText,
                style = TextStyle(fontSize = 11.sp, color = lineColor, fontWeight = FontWeight.Bold)
            )
            drawText(
                textLayoutResult = textLayout,
                topLeft = Offset(4.dp.toPx(), topMargin + (fretSpacing / 4))
            )
        }

        // Nut line or regular fret 0 line
        val nutThickness = if (data.baseFret == 1) 5.dp.toPx() else 1.5.dp.toPx()
        drawLine(
            color = lineColor,
            start = Offset(leftMargin, topMargin),
            end = Offset(leftMargin + gridWidth, topMargin),
            strokeWidth = nutThickness
        )

        // Horizontal frets
        for (f in 1..numFrets) {
            val y = topMargin + f * fretSpacing
            drawLine(
                color = lineColor.copy(alpha = 0.6f),
                start = Offset(leftMargin, y),
                end = Offset(leftMargin + gridWidth, y),
                strokeWidth = 1.5.dp.toPx()
            )
        }

        // Vertical strings
        for (s in 0 until numStrings) {
            val x = leftMargin + s * stringSpacing
            drawLine(
                color = lineColor.copy(alpha = 0.8f),
                start = Offset(x, topMargin),
                end = Offset(x, topMargin + gridHeight),
                strokeWidth = 1.5.dp.toPx()
            )

            // Top markings: X (muted) or O (open)
            val fret = data.frets.getOrNull(s) ?: 0
            val markerText = when (fret) {
                -1 -> "×"
                0 -> "○"
                else -> ""
            }
            if (markerText.isNotEmpty()) {
                val markerLayout = textMeasurer.measure(
                    text = markerText,
                    style = TextStyle(fontSize = 13.sp, color = lineColor, fontWeight = FontWeight.Bold)
                )
                drawText(
                    textLayoutResult = markerLayout,
                    topLeft = Offset(x - markerLayout.size.width / 2, topMargin - 22.dp.toPx())
                )
            }
        }

        // Barre chord
        if (data.barreFret != null && data.barreFrom != null && data.barreTo != null) {
            val fretRel = data.barreFret - data.baseFret + 1
            if (fretRel in 1..numFrets) {
                val y = topMargin + (fretRel - 0.5f) * fretSpacing
                val x1 = leftMargin + (data.barreFrom - 1) * stringSpacing
                val x2 = leftMargin + (data.barreTo - 1) * stringSpacing
                val barreHeight = 16.dp.toPx()
                drawRoundRect(
                    color = dotColor,
                    topLeft = Offset(minOf(x1, x2) - 8.dp.toPx(), y - barreHeight / 2),
                    size = Size(kotlin.math.abs(x2 - x1) + 16.dp.toPx(), barreHeight),
                    cornerRadius = CornerRadius(8.dp.toPx(), 8.dp.toPx())
                )
            }
        }

        // Finger dots
        for (s in 0 until numStrings) {
            val fret = data.frets.getOrNull(s) ?: 0
            if (fret > 0) {
                val fretRel = fret - data.baseFret + 1
                if (fretRel in 1..numFrets) {
                    val x = leftMargin + s * stringSpacing
                    val y = topMargin + (fretRel - 0.5f) * fretSpacing
                    val radius = 9.dp.toPx()

                    drawCircle(
                        color = dotColor,
                        radius = radius,
                        center = Offset(x, y)
                    )

                    val finger = data.fingers.getOrNull(s) ?: 0
                    if (finger > 0) {
                        val fingerText = finger.toString()
                        val fingerLayout = textMeasurer.measure(
                            text = fingerText,
                            style = TextStyle(fontSize = 10.sp, color = dotTextColor, fontWeight = FontWeight.Bold)
                        )
                        drawText(
                            textLayoutResult = fingerLayout,
                            topLeft = Offset(x - fingerLayout.size.width / 2, y - fingerLayout.size.height / 2)
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChordDetailBottomSheet(
    chordName: String,
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState()
    var selectedInstrument by remember { mutableStateOf(InstrumentType.GUITAR) }
    val scope = rememberCoroutineScope()

    val chordData = remember(chordName, selectedInstrument) {
        ChordDiagramDatabase.getChord(chordName, selectedInstrument)
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Akord $chordName",
                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(16.dp))

            SingleChoiceSegmentedButtonRow {
                SegmentedButton(
                    selected = selectedInstrument == InstrumentType.GUITAR,
                    onClick = { selectedInstrument = InstrumentType.GUITAR },
                    shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2)
                ) {
                    Text("Kytara")
                }
                SegmentedButton(
                    selected = selectedInstrument == InstrumentType.UKULELE,
                    onClick = { selectedInstrument = InstrumentType.UKULELE },
                    shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2)
                ) {
                    Text("Ukulele")
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            if (chordData != null) {
                ChordDiagramView(data = chordData)
            } else {
                Text(
                    text = "Prstoklad pro tento akord není v databázi.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(24.dp)
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            Button(
                onClick = {
                    scope.launch {
                        // Play base tonic tone approximation
                        val freq = when (chordName.take(2)) {
                            "C", "C#" -> 261.63
                            "D", "D#" -> 293.66
                            "E" -> 329.63
                            "F", "F#" -> 349.23
                            "G", "G#" -> 196.00
                            "A", "A#" -> 220.00
                            "B", "H" -> 246.94
                            else -> 220.0
                        }
                        SoundEngine.playTone(freq, 700)
                    }
                },
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary
                )
            ) {
                Icon(Icons.Default.PlayArrow, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Přehrát zvuk")
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}
