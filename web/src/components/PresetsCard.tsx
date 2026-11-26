import React, { useState } from 'react';
import {
  AlertCircle,
  Bookmark,
  CheckCircle2,
  FolderOpen,
  Loader2,
  LogIn,
  RefreshCw,
  Save,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { formatGlyph } from '../engine/alphabet';
import type { ReflectorId, RotorConfig } from '../engine/types';
import { useRotorPresets } from '../hooks/useRotorPresets';
import { LoadedPresetConfig, presetRowToConfig } from '../services/presetsService';
import type { RotorPresetRow } from '../types/database';

interface PresetsCardProps {
  userId?: string;
  reflector: ReflectorId;
  rotors: {
    left: RotorConfig;
    middle: RotorConfig;
    right: RotorConfig;
  };
  onLoadPreset: (preset: LoadedPresetConfig) => void;
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
}

export const PresetsCard: React.FC<PresetsCardProps> = ({
  userId,
  reflector,
  rotors,
  onLoadPreset,
  onNavigateLogin,
  onNavigateRegister,
}) => {
  const {
    presets,
    loading,
    mutating,
    error,
    clearError,
    refreshPresets,
    savePreset,
    updatePreset,
    removePreset,
  } = useRotorPresets(userId);

  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!userId) {
    return (
      <div className="clay-card p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-[3px_4px_10px_rgba(30,64,175,0.3)] shrink-0">
            <Bookmark className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-blue-950 tracking-tight">
              Cloud Rotor Presets
            </h2>
            <p className="text-xs font-normal text-slate-600 mt-0.5">
              Sign in to securely store and load your private Enigma96 rotor configurations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onNavigateLogin}
            className="clay-btn-blue px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={onNavigateRegister}
            className="clay-btn-white px-4 py-2 text-xs font-bold cursor-pointer"
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setStatusMessage(null);

    const trimmedName = presetName.trim();
    if (!trimmedName) {
      setNameError('Enter a preset name (e.g., "Night Shift Key").');
      return;
    }
    if (trimmedName.length > 80) {
      setNameError('Preset name must be 80 characters or fewer.');
      return;
    }

    setNameError(null);
    const created = await savePreset({
      name: trimmedName,
      description: presetDescription.trim(),
      reflector,
      rotors,
    });

    if (created) {
      setPresetName('');
      setPresetDescription('');
      setStatusMessage(`Saved preset "${created.name}" to your private vault.`);
    }
  };

  const handleLoad = (row: RotorPresetRow) => {
    clearError();
    onLoadPreset(presetRowToConfig(row));
    setStatusMessage(`Loaded preset "${row.name}" onto the rotor bay.`);
  };

  const handleOverwrite = async (row: RotorPresetRow) => {
    clearError();
    const updated = await updatePreset(row.id, {
      name: row.name,
      description: row.description,
      reflector,
      rotors,
    });
    if (updated) {
      setStatusMessage(`Updated "${updated.name}" with the current rotor configuration.`);
    }
  };

  const handleDelete = async (row: RotorPresetRow) => {
    clearError();
    const ok = await removePreset(row.id);
    if (ok) {
      setStatusMessage(`Deleted preset "${row.name}".`);
    }
  };

  return (
    <div className="clay-card p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-[3px_4px_10px_rgba(30,64,175,0.35),inset_1px_1px_2px_rgba(255,255,255,0.4)] shrink-0">
            <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-blue-950 tracking-tight">
              Saved Rotor Presets
            </h2>
            <p className="text-[11px] sm:text-xs font-normal text-slate-500">
              RLS-protected personal key configurations synced to Supabase
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void refreshPresets()}
          disabled={loading || mutating}
          className="clay-btn-white px-3 py-1.5 text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          title="Refresh saved presets"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Feedback Banners */}
      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 flex items-start gap-2.5 text-xs font-medium text-red-700"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {statusMessage && !error && (
        <div
          role="status"
          className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 flex items-start gap-2.5 text-xs font-medium text-emerald-800"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Save Current Rotor Key Form */}
      <form onSubmit={handleSave} noValidate className="clay-well p-3.5 sm:p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
          <div className="sm:col-span-5 space-y-1">
            <label htmlFor="preset-name" className="block text-[11px] font-bold text-blue-950">
              Preset Name
            </label>
            <input
              id="preset-name"
              type="text"
              value={presetName}
              onChange={(e) => {
                setPresetName(e.target.value);
                if (nameError && e.target.value.trim()) setNameError(null);
              }}
              placeholder="e.g. Daily Cipher Key"
              maxLength={80}
              aria-invalid={Boolean(nameError)}
              className="w-full rounded-xl bg-white px-3 py-2 text-xs font-normal text-slate-800 border border-blue-100 focus:border-blue-500 focus:outline-none"
            />
            {nameError && <p className="text-[11px] font-medium text-red-600">{nameError}</p>}
          </div>

          <div className="sm:col-span-4 space-y-1">
            <label htmlFor="preset-notes" className="block text-[11px] font-bold text-blue-950">
              Note (optional)
            </label>
            <input
              id="preset-notes"
              type="text"
              value={presetDescription}
              onChange={(e) => setPresetDescription(e.target.value)}
              placeholder="Channel or usage note"
              maxLength={240}
              className="w-full rounded-xl bg-white px-3 py-2 text-xs font-normal text-slate-800 border border-blue-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3 sm:pt-5">
            <button
              type="submit"
              disabled={mutating}
              className="clay-btn-orange w-full px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {mutating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save Key</span>
            </button>
          </div>
        </div>
      </form>

      {/* Preset List */}
      {loading && presets.length === 0 ? (
        <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Loading your saved rotor presets...</span>
        </div>
      ) : presets.length === 0 ? (
        <div className="clay-bay p-6 text-center space-y-1.5">
          <p className="text-xs font-bold text-blue-950">No saved rotor presets yet</p>
          <p className="text-[11px] font-normal text-slate-500">
            Configure your rotors above and click Save Key to store a preset in your personal vault.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="clay-bay p-3.5 flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-blue-950 truncate">
                      {preset.name}
                    </h3>
                    {preset.description && (
                      <p className="text-[11px] font-normal text-slate-500 truncate mt-0.5">
                        {preset.description}
                      </p>
                    )}
                  </div>
                  <span className="clay-pill-blue text-[10px] px-2 py-0.5 shrink-0">
                    Ref {preset.reflector}
                  </span>
                </div>

                {/* Rotor Snapshot Badges */}
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  <div className="bg-white/80 rounded-lg px-2 py-1 border border-blue-100 text-center">
                    <div className="text-slate-500 font-semibold">R₁ ({preset.left_rotor_id})</div>
                    <div className="text-blue-950 font-bold truncate">
                      {formatGlyph(preset.left_position)} · R{preset.left_ring_setting + 1}
                    </div>
                  </div>
                  <div className="bg-white/80 rounded-lg px-2 py-1 border border-orange-100 text-center">
                    <div className="text-orange-600 font-semibold">R₂ ({preset.middle_rotor_id})</div>
                    <div className="text-blue-950 font-bold truncate">
                      {formatGlyph(preset.middle_position)} · R{preset.middle_ring_setting + 1}
                    </div>
                  </div>
                  <div className="bg-white/80 rounded-lg px-2 py-1 border border-blue-100 text-center">
                    <div className="text-slate-500 font-semibold">R₃ ({preset.right_rotor_id})</div>
                    <div className="text-blue-950 font-bold truncate">
                      {formatGlyph(preset.right_position)} · R{preset.right_ring_setting + 1}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleLoad(preset)}
                  disabled={mutating}
                  className="clay-btn-blue flex-1 px-2.5 py-1.5 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Load preset onto Enigma96 rotors"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Load</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleOverwrite(preset)}
                  disabled={mutating}
                  className="clay-btn-white px-2.5 py-1.5 text-[11px] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Overwrite preset with current machine settings"
                  aria-label={`Overwrite ${preset.name}`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(preset)}
                  disabled={mutating}
                  className="clay-btn-white p-1.5 text-orange-600 flex items-center justify-center cursor-pointer disabled:opacity-50"
                  title="Delete preset"
                  aria-label={`Delete ${preset.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-orange-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
