import { ALPHABET_CHARS, ALPHABET_SIZE, sanitizeInput, charToIndex } from './alphabet';
import { RotorId, ReflectorId } from './types';
import { ROTOR_CATALOG, REFLECTOR_CATALOG } from './presets';
import { Rotor } from './rotor';
import { Reflector } from './reflector';

export interface SignalTrace {
  inChar: string;
  inIdx: number;
  posBefore: [number, number, number];
  posAfter: [number, number, number];
  pawlAction: string;
  shift3: number;
  shift2: number;
  shift1: number;
  r3Fwd: number;
  r2Fwd: number;
  r1Fwd: number;
  refIdx: number;
  r1Bwd: number;
  r2Bwd: number;
  r3Bwd: number;
  outChar: string;
  outIdx: number;
}

export interface StepHistoryItem {
  stepNum: number;
  chIn: string;
  posBefore: [number, number, number];
  pawlAction: string;
  posAfter: [number, number, number];
  chOut: string;
}

export interface EncryptResult {
  ciphertext: string;
  finalPositions: [number, number, number];
  lastTrace: SignalTrace | null;
  history: StepHistoryItem[];
}

export interface EnigmaMachineConfig {
  reflector?: ReflectorId;
  rotors: {
    left: { id: RotorId; position: number; ringSetting: number; turnoverNotch?: number };
    middle: { id: RotorId; position: number; ringSetting: number; turnoverNotch?: number };
    right: { id: RotorId; position: number; ringSetting: number; turnoverNotch?: number };
  };
}

export function stepRotors(
  pos1: number,
  pos2: number,
  pos3: number,
  notch2: number,
  notch3: number
): {
  positions: [number, number, number];
  pawlAction: string;
  r2AtNotch: boolean;
  r3AtNotch: boolean;
} {
  const r2AtNotch = pos2 === notch2;
  const r3AtNotch = pos3 === notch3;

  let newPos1 = pos1;
  let newPos2 = pos2;
  let newPos3 = (pos3 + 1) % ALPHABET_SIZE;
  let pawlAction = 'Normal Fast (R3)';

  if (r2AtNotch) {
    newPos1 = (pos1 + 1) % ALPHABET_SIZE;
    newPos2 = (pos2 + 1) % ALPHABET_SIZE;
    pawlAction = 'Double-Step Anomaly (R2+R1+R3)';
  } else if (r3AtNotch) {
    newPos2 = (pos2 + 1) % ALPHABET_SIZE;
    pawlAction = 'Middle Turnover (R2+R3)';
  }

  return {
    positions: [newPos1, newPos2, newPos3],
    pawlAction,
    r2AtNotch,
    r3AtNotch,
  };
}

export class EnigmaMachine {
  r1: Rotor;
  r2: Rotor;
  r3: Rotor;
  reflector: Reflector;

  constructor(config: EnigmaMachineConfig) {
    this.r1 = new Rotor(
      ROTOR_CATALOG[config.rotors.left.id],
      config.rotors.left.position,
      config.rotors.left.ringSetting,
      config.rotors.left.turnoverNotch
    );
    this.r2 = new Rotor(
      ROTOR_CATALOG[config.rotors.middle.id],
      config.rotors.middle.position,
      config.rotors.middle.ringSetting,
      config.rotors.middle.turnoverNotch
    );
    this.r3 = new Rotor(
      ROTOR_CATALOG[config.rotors.right.id],
      config.rotors.right.position,
      config.rotors.right.ringSetting,
      config.rotors.right.turnoverNotch
    );
    this.reflector = new Reflector(REFLECTOR_CATALOG[config.reflector || 'A']);
  }

  encryptChar(ch: string, recordTrace: boolean = false): { outChar: string; trace: SignalTrace | null } {
    const inIdx = charToIndex(ch);
    if (inIdx === -1) return { outChar: ch, trace: null };

    // Capture position before stepping
    const posBefore: [number, number, number] = [this.r1.position, this.r2.position, this.r3.position];

    // Authentic pawl stepping before electrical contact
    const step = stepRotors(
      this.r1.position,
      this.r2.position,
      this.r3.position,
      this.r2.turnoverNotch,
      this.r3.turnoverNotch
    );

    this.r1.position = step.positions[0];
    this.r2.position = step.positions[1];
    this.r3.position = step.positions[2];

    const posAfter: [number, number, number] = [this.r1.position, this.r2.position, this.r3.position];

    // Forward pass: R3 -> R2 -> R1
    const r3Fwd = this.r3.forward(inIdx);
    const r2Fwd = this.r2.forward(r3Fwd);
    const r1Fwd = this.r1.forward(r2Fwd);

    // Reflector
    const refIdx = this.reflector.reflect(r1Fwd);

    // Backward pass: R1 -> R2 -> R3
    const r1Bwd = this.r1.backward(refIdx);
    const r2Bwd = this.r2.backward(r1Bwd);
    const r3Bwd = this.r3.backward(r2Bwd);

    const outChar = ALPHABET_CHARS[r3Bwd] ?? '?';

    let trace: SignalTrace | null = null;
    if (recordTrace) {
      trace = {
        inChar: ch,
        inIdx,
        posBefore,
        posAfter,
        pawlAction: step.pawlAction,
        shift3: this.r3.effectiveShift,
        shift2: this.r2.effectiveShift,
        shift1: this.r1.effectiveShift,
        r3Fwd,
        r2Fwd,
        r1Fwd,
        refIdx,
        r1Bwd,
        r2Bwd,
        r3Bwd,
        outChar,
        outIdx: r3Bwd,
      };
    }

    return { outChar, trace };
  }

  processText(text: string): EncryptResult {
    const sanitized = sanitizeInput(text);
    let out = '';
    let lastTrace: SignalTrace | null = null;
    const history: StepHistoryItem[] = [];

    const len = sanitized.length;
    for (let i = 0; i < len; i++) {
      const ch = sanitized[i];
      // Only allocate full trace object for initial steps (up to 25 for history) and the final step
      const shouldRecord = i === len - 1 || i < 25;
      const res = this.encryptChar(ch, shouldRecord);
      out += res.outChar;
      if (res.trace) {
        lastTrace = res.trace;
        if (history.length < 25) {
          history.push({
            stepNum: i + 1,
            chIn: ch,
            posBefore: res.trace.posBefore,
            pawlAction: res.trace.pawlAction,
            posAfter: res.trace.posAfter,
            chOut: res.outChar,
          });
        }
      }
    }

    return {
      ciphertext: out,
      finalPositions: [this.r1.position, this.r2.position, this.r3.position],
      lastTrace,
      history,
    };
  }
}
