package com.example.songbook.audio

import android.annotation.SuppressLint
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.isActive
import kotlinx.coroutines.withContext
import kotlin.coroutines.coroutineContext
import kotlin.math.log2
import kotlin.math.pow
import kotlin.math.roundToInt
import kotlin.math.sqrt

data class PitchResult(
    val frequency: Double,
    val noteName: String,
    val octave: Int,
    val centsDeviation: Double,
    val isTuned: Boolean
)

object PitchDetector {
    private const val SAMPLE_RATE = 44100
    private const val BUFFER_SIZE = 4096
    private val NOTE_NAMES = listOf("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")

    @SuppressLint("MissingPermission")
    suspend fun startListening(onPitchDetected: (PitchResult?) -> Unit) = withContext(Dispatchers.IO) {
        val minBufferSize = AudioRecord.getMinBufferSize(
            SAMPLE_RATE,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        ).coerceAtLeast(BUFFER_SIZE * 2)

        val audioRecord = try {
            AudioRecord(
                MediaRecorder.AudioSource.MIC,
                SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                minBufferSize
            )
        } catch (_: Exception) {
            return@withContext
        }

        if (audioRecord.state != AudioRecord.STATE_INITIALIZED) {
            audioRecord.release()
            return@withContext
        }

        val audioBuffer = ShortArray(BUFFER_SIZE)

        try {
            audioRecord.startRecording()
            while (coroutineContext.isActive) {
                val read = audioRecord.read(audioBuffer, 0, BUFFER_SIZE)
                if (read > 0) {
                    val pitch = detectPitch(audioBuffer, read)
                    withContext(Dispatchers.Main) {
                        onPitchDetected(pitch)
                    }
                }
            }
        } catch (_: Exception) {
        } finally {
            try {
                audioRecord.stop()
                audioRecord.release()
            } catch (_: Exception) {}
        }
    }

    private fun detectPitch(buffer: ShortArray, size: Int): PitchResult? {
        // Compute RMS to filter silence/low volume
        var sumSquares = 0.0
        for (i in 0 until size) {
            val normalized = buffer[i] / 32768.0
            sumSquares += normalized * normalized
        }
        val rms = sqrt(sumSquares / size)
        if (rms < 0.015) return null // Noise floor

        // Autocorrelation within 65 Hz to 1100 Hz
        val minPeriod = SAMPLE_RATE / 1100 // ~40 samples
        val maxPeriod = (SAMPLE_RATE / 65).coerceAtMost(size / 2) // ~678 samples

        var bestPeriod = -1
        var maxCorr = 0.0

        for (lag in minPeriod..maxPeriod) {
            var corr = 0.0
            for (i in 0 until (size - lag)) {
                corr += buffer[i].toDouble() * buffer[i + lag].toDouble()
            }
            if (corr > maxCorr) {
                maxCorr = corr
                bestPeriod = lag
            }
        }

        if (bestPeriod == -1 || maxCorr <= 0.0) return null

        val frequency = SAMPLE_RATE.toDouble() / bestPeriod
        if (frequency < 60.0 || frequency > 1200.0) return null

        // Convert frequency to MIDI note and cents
        val midiNumber = 12.0 * log2(frequency / 440.0) + 69.0
        val nearestMidi = midiNumber.roundToInt()
        val nearestFreq = 440.0 * 2.0.pow((nearestMidi - 69.0) / 12.0)
        val cents = 1200.0 * log2(frequency / nearestFreq)

        val noteIndex = (nearestMidi % 12 + 12) % 12
        val octave = (nearestMidi / 12) - 1
        val noteName = NOTE_NAMES[noteIndex]
        val isTuned = cents in -4.0..4.0

        return PitchResult(
            frequency = frequency,
            noteName = noteName,
            octave = octave,
            centsDeviation = cents.coerceIn(-50.0, 50.0),
            isTuned = isTuned
        )
    }
}
