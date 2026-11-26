import { normalizeMod96 } from './alphabet';
import { ReflectorDefinition } from './presets';

export class Reflector {
  readonly definition: ReflectorDefinition;

  constructor(definition: ReflectorDefinition) {
    this.definition = definition;
  }

  reflect(x: number): number {
    return this.definition.wiring[normalizeMod96(x)];
  }
}
