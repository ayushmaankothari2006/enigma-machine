package com.enigma.machine.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupProperties
import com.enigma.machine.engine.Alphabet
import com.enigma.machine.ui.theme.*

/**
 * NotchDropdown: Matches the exact Web Mobile UI shown in user screenshot (Image 1):
 * - Pill trigger button with warm peach border, orange text, and rotating chevron.
 * - Floating rounded popup (16dp rounded corners) with soft warm shadow and peach border.
 * - Exactly ~5 items visible at a time (170dp height) with smooth lazy scrolling.
 * - Automatically scrolls to center the active selected notch.
 * - Selected item highlighted in solid Safety Orange with bold white text and checkmark.
 */
@Composable
fun NotchDropdown(
    value: Int, // 0 to 95
    onChange: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }
    val chevronRotation by animateFloatAsState(targetValue = if (expanded) 180f else 0f, label = "chevron")

    Box(modifier = modifier) {
        // Trigger Button: Rounded rectangle / pill with warm peach border
        Surface(
            onClick = { expanded = !expanded },
            shape = RoundedCornerShape(12.dp),
            color = SurfaceLight,
            border = androidx.compose.foundation.BorderStroke(1.2.dp, Color(0xFFFED7AA)),
            shadowElevation = 1.dp,
            modifier = Modifier.testTag("notch_dropdown_trigger")
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp)
            ) {
                Text(
                    text = "${Alphabet.formatGlyph(value)} (${value + 1})",
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp
                    ),
                    color = SecondaryOrange
                )
                Icon(
                    imageVector = Icons.Default.ArrowDropDown,
                    contentDescription = "Toggle Notch Menu",
                    tint = SecondaryOrange,
                    modifier = Modifier
                        .size(16.dp)
                        .rotate(chevronRotation)
                )
            }
        }

        // Floating Popup Card matching Image 1
        if (expanded) {
            val listState = rememberLazyListState(
                initialFirstVisibleItemIndex = (value - 2).coerceIn(0, Alphabet.ALPHABET_SIZE - 5)
            )

            Popup(
                alignment = Alignment.TopEnd,
                offset = androidx.compose.ui.unit.IntOffset(0, 110),
                onDismissRequest = { expanded = false },
                properties = PopupProperties(focusable = true)
            ) {
                Box(
                    modifier = Modifier
                        .width(136.dp)
                        .height(176.dp)
                        .shadow(
                            elevation = 12.dp,
                            shape = RoundedCornerShape(16.dp),
                            ambientColor = Color(0x3DF97316),
                            spotColor = Color(0x3DF97316)
                        )
                        .background(color = SurfaceLight, shape = RoundedCornerShape(16.dp))
                        .border(width = 1.5.dp, color = Color(0xFFFED7AA), shape = RoundedCornerShape(16.dp))
                        .padding(horizontal = 6.dp, vertical = 6.dp)
                ) {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        items(Alphabet.ALPHABET_SIZE) { idx ->
                            val isSelected = idx == value
                            val displayIdx = idx + 1
                            val glyphText = Alphabet.formatGlyph(idx)

                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(32.dp)
                                    .then(
                                        if (isSelected) {
                                            Modifier
                                                .background(
                                                    color = SecondaryOrangeBright,
                                                    shape = RoundedCornerShape(10.dp)
                                                )
                                                .padding(horizontal = 8.dp)
                                        } else {
                                            Modifier
                                                .clickable {
                                                    onChange(idx)
                                                    expanded = false
                                                }
                                                .padding(horizontal = 8.dp)
                                        }
                                    ),
                                contentAlignment = Alignment.CenterStart
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "$glyphText ($displayIdx)",
                                        style = MaterialTheme.typography.labelSmall.copy(
                                            fontFamily = FontFamily.Monospace,
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                            fontSize = 11.sp
                                        ),
                                        color = if (isSelected) Color.White else Color(0xFF334155)
                                    )

                                    if (isSelected) {
                                        Icon(
                                            imageVector = Icons.Default.Check,
                                            contentDescription = "Selected",
                                            tint = Color.White,
                                            modifier = Modifier.size(14.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
