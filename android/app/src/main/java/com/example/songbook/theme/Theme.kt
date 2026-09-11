package com.example.songbook.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = PureWhite,
    onPrimary = PureBlack,
    primaryContainer = MonoDarkSurfaceVariant,
    onPrimaryContainer = PureWhite,
    secondary = MonoDarkTextSecondary,
    onSecondary = PureWhite,
    background = MonoBlack,
    onBackground = MonoDarkTextPrimary,
    surface = MonoDarkSurface,
    onSurface = MonoDarkTextPrimary,
    surfaceVariant = MonoDarkSurfaceVariant,
    onSurfaceVariant = MonoDarkTextSecondary,
    outline = MonoDarkBorder,
    outlineVariant = MonoDarkBorder
)

private val LightColorScheme = lightColorScheme(
    primary = PureBlack,
    onPrimary = PureWhite,
    primaryContainer = MonoLightSurfaceVariant,
    onPrimaryContainer = PureBlack,
    secondary = MonoLightTextSecondary,
    onSecondary = PureBlack,
    background = MonoLightBackground,
    onBackground = MonoLightTextPrimary,
    surface = MonoLightSurface,
    onSurface = MonoLightTextPrimary,
    surfaceVariant = MonoLightSurfaceVariant,
    onSurfaceVariant = MonoLightTextSecondary,
    outline = MonoLightBorder,
    outlineVariant = MonoLightBorder
)

@Composable
fun SongbookTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
