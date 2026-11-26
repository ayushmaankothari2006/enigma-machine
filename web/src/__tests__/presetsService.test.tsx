// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, renderHook, act } from '@testing-library/react';
import { configToPresetPayload, presetRowToConfig } from '../services/presetsService';
import { useEnigma } from '../hooks/useEnigma';
import type { RotorPresetRow } from '../types/database';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('../lib/supabase', async () => {
  const actual = await vi.importActual<typeof import('../lib/supabase')>('../lib/supabase');
  return {
    ...actual,
    isSupabaseConfigured: true,
    supabase: {
      ...actual.supabase,
      from: mockFrom,
    },
  };
});

import { PresetsCard } from '../components/PresetsCard';

describe('Rotor Presets Service & PresetsCard', () => {
  const sampleRow: RotorPresetRow = {
    id: 42,
    user_id: 'user-123',
    name: 'Night Shift Key',
    description: 'Ops team channel',
    reflector: 'B',
    left_rotor_id: 'IV',
    left_position: 12,
    left_ring_setting: 7,
    left_turnover_notch: 0,
    middle_rotor_id: 'II',
    middle_position: 45,
    middle_ring_setting: 22,
    middle_turnover_notch: 65,
    right_rotor_id: 'V',
    right_position: 95,
    right_ring_setting: 3,
    right_turnover_notch: 95,
    created_at: '2026-11-25T05:45:00Z',
    updated_at: '2026-11-25T05:45:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('converts between machine rotor state and DB row payload with modulo-96 clamping', () => {
    const config = presetRowToConfig(sampleRow);
    expect(config.reflector).toBe('B');
    expect(config.rotors.left).toEqual({
      id: 'IV',
      name: 'Rotor IV',
      position: 12,
      ringSetting: 7,
      turnoverNotch: 0,
    });
    expect(config.rotors.right.position).toBe(95);

    const payload = configToPresetPayload({
      userId: 'user-123',
      name: '  Custom Key  ',
      description: '  Note  ',
      reflector: 'A',
      rotors: {
        left: { ...config.rotors.left, position: 98, ringSetting: -1 },
        middle: config.rotors.middle,
        right: config.rotors.right,
      },
    });

    expect(payload.name).toBe('Custom Key');
    expect(payload.description).toBe('Note');
    expect(payload.left_position).toBe(2);
    expect(payload.left_ring_setting).toBe(95);
  });

  it('loads a saved preset into useEnigma and updates reflector + initial positions', () => {
    const { result } = renderHook(() => useEnigma());
    const loadedConfig = presetRowToConfig(sampleRow);

    act(() => {
      result.current.loadPreset(loadedConfig);
    });

    expect(result.current.reflector).toBe('B');
    expect(result.current.rotors.left.id).toBe('IV');
    expect(result.current.rotors.left.position).toBe(12);
    expect(result.current.rotors.middle.ringSetting).toBe(22);
    expect(result.current.rotors.right.position).toBe(95);
    expect(result.current.state.initialPositions).toEqual({ left: 12, middle: 45, right: 95 });
  });

  it('fetches, validates, saves, loads, and deletes user presets in PresetsCard', async () => {
    const orderMock = vi.fn().mockResolvedValue({ data: [sampleRow], error: null });
    const selectEqMock = vi.fn().mockReturnValue({ order: orderMock });
    const selectMock = vi.fn().mockReturnValue({ eq: selectEqMock });

    const createdRow: RotorPresetRow = {
      ...sampleRow,
      id: 43,
      name: 'Morning Key',
      description: 'Daily sync',
    };
    const singleInsertMock = vi.fn().mockResolvedValue({ data: createdRow, error: null });
    const insertSelectMock = vi.fn().mockReturnValue({ single: singleInsertMock });
    const insertMock = vi.fn().mockReturnValue({ select: insertSelectMock });

    const deleteSecondEqMock = vi.fn().mockResolvedValue({ error: null });
    const deleteFirstEqMock = vi.fn().mockReturnValue({ eq: deleteSecondEqMock });
    const deleteMock = vi.fn().mockReturnValue({ eq: deleteFirstEqMock });

    mockFrom.mockReturnValue({
      select: selectMock,
      insert: insertMock,
      delete: deleteMock,
    });

    const onLoadPreset = vi.fn();
    render(
      <PresetsCard
        userId="user-123"
        reflector="A"
        rotors={presetRowToConfig(sampleRow).rotors}
        onLoadPreset={onLoadPreset}
        onNavigateLogin={vi.fn()}
        onNavigateRegister={vi.fn()}
      />
    );

    expect(await screen.findByText('Night Shift Key')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Load/i }));
    expect(onLoadPreset).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Save Key/i }));
    expect(await screen.findByText(/Enter a preset name/i)).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/Preset Name/i), {
      target: { value: 'Morning Key' },
    });
    fireEvent.change(screen.getByLabelText(/Note/i), {
      target: { value: 'Daily sync' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save Key/i }));

    expect(await screen.findByText('Morning Key')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Night Shift Key' }));
    await waitFor(() => {
      expect(screen.queryByText('Night Shift Key')).toBeNull();
    });
  });
});
