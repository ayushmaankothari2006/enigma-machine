import { useState, useCallback, useMemo } from 'react';
import { RotorId, ReflectorId, EnigmaState, RotorConfig } from '../engine/types';
import { ALPHABET_SIZE } from '../engine/alphabet';
import { ROTOR_CATALOG } from '../engine/presets';
import { EnigmaMachine, SignalTrace, StepHistoryItem } from '../engine/enigma';

const SAMPLE_TEXT = `Modern Enigma 96 Cryptographic System
---------------------------------------
Alpha: ABCDEFGHIJKLMNOPQRSTUVWXYZ
Numeric: 0123456789
Symbols: !@#$%^&*()_+{}[]:;"'<>?,./~
Multiline payload verification successful.`;

const DEFAULT_ROTORS: { left: RotorConfig; middle: RotorConfig; right: RotorConfig } = {
  left: { id: 'I', name: 'Rotor I', position: 0, ringSetting: 0, turnoverNotch: ROTOR_CATALOG['I'].notch },
  middle: { id: 'II', name: 'Rotor II', position: 0, ringSetting: 0, turnoverNotch: ROTOR_CATALOG['II'].notch },
  right: { id: 'III', name: 'Rotor III', position: 0, ringSetting: 0, turnoverNotch: ROTOR_CATALOG['III'].notch },
};

export function useEnigma() {
  const [reflector, setReflector] = useState<ReflectorId>('A');
  const [rotors, setRotors] = useState(DEFAULT_ROTORS);
  const [initialPositions, setInitialPositions] = useState({ left: 0, middle: 0, right: 0 });
  const [inputText, setInputText] = useState('');

  // Real-time synchronous stateless re-encryption using the full EnigmaMachine engine
  const encryptionResult = useMemo(() => {
    const machine = new EnigmaMachine({
      reflector: 'A',
      rotors: {
        left: {
          id: rotors.left.id,
          position: rotors.left.position,
          ringSetting: rotors.left.ringSetting,
          turnoverNotch: rotors.left.turnoverNotch,
        },
        middle: {
          id: rotors.middle.id,
          position: rotors.middle.position,
          ringSetting: rotors.middle.ringSetting,
          turnoverNotch: rotors.middle.turnoverNotch,
        },
        right: {
          id: rotors.right.id,
          position: rotors.right.position,
          ringSetting: rotors.right.ringSetting,
          turnoverNotch: rotors.right.turnoverNotch,
        },
      },
    });

    return machine.processText(inputText);
  }, [inputText, rotors]);

  const outputText = encryptionResult.ciphertext;
  const lastTrace: SignalTrace | null = encryptionResult.lastTrace;
  const history: StepHistoryItem[] = encryptionResult.history;

  const setTurnoverNotch = useCallback((slot: 'left' | 'middle' | 'right', notch: number) => {
    const next = ((notch % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE;
    setRotors((prev) => ({
      ...prev,
      [slot]: { ...prev[slot], turnoverNotch: next },
    }));
  }, []);

  const setRotorModel = useCallback((slot: 'left' | 'middle' | 'right', id: RotorId) => {
    setRotors((prev) => ({
      ...prev,
      [slot]: {
        ...prev[slot],
        id,
        name: ROTOR_CATALOG[id].name,
      },
    }));
  }, []);

  const stepPosition = useCallback((slot: 'left' | 'middle' | 'right', delta: number) => {
    setRotors((prev) => {
      const current = prev[slot].position;
      const next = ((current + delta) % ALPHABET_SIZE + ALPHABET_SIZE) % ALPHABET_SIZE;
      return {
        ...prev,
        [slot]: { ...prev[slot], position: next },
      };
    });
    setInitialPositions((prev) => {
      const current = prev[slot];
      const next = ((current + delta) % ALPHABET_SIZE + ALPHABET_SIZE) % ALPHABET_SIZE;
      return { ...prev, [slot]: next };
    });
  }, []);

  const setPosition = useCallback((slot: 'left' | 'middle' | 'right', position: number) => {
    const next = ((position % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE;
    setRotors((prev) => ({
      ...prev,
      [slot]: { ...prev[slot], position: next },
    }));
    setInitialPositions((prev) => ({
      ...prev,
      [slot]: next,
    }));
  }, []);

  const stepRing = useCallback((slot: 'left' | 'middle' | 'right', delta: number) => {
    setRotors((prev) => {
      const current = prev[slot].ringSetting;
      const next = ((current + delta) % ALPHABET_SIZE + ALPHABET_SIZE) % ALPHABET_SIZE;
      return {
        ...prev,
        [slot]: { ...prev[slot], ringSetting: next },
      };
    });
  }, []);

  const resetPositionsToDefaults = useCallback(() => {
    setRotors((prev) => ({
      left: { ...prev.left, position: initialPositions.left },
      middle: { ...prev.middle, position: initialPositions.middle },
      right: { ...prev.right, position: initialPositions.right },
    }));
  }, [initialPositions]);

  const randomizeSettings = useCallback(() => {
    const p1 = Math.floor(Math.random() * ALPHABET_SIZE);
    const p2 = Math.floor(Math.random() * ALPHABET_SIZE);
    const p3 = Math.floor(Math.random() * ALPHABET_SIZE);
    const r1 = Math.floor(Math.random() * ALPHABET_SIZE);
    const r2 = Math.floor(Math.random() * ALPHABET_SIZE);
    const r3 = Math.floor(Math.random() * ALPHABET_SIZE);
    const n1 = Math.floor(Math.random() * ALPHABET_SIZE);
    const n2 = Math.floor(Math.random() * ALPHABET_SIZE);
    const n3 = Math.floor(Math.random() * ALPHABET_SIZE);

    setRotors((prev) => ({
      left: { ...prev.left, position: p1, ringSetting: r1, turnoverNotch: n1 },
      middle: { ...prev.middle, position: p2, ringSetting: r2, turnoverNotch: n2 },
      right: { ...prev.right, position: p3, ringSetting: r3, turnoverNotch: n3 },
    }));
    setInitialPositions({ left: p1, middle: p2, right: p3 });
  }, []);

  const clearInput = useCallback(() => {
    setInputText('');
  }, []);

  const loadSampleText = useCallback(() => {
    setInputText(SAMPLE_TEXT);
  }, []);

  const useOutputAsInput = useCallback(() => {
    // Decipher workflow: take output, put into input, and restore initial positions
    setInputText(outputText);
    resetPositionsToDefaults();
  }, [outputText, resetPositionsToDefaults]);

  const state: EnigmaState = {
    reflector,
    rotors,
    inputText,
    outputText,
    initialPositions,
  };

  return {
    state,
    reflector,
    rotors,
    inputText,
    outputText,
    lastTrace,
    history,
    setReflector,
    setRotorModel,
    stepPosition,
    setPosition,
    stepRing,
    setTurnoverNotch,
    setInputText,
    resetPositionsToDefaults,
    randomizeSettings,
    clearInput,
    loadSampleText,
    useOutputAsInput,
  };
}

export type UseEnigmaReturn = ReturnType<typeof useEnigma>;
