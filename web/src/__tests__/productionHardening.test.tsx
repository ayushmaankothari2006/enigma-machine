// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { OutputCard } from '../components/OutputCard';
import { DriveSessionPage } from '../components/drive/DriveSessionPage';
import { TurnstileWidget } from '../components/auth/TurnstileWidget';
import App from '../App';

const mockInvoke = vi.hoisted(() => vi.fn());

vi.mock('../lib/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/supabase')>();
  return {
    ...actual,
    isSupabaseConfigured: true,
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
        signInWithPassword: vi.fn(),
        signInWithOAuth: vi.fn(),
        setSession: vi.fn(),
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
      functions: {
        invoke: mockInvoke,
      },
      from: vi.fn(),
      storage: { from: vi.fn() },
    },
  };
});

describe('Production Hardening, Error Feedback & Accessibility', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.pushState({}, '', '/login');
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    delete window.turnstile;
  });

  it('surfaces visible error feedback in OutputCard when clipboard write is denied', async () => {
    const originalClipboard = navigator.clipboard;
    const originalExecCommand = document.execCommand;

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('Permission denied')) },
    });
    document.execCommand = vi.fn().mockReturnValue(false);

    try {
      render(<OutputCard value="CIPHERTEXT" onUseOutputAsInput={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /Copy/i }));
      expect(
        await screen.findByText(/Clipboard access was denied\. Please select and copy manually\./i)
      ).toBeTruthy();
    } finally {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: originalClipboard,
      });
      document.execCommand = originalExecCommand;
    }
  });

  it('surfaces deletion and copy errors cleanly inside DriveSessionPage without unhandled rejections', async () => {
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('Clipboard blocked')) },
    });

    try {
      const onDeleteClipboard = vi.fn().mockRejectedValue(new Error('Clipboard delete failed'));
      render(
        <DriveSessionPage
          session={{
            id: 's1',
            token: 'abc123',
            hasPassword: false,
            durationMinutes: 30,
            lockdownMode: false,
            status: 'active',
            createdAt: '2026-11-26T10:00:00.000Z',
            expiresAt: '2026-11-26T10:30:00.000Z',
          }}
          sessionPassword=""
          files={[]}
          clipboardItems={[
            {
              id: 'clip-1',
              sessionId: 's1',
              content: 'Secret payload',
              createdBy: 'Guest',
              createdAt: '2026-11-26T10:05:00.000Z',
            },
          ]}
          connectedDevices={[]}
          remainingMs={1800000}
          isEnding={false}
          onEndSession={vi.fn()}
          onUploadFiles={vi.fn()}
          onDownloadFile={vi.fn()}
          onDeleteFile={vi.fn()}
          onAddClipboard={vi.fn()}
          onDeleteClipboard={onDeleteClipboard}
        />
      );

      // Copy token failure feedback
      fireEvent.click(screen.getByRole('button', { name: /Copy session token abc123/i }));
      expect(
        await screen.findByText(/Unable to copy session token automatically/i)
      ).toBeTruthy();

      // Switch to Board tab -> H2 heading & safe async deletion error handling
      fireEvent.click(screen.getByRole('tab', { name: /Board/i }));
      expect(screen.getByRole('heading', { level: 2, name: /Add to Clipboard/i })).toBeTruthy();

      fireEvent.click(screen.getByRole('button', { name: /Delete clipboard item/i }));
      expect(await screen.findByText(/Clipboard delete failed/i)).toBeTruthy();
    } finally {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: originalClipboard,
      });
    }
  });

  it('closes footer and legal modals on Escape and updates route SEO page titles', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: /Welcome Back/i });
    expect(document.title).toContain('Sign In');

    // Open Feedback modal and dismiss with Escape
    fireEvent.click(screen.getByRole('button', { name: /^Feedback$/i }));
    expect(await screen.findByRole('heading', { name: /^Feedback$/i })).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    // Navigate to Register -> title updates and Terms modal closes on Escape
    fireEvent.click(screen.getByRole('button', { name: /Create an account/i }));
    expect(await screen.findByRole('heading', { name: /^Register$/i })).toBeTruthy();
    expect(document.title).toContain('Create Account');

    fireEvent.click(screen.getByRole('button', { name: /Terms of Service/i }));
    expect(await screen.findByRole('dialog')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('calls TurnstileWidget onError when challenge script times out', async () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    render(
      <TurnstileWidget
        action="register"
        onTokenChange={vi.fn()}
        onError={onError}
      />
    );

    await act(async () => {
      vi.advanceTimersByTime(12_500);
    });
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
