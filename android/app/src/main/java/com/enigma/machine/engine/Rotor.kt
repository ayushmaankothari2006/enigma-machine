package com.enigma.machine.engine

class Rotor(
    val definition: RotorDefinition,
    position: Int = 0,
    ringSetting: Int = 0,
    turnoverNotch: Int? = null
) {
    var position: Int = ((position % Alphabet.ALPHABET_SIZE) + Alphabet.ALPHABET_SIZE) % Alphabet.ALPHABET_SIZE
    var ringSetting: Int = ((ringSetting % Alphabet.ALPHABET_SIZE) + Alphabet.ALPHABET_SIZE) % Alphabet.ALPHABET_SIZE
    var turnoverNotch: Int = turnoverNotch?.let {
        ((it % Alphabet.ALPHABET_SIZE) + Alphabet.ALPHABET_SIZE) % Alphabet.ALPHABET_SIZE
    } ?: definition.notch

    val effectiveShift: Int
        get() {
            val diff = (position - ringSetting) % Alphabet.ALPHABET_SIZE
            return if (diff < 0) diff + Alphabet.ALPHABET_SIZE else diff
        }

    fun forward(x: Int): Int = forward(x, effectiveShift)

    fun forward(x: Int, shift: Int): Int {
        val pinIn = (x + shift) % Alphabet.ALPHABET_SIZE
        val pinMid = definition.wiring[pinIn]
        val diff = (pinMid - shift) % Alphabet.ALPHABET_SIZE
        return if (diff < 0) diff + Alphabet.ALPHABET_SIZE else diff
    }

    fun backward(x: Int): Int = backward(x, effectiveShift)

    fun backward(x: Int, shift: Int): Int {
        val pinIn = (x + shift) % Alphabet.ALPHABET_SIZE
        val pinMid = definition.inverse[pinIn]
        val diff = (pinMid - shift) % Alphabet.ALPHABET_SIZE
        return if (diff < 0) diff + Alphabet.ALPHABET_SIZE else diff
    }
}
