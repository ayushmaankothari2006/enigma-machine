package com.enigma.machine.ui.theme

import android.app.Activity
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = PrimaryLight,
    onPrimary = OnPrimaryLight,
    primaryContainer = PrimaryContainerLight,
    onPrimaryContainer = OnPrimaryContainerLight,
    secondary = SecondaryOrange,
    onSecondary = OnSecondaryOrange,
    secondaryContainer = SecondaryContainerOrange,
    onSecondaryContainer = OnSecondaryContainerOrange,
    tertiary = TertiaryTeal,
    onTertiary = OnTertiaryTeal,
    tertiaryContainer = TertiaryContainerTeal,
    onTertiaryContainer = OnTertiaryContainerTeal,
    background = BackgroundLight,
    onBackground = OnBackgroundLight,
    surface = SurfaceLight,
    onSurface = OnSurfaceLight,
    surfaceVariant = SurfaceVariantLight,
    onSurfaceVariant = OnSurfaceVariantLight,
    outline = OutlineLight,
    outlineVariant = OutlineVariantLight
)

/**
 * EnigmaTheme strictly enforces the Light Claymorphism theme to match the Web application.
 */
@Composable
fun EnigmaTheme(
    darkTheme: Boolean = false, // Strictly Light Mode as requested
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = LightColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window
            if (window != null) {
                window.statusBarColor = SurfaceLight.toArgb()
                window.navigationBarColor = BackgroundLight.toArgb()
                WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = true
                WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = true
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
