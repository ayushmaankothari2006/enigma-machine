export type RotorId = 'I' | 'II' | 'III' | 'IV' | 'V';
export type ReflectorId = 'A' | 'B';

export interface RotorConfig {
  id: RotorId;
  name: string;
  position: number;    // 0 to 95
  ringSetting: number; // 0 to 95 (displayed 1 to 96)
  turnoverNotch: number;
}

export interface EnigmaState {
  reflector: ReflectorId;
  rotors: {
    left: RotorConfig;
    middle: RotorConfig;
    right: RotorConfig;
  };
  inputText: string;
  outputText: string;
  initialPositions: {
    left: number;
    middle: number;
    right: number;
  };
}
