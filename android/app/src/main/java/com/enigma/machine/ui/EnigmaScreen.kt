package com.enigma.machine.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.enigma.machine.R
import com.enigma.machine.ui.components.InputCard
import com.enigma.machine.ui.components.OutputCard
import com.enigma.machine.ui.components.SettingsCard
import com.enigma.machine.ui.theme.*
import com.enigma.machine.utils.PdfExporter
import kotlinx.coroutines.launch

/**
 * EnigmaScreen: Main screen replicating the Web UI in mobile view.
 * - Light theme Claymorphism design
 * - Top header with CPU icon, ENIGMA96 branding, and Export PDF action (no 100% offline badge)
 * - Plaintext Input card
 * - Ciphertext Output card
 * - Machine Settings Dashboard card (no reflector selector, no rotor selector)
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun EnigmaScreen(
    viewModel: EnigmaViewModel = viewModel(),
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    // Surface status notifications via native Material 3 Snackbar
    LaunchedEffect(uiState.statusMessage) {
        val msg = uiState.statusMessage
        if (msg != null) {
            snackbarHostState.showSnackbar(
                message = msg,
                duration = SnackbarDuration.Short
            )
            viewModel.clearStatusMessage()
        }
    }

    // Surface error notifications via native Material 3 Snackbar
    LaunchedEffect(uiState.errorMessage) {
        val err = uiState.errorMessage
        if (err != null) {
            snackbarHostState.showSnackbar(
                message = err,
                duration = SnackbarDuration.Long,
                actionLabel = "Dismiss"
            )
            viewModel.clearErrorMessage()
        }
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        contentWindowInsets = WindowInsets.systemBars,
        snackbarHost = {
            SnackbarHost(hostState = snackbarHostState)
        },
        topBar = {
            // Web-matching Header Bar
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = SurfaceLight,
                shadowElevation = 2.dp,
                border = androidx.compose.foundation.BorderStroke(1.dp, BorderCard)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .padding(horizontal = 14.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Brand & Identity: CPU Icon + ENIGMA96
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.weight(1f, fill = false)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .shadow(
                                    elevation = 2.dp,
                                    shape = RoundedCornerShape(12.dp),
                                    ambientColor = Color(0x401D4ED8)
                                )
                                .background(
                                    brush = Brush.linearGradient(
                                        listOf(PrimaryDark, PrimaryLight)
                                    ),
                                    shape = RoundedCornerShape(12.dp)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_cpu),
                                contentDescription = "Enigma CPU",
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }

                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "ENIGMA",
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        fontFamily = FontFamily.Monospace,
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 17.sp,
                                        letterSpacing = 0.5.sp
                                    ),
                                    color = PrimaryNavy
                                )
                                Text(
                                    text = "96",
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        fontFamily = FontFamily.Monospace,
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 17.sp,
                                        letterSpacing = 0.5.sp
                                    ),
                                    color = SecondaryOrangeBright
                                )
                            }
                            Text(
                                text = "Modern 96-Character Involutory Cipher Engine",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 10.sp
                                ),
                                color = TextMuted,
                                maxLines = 1
                            )
                        }
                    }

                    // Top Action: Export PDF Button
                    Surface(
                        onClick = {
                            val result = PdfExporter.exportAndShare(
                                context = context,
                                leftRotor = uiState.leftRotor,
                                middleRotor = uiState.middleRotor,
                                rightRotor = uiState.rightRotor,
                                inputText = uiState.inputText,
                                outputText = uiState.outputText
                            )
                            coroutineScope.launch {
                                if (result.success) {
                                    snackbarHostState.showSnackbar("Exported PDF: ${result.fileName}")
                                } else {
                                    snackbarHostState.showSnackbar(result.errorMessage ?: "Failed to export PDF")
                                }
                            }
                        },
                        shape = RoundedCornerShape(999.dp),
                        color = SecondaryOrange,
                        shadowElevation = 2.dp,
                        modifier = Modifier.padding(start = 8.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(5.dp)
                        ) {
                            Icon(
                                painter = painterResource(id = R.drawable.ic_download),
                                contentDescription = "Export PDF",
                                tint = Color.White,
                                modifier = Modifier.size(14.dp)
                            )
                            Text(
                                text = "Export PDF",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp
                                ),
                                color = Color.White
                            )
                        }
                    }
                }
            }
        },
        containerColor = Color.Transparent
    ) { innerPadding ->
        // Claymorphism Background Gradient (Soft light blue to warm peach)
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            BackgroundGradientStart,
                            BackgroundGradientMiddle,
                            BackgroundGradientEnd
                        )
                    )
                )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .consumeWindowInsets(innerPadding)
                    .imePadding()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 14.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Adaptive layout constraint for compact phones, landscape phones, and wide tablets
                BoxWithConstraints(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = Alignment.TopCenter
                ) {
                    val isTabletOrLandscape = maxWidth >= 760.dp

                    if (isTabletOrLandscape) {
                        // WIDE SCREEN / TABLET: Side-by-side Input & Output, wide settings dashboard
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .widthIn(max = 1100.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(16.dp),
                                verticalAlignment = Alignment.Top
                            ) {
                                InputCard(
                                    value = uiState.inputText,
                                    onValueChange = viewModel::updateInputText,
                                    onClear = viewModel::clearInput,
                                    onLoadSample = viewModel::loadSampleText,
                                    unsupportedWarningMessage = uiState.unsupportedWarningMessage,
                                    modifier = Modifier.weight(1f)
                                )

                                OutputCard(
                                    value = uiState.outputText,
                                    onUseOutputAsInput = viewModel::useOutputAsInput,
                                    onCopySuccess = viewModel::notifyClipboardCopied,
                                    onCopyError = viewModel::notifyClipboardError,
                                    isProcessing = uiState.isProcessing,
                                    calculationTimeMillis = uiState.calculationTimeMillis,
                                    modifier = Modifier.weight(1f)
                                )
                            }

                            SettingsCard(
                                reflector = uiState.reflector,
                                leftRotor = uiState.leftRotor,
                                middleRotor = uiState.middleRotor,
                                rightRotor = uiState.rightRotor,
                                onPositionStep = viewModel::stepPosition,
                                onRingStep = viewModel::stepRing,
                                onTurnoverNotchChange = viewModel::setTurnoverNotch,
                                onRandomizeSettings = viewModel::randomizeSettings,
                                onResetPositions = viewModel::resetPositionsToDefaults,
                                configWarnings = uiState.configWarnings,
                                modifier = Modifier.fillMaxWidth()
                            )

                            Spacer(modifier = Modifier.height(16.dp))
                        }
                    } else {
                        // COMPACT / PORTRAIT PHONES: Balanced single-column vertical stack
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .widthIn(max = 640.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            InputCard(
                                value = uiState.inputText,
                                onValueChange = viewModel::updateInputText,
                                onClear = viewModel::clearInput,
                                onLoadSample = viewModel::loadSampleText,
                                unsupportedWarningMessage = uiState.unsupportedWarningMessage
                            )

                            OutputCard(
                                value = uiState.outputText,
                                onUseOutputAsInput = viewModel::useOutputAsInput,
                                onCopySuccess = viewModel::notifyClipboardCopied,
                                onCopyError = viewModel::notifyClipboardError,
                                isProcessing = uiState.isProcessing,
                                calculationTimeMillis = uiState.calculationTimeMillis
                            )

                            SettingsCard(
                                reflector = uiState.reflector,
                                leftRotor = uiState.leftRotor,
                                middleRotor = uiState.middleRotor,
                                rightRotor = uiState.rightRotor,
                                onPositionStep = viewModel::stepPosition,
                                onRingStep = viewModel::stepRing,
                                onTurnoverNotchChange = viewModel::setTurnoverNotch,
                                onRandomizeSettings = viewModel::randomizeSettings,
                                onResetPositions = viewModel::resetPositionsToDefaults,
                                configWarnings = uiState.configWarnings
                            )

                            Spacer(modifier = Modifier.height(16.dp))
                        }
                    }
                }
            }
        }
    }
}
