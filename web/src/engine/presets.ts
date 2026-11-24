import { RotorId, ReflectorId } from './types';

// Seeded PRNG (mulberry32) for deterministic, reproducible permutations
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generatePermutation(seed: number): number[] {
  const rng = mulberry32(seed);
  const arr = Array.from({ length: 96 }, (_, i) => i);
  for (let i = 95; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function invertPermutation(p: number[]): number[] {
  const inv = new Array(96);
  for (let i = 0; i < 96; i++) {
    inv[p[i]] = i;
  }
  return inv;
}

export function generateReflector(seed: number): number[] {
  const rng = mulberry32(seed);
  const pool = Array.from({ length: 96 }, (_, i) => i);
  for (let i = 95; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const ref = new Array(96);
  for (let i = 0; i < 96; i += 2) {
    const a = pool[i];
    const b = pool[i + 1];
    ref[a] = b;
    ref[b] = a;
  }
  return ref;
}

export interface RotorDefinition {
  id: RotorId;
  name: string;
  wiring: number[];
  inverse: number[];
  notch: number;
  notchGlyph: string;
}

export interface ReflectorDefinition {
  id: ReflectorId;
  name: string;
  wiring: number[];
}

export const ROTOR_CATALOG: Record<RotorId, RotorDefinition> = {
  I: {
    id: 'I',
    name: 'Rotor I',
    wiring: generatePermutation(101),
    inverse: invertPermutation(generatePermutation(101)),
    notch: 33, // 'A'
    notchGlyph: "'A'",
  },
  II: {
    id: 'II',
    name: 'Rotor II',
    wiring: generatePermutation(202),
    inverse: invertPermutation(generatePermutation(202)),
    notch: 65, // 'a'
    notchGlyph: "'a'",
  },
  III: {
    id: 'III',
    name: 'Rotor III',
    wiring: generatePermutation(303),
    inverse: invertPermutation(generatePermutation(303)),
    notch: 16, // '0'
    notchGlyph: "'0'",
  },
  IV: {
    id: 'IV',
    name: 'Rotor IV',
    wiring: generatePermutation(404),
    inverse: invertPermutation(generatePermutation(404)),
    notch: 0, // ' '
    notchGlyph: '[Space]',
  },
  V: {
    id: 'V',
    name: 'Rotor V',
    wiring: generatePermutation(505),
    inverse: invertPermutation(generatePermutation(505)),
    notch: 95, // '\n'
    notchGlyph: '[Enter]',
  },
};

export const REFLECTOR_CATALOG: Record<ReflectorId, ReflectorDefinition> = {
  A: {
    id: 'A',
    name: 'Reflector A',
    wiring: generateReflector(606),
  },
  B: {
    id: 'B',
    name: 'Reflector B',
    wiring: generateReflector(707),
  },
};
