package com.enigma.machine

import androidx.lifecycle.SavedStateHandle
import com.enigma.machine.engine.ReflectorId
import com.enigma.machine.engine.RotorId
import com.enigma.machine.engine.RotorSlot
import com.enigma.machine.ui.EnigmaViewModel
import kotlinx.coroutines.Dispatchers
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class EnigmaViewModelTest {

    private lateinit var viewModel: EnigmaViewModel

    @Before
    fun setUp() {
        // Use Dispatchers.Unconfined for immediate synchronous execution in tests
        viewModel = EnigmaViewModel(computationDispatcher = Dispatchers.Unconfined)
    }

    @Test
    fun testInitialState() {
        val state = viewModel.uiState.value
        assertEquals("", state.inputText)
        assertEquals("", state.outputText)
        assertEquals(ReflectorId.A, state.reflector)
        assertEquals(RotorId.I, state.leftRotor.id)
        assertEquals(RotorId.II, state.middleRotor.id)
        assertEquals(RotorId.III, state.rightRotor.id)
        assertFalse(state.isProcessing)
        assertNull(state.errorMessage)
    }

    @Test
    fun testUpdateInputTextProducesCiphertext() {
        viewModel.updateInputText("Hello World!")
        val state = viewModel.uiState.value
        assertEquals("Hello World!", state.inputText)
        assertNotEquals("Hello World!", state.outputText)
        assertEquals("Hello World!".length, state.outputText.length)
        assertFalse(state.isProcessing)
    }

    @Test
    fun testUnsupportedCharactersGenerateWarning() {
        viewModel.updateInputText("Valid Text 😊 With 🚀 Emojis")
        val state = viewModel.uiState.value
        assertEquals(2, state.unsupportedCharsCount)
        assertNotNull(state.unsupportedWarningMessage)
        assertTrue(state.unsupportedWarningMessage!!.contains("Filtered 2 unsupported character(s)"))
    }

    @Test
    fun testClearInputResetsState() {
        viewModel.updateInputText("Some payload")
        assertTrue(viewModel.uiState.value.outputText.isNotEmpty())

        viewModel.clearInput()
        val state = viewModel.uiState.value
        assertEquals("", state.inputText)
        assertEquals("", state.outputText)
        assertNull(state.unsupportedWarningMessage)
    }

    @Test
    fun testLoadSampleText() {
        viewModel.loadSampleText()
        val state = viewModel.uiState.value
        assertEquals(EnigmaViewModel.SAMPLE_TEXT, state.inputText)
        assertTrue(state.outputText.isNotEmpty())
    }

    @Test
    fun testReciprocalDecipherWorkflow() {
        val originalMessage = "Secret Operative 007:\nMeeting at dawn.\nPasscode: #7890~!"
        viewModel.updateInputText(originalMessage)

        val ciphertext = viewModel.uiState.value.outputText
        assertNotEquals(originalMessage, ciphertext)

        // Trigger reciprocal decipherment
        viewModel.useOutputAsInput()

        val recoveredMessage = viewModel.uiState.value.outputText
        assertEquals(originalMessage, recoveredMessage)
    }

    @Test
    fun testRotorSteppingAndKeyReset() {
        val originalLeft = viewModel.uiState.value.leftRotor.position
        viewModel.stepPosition(RotorSlot.LEFT, 1)
        assertEquals((originalLeft + 1) % 96, viewModel.uiState.value.leftRotor.position)

        viewModel.resetPositionsToDefaults()
        assertEquals((originalLeft + 1) % 96, viewModel.uiState.value.leftRotor.position)
    }

    @Test
    fun testRandomizeSettings() {
        viewModel.randomizeSettings()
        val state = viewModel.uiState.value
        assertTrue(state.statusMessage?.contains("random") == true)
    }

    @Test
    fun testClipboardFeedback() {
        viewModel.notifyClipboardCopied(42)
        assertEquals(true, viewModel.uiState.value.isCopied)
        assertTrue(viewModel.uiState.value.statusMessage?.contains("Copied 42 characters") == true)

        viewModel.notifyClipboardError("Permission denied")
        assertFalse(viewModel.uiState.value.isCopied)
        assertTrue(viewModel.uiState.value.errorMessage?.contains("Clipboard failure") == true)
    }

    @Test
    fun testSavedStateHandleRestoresInputAcrossProcessDeath() {
        val handle = SavedStateHandle(mapOf("saved_input_text" to "Surviving State After Death"))
        val restoredViewModel = EnigmaViewModel(
            savedStateHandle = handle,
            computationDispatcher = Dispatchers.Unconfined
        )
        val state = restoredViewModel.uiState.value
        assertEquals("Surviving State After Death", state.inputText)
        assertTrue(state.outputText.isNotEmpty())
        assertEquals("Surviving State After Death".length, state.outputText.length)
    }

    @Test
    fun testPastingExtremePayload10000Chars() {
        // Build a 10,000+ character realistic payload containing multiline ASCII
        val chunk = "0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz !@#$\n"
        val builder = StringBuilder(12000)
        while (builder.length < 10000) {
            builder.append(chunk)
        }
        val largePayload = builder.toString()
        assertTrue(largePayload.length >= 10000)

        viewModel.updateInputText(largePayload)
        val state = viewModel.uiState.value

        assertEquals(largePayload.length, state.inputText.length)
        assertEquals(largePayload.length, state.outputText.length)
        assertNotEquals(largePayload, state.outputText)
        assertFalse(state.isProcessing)
        assertNull(state.errorMessage)
    }

    @Test
    fun testRapidTypingSupersedesPendingComputations() {
        // Rapid succession of keystrokes
        viewModel.updateInputText("A")
        viewModel.updateInputText("AB")
        viewModel.updateInputText("ABC")
        viewModel.updateInputText("ABCD")
        viewModel.updateInputText("ABCDE")

        val state = viewModel.uiState.value
        assertEquals("ABCDE", state.inputText)
        assertEquals(5, state.outputText.length)
        assertFalse(state.isProcessing)
    }
}
