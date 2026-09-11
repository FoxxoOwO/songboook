package com.example.songbook.data.model

import kotlinx.serialization.Serializable

@Serializable
data class Song(
    val id: String,
    val title: String,
    val artist: String,
    val album: String = "",
    val key: String = "",
    val capo: Int = 0,
    val tempo: Int = 120,
    val autoscroll_speed: Int = 20,
    val tags: List<String> = emptyList(),
    val youtube_url: String = "",
    val spotify_url: String = "",
    val deezer_url: String = "",
    val content: String,
    val created_at: String = "",
    val updated_at: String = ""
)

@Serializable
data class Playlist(
    val id: String,
    val title: String,
    val description: String = "",
    val song_ids: List<String> = emptyList(),
    val created_at: String = "",
    val updated_at: String = ""
)
