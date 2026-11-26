import { useCallback, useEffect, useState } from 'react';
import type { ReflectorId } from '../engine/types';
import {
  createRotorPreset,
  deleteRotorPreset,
  EnigmaRotorSet,
  fetchUserPresets,
  updateRotorPreset,
} from '../services/presetsService';
import type { RotorPresetRow } from '../types/database';

export function useRotorPresets(userId: string | undefined) {
  const [presets, setPresets] = useState<RotorPresetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPresets = useCallback(async () => {
    if (!userId) {
      setPresets([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const rows = await fetchUserPresets(userId);
      setPresets(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch saved presets.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refreshPresets();
  }, [refreshPresets]);

  const savePreset = useCallback(
    async (params: {
      name: string;
      description?: string;
      reflector: ReflectorId;
      rotors: EnigmaRotorSet;
    }): Promise<RotorPresetRow | null> => {
      if (!userId) {
        setError('Please sign in to save rotor presets.');
        return null;
      }

      try {
        setMutating(true);
        setError(null);
        const created = await createRotorPreset({
          userId,
          name: params.name,
          description: params.description,
          reflector: params.reflector,
          rotors: params.rotors,
        });
        setPresets((prev) => [created, ...prev]);
        return created;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to save rotor preset.');
        return null;
      } finally {
        setMutating(false);
      }
    },
    [userId]
  );

  const updateExistingPreset = useCallback(
    async (
      presetId: number,
      params: {
        name: string;
        description?: string;
        reflector: ReflectorId;
        rotors: EnigmaRotorSet;
      }
    ): Promise<RotorPresetRow | null> => {
      if (!userId) {
        setError('Please sign in to update rotor presets.');
        return null;
      }

      try {
        setMutating(true);
        setError(null);
        const updated = await updateRotorPreset(presetId, {
          userId,
          name: params.name,
          description: params.description,
          reflector: params.reflector,
          rotors: params.rotors,
        });
        setPresets((prev) =>
          [updated, ...prev.filter((item) => item.id !== presetId)]
        );
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to update rotor preset.');
        return null;
      } finally {
        setMutating(false);
      }
    },
    [userId]
  );

  const removePreset = useCallback(
    async (presetId: number): Promise<boolean> => {
      if (!userId) return false;

      try {
        setMutating(true);
        setError(null);
        await deleteRotorPreset(presetId, userId);
        setPresets((prev) => prev.filter((item) => item.id !== presetId));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to delete rotor preset.');
        return false;
      } finally {
        setMutating(false);
      }
    },
    [userId]
  );

  return {
    presets,
    loading,
    mutating,
    error,
    clearError: useCallback(() => setError(null), []),
    refreshPresets,
    savePreset,
    updatePreset: updateExistingPreset,
    removePreset,
  };
}
