package com.example.songbook

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

@Serializable
data object MainNavKey : NavKey

@Serializable
data class SongDetailNavKey(val songId: String) : NavKey

@Serializable
data class StageModeNavKey(val songId: String) : NavKey
