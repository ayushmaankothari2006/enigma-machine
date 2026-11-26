// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import type { Session, User } from '@supabase/supabase-js';

vi.setConfig({ testTimeout: 15000 });

const {
  mockGetSession,
  mockOnAuthStateChange,
  mockSignInWithPassword,
  mockSignInWithOtp,
  mockSignUp,
  mockVerifyOtp,
  mockResend,
  mockSignInWithOAuth,
  mockSetSession,
  mockSignOut,
  mockFrom,
  mockFunctionsInvoke,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockSignInWithPassword: vi.fn(),
  mockSignInWithOtp: vi.fn(),
  mockSignUp: vi.fn(),
  mockVerifyOtp: vi.fn(),
  mockResend: vi.fn(),
  mockSignInWithOAuth: vi.fn(),
  mockSetSession: vi.fn(),
  mockSignOut: vi.fn(),
  mockFrom: vi.fn(),
  mockFunctionsInvoke: vi.fn(),
}));

vi.mock('../lib/supabase', async () => {
  const actual = await vi.importActual<typeof import('../lib/supabase')>('../lib/supabase');
  return {
    ...actual,
    isSupabaseConfigured: true,
    supabase: {
      auth: {
        getSession: mockGetSession,
        onAuthStateChange: mockOnAuthStateChange,
        signInWithPassword: mockSignInWithPassword,
        signInWithOtp: mockSignInWithOtp,
        signUp: mockSignUp,
        verifyOtp: mockVerifyOtp,
        resend: mockResend,
        signInWithOAuth: mockSignInWithOAuth,
        setSession: mockSetSession,
        signOut: mockSignOut,
      },
      from: mockFrom,
      functions: {
        invoke: mockFunctionsInvoke,
      },
    },
  };
});

import App from '../App';

function makeMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-11-25T00:00:00Z',
    email: 'ada@example.com',
    ...overrides,
  } as User;
}

function makeMockSession(user: User): Session {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user,
  } as Session;
}

describe('ENIGMA96 Authentication Pages & Auth Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/');
    window.localStorage.clear();
    window.sessionStorage.clear();

    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockOnAuthStateChange.mockImplementation(() => ({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    }));
    mockSignOut.mockResolvedValue({ error: null });

    const orderMock = vi.fn().mockResolvedValue({ data: [], error: null });
    const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqMock = vi.fn().mockReturnValue({ order: orderMock, maybeSingle: maybeSingleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ select: selectMock, upsert: upsertMock });
    mockFunctionsInvoke.mockResolvedValue({ data: { verified: true }, error: null });

    let latestTurnstileCallback: ((token: string) => void) | undefined;
    window.turnstile = {
      render: (_el, options) => {
        latestTurnstileCallback = options.callback;
        options.callback?.('mock-turnstile-token');
        return 'mock-widget-1';
      },
      reset: () => {
        latestTurnstileCallback?.('mock-turnstile-token-refreshed');
      },
      remove: vi.fn(),
    };
  });

  afterEach(() => {
    cleanup();
  });

  it('blocks direct access when signed out, supports Visit Cover Page & Support Enigma modals, and allows Continue as Guest', async () => {
    window.history.replaceState({}, '', '/machine');
    render(<App />);

    await screen.findByRole('heading', { name: /Welcome Back/i });
    expect(screen.getByText(/Cipher Engine \| Enigma Drive/i)).toBeTruthy();
    expect(screen.queryByText(/Bot Protection/i)).toBeNull();
    expect(screen.queryByText(/Machine Settings Dashboard/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /^Visit Cover Page$/i }));
    expect(await screen.findByText(/Currently under development/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Close$/i }));
    await waitFor(() => {
      expect(screen.queryByText(/Currently under development/i)).toBeNull();
    });

    fireEvent.click(screen.getByRole('button', { name: /Support Enigma\?/i }));
    expect(await screen.findByText(/Currently under development/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Close$/i }));
    await waitFor(() => {
      expect(screen.queryByText(/Currently under development/i)).toBeNull();
    });

    // Continue as Guest matches Sign In CTA design and enters main dashboard
    const guestButton = screen.getByRole('button', { name: /Continue as Guest/i });
    expect(guestButton.className).toContain('glass-primary-cta');
    fireEvent.click(guestButton);
    expect(await screen.findByText(/Machine Settings Dashboard/i)).toBeTruthy();

    // Header mode switcher: Cipher Engine is selected by default, Enigma Drive switches exclusively
    const cipherTab = screen.getByRole('tab', {
      name: /Cipher Engine/i,
    });
    const driveTab = screen.getByRole('tab', { name: /Enigma Drive/i });
    expect(cipherTab.getAttribute('aria-selected')).toBe('true');
    expect(driveTab.getAttribute('aria-selected')).toBe('false');

    // Export PDF button is visible in Cipher mode
    expect(screen.getByRole('button', { name: /Export PDF/i })).toBeTruthy();

    fireEvent.click(driveTab);
    expect(driveTab.getAttribute('aria-selected')).toBe('true');
    expect(cipherTab.getAttribute('aria-selected')).toBe('false');
    expect(screen.queryByRole('button', { name: /Export PDF/i })).toBeNull();
    expect(await screen.findByRole('heading', { name: /Start Your Session/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Access Session/i })).toBeTruthy();

    fireEvent.click(cipherTab);
    expect(cipherTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('button', { name: /Export PDF/i })).toBeTruthy();
    expect(await screen.findByText(/Machine Settings Dashboard/i)).toBeTruthy();
    const plaintextInput = screen.getByPlaceholderText(
      /Type or paste text here to encipher in real-time/i
    );
    await waitFor(() => {
      expect(document.activeElement).toBe(plaintextInput);
    });

    fireEvent.click(screen.getByRole('button', { name: /Account menu/i }));
    expect(await screen.findByText(/Guest Session/i)).toBeTruthy();
  }, 15000);

  it('validates login fields inline, toggles password visibility, and blocks copy/paste in password box', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: /Welcome Back/i });

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
    passwordInput.dispatchEvent(pasteEvent);
    expect(pasteEvent.defaultPrevented).toBe(true);
    expect(await screen.findByText(/Copy and paste is disabled/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Show password/i }));
    expect(passwordInput.type).toBe('text');

    fireEvent.click(screen.getByRole('button', { name: /Hide password/i }));
    expect(passwordInput.type).toBe('password');

    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));
    expect(await screen.findByText(/Email address is required\./i)).toBeTruthy();
    expect(screen.getByText(/Password is required\./i)).toBeTruthy();
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it('signs in directly with email/password + Turnstile (no OTP), switches accounts in rightmost dropdown, and signs out', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: 'Invalid login credentials' },
    });

    render(<App />);
    await screen.findByRole('heading', { name: /Welcome Back/i });

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong-pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    expect(
      await screen.findByText(/Incorrect email or password\. Please verify your credentials/i)
    ).toBeTruthy();

    const user = makeMockUser();
    const session = makeMockSession(user);
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { session, user },
      error: null,
    });

    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    expect(await screen.findByText(/Machine Settings Dashboard/i)).toBeTruthy();
    expect(mockSignInWithOtp).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Account menu/i }));
    expect(await screen.findByText('ada@example.com')).toBeTruthy();
    expect(screen.getByLabelText('Active account')).toBeTruthy();

    fireEvent.click(screen.getByRole('menuitem', { name: /Add Account/i }));
    await screen.findByRole('heading', { name: /Welcome Back/i });

    const secondUser = makeMockUser({ id: 'user-456', email: 'alan@example.com' });
    const secondSession = makeMockSession(secondUser);
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { session: secondSession, user: secondUser },
      error: null,
    });

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'alan@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'turing-pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));

    expect(await screen.findByText(/Machine Settings Dashboard/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Account menu/i }));
    expect(await screen.findByText('alan@example.com')).toBeTruthy();
    expect(screen.getByText('ada@example.com')).toBeTruthy();

    mockSetSession.mockResolvedValueOnce({
      data: { session, user },
      error: null,
    });

    fireEvent.click(screen.getByText('ada@example.com'));
    await waitFor(() => {
      expect(mockSetSession).toHaveBeenCalledWith({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      });
    });

    fireEvent.click(screen.getByRole('button', { name: /Account menu/i }));
    fireEvent.click(await screen.findByRole('button', { name: 'Sign out' }));
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  it('creates pre-confirmed account on register with Cloudflare Turnstile and signs in directly without OTP', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: /Welcome Back/i });

    fireEvent.click(screen.getByRole('button', { name: /Create an account/i }));

    expect(await screen.findByRole('heading', { name: /^Register$/i })).toBeTruthy();
    expect(screen.getByTestId('cloudflare-turnstile-container')).toBeTruthy();
    expect(screen.queryByLabelText(/Full Name/i)).toBeNull();

    const passwordInput = screen.getByLabelText(/^Password$/i) as HTMLInputElement;
    const confirmInput = screen.getByLabelText(/^Confirm Password$/i) as HTMLInputElement;

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(passwordInput, {
      target: { value: 'EnigmaPass123' },
    });
    fireEvent.change(confirmInput, {
      target: { value: 'EnigmaPass999' },
    });
    expect(await screen.findByText(/^Passwords do not match$/i)).toBeTruthy();

    fireEvent.change(confirmInput, {
      target: { value: 'EnigmaPass123' },
    });
    expect(await screen.findByText(/^Passwords match$/i)).toBeTruthy();

    const user = makeMockUser();
    const session = makeMockSession(user);
    mockFunctionsInvoke.mockImplementation(async (fnName: string) => {
      if (fnName === 'verify-turnstile') return { data: { verified: true }, error: null };
      if (fnName === 'register-user') return { data: { user: { id: user.id, email: user.email } }, error: null };
      return { data: null, error: null };
    });
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user, session },
      error: null,
    });

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(mockFunctionsInvoke).toHaveBeenCalledWith('verify-turnstile', {
        body: { token: 'mock-turnstile-token', action: 'register' },
      });
    });

    await waitFor(() => {
      expect(mockFunctionsInvoke).toHaveBeenCalledWith('register-user', {
        body: { email: 'ada@example.com', password: 'EnigmaPass123' },
      });
    });

    expect(await screen.findByText(/Machine Settings Dashboard/i)).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('shows currently under development inside Forgot Password and triggers Google OAuth', async () => {
    mockSignInWithOAuth.mockResolvedValue({ data: { provider: 'google', url: '' }, error: null });

    render(<App />);
    await screen.findByRole('heading', { name: /Welcome Back/i });

    fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }));
    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
    });

    fireEvent.click(screen.getByRole('button', { name: /Forgot password\?/i }));
    expect(await screen.findByRole('heading', { name: /Forgot Password/i })).toBeTruthy();
    expect(screen.getByText(/Currently under development/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Back to Sign In/i }));
    expect(await screen.findByRole('heading', { name: /Welcome Back/i })).toBeTruthy();
  });

  it('omits Turnstile on login, supports Feedback footer modal and guest entry, and gates registration on Turnstile', async () => {
    let captureCallback: ((token: string) => void) | undefined;
    window.turnstile = {
      render: (_el, options) => {
        captureCallback = options.callback;
        return 'mock-widget-gated';
      },
      reset: vi.fn(),
      remove: vi.fn(),
    };

    render(<App />);
    await screen.findByRole('heading', { name: /Welcome Back/i });
    expect(screen.queryByTestId('cloudflare-turnstile-container')).toBeNull();
    expect(screen.getByRole('button', { name: /^Feedback$/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Support Enigma\?/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /^Feedback$/i }));
    expect(await screen.findByRole('heading', { name: /^Feedback$/i })).toBeTruthy();
    expect(screen.getByText(/Currently under development/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Close$/i }));

    // Navigate to Register to verify Turnstile gating remains active there
    fireEvent.click(screen.getByRole('button', { name: /Create an account/i }));
    expect(await screen.findByRole('heading', { name: /^Register$/i })).toBeTruthy();
    expect(screen.getByTestId('cloudflare-turnstile-container')).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: 'EnigmaPass123' },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm Password$/i), {
      target: { value: 'EnigmaPass123' },
    });
    fireEvent.click(screen.getByRole('checkbox'));

    // Attempting Create Account before completing Turnstile shows bot check error
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
    expect(
      await screen.findByText(/Please complete the Cloudflare security check to block bots\./i)
    ).toBeTruthy();
    expect(screen.queryByText(/Machine Settings Dashboard/i)).toBeNull();

    // Completing Turnstile verifies via Edge Function and finishes signup
    const user = makeMockUser();
    const session = makeMockSession(user);
    mockFunctionsInvoke.mockImplementation(async (fnName: string) => {
      if (fnName === 'verify-turnstile') return { data: { verified: true }, error: null };
      if (fnName === 'register-user') {
        return { data: { user: { id: user.id, email: user.email } }, error: null };
      }
      return { data: null, error: null };
    });
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user, session },
      error: null,
    });

    act(() => {
      captureCallback?.('valid-turnstile-token');
    });
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
    await waitFor(() => {
      expect(mockFunctionsInvoke).toHaveBeenCalledWith('verify-turnstile', {
        body: { token: 'valid-turnstile-token', action: 'register' },
      });
    });
    expect(await screen.findByText(/Machine Settings Dashboard/i)).toBeTruthy();
  });
});
