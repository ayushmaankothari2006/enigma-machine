package com.enigma.machine.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.enigma.machine.engine.Alphabet
import com.enigma.machine.engine.RotorConfig
import com.enigma.machine.ui.theme.*

/**
 * RotorBay: Represents a single rotor slot in the Enigma machine.
 * Matches the Web Claymorphism design:
 * - Rotor Model selector removed (standard fixed models)
 * - Clean light clay-bay container
 * - Status badge (R1 Slow / R2 Medium / R3 Fast)
 * - Web-styled floating NotchDropdown
 * - Rapid continuous stepping on hold for Position and Ring Offset
 */
@Composable
fun RotorBay(
    title: String,
    badge: String,
    isOrangeBadge: Boolean = false,
    rotor: RotorConfig,
    onPositionStep: (delta: Int) -> Unit,
    onRingStep: (delta: Int) -> Unit,
    onTurnoverNotchChange: (notch: Int) -> Unit,
    modifier: Modifier = Modifier
) {
    val glyph = Alphabet.formatGlyph(rotor.position)
    val displayIndex = rotor.position + 1
    val displayRing = rotor.ringSetting + 1

    // Clay Bay Outer Container
    Box(
        modifier = modifier
            .fillMaxWidth()
            .shadow(
                elevation = 2.dp,
                shape = RoundedCornerShape(20.dp),
                ambientColor = Color(0x1A1E3A8A),
                spotColor = Color(0x1A1E3A8A)
            )
            .background(color = SurfaceWell, shape = RoundedCornerShape(20.dp))
            .border(width = 1.5.dp, color = BorderRotor, shape = RoundedCornerShape(20.dp))
            .padding(14.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Top Slot Header: Title & Pill Badge
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall.copy(
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.5.sp
                    ),
                    color = TextNavy
                )

                // Clay Pill Badge
                Box(
                    modifier = Modifier
                        .background(
                            color = if (isOrangeBadge) PillOrangeBg else PillBlueBg,
                            shape = RoundedCornerShape(999.dp)
                        )
                        .border(
                            width = 1.dp,
                            color = if (isOrangeBadge) Color(0xFFFED7AA) else Color(0xFFBFDBFE),
                            shape = RoundedCornerShape(999.dp)
                        )
                        .padding(horizontal = 10.dp, vertical = 2.5.dp)
                ) {
                    Text(
                        text = badge,
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.sp
                        ),
                        color = if (isOrangeBadge) PillOrangeText else PillBlueText
                    )
                }
            }

            // Position (P) Section Header & Notch Dropdown
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Position (P):",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.5.sp
                        ),
                        color = PrimaryNavy
                    )

                    // Notch Selector Dropdown matching Image 1
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = "Notch:",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 11.sp
                            ),
                            color = TextSlate
                        )

                        NotchDropdown(
                            value = rotor.turnoverNotch,
                            onChange = onTurnoverNotchChange
                        )
                    }
                }

                // Clay Well Stepper for Position (P)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .shadow(
                            elevation = 1.dp,
                            shape = RoundedCornerShape(16.dp),
                            ambientColor = Color(0x1A1E3A8A)
                        )
                        .background(color = SurfaceLight, shape = RoundedCornerShape(16.dp))
                        .border(width = 1.5.dp, color = BorderWell, shape = RoundedCornerShape(16.dp))
                        .padding(horizontal = 12.dp, vertical = 8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Rapid Decrease Position Button (Single tap or continuous hold)
                        HoldStepperButton(
                            text = "-",
                            onStep = { onPositionStep(-1) },
                            size = 36.dp,
                            shapeRadius = 12.dp,
                            fontSize = 18.sp
                        )

                        // Center Glyph & Index Display
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = glyph,
                                style = MaterialTheme.typography.titleLarge.copy(
                                    fontWeight = FontWeight.Black,
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 20.sp
                                ),
                                textAlign = TextAlign.Center,
                                color = TextNavy
                            )
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(2.dp)
                            ) {
                                Text(
                                    text = "Index ",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 10.sp
                                    ),
                                    color = TextMuted
                                )
                                Text(
                                    text = "$displayIndex",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontFamily = FontFamily.Monospace,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 10.sp
                                    ),
                                    color = SecondaryOrange
                                )
                                Text(
                                    text = " / 96",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 10.sp
                                    ),
                                    color = TextMuted
                                )
                            }
                        }

                        // Rapid Increase Position Button (Single tap or continuous hold)
                        HoldStepperButton(
                            text = "+",
                            onStep = { onPositionStep(1) },
                            size = 36.dp,
                            shapeRadius = 12.dp,
                            fontSize = 18.sp
                        )
                    }
                }
            }

            // Ring Offset (R) Section
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Ring Offset (R):",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp
                        ),
                        color = PrimaryNavy
                    )
                    Text(
                        text = "Range: 1..96",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontFamily = FontFamily.Monospace,
                            fontSize = 10.sp
                        ),
                        color = TextMuted
                    )
                }

                // Ring Setting Row Box
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = SurfaceLight,
                    border = androidx.compose.foundation.BorderStroke(1.dp, BorderWell),
                    shadowElevation = 1.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 10.dp, vertical = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Ring: ",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 11.5.sp
                                ),
                                color = TextSlate
                            )
                            Text(
                                text = "$displayRing",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 12.5.sp
                                ),
                                color = PrimaryNavy
                            )
                        }

                        // Stepper buttons (-) and (+) with rapid continuous hold support
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            HoldStepperButton(
                                text = "-",
                                onStep = { onRingStep(-1) },
                                size = 26.dp,
                                shapeRadius = 8.dp,
                                fontSize = 14.sp
                            )

                            HoldStepperButton(
                                text = "+",
                                onStep = { onRingStep(1) },
                                size = 26.dp,
                                shapeRadius = 8.dp,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
            }
        }
    }
}
