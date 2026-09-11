package com.example.songbook

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.automirrored.filled.PlaylistPlay
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import com.example.songbook.data.repository.SongRepository
import com.example.songbook.ui.screens.metronome.MetronomeScreen
import com.example.songbook.ui.screens.playlists.PlaylistsScreen
import com.example.songbook.ui.screens.songdetail.SongDetailScreen
import com.example.songbook.ui.screens.songs.SongsListScreen
import com.example.songbook.ui.screens.stagemode.StageModeScreen
import com.example.songbook.ui.screens.tuner.TunerScreen

@Composable
fun MainNavigation(
    isDarkMode: Boolean,
    onToggleDarkMode: () -> Unit
) {
    val context = LocalContext.current
    val repository = remember { SongRepository(context.applicationContext) }
    val backStack = rememberNavBackStack(MainNavKey)

    NavDisplay(
        backStack = backStack,
        onBack = { backStack.removeLastOrNull() },
        entryProvider = entryProvider {
            entry<MainNavKey> {
                HomeTabsScaffold(
                    repository = repository,
                    onSongClick = { songId -> backStack.add(SongDetailNavKey(songId)) },
                    onOpenStageMode = { songId -> backStack.add(StageModeNavKey(songId)) },
                    isDarkMode = isDarkMode,
                    onToggleDarkMode = onToggleDarkMode
                )
            }
            entry<SongDetailNavKey> { key ->
                SongDetailScreen(
                    songId = key.songId,
                    repository = repository,
                    onBack = { backStack.removeLastOrNull() },
                    onOpenStageMode = { songId -> backStack.add(StageModeNavKey(songId)) }
                )
            }
            entry<StageModeNavKey> { key ->
                StageModeScreen(
                    songId = key.songId,
                    repository = repository,
                    onClose = { backStack.removeLastOrNull() },
                    onNavigateSong = { newId ->
                        backStack.removeLastOrNull()
                        backStack.add(StageModeNavKey(newId))
                    }
                )
            }
        }
    )
}

@Composable
fun HomeTabsScaffold(
    repository: SongRepository,
    onSongClick: (String) -> Unit,
    onOpenStageMode: (String) -> Unit,
    isDarkMode: Boolean,
    onToggleDarkMode: () -> Unit
) {
    var selectedTab by remember { mutableIntStateOf(0) }

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = MaterialTheme.colorScheme.onSurface
            ) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.MusicNote, contentDescription = null) },
                    label = { Text("Písně") },
                    colors = NavigationBarItemDefaults.colors(
                        indicatorColor = MaterialTheme.colorScheme.primaryContainer,
                        selectedIconColor = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.AutoMirrored.Filled.PlaylistPlay, contentDescription = null) },
                    label = { Text("Playlisty") },
                    colors = NavigationBarItemDefaults.colors(
                        indicatorColor = MaterialTheme.colorScheme.primaryContainer,
                        selectedIconColor = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Default.Mic, contentDescription = null) },
                    label = { Text("Ladička") },
                    colors = NavigationBarItemDefaults.colors(
                        indicatorColor = MaterialTheme.colorScheme.primaryContainer,
                        selectedIconColor = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = { selectedTab = 3 },
                    icon = { Icon(Icons.Default.Speed, contentDescription = null) },
                    label = { Text("Metronom") },
                    colors = NavigationBarItemDefaults.colors(
                        indicatorColor = MaterialTheme.colorScheme.primaryContainer,
                        selectedIconColor = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                )
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        androidx.compose.foundation.layout.Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (selectedTab) {
                0 -> SongsListScreen(
                    repository = repository,
                    onSongClick = onSongClick,
                    isDarkMode = isDarkMode,
                    onToggleDarkMode = onToggleDarkMode
                )
                1 -> PlaylistsScreen(
                    repository = repository,
                    onSongClick = onSongClick,
                    onOpenStageMode = onOpenStageMode
                )
                2 -> TunerScreen()
                3 -> MetronomeScreen()
            }
        }
    }
}
