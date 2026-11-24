import { describe, it, expect } from 'vitest';
import { exportEnigmaPDF } from '../utils/exportPdf';

describe('exportEnigmaPDF', () => {
  it('generates a 3-page PDF with machine settings, input text, and output text', () => {
    const options = {
      rotors: {
        left: { id: 'I' as const, name: 'Rotor I', position: 0, ringSetting: 0, turnoverNotch: 34 },
        middle: { id: 'II' as const, name: 'Rotor II', position: 10, ringSetting: 5, turnoverNotch: 66 },
        right: { id: 'III' as const, name: 'Rotor III', position: 20, ringSetting: 15, turnoverNotch: 17 },
      },
      inputText: 'HELLO WORLD ENIGMA 96\nSecond line plaintext payload.',
      outputText: 'CIPHERTEXT PAYLOAD RESULT\nSecond line scrambled.',
    };

    // Run without autoSave in test environment
    const doc = exportEnigmaPDF(options, false);

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBe(3);
  });
});
