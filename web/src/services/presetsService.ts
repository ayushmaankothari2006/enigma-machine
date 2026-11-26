import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { ReflectorId, RotorConfig, RotorId } from '../engine/types';
import type { RotorPresetInsert, RotorPresetRow } from '../types/database';

export interface EnigmaRotorSet {
  left: RotorConfig;
  middle: RotorConfig;
  right: RotorConfig;
}

export interface SavePresetInput {
  userId: string;
  name: string;
  description?: string;
  reflector: ReflectorId;
  rotors: EnigmaRotorSet;
}

export interface LoadedPresetConfig {
  reflector: ReflectorId;
  rotors: EnigmaRotorSet;
}

const VALID_ROTOR_IDS: readonly RotorId[] = ['I', 'II', 'III', 'IV', 'V'];
const VALID_REFLECTORS: readonly ReflectorId[] = ['A', 'B'];

function normalizeRotorId(value: string, fallback: RotorId): RotorId {
  return VALID_ROTOR_IDS.includes(value as RotorId) ? (value as RotorId) : fallback;
}

function normalizeReflectorId(value: string): ReflectorId {
  return VALID_REFLECTORS.includes(value as ReflectorId) ? (value as ReflectorId) : 'A';
}

function clampMod96(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return ((Math.trunc(value) % 96) + 96) % 96;
}

export function configToPresetPayload(input: SavePresetInput): RotorPresetInsert {
  return {
    user_id: input.userId,
    name: input.name.trim(),
    description: (input.description ?? '').trim(),
    reflector: input.reflector,
    left_rotor_id: input.rotors.left.id,
    left_position: clampMod96(input.rotors.left.position),
    left_ring_setting: clampMod96(input.rotors.left.ringSetting),
    left_turnover_notch: clampMod96(input.rotors.left.turnoverNotch),
    middle_rotor_id: input.rotors.middle.id,
    middle_position: clampMod96(input.rotors.middle.position),
    middle_ring_setting: clampMod96(input.rotors.middle.ringSetting),
    middle_turnover_notch: clampMod96(input.rotors.middle.turnoverNotch),
    right_rotor_id: input.rotors.right.id,
    right_position: clampMod96(input.rotors.right.position),
    right_ring_setting: clampMod96(input.rotors.right.ringSetting),
    right_turnover_notch: clampMod96(input.rotors.right.turnoverNotch),
  };
}

export function presetRowToConfig(row: RotorPresetRow): LoadedPresetConfig {
  const leftId = normalizeRotorId(row.left_rotor_id, 'I');
  const middleId = normalizeRotorId(row.middle_rotor_id, 'II');
  const rightId = normalizeRotorId(row.right_rotor_id, 'III');

  return {
    reflector: normalizeReflectorId(row.reflector),
    rotors: {
      left: {
        id: leftId,
        name: `Rotor ${leftId}`,
        position: clampMod96(row.left_position),
        ringSetting: clampMod96(row.left_ring_setting),
        turnoverNotch: clampMod96(row.left_turnover_notch),
      },
      middle: {
        id: middleId,
        name: `Rotor ${middleId}`,
        position: clampMod96(row.middle_position),
        ringSetting: clampMod96(row.middle_ring_setting),
        turnoverNotch: clampMod96(row.middle_turnover_notch),
      },
      right: {
        id: rightId,
        name: `Rotor ${rightId}`,
        position: clampMod96(row.right_position),
        ringSetting: clampMod96(row.right_ring_setting),
        turnoverNotch: clampMod96(row.right_turnover_notch),
      },
    },
  };
}

function assertConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
  }
}

export async function fetchUserPresets(userId: string): Promise<RotorPresetRow[]> {
  assertConfigured();
  const { data, error } = await supabase
    .from('rotor_presets')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to load rotor presets.');
  }

  return data ?? [];
}

export async function createRotorPreset(input: SavePresetInput): Promise<RotorPresetRow> {
  assertConfigured();
  const payload = configToPresetPayload(input);
  const { data, error } = await supabase
    .from('rotor_presets')
    .insert(payload)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to save rotor preset.');
  }

  return data;
}

export async function updateRotorPreset(
  presetId: number,
  input: SavePresetInput
): Promise<RotorPresetRow> {
  assertConfigured();
  const payload = configToPresetPayload(input);
  const { data, error } = await supabase
    .from('rotor_presets')
    .update({
      name: payload.name,
      description: payload.description,
      reflector: payload.reflector,
      left_rotor_id: payload.left_rotor_id,
      left_position: payload.left_position,
      left_ring_setting: payload.left_ring_setting,
      left_turnover_notch: payload.left_turnover_notch,
      middle_rotor_id: payload.middle_rotor_id,
      middle_position: payload.middle_position,
      middle_ring_setting: payload.middle_ring_setting,
      middle_turnover_notch: payload.middle_turnover_notch,
      right_rotor_id: payload.right_rotor_id,
      right_position: payload.right_position,
      right_ring_setting: payload.right_ring_setting,
      right_turnover_notch: payload.right_turnover_notch,
    })
    .eq('id', presetId)
    .eq('user_id', input.userId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update rotor preset.');
  }

  return data;
}

export async function deleteRotorPreset(presetId: number, userId: string): Promise<void> {
  assertConfigured();
  const { error } = await supabase
    .from('rotor_presets')
    .delete()
    .eq('id', presetId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message || 'Failed to delete rotor preset.');
  }
}
