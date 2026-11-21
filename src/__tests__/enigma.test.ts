import { describe, it, expect } from 'vitest';
import { ALPHABET_CHARS, ALPHABET_SIZE, formatGlyph, sanitizeInput } from '../engine/alphabet';
import { ROTOR_CATALOG, REFLECTOR_CATALOG } from '../engine/presets';
import { Rotor } from '../engine/rotor';
import { Reflector } from '../engine/reflector';
import { EnigmaMachine, stepRotors } from '../engine/enigma';

describe('Modern Enigma 96 Cryptographic Engine', () => {
  describe('Alphabet & Glyph Formatting', () => {
    it('has exactly 96 characters', () => {
      expect(ALPHABET_CHARS).toHaveLength(96);
      expect(ALPHABET_SIZE).toBe(96);
      expect(ALPHABET_CHARS[0]).toBe(' ');
      expect(ALPHABET_CHARS[1]).toBe('!');
      expect(ALPHABET_CHARS[94]).toBe('~');
      expect(ALPHABET_CHARS[95]).toBe('\n');
    });

    it('formats glyphs for special non-printable indices', () => {
      expect(formatGlyph(0)).toBe('[Space]');
      expect(formatGlyph(95)).toBe('[Enter]');
      expect(formatGlyph(33)).toBe('A');
    });

    it('sanitizes input and normalizes CRLF', () => {
      expect(sanitizeInput('Hello\r\nWorld')).toBe('Hello\nWorld');
      expect(sanitizeInput('Emoji 😊 & tabs \t are stripped')).toBe('Emoji  & tabs  are stripped');
    });
  });

  describe('Reflector Involution & Zero Fixed Points', () => {
    (['A', 'B'] as const).forEach((refId) => {
      it(`Reflector ${refId} has zero fixed points and is an involution`, () => {
        const refDef = REFLECTOR_CATALOG[refId];
        const reflector = new Reflector(refDef);

        for (let x = 0; x < 96; x++) {
          const mapped = reflector.reflect(x);
          // Zero fixed points (no contact maps to itself)
          expect(mapped).not.toBe(x);
          // Strict involution (paired contacts)
          expect(reflector.reflect(mapped)).toBe(x);
        }
      });
    });
  });

  describe('Rotor Wiring & Shift Mechanics', () => {
    (['I', 'II', 'III', 'IV', 'V'] as const).forEach((rotorId) => {
      it(`Rotor ${rotorId} backward pass perfectly reverses forward pass across all positions and rings`, () => {
        const rotorDef = ROTOR_CATALOG[rotorId];
        // Test across multiple positions and ring settings
        const testPositions = [0, 15, 33, 65, 95];
        const testRings = [0, 5, 42, 95];

        for (const pos of testPositions) {
          for (const ring of testRings) {
            const rotor = new Rotor(rotorDef, pos, ring);
            for (let x = 0; x < 96; x++) {
              const fwd = rotor.forward(x);
              const bwd = rotor.backward(fwd);
              expect(bwd).toBe(x);
            }
          }
        }
      });
    });
  });

  describe('Authentic Double-Stepping Pawl Mechanism', () => {
    it('demonstrates middle rotor double-stepping anomaly', () => {
      // Setup middle rotor near notch (Rotor II notch is 65 / 'a')
      // and right rotor near notch (Rotor III notch is 16 / '0')
      const notch2 = 65;
      const notch3 = 16;

      // 1. Right rotor not at notch, middle not at notch
      const step1 = stepRotors(0, 64, 15, notch2, notch3);
      expect(step1.positions).toEqual([0, 64, 16]); // only R3 steps

      // 2. Right rotor IS now at notch 16! Next step should turn R2
      const step2 = stepRotors(0, 64, 16, notch2, notch3);
      expect(step2.positions).toEqual([0, 65, 17]); // R3 and R2 step
      expect(step2.pawlAction).toContain('Middle Turnover');

      // 3. Middle rotor is now at its notch 65!
      // In historical Enigma, middle rotor steps AGAIN and steps left rotor (Double-step anomaly!)
      const step3 = stepRotors(0, 65, 17, notch2, notch3);
      expect(step3.positions).toEqual([1, 66, 18]); // Both R1 and R2 step with R3!
      expect(step3.pawlAction).toContain('Double-Step Anomaly');
    });
  });

  describe('End-to-End Reciprocity E(E(M)) = M', () => {
    it('encrypts and reciprocally decrypts complex multiline text', () => {
      const plaintext = 'Modern Enigma 96!\nSpaces and numbers: 1 2 3.\nSymbols: ~!@#$%^&*()_+{}|:<>?';

      const config = {
        reflector: 'A' as const,
        rotors: {
          left: { id: 'I' as const, position: 10, ringSetting: 5 },
          middle: { id: 'II' as const, position: 20, ringSetting: 15 },
          right: { id: 'III' as const, position: 30, ringSetting: 25 },
        },
      };

      // 1. Encrypt plaintext -> ciphertext
      const machineEncrypt = new EnigmaMachine(config);
      const encResult = machineEncrypt.processText(plaintext);
      expect(encResult.ciphertext).not.toBe(plaintext);
      expect(encResult.ciphertext.length).toBe(plaintext.length);

      // 2. Encrypt ciphertext with identical starting settings -> restored plaintext
      const machineDecrypt = new EnigmaMachine(config);
      const decResult = machineDecrypt.processText(encResult.ciphertext);
      expect(decResult.ciphertext).toBe(plaintext);
    });

    it('never enciphers any character to itself on a single step', () => {
      const char = 'A';
      const config = {
        reflector: 'B' as const,
        rotors: {
          left: { id: 'IV' as const, position: 0, ringSetting: 0 },
          middle: { id: 'V' as const, position: 0, ringSetting: 0 },
          right: { id: 'I' as const, position: 0, ringSetting: 0 },
        },
      };
      const machine = new EnigmaMachine(config);
      const res = machine.encryptChar(char);
      expect(res.outChar).not.toBe(char);
    });
  });
});
