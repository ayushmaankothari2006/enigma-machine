import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { ReflectorId, RotorConfig, RotorId } from '../engine/types';
import { ROTOR_CATALOG } from '../engine/presets';

export interface WorkspaceRotorSet {
  left: RotorConfig;
  middle: RotorConfig;
  right: RotorConfig;
}

export interface WorkspaceSnapshot {
  inputText: string;
  reflector: ReflectorId;
  rotors: WorkspaceRotorSet;
  updatedAt: number;
}

const WORKSPACE_STORAGE_PREFIX = 'enigma96_workspace_';
const VALID_ROTOR_IDS: readonly RotorId[] = ['I', 'II', 'III', 'IV', 'V'];
const VALID_REFLECTORS: readonly ReflectorId[] = ['A', 'B'];

function clampMod96(value: unknown, fallback = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return ((Math.trunc(value) % 96) + 96) % 96;
}

function normalizeRotorId(value: unknown, fallback: RotorId): RotorId {
  return typeof value === 'string' && VALID_ROTOR_IDS.includes(value as RotorId)
    ? (value as RotorId)
    : fallback;
}

function normalizeReflectorId(value: unknown): ReflectorId {
  return typeof value === 'string' && VALID_REFLECTORS.includes(value as ReflectorId)
    ? (value as ReflectorId)
    : 'A';
}

export function createDefaultRotorSet(): WorkspaceRotorSet {
  return {
    left: {
      id: 'I',
      name: 'Rotor I',
      position: 0,
      ringSetting: 0,
      turnoverNotch: ROTOR_CATALOG['I'].notch,
    },
    middle: {
      id: 'II',
      name: 'Rotor II',
      position: 0,
      ringSetting: 0,
      turnoverNotch: ROTOR_CATALOG['II'].notch,
    },
    right: {
      id: 'III',
      name: 'Rotor III',
      position: 0,
      ringSetting: 0,
      turnoverNotch: ROTOR_CATALOG['III'].notch,
    },
  };
}

export function generateRandomWorkspaceDefaults(): {
  reflector: ReflectorId;
  rotors: WorkspaceRotorSet;
} {
  const rand96 = () => Math.floor(Math.random() * 96);
  return {
    reflector: Math.random() < 0.5 ? 'A' : 'B',
    rotors: {
      left: {
        id: 'I',
        name: 'Rotor I',
        position: rand96(),
        ringSetting: rand96(),
        turnoverNotch: rand96(),
      },
      middle: {
        id: 'II',
        name: 'Rotor II',
        position: rand96(),
        ringSetting: rand96(),
        turnoverNotch: rand96(),
      },
      right: {
        id: 'III',
        name: 'Rotor III',
        position: rand96(),
        ringSetting: rand96(),
        turnoverNotch: rand96(),
      },
    },
  };
}

export function readLocalWorkspaceState(userId: string): WorkspaceSnapshot | null {
  if (typeof window === 'undefined' || !userId) return null;
  try {
    const raw = window.localStorage.getItem(`${WORKSPACE_STORAGE_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WorkspaceSnapshot>;
    const defaults = createDefaultRotorSet();

    const leftId = normalizeRotorId(parsed.rotors?.left?.id, 'I');
    const middleId = normalizeRotorId(parsed.rotors?.middle?.id, 'II');
    const rightId = normalizeRotorId(parsed.rotors?.right?.id, 'III');

    return {
      inputText: typeof parsed.inputText === 'string' ? parsed.inputText : '',
      reflector: normalizeReflectorId(parsed.reflector),
      rotors: {
        left: {
          id: leftId,
          name: `Rotor ${leftId}`,
          position: clampMod96(parsed.rotors?.left?.position, defaults.left.position),
          ringSetting: clampMod96(parsed.rotors?.left?.ringSetting, defaults.left.ringSetting),
          turnoverNotch: clampMod96(
            parsed.rotors?.left?.turnoverNotch,
            defaults.left.turnoverNotch
          ),
        },
        middle: {
          id: middleId,
          name: `Rotor ${middleId}`,
          position: clampMod96(parsed.rotors?.middle?.position, defaults.middle.position),
          ringSetting: clampMod96(
            parsed.rotors?.middle?.ringSetting,
            defaults.middle.ringSetting
          ),
          turnoverNotch: clampMod96(
            parsed.rotors?.middle?.turnoverNotch,
            defaults.middle.turnoverNotch
          ),
        },
        right: {
          id: rightId,
          name: `Rotor ${rightId}`,
          position: clampMod96(parsed.rotors?.right?.position, defaults.right.position),
          ringSetting: clampMod96(parsed.rotors?.right?.ringSetting, defaults.right.ringSetting),
          turnoverNotch: clampMod96(
            parsed.rotors?.right?.turnoverNotch,
            defaults.right.turnoverNotch
          ),
        },
      },
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
    };
  } catch {
    return null;
  }
}

export function writeLocalWorkspaceState(userId: string, snapshot: WorkspaceSnapshot): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    window.localStorage.setItem(
      `${WORKSPACE_STORAGE_PREFIX}${userId}`,
      JSON.stringify(snapshot)
    );
  } catch {
    // Ignore storage quota errors
  }
}

export async function fetchRemoteWorkspaceState(
  userId: string
): Promise<WorkspaceSnapshot | null> {
  if (!isSupabaseConfigured || !userId) return null;

  const { data, error } = await supabase
    .from('user_workspace_state')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const leftId = normalizeRotorId(data.left_rotor_id, 'I');
  const middleId = normalizeRotorId(data.middle_rotor_id, 'II');
  const rightId = normalizeRotorId(data.right_rotor_id, 'III');

  return {
    inputText: data.input_text ?? '',
    reflector: normalizeReflectorId(data.reflector),
    rotors: {
      left: {
        id: leftId,
        name: `Rotor ${leftId}`,
        position: clampMod96(data.left_position),
        ringSetting: clampMod96(data.left_ring_setting),
        turnoverNotch: clampMod96(data.left_turnover_notch, ROTOR_CATALOG['I'].notch),
      },
      middle: {
        id: middleId,
        name: `Rotor ${middleId}`,
        position: clampMod96(data.middle_position),
        ringSetting: clampMod96(data.middle_ring_setting),
        turnoverNotch: clampMod96(data.middle_turnover_notch, ROTOR_CATALOG['II'].notch),
      },
      right: {
        id: rightId,
        name: `Rotor ${rightId}`,
        position: clampMod96(data.right_position),
        ringSetting: clampMod96(data.right_ring_setting),
        turnoverNotch: clampMod96(data.right_turnover_notch, ROTOR_CATALOG['III'].notch),
      },
    },
    updatedAt: data.updated_at ? Date.parse(data.updated_at) || 0 : 0,
  };
}

export async function upsertRemoteWorkspaceState(
  userId: string,
  snapshot: WorkspaceSnapshot
): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;

  const { error } = await supabase.from('user_workspace_state').upsert(
    {
      user_id: userId,
      input_text: snapshot.inputText,
      reflector: snapshot.reflector,
      left_rotor_id: snapshot.rotors.left.id,
      left_position: clampMod96(snapshot.rotors.left.position),
      left_ring_setting: clampMod96(snapshot.rotors.left.ringSetting),
      left_turnover_notch: clampMod96(snapshot.rotors.left.turnoverNotch),
      middle_rotor_id: snapshot.rotors.middle.id,
      middle_position: clampMod96(snapshot.rotors.middle.position),
      middle_ring_setting: clampMod96(snapshot.rotors.middle.ringSetting),
      middle_turnover_notch: clampMod96(snapshot.rotors.middle.turnoverNotch),
      right_rotor_id: snapshot.rotors.right.id,
      right_position: clampMod96(snapshot.rotors.right.position),
      right_ring_setting: clampMod96(snapshot.rotors.right.ringSetting),
      right_turnover_notch: clampMod96(snapshot.rotors.right.turnoverNotch),
      updated_at: new Date(snapshot.updatedAt).toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    console.error('Failed to sync workspace state to Supabase:', error.message);
  }
}
