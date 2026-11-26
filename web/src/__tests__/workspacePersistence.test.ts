// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

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

import { useEnigma } from '../hooks/useEnigma';

describe('Per-User Workspace State Retention (Texts & Rotor Settings)', () => {
  const remoteRows = new Map<string, Record<string, unknown>>();

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    remoteRows.clear();

    mockFrom.mockImplementation((table: string) => {
      if (table !== 'user_workspace_state') return {};
      return {
        select: () => ({
          eq: (_col: string, uid: string) => ({
            maybeSingle: async () => ({
              data: remoteRows.get(uid) ?? null,
              error: null,
            }),
          }),
        }),
        upsert: async (payload: Record<string, unknown>) => {
          if (typeof payload.user_id === 'string') {
            remoteRows.set(payload.user_id, payload);
          }
          return { error: null };
        },
      };
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retains each user’s input text and rotor settings independently when switching accounts and logging back in', async () => {
    const { result, rerender, unmount } = renderHook(
      ({ userId }: { userId?: string }) => useEnigma(userId),
      { initialProps: { userId: 'user-alpha' } }
    );

    // Edit text and rotor settings for user-alpha
    act(() => {
      result.current.setInputText('SECRET ALPHA MESSAGE');
      result.current.stepPosition('left', 7);
      result.current.stepRing('middle', 4);
      result.current.setTurnoverNotch('right', 42);
    });

    expect(result.current.inputText).toBe('SECRET ALPHA MESSAGE');
    expect(result.current.rotors.left.position).toBe(7);
    expect(result.current.rotors.middle.ringSetting).toBe(4);
    expect(result.current.rotors.right.turnoverNotch).toBe(42);

    // Switch to user-beta: starts clean without leaking user-alpha state
    rerender({ userId: 'user-beta' });
    expect(result.current.inputText).toBe('');
    expect(result.current.rotors.left.position).toBe(0);
    expect(result.current.rotors.middle.ringSetting).toBe(0);

    // Edit text and rotor settings for user-beta
    act(() => {
      result.current.setInputText('BETA PAYLOAD');
      result.current.stepPosition('right', 15);
    });
    expect(result.current.inputText).toBe('BETA PAYLOAD');
    expect(result.current.rotors.right.position).toBe(15);

    // Switch back to user-alpha: user-alpha's exact text & rotor settings are restored
    rerender({ userId: 'user-alpha' });
    expect(result.current.inputText).toBe('SECRET ALPHA MESSAGE');
    expect(result.current.rotors.left.position).toBe(7);
    expect(result.current.rotors.middle.ringSetting).toBe(4);
    expect(result.current.rotors.right.turnoverNotch).toBe(42);

    // Unmount flushes user-beta/user-alpha pending sync to Supabase remote store
    unmount();

    // Clear localStorage completely (simulating logging back in from a fresh session/browser)
    await waitFor(() => {
      expect(remoteRows.has('user-alpha')).toBe(true);
    });
    window.localStorage.clear();

    const { result: freshLogin } = renderHook(() => useEnigma('user-alpha'));
    await waitFor(() => {
      expect(freshLogin.current.inputText).toBe('SECRET ALPHA MESSAGE');
    });
    expect(freshLogin.current.rotors.left.position).toBe(7);
    expect(freshLogin.current.rotors.middle.ringSetting).toBe(4);
    expect(freshLogin.current.rotors.right.turnoverNotch).toBe(42);
  });
});
