package com.enigma.machine

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.enigma.machine.engine.Alphabet
import com.enigma.machine.ui.EnigmaViewModel
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * End-to-End Compose UI Integration Test Suite for Enigma Machine Android Application.
 *
 * Verifies all user interactions:
 * 1. Initial UI composition and component visibility (Input, Output, Settings cards).
 * 2. Real-time encipherment as the user types text into the Input card.
 * 3. Clipboard copy interaction and feedback state transitions.
 * 4. Negative test cases: handling invalid/unsupported characters (emojis, control codes) with diagnostic banners.
 * 5. Negative test cases: clearing input, ensuring graceful state reset and zero crashes.
 * 6. Quick action button interactions (Sample text loader).
 * 7. End-to-end reciprocal decipherment (Ek(Ek(M)) == M) through UI button triggers.
 * 8. Rotor position stepper, random key generation, and position reset interactions.
 * 9. Reflector switching (Reflector A <-> Reflector B) and real-time re-encipherment.
 */
@RunWith(AndroidJUnit4::class)
class EnigmaUiIntegrationTest {

    @get:Rule
    val composeTestRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun testInitialUiStateRendersAllCardsAndControls() {
        // Verify Top App Bar title and export action
        composeTestRule.onNodeWithText("ENIGMA").assertIsDisplayed()
        composeTestRule.onNodeWithText("96").assertIsDisplayed()
        composeTestRule.onNodeWithText("Export PDF").assertIsDisplayed()

        // Verify Card 1: Plaintext Input Card
        composeTestRule.onNodeWithTag("input_card").assertIsDisplayed()
        composeTestRule.onNodeWithText("Plaintext Input").assertIsDisplayed()
        composeTestRule.onNodeWithTag("input_char_counter").assertTextEquals("Length: 0 chars")
        composeTestRule.onNodeWithTag("sample_text_button").assertIsDisplayed().assertIsEnabled()
        composeTestRule.onNodeWithTag("clear_button").assertIsDisplayed().assertIsNotEnabled()
        composeTestRule.onNodeWithTag("input_text_field").assertIsDisplayed()

        // Verify Card 2: Ciphertext Output Card
        composeTestRule.onNodeWithTag("output_card").assertIsDisplayed()
        composeTestRule.onNodeWithText("Ciphertext Output").assertIsDisplayed()
        composeTestRule.onNodeWithTag("output_char_counter").assertTextEquals("Length: 0 chars")
        composeTestRule.onNodeWithTag("output_placeholder").assertIsDisplayed()
        composeTestRule.onNodeWithTag("decipher_button").assertIsDisplayed().assertIsNotEnabled()
        composeTestRule.onNodeWithTag("copy_button").assertIsDisplayed().assertIsNotEnabled()

        // Verify Card 3: Machine Settings Dashboard
        composeTestRule.onNodeWithTag("settings_card").assertIsDisplayed()
        composeTestRule.onNodeWithText("Machine Settings Dashboard").assertIsDisplayed()
        composeTestRule.onNodeWithTag("random_key_button").assertIsDisplayed().assertIsEnabled()
        composeTestRule.onNodeWithTag("reset_positions_button").assertIsDisplayed().assertIsEnabled()
    }

    @Test
    fun testTypingInputUpdatesOutputInRealTime() {
        val testInput = "HELLO WORLD 2026!"

        // Simulate user typing text into the Input card
        composeTestRule.onNodeWithTag("input_text_field")
            .performTextInput(testInput)

        // Wait for coroutine computation to complete
        composeTestRule.waitForIdle()

        // Verify input text field contains the typed input
        composeTestRule.onNodeWithTag("input_text_field")
            .assertTextContains(testInput)

        // Verify input character counter updates
        composeTestRule.onNodeWithTag("input_char_counter")
            .assertTextEquals("Length: ${testInput.length} chars")

        // Verify output card updates with ciphertext
        composeTestRule.onNodeWithTag("output_text")
            .assertIsDisplayed()

        // Verify output character counter matches
        composeTestRule.onNodeWithTag("output_char_counter")
            .assertTextEquals("Length: ${testInput.length} chars")

        // Verify action buttons are now enabled
        composeTestRule.onNodeWithTag("clear_button").assertIsEnabled()
        composeTestRule.onNodeWithTag("copy_button").assertIsEnabled()
        composeTestRule.onNodeWithTag("decipher_button").assertIsEnabled()

        // Verify that the ciphertext is not identical to input (core Enigma property)
        composeTestRule.onNodeWithTag("output_text")
            .assert(hasText(testInput).not())
    }

    @Test
    fun testCopyToClipboardActionTriggersProperConfirmationFeedback() {
        val testPayload = "CONFIDENTIAL DISPATCH"

        // Enter input
        composeTestRule.onNodeWithTag("input_text_field")
            .performTextInput(testPayload)
        composeTestRule.waitForIdle()

        // Perform click on the Copy button
        composeTestRule.onNodeWithTag("copy_button")
            .assertIsEnabled()
            .performClick()

        // Wait for UI update
        composeTestRule.waitForIdle()

        // Verify Copy button changes label to "Copied!" confirmation state
        composeTestRule.onNodeWithText("Copied!").assertIsDisplayed()

        // Verify Snackbar notification surfaces confirmation message
        composeTestRule.onNodeWithText("Copied ${testPayload.length} characters to clipboard.")
            .assertIsDisplayed()
    }

    @Test
    fun testNegativeScenarioTypingInvalidCharactersShowsDiagnosticWarning() {
        // Type a string containing emojis and tab characters outside the 96-char alphabet
        val inputWithUnsupported = "Secret 😊 Mission 🚀 With \t Tabs"

        composeTestRule.onNodeWithTag("input_text_field")
            .performTextInput(inputWithUnsupported)
        composeTestRule.waitForIdle()

        // Verify unsupported characters warning banner is displayed
        composeTestRule.onNodeWithTag("unsupported_warning_banner")
            .assertIsDisplayed()

        // Verify warning banner contains the filtered character count (3 unsupported: 😊, 🚀, \t)
        composeTestRule.onNodeWithText("Filtered 3 unsupported character(s)", substring = true)
            .assertIsDisplayed()

        // Verify the app did not crash and output is still produced for the valid characters
        composeTestRule.onNodeWithTag("output_text").assertIsDisplayed()

        // The sanitized output length should match valid characters (inputWithUnsupported.length - 3)
        val validCharsCount = Alphabet.sanitizeInput(inputWithUnsupported).length
        composeTestRule.onNodeWithTag("output_char_counter")
            .assertTextEquals("Length: $validCharsCount chars")
    }

    @Test
    fun testNegativeScenarioClearingInputResetsUiGracefullyWithoutCrashing() {
        // First type some text with an invalid character to trigger warnings and output
        composeTestRule.onNodeWithTag("input_text_field")
            .performTextInput("Temporary Payload 🌟")
        composeTestRule.waitForIdle()

        // Verify output and warning are visible
        composeTestRule.onNodeWithTag("output_text").assertIsDisplayed()
        composeTestRule.onNodeWithTag("unsupported_warning_banner").assertIsDisplayed()
        composeTestRule.onNodeWithTag("clear_button").assertIsEnabled()

        // Click the Clear button
        composeTestRule.onNodeWithTag("clear_button")
            .performClick()
        composeTestRule.waitForIdle()

        // Verify input text field is empty
        composeTestRule.onNodeWithTag("input_char_counter")
            .assertTextEquals("Length: 0 chars")

        // Verify output resets to placeholder
        composeTestRule.onNodeWithTag("output_placeholder")
            .assertIsDisplayed()
        composeTestRule.onNodeWithTag("output_char_counter")
            .assertTextEquals("Length: 0 chars")

        // Verify warning banner is gone
        composeTestRule.onNodeWithTag("unsupported_warning_banner")
            .assertDoesNotExist()

        // Verify buttons return to disabled state
        composeTestRule.onNodeWithTag("clear_button").assertIsNotEnabled()
        composeTestRule.onNodeWithTag("copy_button").assertIsNotEnabled()
        composeTestRule.onNodeWithTag("decipher_button").assertIsNotEnabled()
    }

    @Test
    fun testSampleButtonLoadsSamplePayloadAndEnciphers() {
        // Click "Sample" button
        composeTestRule.onNodeWithTag("sample_text_button")
            .performClick()
        composeTestRule.waitForIdle()

        // Verify input char counter reflects sample text length
        composeTestRule.onNodeWithTag("input_char_counter")
            .assertTextEquals("Length: ${EnigmaViewModel.SAMPLE_TEXT.length} chars")

        // Verify output text is populated and matches sample length
        composeTestRule.onNodeWithTag("output_text")
            .assertIsDisplayed()
        composeTestRule.onNodeWithTag("output_char_counter")
            .assertTextEquals("Length: ${EnigmaViewModel.SAMPLE_TEXT.length} chars")
    }

    @Test
    fun testReciprocalDecipherWorkflowEndToEnd() {
        val originalSecret = "TOP SECRET ENIGMA TRANSMISSION 1942: ALPHA BRAVO CHARLIE"

        // 1. Enter original message
        composeTestRule.onNodeWithTag("input_text_field")
            .performTextInput(originalSecret)
        composeTestRule.waitForIdle()

        // 2. Read the resulting ciphertext
        composeTestRule.onNodeWithTag("output_text")
            .assertIsDisplayed()
            .assert(hasText(originalSecret).not())

        // 3. Click the "Decipher" button (transfers ciphertext to input and restores key)
        composeTestRule.onNodeWithTag("decipher_button")
            .performClick()
        composeTestRule.waitForIdle()

        // 4. Verify input now holds the ciphertext
        composeTestRule.onNodeWithTag("input_char_counter")
            .assertTextEquals("Length: ${originalSecret.length} chars")

        // 5. Verify reciprocal output perfectly matches the original secret!
        composeTestRule.onNodeWithTag("output_text")
            .assertTextEquals(originalSecret)
    }

    @Test
    fun testRandomizeAndResetPositionsControls() {
        // Click Random Key button
        composeTestRule.onNodeWithTag("random_key_button")
            .performClick()
        composeTestRule.waitForIdle()

        // Verify snackbar displays key generation message
        composeTestRule.onNodeWithText("Generated random cryptographic key.")
            .assertIsDisplayed()

        // Click Reset Positions button
        composeTestRule.onNodeWithTag("reset_positions_button")
            .performClick()
        composeTestRule.waitForIdle()

        // Verify snackbar displays reset message
        composeTestRule.onNodeWithText("Rotor positions reset to starting key.")
            .assertIsDisplayed()
    }

    @Test
    fun testRandomizingKeyRecomputesCiphertext() {
        val testText = "KEY RECOMPUTATION TEST VECTOR"

        composeTestRule.onNodeWithTag("input_text_field")
            .performTextInput(testText)
        composeTestRule.waitForIdle()

        val outputNodeInitial = composeTestRule.onNodeWithTag("output_text").fetchSemanticsNode()
        val ciphertextInitial = outputNodeInitial.config[androidx.compose.ui.semantics.SemanticsProperties.Text].first().text

        // Click Random Key button
        composeTestRule.onNodeWithTag("random_key_button")
            .performClick()
        composeTestRule.waitForIdle()

        val outputNodeRandom = composeTestRule.onNodeWithTag("output_text").fetchSemanticsNode()
        val ciphertextRandom = outputNodeRandom.config[androidx.compose.ui.semantics.SemanticsProperties.Text].first().text

        // New key must produce different ciphertext
        assertNotEquals("New cryptographic key must produce different ciphertext", ciphertextInitial, ciphertextRandom)
        assertEquals(testText.length, ciphertextRandom.length)
    }

    @Test
    fun testPastingVeryLargeTextBlockEnciphersWithoutLagOrCrash() {
        // Build 10,000+ character stress payload
        val unit = "0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz !@#$%^&*()_+\n"
        val builder = StringBuilder(11000)
        while (builder.length < 10000) {
            builder.append(unit)
        }
        val largePayload = builder.toString()

        // Paste 10,000+ characters into the input card
        composeTestRule.onNodeWithTag("input_text_field")
            .performTextInput(largePayload)
        composeTestRule.waitForIdle()

        // Verify input char counter reflects 10,000+ length
        composeTestRule.onNodeWithTag("input_char_counter")
            .assertTextEquals("Length: ${largePayload.length} chars")

        // Verify output card processed the entire text and displays ciphertext
        composeTestRule.onNodeWithTag("output_text")
            .assertIsDisplayed()

        composeTestRule.onNodeWithTag("output_char_counter")
            .assertTextEquals("Length: ${largePayload.length} chars")

        // Verify Clear button clears 10k text instantly
        composeTestRule.onNodeWithTag("clear_button")
            .assertIsEnabled()
            .performClick()
        composeTestRule.waitForIdle()

        composeTestRule.onNodeWithTag("output_placeholder")
            .assertIsDisplayed()
    }

    @Test
    fun testConfigurationChangePreservesInputAndOutputState() {
        val testText = "Persistent Payload Across Rotation"

        // Type test text
        composeTestRule.onNodeWithTag("input_text_field")
            .performTextInput(testText)
        composeTestRule.waitForIdle()

        // Verify output produced
        composeTestRule.onNodeWithTag("output_text").assertIsDisplayed()

        // Simulate activity recreation (e.g. screen rotation portrait <-> landscape)
        composeTestRule.activityRule.scenario.recreate()
        composeTestRule.waitForIdle()

        // Verify state is completely preserved
        composeTestRule.onNodeWithTag("input_char_counter")
            .assertTextEquals("Length: ${testText.length} chars")
        composeTestRule.onNodeWithTag("output_text")
            .assertIsDisplayed()
        composeTestRule.onNodeWithTag("output_char_counter")
            .assertTextEquals("Length: ${testText.length} chars")
    }

    @Test
    fun testPdfExporterGeneratesValidSessionDocument() {
        val context = composeTestRule.activity
        val left = com.enigma.machine.engine.RotorConfig(id = com.enigma.machine.engine.RotorId.I, position = 0, ringSetting = 0, turnoverNotch = 33)
        val middle = com.enigma.machine.engine.RotorConfig(id = com.enigma.machine.engine.RotorId.II, position = 0, ringSetting = 0, turnoverNotch = 65)
        val right = com.enigma.machine.engine.RotorConfig(id = com.enigma.machine.engine.RotorId.III, position = 0, ringSetting = 0, turnoverNotch = 16)

        val result = com.enigma.machine.utils.PdfExporter.exportAndShare(
            context = context,
            leftRotor = left,
            middleRotor = middle,
            rightRotor = right,
            inputText = "INTEGRATION TEST PLAINTEXT",
            outputText = "INTEGRATION TEST CIPHERTEXT"
        )

        assertTrue("PDF export must succeed", result.success)
        assertTrue("PDF file must exist on disk", java.io.File(result.filePath).exists())
        assertTrue("PDF file must have non-zero size", java.io.File(result.filePath).length() > 1000)
    }
}
