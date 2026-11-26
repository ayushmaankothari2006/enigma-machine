import { ALPHABET_SIZE, normalizeMod96 } from './alphabet';
import { RotorDefinition } from './presets';

export class Rotor {
  readonly definition: RotorDefinition;
  position: number;
  ringSetting: number;
  turnoverNotch: number;

  constructor(definition: RotorDefinition, position: number = 0, ringSetting: number = 0, turnoverNotch?: number) {
    this.definition = definition;
    this.position = normalizeMod96(position);
    this.ringSetting = normalizeMod96(ringSetting);
    this.turnoverNotch = turnoverNotch !== undefined
      ? normalizeMod96(turnoverNotch, definition.notch)
      : definition.notch;
  }

  get effectiveShift(): number {
    return normalizeMod96(this.position - this.ringSetting);
  }

  forward(x: number): number {
    const input = normalizeMod96(x);
    const shift = this.effectiveShift;
    const pinIn = (input + shift) % ALPHABET_SIZE;
    const pinMid = this.definition.wiring[pinIn];
    return normalizeMod96(pinMid - shift);
  }

  backward(x: number): number {
    const input = normalizeMod96(x);
    const shift = this.effectiveShift;
    const pinIn = (input + shift) % ALPHABET_SIZE;
    const pinMid = this.definition.inverse[pinIn];
    return normalizeMod96(pinMid - shift);
  }
}
