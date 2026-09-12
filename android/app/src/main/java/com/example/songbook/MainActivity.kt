package com.example.songbook

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import com.example.songbook.theme.SongbookTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val context = LocalContext.current
            val prefs = remember { context.getSharedPreferences("songbook_prefs", Context.MODE_PRIVATE) }
            val systemInDark = isSystemInDarkTheme()
            var isDarkMode by remember {
                mutableStateOf(
                    if (prefs.contains("is_dark_mode")) {
                        prefs.getBoolean("is_dark_mode", systemInDark)
                    } else {
                        systemInDark
                    }
                )
            }

            SongbookTheme(darkTheme = isDarkMode) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainNavigation(
                        isDarkMode = isDarkMode,
                        onToggleDarkMode = {
                            val newMode = !isDarkMode
                            isDarkMode = newMode
                            prefs.edit().putBoolean("is_dark_mode", newMode).apply()
                        }
                    )
                }
            }
        }
    }
}
