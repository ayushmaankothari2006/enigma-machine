package com.enigma.machine.engine

/**
 * Result of input sanitization detailing stripped characters for native user feedback.
 */
data class SanitizeResult(
    val text: String,
    val unsupportedCount: Int = 0,
    val unsupportedSample: List<Char> = emptyList()
)

/**
 * Modern Enigma 96 Alphabet Definition
 *
 * Index 0: ' ' (SPACE)
 * Index 1..94: ASCII 33..126 ('!' to '~')
 * Index 95: '\n' (ENTER / Line Feed)
 */
object Alphabet {
    const val ALPHABET_SIZE: Int = 96

    val ALPHABET_CHARS: CharArray = CharArray(ALPHABET_SIZE).apply {
        this[0] = ' '
        for (i in 33..126) {
            this[i - 32] = i.toChar()
        }
        this[95] = '\n'
    }

    /**
     * Fast O(1) character-to-index lookup using ASCII code boundaries.
     * Returns -1 if the character is outside the 96-character alphabet.
     */
    fun charToIndex(ch: Char): Int {
        val code = ch.code
        return when {
            code == 32 -> 0   // Space -> 0
            code == 10 -> 95  // Line feed '\n' -> 95
            code in 33..126 -> code - 32 // '!' (33) -> 1 ... '~' (126) -> 94
            else -> -1
        }
    }

    /**
     * Fast O(1) index-to-character lookup with modulo wrapping.
     */
    fun indexToChar(index: Int): Char {
        val norm = ((index % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE
        return ALPHABET_CHARS[norm]
    }

    /**
     * Human-readable label for glyphs, formatting Space and Enter clearly.
     */
    fun formatGlyph(index: Int): String {
        val norm = ((index % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE
        return when (norm) {
            0 -> "[Space]"
            95 -> "[Enter]"
            else -> ALPHABET_CHARS[norm].toString()
        }
    }

    /**
     * High-performance single-pass sanitization:
     * - Normalizes CRLF (\r\n) and lone CR (\r) into LF (\n) without intermediate string copies.
     * - Filters characters outside the 96-character set.
     * - Collects diagnostic metadata for native UI feedback.
     */
    fun sanitizeInputWithDetails(text: String): SanitizeResult {
        if (text.isEmpty()) return SanitizeResult(text = "")

        val len = text.length
        val builder = java.lang.StringBuilder(len)
        var unsupportedCount = 0
        val unsupportedSample = mutableListOf<Char>()
        val maxSamples = 5

        var i = 0
        while (i < len) {
            val ch = text[i]

            // Handle newline normalization: CRLF (\r\n) or lone CR (\r) -> LF (\n)
            if (ch == '\r') {
                if (i + 1 < len && text[i + 1] == '\n') {
                    i++ // Skip '\r' and proceed to '\n'
                }
                builder.append('\n')
                i++
                continue
            }

            val idx = charToIndex(ch)
            if (idx != -1) {
                builder.append(ch)
            } else {
                // If this is a high surrogate followed by a low surrogate (e.g. emoji), consume the pair as one
                if (ch.isHighSurrogate() && i + 1 < len && text[i + 1].isLowSurrogate()) {
                    i++
                }
                unsupportedCount++
                if (unsupportedSample.size < maxSamples && !unsupportedSample.contains(ch)) {
                    unsupportedSample.add(ch)
                }
            }
            i++
        }

        return SanitizeResult(
            text = builder.toString(),
            unsupportedCount = unsupportedCount,
            unsupportedSample = unsupportedSample
        )
    }

    /**
     * Backward-compatible shorthand returning only the sanitized string.
     */
    fun sanitizeInput(text: String): String = sanitizeInputWithDetails(text).text
}
