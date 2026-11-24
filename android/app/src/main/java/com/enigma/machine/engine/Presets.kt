package com.enigma.machine.engine

/**
 * Standard Presets and Wiring Catalog for the Modern Enigma 96 Cryptographic Engine.
 *
 * Each rotor and reflector uses a deterministic 96-character permutation table
 * perfectly identical to the web version, ensuring full cross-platform reciprocity.
 */
object Presets {

    fun invertPermutation(p: IntArray): IntArray {
        val inv = IntArray(Alphabet.ALPHABET_SIZE)
        for (i in 0 until Alphabet.ALPHABET_SIZE) {
            inv[p[i]] = i
        }
        return inv
    }

    // Rotor I Wiring (Mulberry32 Seed: 101)
    private val WIRING_ROTOR_I = intArrayOf(
        23, 53, 60, 78, 84, 69, 34, 1, 5, 70, 48, 45, 21, 91, 43, 65,
        19, 82, 38, 31, 95, 88, 24, 27, 25, 54, 90, 18, 55, 75, 44, 11,
        28, 76, 74, 46, 64, 62, 66, 14, 17, 93, 26, 12, 56, 42, 89, 10,
        36, 16, 81, 7, 22, 51, 77, 61, 86, 37, 0, 68, 80, 9, 73, 40,
        92, 49, 29, 58, 30, 71, 41, 3, 47, 79, 87, 57, 15, 2, 83, 4,
        8, 39, 94, 32, 67, 33, 6, 20, 85, 52, 63, 35, 59, 50, 72, 13
    )

    // Rotor II Wiring (Mulberry32 Seed: 202)
    private val WIRING_ROTOR_II = intArrayOf(
        6, 5, 47, 31, 88, 93, 19, 15, 45, 25, 0, 8, 52, 65, 72, 49,
        4, 85, 79, 87, 95, 75, 2, 55, 48, 80, 29, 66, 41, 60, 50, 53,
        34, 71, 28, 76, 11, 81, 30, 39, 37, 23, 16, 90, 42, 1, 38, 62,
        67, 82, 54, 73, 3, 13, 77, 44, 64, 92, 68, 21, 63, 70, 69, 18,
        36, 10, 59, 89, 84, 61, 78, 83, 94, 35, 7, 58, 14, 27, 74, 86,
        40, 22, 57, 51, 56, 17, 9, 24, 32, 43, 26, 33, 46, 20, 91, 12
    )

    // Rotor III Wiring (Mulberry32 Seed: 303)
    private val WIRING_ROTOR_III = intArrayOf(
        88, 78, 90, 12, 37, 65, 25, 27, 92, 17, 71, 53, 20, 33, 87, 6,
        44, 86, 0, 11, 57, 83, 2, 13, 51, 79, 77, 73, 70, 10, 82, 8,
        81, 80, 38, 5, 48, 68, 22, 36, 26, 60, 30, 58, 16, 56, 4, 49,
        61, 72, 23, 84, 63, 9, 66, 7, 85, 74, 95, 14, 24, 39, 62, 64,
        46, 35, 67, 3, 94, 52, 21, 19, 69, 91, 54, 29, 34, 45, 43, 1,
        75, 18, 41, 55, 42, 50, 40, 15, 31, 28, 59, 93, 47, 32, 76, 89
    )

    // Rotor IV Wiring (Mulberry32 Seed: 404)
    private val WIRING_ROTOR_IV = intArrayOf(
        3, 49, 66, 48, 10, 60, 93, 5, 89, 92, 9, 73, 29, 67, 6, 86,
        21, 64, 88, 91, 18, 77, 35, 44, 81, 32, 84, 12, 47, 39, 0, 4,
        79, 55, 27, 75, 31, 74, 15, 11, 17, 53, 71, 59, 2, 46, 26, 37,
        61, 90, 69, 70, 38, 52, 63, 72, 94, 40, 76, 19, 83, 43, 8, 78,
        25, 16, 54, 7, 51, 80, 95, 20, 87, 42, 34, 28, 57, 50, 41, 58,
        62, 36, 23, 68, 1, 82, 24, 22, 30, 65, 56, 45, 14, 13, 85, 33
    )

    // Rotor V Wiring (Mulberry32 Seed: 505)
    private val WIRING_ROTOR_V = intArrayOf(
        72, 66, 30, 90, 88, 31, 86, 32, 8, 25, 28, 92, 6, 75, 64, 46,
        70, 81, 26, 63, 78, 61, 22, 83, 56, 73, 17, 45, 10, 39, 21, 0,
        89, 53, 38, 59, 43, 57, 54, 7, 13, 68, 51, 50, 84, 1, 11, 44,
        87, 58, 18, 41, 19, 12, 85, 67, 5, 52, 23, 34, 95, 60, 74, 77,
        48, 4, 94, 71, 29, 20, 40, 36, 27, 24, 55, 76, 91, 69, 2, 93,
        14, 16, 79, 65, 42, 15, 62, 37, 35, 47, 33, 80, 9, 49, 82, 3
    )

    // Reflector A Wiring (Mulberry32 Seed: 606 - Involution, zero fixed points)
    private val WIRING_REFLECTOR_A = intArrayOf(
        62, 38, 13, 40, 32, 76, 33, 84, 69, 56, 17, 85, 39, 2, 31, 59,
        18, 10, 16, 89, 41, 42, 70, 94, 65, 86, 58, 34, 53, 68, 82, 14,
        4, 6, 27, 52, 91, 83, 1, 12, 3, 20, 21, 49, 90, 47, 80, 45,
        63, 43, 51, 50, 35, 28, 71, 95, 9, 93, 26, 15, 77, 87, 0, 48,
        74, 24, 67, 66, 29, 8, 22, 54, 92, 79, 64, 81, 5, 60, 88, 73,
        46, 75, 30, 37, 7, 11, 25, 61, 78, 19, 44, 36, 72, 57, 23, 55
    )

    // Reflector B Wiring (Mulberry32 Seed: 707 - Involution, zero fixed points)
    private val WIRING_REFLECTOR_B = intArrayOf(
        60, 78, 61, 19, 37, 42, 85, 15, 91, 70, 66, 81, 62, 63, 92, 7,
        27, 25, 69, 3, 80, 64, 84, 59, 28, 17, 93, 16, 24, 76, 54, 74,
        48, 79, 82, 55, 57, 4, 88, 67, 94, 90, 5, 72, 87, 86, 53, 95,
        32, 68, 65, 58, 83, 46, 30, 35, 75, 36, 51, 23, 0, 2, 12, 13,
        21, 50, 10, 39, 49, 18, 9, 77, 43, 89, 31, 56, 29, 71, 1, 33,
        20, 11, 34, 52, 22, 6, 45, 44, 38, 73, 41, 8, 14, 26, 40, 47
    )

    val ROTOR_CATALOG: Map<RotorId, RotorDefinition> = mapOf(
        RotorId.I to RotorDefinition(
            id = RotorId.I,
            name = "Rotor I",
            wiring = WIRING_ROTOR_I,
            inverse = invertPermutation(WIRING_ROTOR_I),
            notch = 33, // 'A'
            notchGlyph = "'A'"
        ),
        RotorId.II to RotorDefinition(
            id = RotorId.II,
            name = "Rotor II",
            wiring = WIRING_ROTOR_II,
            inverse = invertPermutation(WIRING_ROTOR_II),
            notch = 65, // 'a'
            notchGlyph = "'a'"
        ),
        RotorId.III to RotorDefinition(
            id = RotorId.III,
            name = "Rotor III",
            wiring = WIRING_ROTOR_III,
            inverse = invertPermutation(WIRING_ROTOR_III),
            notch = 16, // '0'
            notchGlyph = "'0'"
        ),
        RotorId.IV to RotorDefinition(
            id = RotorId.IV,
            name = "Rotor IV",
            wiring = WIRING_ROTOR_IV,
            inverse = invertPermutation(WIRING_ROTOR_IV),
            notch = 0, // ' '
            notchGlyph = "[Space]"
        ),
        RotorId.V to RotorDefinition(
            id = RotorId.V,
            name = "Rotor V",
            wiring = WIRING_ROTOR_V,
            inverse = invertPermutation(WIRING_ROTOR_V),
            notch = 95, // '\n'
            notchGlyph = "[Enter]"
        )
    )

    val REFLECTOR_CATALOG: Map<ReflectorId, ReflectorDefinition> = mapOf(
        ReflectorId.A to ReflectorDefinition(
            id = ReflectorId.A,
            name = "Reflector A",
            wiring = WIRING_REFLECTOR_A
        ),
        ReflectorId.B to ReflectorDefinition(
            id = ReflectorId.B,
            name = "Reflector B",
            wiring = WIRING_REFLECTOR_B
        )
    )
}
