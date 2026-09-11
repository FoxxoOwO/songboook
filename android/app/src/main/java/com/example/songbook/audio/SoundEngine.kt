package com.example.songbook.audio

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlin.math.sin

object SoundEngine {
    private const val SAMPLE_RATE = 44100

    /**
     * Plays a synthesized harmonic tone at the given frequency in Hz for a given duration.
     */
    suspend fun playTone(frequency: Double, durationMs: Int = 800) = withContext(Dispatchers.Default) {
        if (frequency <= 0.0) return@withContext

        val numSamples = (SAMPLE_RATE * durationMs) / 1000
        val buffer = ShortArray(numSamples)

        for (i in 0 until numSamples) {
            val t = i.toDouble() / SAMPLE_RATE
            // Pluck decay envelope
            val envelope = (1.0 - (i.toDouble() / numSamples)).coerceIn(0.0, 1.0)
            // Fundamental + harmonic overtones for warm acoustic guitar tone
            val fundamental = sin(2.0 * Math.PI * frequency * t)
            val overtone1 = 0.4 * sin(4.0 * Math.PI * frequency * t)
            val overtone2 = 0.15 * sin(6.0 * Math.PI * frequency * t)
            val sample = (fundamental + overtone1 + overtone2) * envelope * 0.7 * Short.MAX_VALUE
            buffer[i] = sample.toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
        }

        val audioTrack = AudioTrack.Builder()
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build()
            )
            .setAudioFormat(
                AudioFormat.Builder()
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setSampleRate(SAMPLE_RATE)
                    .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                    .build()
            )
            .setBufferSizeInBytes(buffer.size * 2)
            .setTransferMode(AudioTrack.MODE_STATIC)
            .build()

        try {
            audioTrack.write(buffer, 0, buffer.size)
            audioTrack.play()
            kotlinx.coroutines.delay(durationMs.toLong() + 50)
        } catch (_: Exception) {
        } finally {
            try {
                audioTrack.stop()
                audioTrack.release()
            } catch (_: Exception) {}
        }
    }

    /**
     * Plays a sharp metronome click sound (high frequency for downbeat, mid frequency for other beats).
     */
    suspend fun playMetronomeClick(isDownbeat: Boolean) = withContext(Dispatchers.Default) {
        val durationMs = 25
        val freq = if (isDownbeat) 1800.0 else 1100.0
        val numSamples = (SAMPLE_RATE * durationMs) / 1000
        val buffer = ShortArray(numSamples)

        for (i in 0 until numSamples) {
            val t = i.toDouble() / SAMPLE_RATE
            val envelope = (1.0 - (i.toDouble() / numSamples)).coerceIn(0.0, 1.0)
            val sample = sin(2.0 * Math.PI * freq * t) * envelope * 0.8 * Short.MAX_VALUE
            buffer[i] = sample.toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
        }

        val audioTrack = AudioTrack.Builder()
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            )
            .setAudioFormat(
                AudioFormat.Builder()
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setSampleRate(SAMPLE_RATE)
                    .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                    .build()
            )
            .setBufferSizeInBytes(buffer.size * 2)
            .setTransferMode(AudioTrack.MODE_STATIC)
            .build()

        try {
            audioTrack.write(buffer, 0, buffer.size)
            audioTrack.play()
            kotlinx.coroutines.delay(durationMs.toLong() + 20)
        } catch (_: Exception) {
        } finally {
            try {
                audioTrack.stop()
                audioTrack.release()
            } catch (_: Exception) {}
        }
    }
}
