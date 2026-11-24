package com.enigma.machine.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.enigma.machine.R
import com.enigma.machine.ui.theme.*
import kotlinx.coroutines.delay

/**
 * OutputCard: Ciphertext output card matching Web Claymorphism design.
 * Features:
 * - Rounded 24dp white clay card
 * - Orange lock icon box
 * - "Use as Input" orange pill button
 * - Blue/Orange copy button with feedback state
 * - Inset clay well with monospace selectable typography
 */
@Composable
fun OutputCard(
    value: String,
    onUseOutputAsInput: () -> Unit,
    onCopySuccess: (Int) -> Unit = {},
    onCopyError: (String) -> Unit = {},
    isProcessing: Boolean = false,
    calculationTimeMillis: Double = 0.0,
    modifier: Modifier = Modifier
) {
    val clipboardManager = LocalClipboardManager.current
    var copied by rememberSaveable { mutableStateOf(false) }

    LaunchedEffect(copied) {
        if (copied) {
            delay(2000)
            copied = false
        }
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .testTag("output_card")
            .shadow(
                elevation = 3.dp,
                shape = RoundedCornerShape(24.dp),
                ambientColor = Color(0x1E1E3A8A),
                spotColor = Color(0x1E1E3A8A)
            )
            .background(color = SurfaceCard, shape = RoundedCornerShape(24.dp))
            .border(width = 1.5.dp, color = BorderCard, shape = RoundedCornerShape(24.dp))
            .padding(16.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Header: Icon, Title, Length counter, Actions
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .shadow(
                                elevation = 2.dp,
                                shape = RoundedCornerShape(12.dp),
                                ambientColor = Color(0x40F97316)
                            )
                            .background(
                                color = SecondaryOrangeBright,
                                shape = RoundedCornerShape(12.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = "Output Lock Icon",
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    Column {
                        Text(
                            text = "Ciphertext Output",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 15.sp
                            ),
                            color = TextNavy
                        )
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text(
                                text = "Length: ${value.length} chars",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 11.sp
                                ),
                                color = TextMuted,
                                modifier = Modifier.testTag("output_char_counter")
                            )
                        }
                    }
                }

                // Action Buttons: "Use as Input" & "Copy"
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    // "Use as Input" Button
                    Surface(
                        onClick = onUseOutputAsInput,
                        enabled = value.isNotEmpty() && !isProcessing,
                        shape = RoundedCornerShape(12.dp),
                        color = if (value.isNotEmpty() && !isProcessing) SecondaryOrange else Color(0xFFFFEDD5),
                        shadowElevation = if (value.isNotEmpty()) 2.dp else 0.dp,
                        modifier = Modifier
                            .testTag("decipher_button")
                            .testTag("use_as_input_button")
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_swap_horiz),
                                contentDescription = "Use as Input",
                                tint = if (value.isNotEmpty()) Color.White else TextPlaceholder,
                                modifier = Modifier.size(15.dp)
                            )
                            Text(
                                text = "Use as Input",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp
                                ),
                                color = if (value.isNotEmpty()) Color.White else TextPlaceholder
                            )
                        }
                    }

                    // Copy Button
                    Surface(
                        onClick = {
                            if (value.isNotEmpty()) {
                                try {
                                    clipboardManager.setText(AnnotatedString(value))
                                    copied = true
                                    onCopySuccess(value.length)
                                } catch (e: Exception) {
                                    onCopyError(e.localizedMessage ?: "Failed to copy")
                                }
                            }
                        },
                        enabled = value.isNotEmpty(),
                        shape = RoundedCornerShape(12.dp),
                        color = when {
                            copied -> SecondaryOrange
                            value.isNotEmpty() -> PrimaryLight
                            else -> Color(0xFFDBEAFE)
                        },
                        shadowElevation = if (value.isNotEmpty()) 2.dp else 0.dp,
                        modifier = Modifier
                            .size(32.dp)
                            .testTag("copy_button")
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            if (copied) {
                                Icon(
                                    imageVector = Icons.Default.Check,
                                    contentDescription = "Copied",
                                    tint = Color.White,
                                    modifier = Modifier.size(16.dp)
                                )
                            } else {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_content_copy),
                                    contentDescription = "Copy Ciphertext",
                                    tint = if (value.isNotEmpty()) Color.White else TextPlaceholder,
                                    modifier = Modifier.size(15.dp)
                                )
                            }
                        }
                    }
                }
            }

            // Inset Clay Well for Ciphertext Output
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 150.dp, max = 220.dp)
                    .shadow(
                        elevation = 1.dp,
                        shape = RoundedCornerShape(18.dp),
                        ambientColor = Color(0x141E3A8A)
                    )
                    .background(color = SurfaceWell, shape = RoundedCornerShape(18.dp))
                    .border(width = 1.5.dp, color = BorderWell, shape = RoundedCornerShape(18.dp))
                    .padding(12.dp)
            ) {
                if (value.isEmpty()) {
                    Text(
                        text = "Ciphertext appears here automatically...",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Normal,
                            fontSize = 13.sp,
                            color = TextPlaceholder
                        ),
                        modifier = Modifier.testTag("output_placeholder")
                    )
                } else {
                    SelectionContainer {
                        Text(
                            text = value,
                            style = MaterialTheme.typography.bodyMedium.copy(
                                color = TextNavy,
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.5.sp,
                                lineHeight = 19.sp
                            ),
                            modifier = Modifier
                                .fillMaxSize()
                                .verticalScroll(rememberScrollState())
                                .testTag("output_text")
                        )
                    }
                }

                // Processing Indicator
                if (isProcessing) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(SurfaceWell.copy(alpha = 0.6f)),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            color = SecondaryOrange,
                            strokeWidth = 2.5.dp
                        )
                    }
                }
            }
        }
    }
}
