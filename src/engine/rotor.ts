import { ALPHABET_SIZE } from './alphabet';
import { RotorDefinition } from './presets';

export class Rotor {
  readonly definition: RotorDefinition;
  position: number;
  ringSetting: number;
  turnoverNotch: number;

  constructor(definition: RotorDefinition, position: number = 0, ringSetting: number = 0, turnoverNotch?: number) {
    this.definition = definition;
    this.position = ((position % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE;
    this.ringSetting = ((ringSetting % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE;
    this.turnoverNotch = turnoverNotch !== undefined
      ? ((turnoverNotch % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE
      : definition.notch;
  }

  get effectiveShift(): number {
    return ((this.position - this.ringSetting) % ALPHABET_SIZE + ALPHABET_SIZE) % ALPHABET_SIZE;
  }

  forward(x: number): number {
    const shift = this.effectiveShift;
    const pinIn = (x + shift) % ALPHABET_SIZE;
    const pinMid = this.definition.wiring[pinIn];
    return ((pinMid - shift) % ALPHABET_SIZE + ALPHABET_SIZE) % ALPHABET_SIZE;
  }

  backward(x: number): number {
    const shift = this.effectiveShift;
    const pinIn = (x + shift) % ALPHABET_SIZE;
    const pinMid = this.definition.inverse[pinIn];
    return ((pinMid - shift) % ALPHABET_SIZE + ALPHABET_SIZE) % ALPHABET_SIZE;
  }
}
