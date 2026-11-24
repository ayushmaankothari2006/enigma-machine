package com.enigma.machine.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.enigma.machine.R
import com.enigma.machine.engine.ReflectorId
import com.enigma.machine.engine.RotorConfig
import com.enigma.machine.engine.RotorSlot
import com.enigma.machine.ui.theme.*

/**
 * SettingsCard: Machine Settings Dashboard matching Web Claymorphism design.
 * - Reflector selector removed as requested
 * - Rotor model selectors removed as requested
 * - Pure light mode styling with crisp clay borders & shadows
 * - Random Key button
 */
@Composable
fun SettingsCard(
    reflector: ReflectorId = ReflectorId.A,
    leftRotor: RotorConfig,
    middleRotor: RotorConfig,
    rightRotor: RotorConfig,
    onPositionStep: (slot: RotorSlot, delta: Int) -> Unit,
    onRingStep: (slot: RotorSlot, delta: Int) -> Unit,
    onTurnoverNotchChange: (slot: RotorSlot, notch: Int) -> Unit,
    onRandomizeSettings: () -> Unit,
    onResetPositions: () -> Unit,
    configWarnings: List<String> = emptyList(),
    modifier: Modifier = Modifier
) {
    // Outer Clay Card
    Box(
        modifier = modifier
            .fillMaxWidth()
            .testTag("settings_card")
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
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Dashboard Header: Icon, Title & Random Key Action Button
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.weight(1f, fill = false)
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .shadow(
                                elevation = 2.dp,
                                shape = RoundedCornerShape(12.dp),
                                ambientColor = Color(0x401D4ED8)
                            )
                            .background(
                                color = PrimaryDark,
                                shape = RoundedCornerShape(12.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_tune),
                            contentDescription = "Settings Icon",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    Text(
                        text = "Machine Settings Dashboard",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 13.sp
                        ),
                        maxLines = 1,
                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
                        color = TextNavy
                    )
                }

                Spacer(modifier = Modifier.width(8.dp))

                // Random Key Button matching Web UI
                Surface(
                    onClick = onRandomizeSettings,
                    shape = RoundedCornerShape(12.dp),
                    color = PrimaryLight,
                    shadowElevation = 2.dp,
                    modifier = Modifier.testTag("random_key_button")
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_casino),
                            contentDescription = "Random Key",
                            tint = Color(0xFFFED7AA),
                            modifier = Modifier.size(14.dp)
                        )
                        Text(
                            text = "Random Key",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp
                            ),
                            maxLines = 1,
                            color = Color.White
                        )
                    }
                }
            }

            // Informational Configuration Warnings
            AnimatedVisibility(visible = configWarnings.isNotEmpty()) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = PillOrangeBg,
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFED7AA)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("config_warnings_banner")
                ) {
                    Column(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        for (warning in configWarnings) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Info,
                                    contentDescription = "Config Note",
                                    tint = SecondaryOrange,
                                    modifier = Modifier.size(14.dp)
                                )
                                Text(
                                    text = warning,
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 11.sp
                                    ),
                                    color = PillOrangeText
                                )
                            }
                        }
                    }
                }
            }

            // 3 Rotor Bays: Responsive (Side-by-Side on wide screens, Stacked on phones)
            BoxWithConstraints(modifier = Modifier.fillMaxWidth()) {
                if (maxWidth >= 600.dp) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        RotorBay(
                            title = "Left Rotor",
                            badge = "R₁ • Slow",
                            isOrangeBadge = false,
                            rotor = leftRotor,
                            onPositionStep = { onPositionStep(RotorSlot.LEFT, it) },
                            onRingStep = { onRingStep(RotorSlot.LEFT, it) },
                            onTurnoverNotchChange = { onTurnoverNotchChange(RotorSlot.LEFT, it) },
                            modifier = Modifier.weight(1f)
                        )

                        RotorBay(
                            title = "Middle Rotor",
                            badge = "R₂ • Medium",
                            isOrangeBadge = true,
                            rotor = middleRotor,
                            onPositionStep = { onPositionStep(RotorSlot.MIDDLE, it) },
                            onRingStep = { onRingStep(RotorSlot.MIDDLE, it) },
                            onTurnoverNotchChange = { onTurnoverNotchChange(RotorSlot.MIDDLE, it) },
                            modifier = Modifier.weight(1f)
                        )

                        RotorBay(
                            title = "Right Rotor",
                            badge = "R₃ • Fast",
                            isOrangeBadge = false,
                            rotor = rightRotor,
                            onPositionStep = { onPositionStep(RotorSlot.RIGHT, it) },
                            onRingStep = { onRingStep(RotorSlot.RIGHT, it) },
                            onTurnoverNotchChange = { onTurnoverNotchChange(RotorSlot.RIGHT, it) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                } else {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        RotorBay(
                            title = "Left Rotor",
                            badge = "R₁ • Slow",
                            isOrangeBadge = false,
                            rotor = leftRotor,
                            onPositionStep = { onPositionStep(RotorSlot.LEFT, it) },
                            onRingStep = { onRingStep(RotorSlot.LEFT, it) },
                            onTurnoverNotchChange = { onTurnoverNotchChange(RotorSlot.LEFT, it) }
                        )

                        RotorBay(
                            title = "Middle Rotor",
                            badge = "R₂ • Medium",
                            isOrangeBadge = true,
                            rotor = middleRotor,
                            onPositionStep = { onPositionStep(RotorSlot.MIDDLE, it) },
                            onRingStep = { onRingStep(RotorSlot.MIDDLE, it) },
                            onTurnoverNotchChange = { onTurnoverNotchChange(RotorSlot.MIDDLE, it) }
                        )

                        RotorBay(
                            title = "Right Rotor",
                            badge = "R₃ • Fast",
                            isOrangeBadge = false,
                            rotor = rightRotor,
                            onPositionStep = { onPositionStep(RotorSlot.RIGHT, it) },
                            onRingStep = { onRingStep(RotorSlot.RIGHT, it) },
                            onTurnoverNotchChange = { onTurnoverNotchChange(RotorSlot.RIGHT, it) }
                        )
                    }
                }
            }
        }
    }
}
