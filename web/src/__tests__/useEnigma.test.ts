// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEnigma } from '../hooks/useEnigma';
import { ALPHABET_SIZE } from '../engine/alphabet';

describe('useEnigma Hook State & Control Integration', () => {
  it('initializes with default rotors and empty input', () => {
    const { result } = renderHook(() => useEnigma());

    expect(result.current.inputText).toBe('');
    expect(result.current.outputText).toBe('');
    expect(result.current.rotors.left.position).toBe(0);
    expect(result.current.rotors.middle.position).toBe(0);
    expect(result.current.rotors.right.position).toBe(0);
  });

  it('steps positions forward and backward with wrapping at 0 and 95', () => {
    const { result } = renderHook(() => useEnigma());

    // Step right rotor forward by 1
    act(() => {
      result.current.stepPosition('right', 1);
    });
    expect(result.current.rotors.right.position).toBe(1);

    // Step right rotor backward by 2 (wraps to 95)
    act(() => {
      result.current.stepPosition('right', -2);
    });
    expect(result.current.rotors.right.position).toBe(95);

    // Step forward by 1 (wraps back to 0)
    act(() => {
      result.current.stepPosition('right', 1);
    });
    expect(result.current.rotors.right.position).toBe(0);
  });

  it('steps rings forward and backward with wrapping', () => {
    const { result } = renderHook(() => useEnigma());

    act(() => {
      result.current.stepRing('middle', -1);
    });
    expect(result.current.rotors.middle.ringSetting).toBe(95);

    act(() => {
      result.current.stepRing('middle', 1);
    });
    expect(result.current.rotors.middle.ringSetting).toBe(0);
  });

  it('randomizeSettings sets valid positions, rings, and notches within 0..95 range', () => {
    const { result } = renderHook(() => useEnigma());

    act(() => {
      result.current.randomizeSettings();
    });

    (['left', 'middle', 'right'] as const).forEach((slot) => {
      const rotor = result.current.rotors[slot];
      expect(rotor.position).toBeGreaterThanOrEqual(0);
      expect(rotor.position).toBeLessThan(ALPHABET_SIZE);
      expect(rotor.ringSetting).toBeGreaterThanOrEqual(0);
      expect(rotor.ringSetting).toBeLessThan(ALPHABET_SIZE);
      expect(rotor.turnoverNotch).toBeGreaterThanOrEqual(0);
      expect(rotor.turnoverNotch).toBeLessThan(ALPHABET_SIZE);
    });
  });

  it('supports sample loading, clearing, and reciprocal decipherment with useOutputAsInput', () => {
    const { result } = renderHook(() => useEnigma());

    // Load sample text
    act(() => {
      result.current.loadSampleText();
    });
    expect(result.current.inputText.length).toBeGreaterThan(0);
    const originalPlaintext = result.current.inputText;
    const cipherResult = result.current.outputText;
    expect(cipherResult).not.toBe(originalPlaintext);

    // Use output as input (decipher)
    act(() => {
      result.current.useOutputAsInput();
    });
    // Now input is the ciphertext
    expect(result.current.inputText).toBe(cipherResult);
    // And output immediately deciphers back to the original plaintext!
    expect(result.current.outputText).toBe(originalPlaintext);

    // Clear input
    act(() => {
      result.current.clearInput();
    });
    expect(result.current.inputText).toBe('');
    expect(result.current.outputText).toBe('');
  });

  it('pre-randomizes initial rotor positions, rings, and notches when randomizeDefaults is enabled', () => {
    const { result } = renderHook(() => useEnigma(undefined, { randomizeDefaults: true }));

    (['left', 'middle', 'right'] as const).forEach((slot) => {
      const rotor = result.current.rotors[slot];
      expect(rotor.position).toBeGreaterThanOrEqual(0);
      expect(rotor.position).toBeLessThan(ALPHABET_SIZE);
      expect(rotor.ringSetting).toBeGreaterThanOrEqual(0);
      expect(rotor.ringSetting).toBeLessThan(ALPHABET_SIZE);
      expect(rotor.turnoverNotch).toBeGreaterThanOrEqual(0);
      expect(rotor.turnoverNotch).toBeLessThan(ALPHABET_SIZE);
    });
    expect(['A', 'B']).toContain(result.current.reflector);
  });
});
