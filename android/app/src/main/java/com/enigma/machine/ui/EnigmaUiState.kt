package com.enigma.machine.ui

import com.enigma.machine.engine.Presets
import com.enigma.machine.engine.ReflectorId
import com.enigma.machine.engine.RotorConfig
import com.enigma.machine.engine.RotorId

data class EnigmaUiState(
    val inputText: String = "",
    val outputText: String = "",
    val reflector: ReflectorId = ReflectorId.A,
    val leftRotor: RotorConfig = RotorConfig(
        id = RotorId.I,
        name = "Rotor I",
        position = 0,
        ringSetting = 0,
        turnoverNotch = Presets.ROTOR_CATALOG[RotorId.I]?.notch ?: 33
    ),
    val middleRotor: RotorConfig = RotorConfig(
        id = RotorId.II,
        name = "Rotor II",
        position = 0,
        ringSetting = 0,
        turnoverNotch = Presets.ROTOR_CATALOG[RotorId.II]?.notch ?: 65
    ),
    val rightRotor: RotorConfig = RotorConfig(
        id = RotorId.III,
        name = "Rotor III",
        position = 0,
        ringSetting = 0,
        turnoverNotch = Presets.ROTOR_CATALOG[RotorId.III]?.notch ?: 16
    ),
    val initialPositions: Triple<Int, Int, Int> = Triple(0, 0, 0),
    val isCopied: Boolean = false,
    val isProcessing: Boolean = false,
    val unsupportedCharsCount: Int = 0,
    val unsupportedCharsSample: List<Char> = emptyList(),
    val unsupportedWarningMessage: String? = null,
    val errorMessage: String? = null,
    val statusMessage: String? = null,
    val configWarnings: List<String> = emptyList(),
    val calculationTimeMillis: Double = 0.0
)
