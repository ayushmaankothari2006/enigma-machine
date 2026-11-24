package com.enigma.machine.engine

class Reflector(val definition: ReflectorDefinition) {
    fun reflect(x: Int): Int {
        val norm = ((x % Alphabet.ALPHABET_SIZE) + Alphabet.ALPHABET_SIZE) % Alphabet.ALPHABET_SIZE
        return definition.wiring[norm]
    }
}
