import { describe, it, expect } from 'vitest';
import { charToIndex, indexToChar, formatGlyph, sanitizeInput, ALPHABET_SIZE } from '../engine/alphabet';
import { Rotor } from '../engine/rotor';
import { ROTOR_CATALOG } from '../engine/presets';
import { EnigmaMachine } from '../engine/enigma';

describe('Error Handling, Edge Cases & Performance Verification', () => {
  describe('Alphabet Boundary & Invalid Input Handling', () => {
    it('handles out-of-range and negative indices safely with modulo arithmetic', () => {
      expect(indexToChar(-1)).toBe('\n'); // wraps to 95
      expect(indexToChar(96)).toBe(' ');  // wraps to 0
      expect(indexToChar(192)).toBe(' '); // wraps to 0
      expect(formatGlyph(-1)).toBe('[Enter]');
      expect(formatGlyph(96)).toBe('[Space]');
      expect(formatGlyph(-96)).toBe('[Space]');
    });

    it('handles charToIndex for empty strings, multi-character strings, and non-ASCII', () => {
      expect(charToIndex('')).toBe(-1);
      expect(charToIndex('ab')).toBe(-1);
      expect(charToIndex('🚀')).toBe(-1);
      expect(charToIndex('é')).toBe(-1);
      expect(charToIndex('\t')).toBe(-1);
      expect(charToIndex('\0')).toBe(-1);
      expect(charToIndex(' ')).toBe(0);
      expect(charToIndex('!')).toBe(1);
      expect(charToIndex('~')).toBe(94);
      expect(charToIndex('\n')).toBe(95);
    });

    it('sanitizes edge inputs (nullish, only whitespace, mixed CRLF, emojis)', () => {
      // @ts-expect-error - testing undefined / null runtime safety
      expect(sanitizeInput(undefined)).toBe('');
      // @ts-expect-error - testing null runtime safety
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput('   \r\n\r\n   ')).toBe('   \n\n   ');
      expect(sanitizeInput('Emoji: 🚀🎉🔥 & Accents: éàç')).toBe('Emoji:  & Accents: ');
    });
  });

  describe('Rotor Boundary & Negative Stepping', () => {
    it('normalizes negative and oversized positions, rings, and notches', () => {
      const rotor = new Rotor(ROTOR_CATALOG['I'], -1, -5, -10);
      expect(rotor.position).toBe(95);
      expect(rotor.ringSetting).toBe(91);
      expect(rotor.turnoverNotch).toBe(86);
      expect(rotor.effectiveShift).toBeGreaterThanOrEqual(0);
      expect(rotor.effectiveShift).toBeLessThan(ALPHABET_SIZE);
    });

    it('preserves forward and backward bijactive mapping under extreme values', () => {
      const rotor = new Rotor(ROTOR_CATALOG['III'], 960, 192, 288);
      expect(rotor.position).toBe(0);
      expect(rotor.ringSetting).toBe(0);
      expect(rotor.turnoverNotch).toBe(0);

      for (let i = 0; i < ALPHABET_SIZE; i++) {
        const fwd = rotor.forward(i);
        expect(fwd).toBeGreaterThanOrEqual(0);
        expect(fwd).toBeLessThan(ALPHABET_SIZE);
        expect(rotor.backward(fwd)).toBe(i);
      }
    });
  });

  describe('Bulk Payload Performance & Reciprocity Stress Test', () => {
    it('enciphers and decipher a 5,000-character payload with perfect reciprocity and high speed', () => {
      // Generate 5,000 character pseudo-random valid payload
      let payload = '';
      const sampleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 !?@#$%^&*()_+-=[]{}|;:,.<>\n';
      for (let i = 0; i < 5000; i++) {
        payload += sampleChars[i % sampleChars.length];
      }

      const config = {
        reflector: 'A' as const,
        rotors: {
          left: { id: 'I' as const, position: 42, ringSetting: 13, turnoverNotch: 34 },
          middle: { id: 'II' as const, position: 17, ringSetting: 55, turnoverNotch: 66 },
          right: { id: 'III' as const, position: 88, ringSetting: 91, turnoverNotch: 17 },
        },
      };

      const startTime = performance.now();
      const machine1 = new EnigmaMachine(config);
      const enc = machine1.processText(payload);
      const encryptTime = performance.now() - startTime;

      expect(enc.ciphertext).toHaveLength(payload.length);
      expect(enc.ciphertext).not.toBe(payload);
      // High performance verification: 5,000 characters should encrypt well under 1 second
      expect(encryptTime).toBeLessThan(1000);

      // Decipher with identical starting key
      const machine2 = new EnigmaMachine(config);
      const dec = machine2.processText(enc.ciphertext);
      expect(dec.ciphertext).toBe(payload);
    });

    it('verifies zero self-encipherment across all 96 alphabet characters on initial keystroke', () => {
      const config = {
        reflector: 'A' as const,
        rotors: {
          left: { id: 'I' as const, position: 0, ringSetting: 0 },
          middle: { id: 'II' as const, position: 0, ringSetting: 0 },
          right: { id: 'III' as const, position: 0, ringSetting: 0 },
        },
      };

      for (let i = 0; i < ALPHABET_SIZE; i++) {
        const machine = new EnigmaMachine(config);
        const char = indexToChar(i);
        const res = machine.encryptChar(char);
        expect(res.outChar).not.toBe(char);
      }
    });
  });
});
