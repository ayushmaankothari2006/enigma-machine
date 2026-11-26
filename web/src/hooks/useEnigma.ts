import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { RotorId, ReflectorId, EnigmaState, RotorConfig } from '../engine/types';
import { ALPHABET_SIZE } from '../engine/alphabet';
import { ROTOR_CATALOG } from '../engine/presets';
import { EnigmaMachine, SignalTrace, StepHistoryItem } from '../engine/enigma';
import type { LoadedPresetConfig } from '../services/presetsService';
import {
  createDefaultRotorSet,
  fetchRemoteWorkspaceState,
  generateRandomWorkspaceDefaults,
  readLocalWorkspaceState,
  upsertRemoteWorkspaceState,
  WorkspaceSnapshot,
  writeLocalWorkspaceState,
} from '../services/workspaceStateService';

const SAMPLE_TEXT = `Modern Enigma 96 Cryptographic System
---------------------------------------
Alpha: ABCDEFGHIJKLMNOPQRSTUVWXYZ
Numeric: 0123456789
Symbols: !@#$%^&*()_+{}[]:;"'<>?,./~
Multiline payload verification successful.`;

const REMOTE_SYNC_DEBOUNCE_MS = 400;

export function useEnigma(userId?: string, options?: { randomizeDefaults?: boolean }) {
  const randomizeDefaults = Boolean(options?.randomizeDefaults);
  const initialSnapshot = userId ? readLocalWorkspaceState(userId) : null;
  const fallbackDefaults = useMemo(
    () =>
      randomizeDefaults
        ? generateRandomWorkspaceDefaults()
        : { reflector: 'A' as ReflectorId, rotors: createDefaultRotorSet() },
    // Intentionally generated once per mount when no saved snapshot exists
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [reflector, setReflector] = useState<ReflectorId>(
    () => initialSnapshot?.reflector ?? fallbackDefaults.reflector
  );
  const [rotors, setRotors] = useState<{
    left: RotorConfig;
    middle: RotorConfig;
    right: RotorConfig;
  }>(() => initialSnapshot?.rotors ?? fallbackDefaults.rotors);
  const [initialPositions, setInitialPositions] = useState(() => {
    const baseRotors = initialSnapshot?.rotors ?? fallbackDefaults.rotors;
    return {
      left: baseRotors.left.position,
      middle: baseRotors.middle.position,
      right: baseRotors.right.position,
    };
  });
  const [inputText, setInputText] = useState(() => initialSnapshot?.inputText ?? '');

  // Track which userId owns the current in-memory state so switching accounts never leaks state
  const activeUserIdRef = useRef<string | undefined>(userId);
  const dirtySinceSwitchRef = useRef(false);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSnapshotRef = useRef<WorkspaceSnapshot | null>(null);
  const pendingUserIdRef = useRef<string | undefined>(undefined);

  const flushPendingRemoteSync = useCallback(() => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    const targetUserId = pendingUserIdRef.current;
    const snapshot = latestSnapshotRef.current;
    if (targetUserId && snapshot) {
      pendingUserIdRef.current = undefined;
      void upsertRemoteWorkspaceState(targetUserId, snapshot);
    }
  }, []);

  // Load saved local + remote state whenever userId changes (e.g., login or account switch)
  useEffect(() => {
    if (activeUserIdRef.current && activeUserIdRef.current !== userId) {
      flushPendingRemoteSync();
    }

    activeUserIdRef.current = userId;
    dirtySinceSwitchRef.current = false;

    if (!userId) {
      return;
    }

    const local = readLocalWorkspaceState(userId);
    if (local) {
      setReflector(local.reflector);
      setRotors(local.rotors);
      setInitialPositions({
        left: local.rotors.left.position,
        middle: local.rotors.middle.position,
        right: local.rotors.right.position,
      });
      setInputText(local.inputText);
    } else {
      const defaults = randomizeDefaults
        ? generateRandomWorkspaceDefaults()
        : { reflector: 'A' as ReflectorId, rotors: createDefaultRotorSet() };
      setReflector(defaults.reflector);
      setRotors(defaults.rotors);
      setInitialPositions({
        left: defaults.rotors.left.position,
        middle: defaults.rotors.middle.position,
        right: defaults.rotors.right.position,
      });
      setInputText('');
    }

    let cancelled = false;

    void fetchRemoteWorkspaceState(userId).then((remote) => {
      if (cancelled || !remote || dirtySinceSwitchRef.current) return;
      if (!local || remote.updatedAt >= local.updatedAt) {
        setReflector(remote.reflector);
        setRotors(remote.rotors);
        setInitialPositions({
          left: remote.rotors.left.position,
          middle: remote.rotors.middle.position,
          right: remote.rotors.right.position,
        });
        setInputText(remote.inputText);
        writeLocalWorkspaceState(userId, remote);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userId, randomizeDefaults, flushPendingRemoteSync]);

  // Flush any pending remote write on unmount
  useEffect(() => {
    return () => {
      flushPendingRemoteSync();
    };
  }, [flushPendingRemoteSync]);

  const markUserEdited = useCallback(() => {
    dirtySinceSwitchRef.current = true;
  }, []);

  // Persist user's text & rotor settings per userId whenever edited
  useEffect(() => {
    if (!userId || activeUserIdRef.current !== userId || !dirtySinceSwitchRef.current) {
      return;
    }

    const snapshot: WorkspaceSnapshot = {
      inputText,
      reflector,
      rotors,
      updatedAt: Date.now(),
    };

    writeLocalWorkspaceState(userId, snapshot);
    latestSnapshotRef.current = snapshot;
    pendingUserIdRef.current = userId;

    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
    }
    pendingTimerRef.current = setTimeout(() => {
      pendingTimerRef.current = null;
      pendingUserIdRef.current = undefined;
      void upsertRemoteWorkspaceState(userId, snapshot);
    }, REMOTE_SYNC_DEBOUNCE_MS);
  }, [userId, inputText, reflector, rotors]);

  // Real-time synchronous stateless re-encryption using the full EnigmaMachine engine
  const encryptionResult = useMemo(() => {
    const machine = new EnigmaMachine({
      reflector,
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
  }, [inputText, rotors, reflector]);

  const outputText = encryptionResult.ciphertext;
  const lastTrace: SignalTrace | null = encryptionResult.lastTrace;
  const history: StepHistoryItem[] = encryptionResult.history;

  const setTurnoverNotch = useCallback(
    (slot: 'left' | 'middle' | 'right', notch: number) => {
      markUserEdited();
      const next = ((notch % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE;
      setRotors((prev) => ({
        ...prev,
        [slot]: { ...prev[slot], turnoverNotch: next },
      }));
    },
    [markUserEdited]
  );

  const setRotorModel = useCallback(
    (slot: 'left' | 'middle' | 'right', id: RotorId) => {
      markUserEdited();
      setRotors((prev) => ({
        ...prev,
        [slot]: {
          ...prev[slot],
          id,
          name: ROTOR_CATALOG[id].name,
        },
      }));
    },
    [markUserEdited]
  );

  const stepPosition = useCallback(
    (slot: 'left' | 'middle' | 'right', delta: number) => {
      markUserEdited();
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
    },
    [markUserEdited]
  );

  const setPosition = useCallback(
    (slot: 'left' | 'middle' | 'right', position: number) => {
      markUserEdited();
      const next = ((position % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE;
      setRotors((prev) => ({
        ...prev,
        [slot]: { ...prev[slot], position: next },
      }));
      setInitialPositions((prev) => ({
        ...prev,
        [slot]: next,
      }));
    },
    [markUserEdited]
  );

  const stepRing = useCallback(
    (slot: 'left' | 'middle' | 'right', delta: number) => {
      markUserEdited();
      setRotors((prev) => {
        const current = prev[slot].ringSetting;
        const next = ((current + delta) % ALPHABET_SIZE + ALPHABET_SIZE) % ALPHABET_SIZE;
        return {
          ...prev,
          [slot]: { ...prev[slot], ringSetting: next },
        };
      });
    },
    [markUserEdited]
  );

  const resetPositionsToDefaults = useCallback(() => {
    markUserEdited();
    setRotors((prev) => ({
      left: { ...prev.left, position: initialPositions.left },
      middle: { ...prev.middle, position: initialPositions.middle },
      right: { ...prev.right, position: initialPositions.right },
    }));
  }, [initialPositions, markUserEdited]);

  const randomizeSettings = useCallback(() => {
    markUserEdited();
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
  }, [markUserEdited]);

  const setInputTextWithSync = useCallback(
    (text: string) => {
      markUserEdited();
      setInputText(text);
    },
    [markUserEdited]
  );

  const setReflectorWithSync = useCallback(
    (nextReflector: ReflectorId) => {
      markUserEdited();
      setReflector(nextReflector);
    },
    [markUserEdited]
  );

  const clearInput = useCallback(() => {
    markUserEdited();
    setInputText('');
  }, [markUserEdited]);

  const loadSampleText = useCallback(() => {
    markUserEdited();
    setInputText(SAMPLE_TEXT);
  }, [markUserEdited]);

  const useOutputAsInput = useCallback(() => {
    markUserEdited();
    // Decipher workflow: take output, put into input, and restore initial positions
    setInputText(outputText);
    resetPositionsToDefaults();
  }, [outputText, resetPositionsToDefaults, markUserEdited]);

  const loadPreset = useCallback(
    (preset: LoadedPresetConfig) => {
      markUserEdited();
      setReflector(preset.reflector);
      setRotors({
        left: { ...preset.rotors.left },
        middle: { ...preset.rotors.middle },
        right: { ...preset.rotors.right },
      });
      setInitialPositions({
        left: preset.rotors.left.position,
        middle: preset.rotors.middle.position,
        right: preset.rotors.right.position,
      });
    },
    [markUserEdited]
  );

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
    setReflector: setReflectorWithSync,
    setRotorModel,
    stepPosition,
    setPosition,
    stepRing,
    setTurnoverNotch,
    setInputText: setInputTextWithSync,
    resetPositionsToDefaults,
    randomizeSettings,
    clearInput,
    loadSampleText,
    useOutputAsInput,
    loadPreset,
  };
}

export type UseEnigmaReturn = ReturnType<typeof useEnigma>;
