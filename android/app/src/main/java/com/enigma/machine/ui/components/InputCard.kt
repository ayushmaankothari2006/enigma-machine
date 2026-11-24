package com.enigma.machine.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.enigma.machine.R
import com.enigma.machine.ui.theme.*

/**
 * InputCard: Plaintext input card matching Web Claymorphism design.
 * Features:
 * - Rounded 24dp white clay card
 * - Blue icon box
 * - "Sample" blue pill button with sparkle
 * - White clear button with orange trash icon
 * - Inset clay well with monospace typography
 */
@Composable
fun InputCard(
    value: String,
    onValueChange: (String) -> Unit,
    onClear: () -> Unit,
    onLoadSample: () -> Unit,
    unsupportedWarningMessage: String? = null,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .testTag("input_card")
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
                                ambientColor = Color(0x402563EB)
                            )
                            .background(
                                color = PrimaryLight,
                                shape = RoundedCornerShape(12.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_edit_note),
                            contentDescription = "Input Icon",
                            tint = Color.White,
                            modifier = Modifier.size(22.dp)
                        )
                    }

                    Column {
                        Text(
                            text = "Plaintext Input",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 15.sp
                            ),
                            color = TextNavy
                        )
                        Text(
                            text = "Length: ${value.length} chars",
                            style = MaterialTheme.typography.bodySmall.copy(
                                fontFamily = FontFamily.Monospace,
                                fontSize = 11.sp
                            ),
                            color = TextMuted,
                            modifier = Modifier.testTag("input_char_counter")
                        )
                    }
                }

                // Action Buttons: Sample & Clear
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    // Sample Button
                    Surface(
                        onClick = onLoadSample,
                        shape = RoundedCornerShape(12.dp),
                        color = PrimaryLight,
                        shadowElevation = 2.dp,
                        modifier = Modifier.testTag("sample_text_button")
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_auto_awesome),
                                contentDescription = "Sample Text",
                                tint = Color(0xFFFED7AA),
                                modifier = Modifier.size(14.dp)
                            )
                            Text(
                                text = "Sample",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp
                                ),
                                color = Color.White
                            )
                        }
                    }

                    // Clear Button
                    Surface(
                        onClick = onClear,
                        enabled = value.isNotEmpty(),
                        shape = RoundedCornerShape(12.dp),
                        color = SurfaceLight,
                        border = androidx.compose.foundation.BorderStroke(1.dp, BorderCard),
                        shadowElevation = 1.dp,
                        modifier = Modifier
                            .size(32.dp)
                            .testTag("clear_button")
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_delete_outline),
                                contentDescription = "Clear Input",
                                tint = if (value.isNotEmpty()) SecondaryOrange else TextPlaceholder,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }

            // Unsupported characters diagnostic warning banner
            AnimatedVisibility(
                visible = unsupportedWarningMessage != null,
                enter = fadeIn(),
                exit = fadeOut()
            ) {
                if (unsupportedWarningMessage != null) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = PillOrangeBg,
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFED7AA)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("unsupported_warning_banner")
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_warning_amber),
                                contentDescription = "Warning",
                                tint = SecondaryOrange,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = unsupportedWarningMessage,
                                style = MaterialTheme.typography.bodySmall.copy(
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 11.sp,
                                    lineHeight = 14.sp
                                ),
                                color = PillOrangeText
                            )
                        }
                    }
                }
            }

            // Inset Clay Well for Text Input
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
                        text = "Type or paste text here to encipher in real-time...",
                        style = TextStyle(
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Normal,
                            fontSize = 13.sp,
                            color = TextPlaceholder
                        )
                    )
                }

                BasicTextField(
                    value = value,
                    onValueChange = onValueChange,
                    modifier = Modifier
                        .fillMaxSize()
                        .testTag("input_text_field"),
                    textStyle = TextStyle(
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.5.sp,
                        color = TextNavy
                    ),
                    cursorBrush = SolidColor(PrimaryLight)
                )
            }
        }
    }
}
