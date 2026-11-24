package com.enigma.machine.ui.components

import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.enigma.machine.ui.theme.BorderWell
import com.enigma.machine.ui.theme.PrimaryNavy
import com.enigma.machine.ui.theme.SurfaceLight
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * Reusable HoldStepperButton matching web HoldButton:
 * - Single quick tap: fires onStep() once immediately.
 * - Long-press hold: fires onStep() continuously every [repeatDelayMillis]
 *   after [initialDelayMillis] while held down.
 */
@Composable
fun HoldStepperButton(
    text: String,
    onStep: () -> Unit,
    modifier: Modifier = Modifier,
    size: Dp = 36.dp,
    shapeRadius: Dp = 12.dp,
    fontSize: TextUnit = 18.sp,
    initialDelayMillis: Long = 350L,
    repeatDelayMillis: Long = 75L
) {
    val currentStep by rememberUpdatedState(onStep)
    val coroutineScope = rememberCoroutineScope()

    Surface(
        shape = RoundedCornerShape(shapeRadius),
        color = SurfaceLight,
        border = androidx.compose.foundation.BorderStroke(1.dp, BorderWell),
        shadowElevation = 2.dp,
        modifier = modifier
            .size(size)
            .pointerInput(Unit) {
                detectTapGestures(
                    onPress = {
                        // Fire 1 step immediately on touch down
                        currentStep()

                        val holdJob = coroutineScope.launch {
                            delay(initialDelayMillis)
                            while (isActive) {
                                currentStep()
                                delay(repeatDelayMillis)
                            }
                        }

                        // Wait for finger release or gesture cancellation
                        tryAwaitRelease()
                        holdJob.cancel()
                    }
                )
            }
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(
                text = text,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.ExtraBold,
                fontSize = fontSize,
                color = PrimaryNavy
            )
        }
    }
}
