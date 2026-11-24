package com.enigma.machine.engine

data class SteppingResult(
    val positions: Triple<Int, Int, Int>,
    val pawlAction: String,
    val r2AtNotch: Boolean,
    val r3AtNotch: Boolean
)

fun stepRotors(
    pos1: Int,
    pos2: Int,
    pos3: Int,
    notch2: Int,
    notch3: Int
): SteppingResult {
    val r2AtNotch = pos2 == notch2
    val r3AtNotch = pos3 == notch3

    var newPos1 = pos1
    var newPos2 = pos2
    val newPos3 = (pos3 + 1) % Alphabet.ALPHABET_SIZE
    var pawlAction = "Normal Fast (R3)"

    if (r2AtNotch) {
        newPos1 = (pos1 + 1) % Alphabet.ALPHABET_SIZE
        newPos2 = (pos2 + 1) % Alphabet.ALPHABET_SIZE
        pawlAction = "Double-Step Anomaly (R2+R1+R3)"
    } else if (r3AtNotch) {
        newPos2 = (pos2 + 1) % Alphabet.ALPHABET_SIZE
        pawlAction = "Middle Turnover (R2+R3)"
    }

    return SteppingResult(
        positions = Triple(newPos1, newPos2, newPos3),
        pawlAction = pawlAction,
        r2AtNotch = r2AtNotch,
        r3AtNotch = r3AtNotch
    )
}

class EnigmaMachine(config: EnigmaMachineConfig) {
    val r1: Rotor = Rotor(
        definition = Presets.ROTOR_CATALOG[config.leftRotor.id]
            ?: error("Invalid rotor ID: ${config.leftRotor.id}"),
        position = config.leftRotor.normalizedPosition,
        ringSetting = config.leftRotor.normalizedRingSetting,
        turnoverNotch = config.leftRotor.normalizedTurnoverNotch
    )

    val r2: Rotor = Rotor(
        definition = Presets.ROTOR_CATALOG[config.middleRotor.id]
            ?: error("Invalid rotor ID: ${config.middleRotor.id}"),
        position = config.middleRotor.normalizedPosition,
        ringSetting = config.middleRotor.normalizedRingSetting,
        turnoverNotch = config.middleRotor.normalizedTurnoverNotch
    )

    val r3: Rotor = Rotor(
        definition = Presets.ROTOR_CATALOG[config.rightRotor.id]
            ?: error("Invalid rotor ID: ${config.rightRotor.id}"),
        position = config.rightRotor.normalizedPosition,
        ringSetting = config.rightRotor.normalizedRingSetting,
        turnoverNotch = config.rightRotor.normalizedTurnoverNotch
    )

    val reflector: Reflector = Reflector(
        definition = Presets.REFLECTOR_CATALOG[config.reflector]
            ?: error("Invalid reflector ID: ${config.reflector}")
    )

    /**
     * Allocation-free fast encipherment path for a single character.
     * Ideal for processing large documents in background threads without GC overhead.
     */
    fun encryptCharFast(ch: Char): Char {
        val inIdx = Alphabet.charToIndex(ch)
        if (inIdx == -1) return ch

        // Step rotors directly before contact
        val r2AtNotch = r2.position == r2.turnoverNotch
        val r3AtNotch = r3.position == r3.turnoverNotch
        r3.position = (r3.position + 1) % Alphabet.ALPHABET_SIZE

        if (r2AtNotch) {
            r1.position = (r1.position + 1) % Alphabet.ALPHABET_SIZE
            r2.position = (r2.position + 1) % Alphabet.ALPHABET_SIZE
        } else if (r3AtNotch) {
            r2.position = (r2.position + 1) % Alphabet.ALPHABET_SIZE
        }

        // Forward pass: R3 -> R2 -> R1
        val s3 = r3.effectiveShift
        val s2 = r2.effectiveShift
        val s1 = r1.effectiveShift

        val f3 = r3.forward(inIdx, s3)
        val f2 = r2.forward(f3, s2)
        val f1 = r1.forward(f2, s1)

        // Reflector
        val ref = reflector.reflect(f1)

        // Backward pass: R1 -> R2 -> R3
        val b1 = r1.backward(ref, s1)
        val b2 = r2.backward(b1, s2)
        val b3 = r3.backward(b2, s3)

        return Alphabet.ALPHABET_CHARS[b3]
    }

    /**
     * Standard encipherment with optional signal trace and diagnostic metadata.
     */
    fun encryptChar(ch: Char, recordTrace: Boolean = false): Pair<Char, SignalTrace?> {
        val inIdx = Alphabet.charToIndex(ch)
        if (inIdx == -1) return Pair(ch, null)

        val posBefore = Triple(r1.position, r2.position, r3.position)

        val step = stepRotors(
            pos1 = r1.position,
            pos2 = r2.position,
            pos3 = r3.position,
            notch2 = r2.turnoverNotch,
            notch3 = r3.turnoverNotch
        )

        r1.position = step.positions.first
        r2.position = step.positions.second
        r3.position = step.positions.third

        val posAfter = Triple(r1.position, r2.position, r3.position)

        val s3 = r3.effectiveShift
        val s2 = r2.effectiveShift
        val s1 = r1.effectiveShift

        val r3Fwd = r3.forward(inIdx, s3)
        val r2Fwd = r2.forward(r3Fwd, s2)
        val r1Fwd = r1.forward(r2Fwd, s1)

        val refIdx = reflector.reflect(r1Fwd)

        val r1Bwd = r1.backward(refIdx, s1)
        val r2Bwd = r2.backward(r1Bwd, s2)
        val r3Bwd = r3.backward(r2Bwd, s3)

        val outChar = Alphabet.ALPHABET_CHARS[r3Bwd]

        val trace: SignalTrace? = if (recordTrace) {
            SignalTrace(
                inChar = ch,
                inIdx = inIdx,
                posBefore = posBefore,
                posAfter = posAfter,
                pawlAction = step.pawlAction,
                shift3 = s3,
                shift2 = s2,
                shift1 = s1,
                r3Fwd = r3Fwd,
                r2Fwd = r2Fwd,
                r1Fwd = r1Fwd,
                refIdx = refIdx,
                r1Bwd = r1Bwd,
                r2Bwd = r2Bwd,
                r3Bwd = r3Bwd,
                outChar = outChar,
                outIdx = r3Bwd
            )
        } else null

        return Pair(outChar, trace)
    }

    /**
     * High-performance text processing pipeline:
     * - Gracefully returns for empty input.
     * - Pre-allocates StringBuilder capacity.
     * - Uses the allocation-free fast path for bulk processing while capturing initial diagnostic traces.
     */
    fun processText(text: String): EncryptResult {
        if (text.isEmpty()) {
            return EncryptResult(
                ciphertext = "",
                finalPositions = Triple(r1.position, r2.position, r3.position)
            )
        }

        val startTime = System.nanoTime()
        val sanitized = Alphabet.sanitizeInput(text)
        val len = sanitized.length
        val outBuilder = StringBuilder(len)
        var lastTrace: SignalTrace? = null
        val history = mutableListOf<StepHistoryItem>()

        for (i in 0 until len) {
            val ch = sanitized[i]
            val shouldRecord = (i == len - 1) || (i < 25)

            if (shouldRecord) {
                val (outChar, trace) = encryptChar(ch, recordTrace = true)
                outBuilder.append(outChar)
                if (trace != null) {
                    lastTrace = trace
                    if (history.size < 25) {
                        history.add(
                            StepHistoryItem(
                                stepNum = i + 1,
                                chIn = ch,
                                posBefore = trace.posBefore,
                                pawlAction = trace.pawlAction,
                                posAfter = trace.posAfter,
                                chOut = outChar
                            )
                        )
                    }
                }
            } else {
                val outChar = encryptCharFast(ch)
                outBuilder.append(outChar)
            }
        }

        val elapsedNanos = System.nanoTime() - startTime

        return EncryptResult(
            ciphertext = outBuilder.toString(),
            finalPositions = Triple(r1.position, r2.position, r3.position),
            lastTrace = lastTrace,
            history = history,
            calculationTimeNanos = elapsedNanos
        )
    }
}
