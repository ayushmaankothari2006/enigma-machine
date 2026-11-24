package com.enigma.machine.ui

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.enigma.machine.engine.*
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlin.random.Random

class EnigmaViewModel(
    private val savedStateHandle: SavedStateHandle? = null,
    private val computationDispatcher: CoroutineDispatcher = Dispatchers.Default
) : ViewModel() {

    companion object {
        private const val KEY_INPUT_TEXT = "saved_input_text"
        const val SAMPLE_TEXT = """Modern Enigma 96 Cryptographic System
---------------------------------------
Alpha: ABCDEFGHIJKLMNOPQRSTUVWXYZ
Numeric: 0123456789
Symbols: !@#$%^&*()_+{}[]:;"'<>?,./~
Multiline payload verification successful."""
    }

    private val initialInput: String = savedStateHandle?.get<String>(KEY_INPUT_TEXT) ?: ""
    private val _uiState = MutableStateFlow(EnigmaUiState(inputText = initialInput))
    val uiState: StateFlow<EnigmaUiState> = _uiState.asStateFlow()

    private var cipherJob: Job? = null

    init {
        if (initialInput.isNotEmpty()) {
            updateInputText(initialInput)
        } else {
            triggerCipherComputation()
        }
    }

    fun updateInputText(newText: String) {
        savedStateHandle?.set(KEY_INPUT_TEXT, newText)
        val sanitizeResult = Alphabet.sanitizeInputWithDetails(newText)
        val warningMessage = if (sanitizeResult.unsupportedCount > 0) {
            val samples = sanitizeResult.unsupportedSample.joinToString(", ") { "'$it'" }
            "Filtered ${sanitizeResult.unsupportedCount} unsupported character(s) ($samples) to preserve 96-char alignment."
        } else null

        _uiState.update {
            it.copy(
                inputText = newText,
                unsupportedCharsCount = sanitizeResult.unsupportedCount,
                unsupportedCharsSample = sanitizeResult.unsupportedSample,
                unsupportedWarningMessage = warningMessage
            )
        }
        triggerCipherComputation()
    }

    fun clearInput() {
        savedStateHandle?.set(KEY_INPUT_TEXT, "")
        cipherJob?.cancel()
        _uiState.update {
            it.copy(
                inputText = "",
                outputText = "",
                isProcessing = false,
                unsupportedCharsCount = 0,
                unsupportedCharsSample = emptyList(),
                unsupportedWarningMessage = null,
                errorMessage = null
            )
        }
    }

    fun loadSampleText() {
        updateInputText(SAMPLE_TEXT)
    }

    /**
     * Reciprocal Decipherment:
     * Moves the current ciphertext into the input field and restores the initial rotor
     * positions so the original message is instantly recovered.
     */
    fun useOutputAsInput() {
        val currentOutput = _uiState.value.outputText
        if (currentOutput.isEmpty()) {
            _uiState.update { it.copy(statusMessage = "Cannot decipher: output text is empty.") }
            return
        }

        val initials = _uiState.value.initialPositions
        _uiState.update { state ->
            state.copy(
                inputText = currentOutput,
                leftRotor = state.leftRotor.copy(position = initials.first),
                middleRotor = state.middleRotor.copy(position = initials.second),
                rightRotor = state.rightRotor.copy(position = initials.third),
                statusMessage = "Loaded ciphertext into input; reset rotor keys for reciprocal decipherment."
            )
        }
        triggerCipherComputation()
    }

    fun stepPosition(slot: RotorSlot, delta: Int) {
        _uiState.update { state ->
            val updatedRotor = when (slot) {
                RotorSlot.LEFT -> state.leftRotor.copy(position = wrap96(state.leftRotor.position + delta))
                RotorSlot.MIDDLE -> state.middleRotor.copy(position = wrap96(state.middleRotor.position + delta))
                RotorSlot.RIGHT -> state.rightRotor.copy(position = wrap96(state.rightRotor.position + delta))
            }

            val updatedInitials = when (slot) {
                RotorSlot.LEFT -> state.initialPositions.copy(first = updatedRotor.position)
                RotorSlot.MIDDLE -> state.initialPositions.copy(second = updatedRotor.position)
                RotorSlot.RIGHT -> state.initialPositions.copy(third = updatedRotor.position)
            }

            when (slot) {
                RotorSlot.LEFT -> state.copy(leftRotor = updatedRotor, initialPositions = updatedInitials)
                RotorSlot.MIDDLE -> state.copy(middleRotor = updatedRotor, initialPositions = updatedInitials)
                RotorSlot.RIGHT -> state.copy(rightRotor = updatedRotor, initialPositions = updatedInitials)
            }
        }
        triggerCipherComputation()
    }

    fun setPosition(slot: RotorSlot, position: Int) {
        val next = wrap96(position)
        _uiState.update { state ->
            val updatedInitials = when (slot) {
                RotorSlot.LEFT -> state.initialPositions.copy(first = next)
                RotorSlot.MIDDLE -> state.initialPositions.copy(second = next)
                RotorSlot.RIGHT -> state.initialPositions.copy(third = next)
            }
            when (slot) {
                RotorSlot.LEFT -> state.copy(leftRotor = state.leftRotor.copy(position = next), initialPositions = updatedInitials)
                RotorSlot.MIDDLE -> state.copy(middleRotor = state.middleRotor.copy(position = next), initialPositions = updatedInitials)
                RotorSlot.RIGHT -> state.copy(rightRotor = state.rightRotor.copy(position = next), initialPositions = updatedInitials)
            }
        }
        triggerCipherComputation()
    }

    fun stepRing(slot: RotorSlot, delta: Int) {
        _uiState.update { state ->
            when (slot) {
                RotorSlot.LEFT -> state.copy(leftRotor = state.leftRotor.copy(ringSetting = wrap96(state.leftRotor.ringSetting + delta)))
                RotorSlot.MIDDLE -> state.copy(middleRotor = state.middleRotor.copy(ringSetting = wrap96(state.middleRotor.ringSetting + delta)))
                RotorSlot.RIGHT -> state.copy(rightRotor = state.rightRotor.copy(ringSetting = wrap96(state.rightRotor.ringSetting + delta)))
            }
        }
        triggerCipherComputation()
    }

    fun setTurnoverNotch(slot: RotorSlot, notch: Int) {
        val next = wrap96(notch)
        _uiState.update { state ->
            when (slot) {
                RotorSlot.LEFT -> state.copy(leftRotor = state.leftRotor.copy(turnoverNotch = next))
                RotorSlot.MIDDLE -> state.copy(middleRotor = state.middleRotor.copy(turnoverNotch = next))
                RotorSlot.RIGHT -> state.copy(rightRotor = state.rightRotor.copy(turnoverNotch = next))
            }
        }
        triggerCipherComputation()
    }

    fun setRotorModel(slot: RotorSlot, rotorId: RotorId) {
        val def = Presets.ROTOR_CATALOG[rotorId] ?: return
        _uiState.update { state ->
            when (slot) {
                RotorSlot.LEFT -> state.copy(leftRotor = state.leftRotor.copy(id = rotorId, name = def.name, turnoverNotch = def.notch))
                RotorSlot.MIDDLE -> state.copy(middleRotor = state.middleRotor.copy(id = rotorId, name = def.name, turnoverNotch = def.notch))
                RotorSlot.RIGHT -> state.copy(rightRotor = state.rightRotor.copy(id = rotorId, name = def.name, turnoverNotch = def.notch))
            }
        }
        triggerCipherComputation()
    }

    fun setReflector(reflectorId: ReflectorId) {
        _uiState.update { it.copy(reflector = reflectorId) }
        triggerCipherComputation()
    }

    fun resetPositionsToDefaults() {
        val initials = _uiState.value.initialPositions
        _uiState.update { state ->
            state.copy(
                leftRotor = state.leftRotor.copy(position = initials.first),
                middleRotor = state.middleRotor.copy(position = initials.second),
                rightRotor = state.rightRotor.copy(position = initials.third),
                statusMessage = "Rotor positions reset to starting key."
            )
        }
        triggerCipherComputation()
    }

    fun randomizeSettings() {
        val p1 = Random.nextInt(Alphabet.ALPHABET_SIZE)
        val p2 = Random.nextInt(Alphabet.ALPHABET_SIZE)
        val p3 = Random.nextInt(Alphabet.ALPHABET_SIZE)

        val r1 = Random.nextInt(Alphabet.ALPHABET_SIZE)
        val r2 = Random.nextInt(Alphabet.ALPHABET_SIZE)
        val r3 = Random.nextInt(Alphabet.ALPHABET_SIZE)

        val n1 = Random.nextInt(Alphabet.ALPHABET_SIZE)
        val n2 = Random.nextInt(Alphabet.ALPHABET_SIZE)
        val n3 = Random.nextInt(Alphabet.ALPHABET_SIZE)

        _uiState.update { state ->
            state.copy(
                leftRotor = state.leftRotor.copy(position = p1, ringSetting = r1, turnoverNotch = n1),
                middleRotor = state.middleRotor.copy(position = p2, ringSetting = r2, turnoverNotch = n2),
                rightRotor = state.rightRotor.copy(position = p3, ringSetting = r3, turnoverNotch = n3),
                initialPositions = Triple(p1, p2, p3),
                statusMessage = "Generated random cryptographic key."
            )
        }
        triggerCipherComputation()
    }

    fun notifyClipboardCopied(charCount: Int) {
        _uiState.update {
            it.copy(
                isCopied = true,
                statusMessage = "Copied $charCount characters to clipboard."
            )
        }
    }

    fun notifyClipboardError(error: String) {
        _uiState.update {
            it.copy(
                isCopied = false,
                errorMessage = "Clipboard failure: $error"
            )
        }
    }

    fun clearErrorMessage() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    fun clearStatusMessage() {
        _uiState.update { it.copy(statusMessage = null) }
    }

    /**
     * Offloads all cipher calculations to the background coroutine thread (Dispatchers.Default).
     * Cancels any previously pending calculation to ensure zero UI lag and maintain 60 FPS.
     */
    private fun triggerCipherComputation() {
        cipherJob?.cancel()

        val state = _uiState.value
        val inputText = state.inputText

        if (inputText.isEmpty()) {
            _uiState.update {
                it.copy(
                    outputText = "",
                    isProcessing = false,
                    calculationTimeMillis = 0.0
                )
            }
            return
        }

        val config = EnigmaMachineConfig(
            reflector = state.reflector,
            leftRotor = RotorSlotConfig(
                id = state.leftRotor.id,
                position = state.leftRotor.position,
                ringSetting = state.leftRotor.ringSetting,
                turnoverNotch = state.leftRotor.turnoverNotch
            ),
            middleRotor = RotorSlotConfig(
                id = state.middleRotor.id,
                position = state.middleRotor.position,
                ringSetting = state.middleRotor.ringSetting,
                turnoverNotch = state.middleRotor.turnoverNotch
            ),
            rightRotor = RotorSlotConfig(
                id = state.rightRotor.id,
                position = state.rightRotor.position,
                ringSetting = state.rightRotor.ringSetting,
                turnoverNotch = state.rightRotor.turnoverNotch
            )
        )

        val validation = config.validate()

        _uiState.update {
            it.copy(
                isProcessing = true,
                configWarnings = validation.warnings
            )
        }

        cipherJob = viewModelScope.launch(computationDispatcher) {
            try {
                val machine = EnigmaMachine(config)
                val result = machine.processText(inputText)

                ensureActive()

                val elapsedMs = result.calculationTimeNanos / 1_000_000.0
                _uiState.update {
                    it.copy(
                        outputText = result.ciphertext,
                        isProcessing = false,
                        calculationTimeMillis = elapsedMs,
                        errorMessage = null
                    )
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isProcessing = false,
                        errorMessage = "Cipher execution failed: ${e.localizedMessage ?: "Unknown error"}"
                    )
                }
            }
        }
    }

    private fun wrap96(v: Int): Int {
        return ((v % Alphabet.ALPHABET_SIZE) + Alphabet.ALPHABET_SIZE) % Alphabet.ALPHABET_SIZE
    }
}
