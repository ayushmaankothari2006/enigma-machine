package com.enigma.machine.engine

enum class RotorId {
    I, II, III, IV, V
}

enum class ReflectorId {
    A, B
}

enum class RotorSlot {
    LEFT, MIDDLE, RIGHT
}

data class RotorDefinition(
    val id: RotorId,
    val name: String,
    val wiring: IntArray,
    val inverse: IntArray,
    val notch: Int,
    val notchGlyph: String
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        other as RotorDefinition
        return id == other.id &&
                name == other.name &&
                wiring.contentEquals(other.wiring) &&
                inverse.contentEquals(other.inverse) &&
                notch == other.notch &&
                notchGlyph == other.notchGlyph
    }

    override fun hashCode(): Int {
        var result = id.hashCode()
        result = 31 * result + name.hashCode()
        result = 31 * result + wiring.contentHashCode()
        result = 31 * result + inverse.contentHashCode()
        result = 31 * result + notch
        result = 31 * result + notchGlyph.hashCode()
        return result
    }
}

data class ReflectorDefinition(
    val id: ReflectorId,
    val name: String,
    val wiring: IntArray
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        other as ReflectorDefinition
        return id == other.id && name == other.name && wiring.contentEquals(other.wiring)
    }

    override fun hashCode(): Int {
        var result = id.hashCode()
        result = 31 * result + name.hashCode()
        result = 31 * result + wiring.contentHashCode()
        return result
    }
}

data class RotorConfig(
    val id: RotorId,
    val name: String,
    val position: Int = 0,       // 0 to 95
    val ringSetting: Int = 0,    // 0 to 95 (displayed 1 to 96)
    val turnoverNotch: Int = 0   // 0 to 95
) {
    val normalizedPosition: Int = ((position % Alphabet.ALPHABET_SIZE) + Alphabet.ALPHABET_SIZE) % Alphabet.ALPHABET_SIZE
    val normalizedRingSetting: Int = ((ringSetting % Alphabet.ALPHABET_SIZE) + Alphabet.ALPHABET_SIZE) % Alphabet.ALPHABET_SIZE
    val normalizedTurnoverNotch: Int = ((turnoverNotch % Alphabet.ALPHABET_SIZE) + Alphabet.ALPHABET_SIZE) % Alphabet.ALPHABET_SIZE

    val displayPosition: Int get() = normalizedPosition + 1
    val displayRing: Int get() = normalizedRingSetting + 1
}

data class SignalTrace(
    val inChar: Char,
    val inIdx: Int,
    val posBefore: Triple<Int, Int, Int>,
    val posAfter: Triple<Int, Int, Int>,
    val pawlAction: String,
    val shift3: Int,
    val shift2: Int,
    val shift1: Int,
    val r3Fwd: Int,
    val r2Fwd: Int,
    val r1Fwd: Int,
    val refIdx: Int,
    val r1Bwd: Int,
    val r2Bwd: Int,
    val r3Bwd: Int,
    val outChar: Char,
    val outIdx: Int
)

data class StepHistoryItem(
    val stepNum: Int,
    val chIn: Char,
    val posBefore: Triple<Int, Int, Int>,
    val pawlAction: String,
    val posAfter: Triple<Int, Int, Int>,
    val chOut: Char
)

data class EncryptResult(
    val ciphertext: String,
    val finalPositions: Triple<Int, Int, Int>,
    val lastTrace: SignalTrace? = null,
    val history: List<StepHistoryItem> = emptyList(),
    val calculationTimeNanos: Long = 0L
)

data class RotorSlotConfig(
    val id: RotorId,
    val position: Int = 0,
    val ringSetting: Int = 0,
    val turnoverNotch: Int? = null
) {
    val normalizedPosition: Int = ((position % Alphabet.ALPHABET_SIZE) + Alphabet.ALPHABET_SIZE) % Alphabet.ALPHABET_SIZE
    val normalizedRingSetting: Int = ((ringSetting % Alphabet.ALPHABET_SIZE) + Alphabet.ALPHABET_SIZE) % Alphabet.ALPHABET_SIZE
    val normalizedTurnoverNotch: Int? = turnoverNotch?.let {
        ((it % Alphabet.ALPHABET_SIZE) + Alphabet.ALPHABET_SIZE) % Alphabet.ALPHABET_SIZE
    }
}

data class ConfigurationValidation(
    val isValid: Boolean = true,
    val warnings: List<String> = emptyList()
)

data class EnigmaMachineConfig(
    val reflector: ReflectorId = ReflectorId.A,
    val leftRotor: RotorSlotConfig,
    val middleRotor: RotorSlotConfig,
    val rightRotor: RotorSlotConfig
) {
    fun validate(): ConfigurationValidation {
        val warnings = mutableListOf<String>()
        val rotorIds = listOf(leftRotor.id, middleRotor.id, rightRotor.id)
        val duplicates = rotorIds.groupingBy { it }.eachCount().filter { it.value > 1 }
        if (duplicates.isNotEmpty()) {
            val names = duplicates.keys.joinToString(", ") { "Rotor $it" }
            warnings.add("Duplicate model ($names) selected across multiple bays.")
        }
        return ConfigurationValidation(
            isValid = true,
            warnings = warnings
        )
    }
}
