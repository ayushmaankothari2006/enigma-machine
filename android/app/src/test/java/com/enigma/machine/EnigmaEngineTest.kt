package com.enigma.machine

import com.enigma.machine.engine.*
import org.junit.Assert.*
import org.junit.Test

class EnigmaEngineTest {

    @Test
    fun testAlphabetSizeAndBoundaries() {
        assertEquals(96, Alphabet.ALPHABET_SIZE)
        assertEquals(96, Alphabet.ALPHABET_CHARS.size)
        assertEquals(' ', Alphabet.ALPHABET_CHARS[0])
        assertEquals('!', Alphabet.ALPHABET_CHARS[1])
        assertEquals('~', Alphabet.ALPHABET_CHARS[94])
        assertEquals('\n', Alphabet.ALPHABET_CHARS[95])

        assertEquals(0, Alphabet.charToIndex(' '))
        assertEquals(1, Alphabet.charToIndex('!'))
        assertEquals(94, Alphabet.charToIndex('~'))
        assertEquals(95, Alphabet.charToIndex('\n'))
        assertEquals(-1, Alphabet.charToIndex('\t'))
        assertEquals(-1, Alphabet.charToIndex('\r'))
        assertEquals(-1, Alphabet.charToIndex('€'))
        assertEquals(-1, Alphabet.charToIndex('§'))
    }

    @Test
    fun testFormatGlyphs() {
        assertEquals("[Space]", Alphabet.formatGlyph(0))
        assertEquals("[Enter]", Alphabet.formatGlyph(95))
        assertEquals("A", Alphabet.formatGlyph(33))
        // Out of bounds / negative modulo wrapping
        assertEquals("[Space]", Alphabet.formatGlyph(96))
        assertEquals("[Space]", Alphabet.formatGlyph(-96))
        assertEquals("[Enter]", Alphabet.formatGlyph(-1))
    }

    @Test
    fun testSanitizeInputWithDetails() {
        // Normal CRLF and CR
        val res1 = Alphabet.sanitizeInputWithDetails("Hello\r\nWorld\rAgain\nDone")
        assertEquals("Hello\nWorld\nAgain\nDone", res1.text)
        assertEquals(0, res1.unsupportedCount)
        assertTrue(res1.unsupportedSample.isEmpty())

        // Unsupported characters and tabs
        val res2 = Alphabet.sanitizeInputWithDetails("Alpha \t Beta § Gamma ©!")
        assertEquals("Alpha  Beta  Gamma !", res2.text)
        assertEquals(3, res2.unsupportedCount)
        assertEquals(listOf('\t', '§', '©'), res2.unsupportedSample)

        // Only unsupported characters
        val res3 = Alphabet.sanitizeInputWithDetails("😊🎉🚀")
        assertEquals("", res3.text)
        assertEquals(3, res3.unsupportedCount)

        // Empty string
        val res4 = Alphabet.sanitizeInputWithDetails("")
        assertEquals("", res4.text)
        assertEquals(0, res4.unsupportedCount)
    }

    @Test
    fun testReflectorInvolutionsAndZeroFixedPoints() {
        for (refId in listOf(ReflectorId.A, ReflectorId.B)) {
            val refDef = Presets.REFLECTOR_CATALOG[refId]!!
            val reflector = Reflector(refDef)
            for (x in 0 until 96) {
                val mapped = reflector.reflect(x)
                // Zero fixed points (no contact maps to itself)
                assertNotEquals("Reflector $refId mapped contact $x to itself", x, mapped)
                // Strict involution: reflect(reflect(x)) == x
                assertEquals("Reflector $refId is not an involution for $x", x, reflector.reflect(mapped))
            }
        }
    }

    @Test
    fun testRotorReversibility() {
        val testPositions = intArrayOf(0, 15, 33, 65, 95, -1, 100)
        val testRings = intArrayOf(0, 5, 42, 95, -10, 200)

        for (rotorId in RotorId.values()) {
            val def = Presets.ROTOR_CATALOG[rotorId]!!
            for (pos in testPositions) {
                for (ring in testRings) {
                    val rotor = Rotor(def, position = pos, ringSetting = ring)
                    for (x in 0 until 96) {
                        val fwd = rotor.forward(x)
                        val bwd = rotor.backward(fwd)
                        assertEquals("Rotor $rotorId reversibility failed at pos=$pos, ring=$ring, x=$x", x, bwd)
                    }
                }
            }
        }
    }

    @Test
    fun testDoubleSteppingPawlMechanism() {
        val notch2 = 65 // Rotor II notch ('a')
        val notch3 = 16 // Rotor III notch ('0')

        // 1. Right rotor not at notch, middle not at notch
        val step1 = stepRotors(0, 64, 15, notch2, notch3)
        assertEquals(Triple(0, 64, 16), step1.positions)

        // 2. Right rotor IS at notch 16! Next step should turn R2
        val step2 = stepRotors(0, 64, 16, notch2, notch3)
        assertEquals(Triple(0, 65, 17), step2.positions)
        assertTrue(step2.pawlAction.contains("Middle Turnover"))

        // 3. Middle rotor is now at its notch 65!
        // In historical Enigma, middle rotor steps AGAIN and steps left rotor (Double-step anomaly!)
        val step3 = stepRotors(0, 65, 17, notch2, notch3)
        assertEquals(Triple(1, 66, 18), step3.positions)
        assertTrue(step3.pawlAction.contains("Double-Step Anomaly"))
    }

    @Test
    fun testCrossPlatformExactCiphertextVector() {
        val plaintext = "Modern Enigma 96!\nSpaces and numbers: 1 2 3.\nSymbols: ~!@#$%^&*()_+{}|:<>?"
        val config = EnigmaMachineConfig(
            reflector = ReflectorId.A,
            leftRotor = RotorSlotConfig(id = RotorId.I, position = 10, ringSetting = 5),
            middleRotor = RotorSlotConfig(id = RotorId.II, position = 20, ringSetting = 15),
            rightRotor = RotorSlotConfig(id = RotorId.III, position = 30, ringSetting = 25)
        )

        val machineEncrypt = EnigmaMachine(config)
        val encResult = machineEncrypt.processText(plaintext)

        val expectedCiphertext = "{7O~aQB)q-dgrt^a'6Yt{Cx0nw${'$'}BB[ sL0R@Sqe[UIOM/`x;cy'bos[&HHJ292|SrWJN!+cIK;"
        assertEquals(expectedCiphertext, encResult.ciphertext)
        assertEquals(plaintext.length, encResult.ciphertext.length)

        // Reciprocal Decryption with identical initial settings
        val machineDecrypt = EnigmaMachine(config)
        val decResult = machineDecrypt.processText(encResult.ciphertext)
        assertEquals(plaintext, decResult.ciphertext)
    }

    @Test
    fun testEmptyInputHandling() {
        val config = EnigmaMachineConfig(
            reflector = ReflectorId.A,
            leftRotor = RotorSlotConfig(id = RotorId.I, position = 5, ringSetting = 0),
            middleRotor = RotorSlotConfig(id = RotorId.II, position = 10, ringSetting = 0),
            rightRotor = RotorSlotConfig(id = RotorId.III, position = 15, ringSetting = 0)
        )

        val machine = EnigmaMachine(config)
        val result = machine.processText("")
        assertEquals("", result.ciphertext)
        assertEquals(Triple(5, 10, 15), result.finalPositions)
        assertNull(result.lastTrace)
        assertTrue(result.history.isEmpty())
    }

    @Test
    fun testOnlyUnsupportedCharacters() {
        val config = EnigmaMachineConfig(
            reflector = ReflectorId.A,
            leftRotor = RotorSlotConfig(id = RotorId.I, position = 0, ringSetting = 0),
            middleRotor = RotorSlotConfig(id = RotorId.II, position = 0, ringSetting = 0),
            rightRotor = RotorSlotConfig(id = RotorId.III, position = 0, ringSetting = 0)
        )

        val machine = EnigmaMachine(config)
        val result = machine.processText("🚀🎉😀\t\u0000")
        assertEquals("", result.ciphertext)
        assertEquals(Triple(0, 0, 0), result.finalPositions)
    }

    @Test
    fun testNeverEnciphersCharacterToItself() {
        val char = 'A'
        val config = EnigmaMachineConfig(
            reflector = ReflectorId.B,
            leftRotor = RotorSlotConfig(id = RotorId.IV, position = 0, ringSetting = 0),
            middleRotor = RotorSlotConfig(id = RotorId.V, position = 0, ringSetting = 0),
            rightRotor = RotorSlotConfig(id = RotorId.I, position = 0, ringSetting = 0)
        )
        val machine = EnigmaMachine(config)
        val (outChar, _) = machine.encryptChar(char)
        assertNotEquals(char, outChar)
    }

    @Test
    fun testDefensiveOutOfBoundsRotorSettings() {
        // Test negative and large rotor positions and rings
        val config = EnigmaMachineConfig(
            reflector = ReflectorId.A,
            leftRotor = RotorSlotConfig(id = RotorId.I, position = -1, ringSetting = -5),
            middleRotor = RotorSlotConfig(id = RotorId.II, position = 96, ringSetting = 192),
            rightRotor = RotorSlotConfig(id = RotorId.III, position = 1000, ringSetting = -96)
        )

        assertEquals(95, config.leftRotor.normalizedPosition)
        assertEquals(91, config.leftRotor.normalizedRingSetting)
        assertEquals(0, config.middleRotor.normalizedPosition)
        assertEquals(0, config.middleRotor.normalizedRingSetting)
        assertEquals(40, config.rightRotor.normalizedPosition) // 1000 % 96 = 40
        assertEquals(0, config.rightRotor.normalizedRingSetting)

        val machine = EnigmaMachine(config)
        val testText = "Defensive Bounds Check OK"
        val enc = machine.processText(testText)
        assertNotEquals(testText, enc.ciphertext)

        val machineDecrypt = EnigmaMachine(config)
        val dec = machineDecrypt.processText(enc.ciphertext)
        assertEquals(testText, dec.ciphertext)
    }

    @Test
    fun testConfigurationValidationWarnings() {
        val duplicateConfig = EnigmaMachineConfig(
            reflector = ReflectorId.A,
            leftRotor = RotorSlotConfig(id = RotorId.I),
            middleRotor = RotorSlotConfig(id = RotorId.I),
            rightRotor = RotorSlotConfig(id = RotorId.II)
        )
        val validation = duplicateConfig.validate()
        assertTrue(validation.isValid)
        assertEquals(1, validation.warnings.size)
        assertTrue(validation.warnings[0].contains("Rotor I"))
    }

    @Test
    fun testBulkEncryptionPerformanceAndMemoryStability() {
        // Generate a 10,000-character payload consisting of cycles of valid 96 characters
        val builder = StringBuilder(10000)
        for (i in 0 until 10000) {
            builder.append(Alphabet.ALPHABET_CHARS[i % 96])
        }
        val largeText = builder.toString()

        val config = EnigmaMachineConfig(
            reflector = ReflectorId.A,
            leftRotor = RotorSlotConfig(id = RotorId.I, position = 1, ringSetting = 2),
            middleRotor = RotorSlotConfig(id = RotorId.II, position = 3, ringSetting = 4),
            rightRotor = RotorSlotConfig(id = RotorId.III, position = 5, ringSetting = 6)
        )

        val machine = EnigmaMachine(config)
        val startNanos = System.nanoTime()
        val encResult = machine.processText(largeText)
        val elapsedMs = (System.nanoTime() - startNanos) / 1_000_000.0

        assertEquals(10000, encResult.ciphertext.length)
        // Ensure execution time for 10,000 chars is well within responsive limits (< 100ms)
        assertTrue("Expected 10k chars to encrypt under 100ms, took ${elapsedMs}ms", elapsedMs < 100.0)

        // Verify reciprocal decryption on large payload
        val decryptMachine = EnigmaMachine(config)
        val decResult = decryptMachine.processText(encResult.ciphertext)
        assertEquals(largeText, decResult.ciphertext)
    }
}
