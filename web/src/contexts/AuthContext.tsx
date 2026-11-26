import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import {
  getAuthRedirectUrl,
  getRememberMePreference,
  isSupabaseConfigured,
  saveRememberedEmail,
  setRememberMePreference,
  supabase,
} from '../lib/supabase';

const SAVED_ACCOUNTS_STORAGE_KEY = 'enigma96_saved_accounts';
const GUEST_MODE_STORAGE_KEY = 'enigma96_guest_mode';

export interface SavedAccount {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

export interface AuthActionResult {
  error: string | null;
}

export interface SignUpActionResult extends AuthActionResult {
  needsEmailVerification?: boolean;
  email?: string;
}

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isGuest: boolean;
  isPasswordRecovery: boolean;
  oauthError: string | null;
  rememberMe: boolean;
  savedAccounts: SavedAccount[];
  isAddingAccount: boolean;
  setRememberMe: (value: boolean) => void;
  clearOAuthError: () => void;
  continueAsGuest: () => void;
  exitGuest: () => void;
  startAddAccount: () => void;
  cancelAddAccount: () => void;
  switchAccount: (accountId: string) => Promise<AuthActionResult>;
  removeSavedAccount: (accountId: string) => Promise<AuthActionResult>;
  signInWithPassword: (email: string, password: string, remember?: boolean) => Promise<AuthActionResult>;
  signUpWithEmail: (email: string, password: string) => Promise<SignUpActionResult>;
  resendVerificationEmail: (email: string) => Promise<AuthActionResult>;
  sendPasswordResetEmail: (email: string) => Promise<AuthActionResult>;
  updatePassword: (newPassword: string) => Promise<AuthActionResult>;
  completePasswordRecovery: () => void;
  signInWithGoogle: () => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
  displayName: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readGuestMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(GUEST_MODE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeGuestMode(active: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (active) {
      window.sessionStorage.setItem(GUEST_MODE_STORAGE_KEY, 'true');
    } else {
      window.sessionStorage.removeItem(GUEST_MODE_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

function readSavedAccounts(): SavedAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SAVED_ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SavedAccount =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.email === 'string' &&
        typeof item.accessToken === 'string' &&
        typeof item.refreshToken === 'string'
    );
  } catch {
    return [];
  }
}

function writeSavedAccounts(accounts: SavedAccount[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SAVED_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // Ignore storage quota errors
  }
}

function upsertAccountFromSession(
  existing: SavedAccount[],
  nextSession: Session | null
): SavedAccount[] {
  const sessionUser = nextSession?.user;
  if (!nextSession || !sessionUser?.id || !sessionUser.email) {
    return existing;
  }

  const updated: SavedAccount = {
    id: sessionUser.id,
    email: sessionUser.email,
    accessToken: nextSession.access_token,
    refreshToken: nextSession.refresh_token,
  };

  const filtered = existing.filter((acc) => acc.id !== updated.id);
  return [updated, ...filtered];
}

export function mapAuthError(rawMessage: string | undefined | null): string {
  if (!rawMessage) {
    return 'An unexpected authentication error occurred. Please try again.';
  }

  const lower = rawMessage.toLowerCase();

  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
    return 'Incorrect email or password. Please verify your credentials and try again.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Please verify your email address first. Check your inbox and click the verification link before signing in.';
  }
  if (
    lower.includes('email link is invalid or has expired') ||
    lower.includes('token has expired') ||
    lower.includes('otp_expired') ||
    lower.includes('invalid otp') ||
    lower.includes('token is invalid')
  ) {
    return 'Your verification link or session has expired. Please register or sign in again.';
  }
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'An account with this email address already exists. Try signing in instead.';
  }
  if (lower.includes('password should be at least') || lower.includes('weak password')) {
    return 'Password is too weak. Please use at least 8 characters with a mix of letters and numbers.';
  }
  if (lower.includes('new password should be different') || lower.includes('same_password')) {
    return 'Your new password must be different from your current password.';
  }
  if (lower.includes('email rate limit') || lower.includes('over_email_send_rate_limit')) {
    return 'Authentication email rate limit reached. Please wait a moment before trying again.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }
  if (lower.includes('unsupported provider') || lower.includes('provider is not enabled')) {
    return 'Google sign-in is not yet enabled on the Supabase project. Enable Google in Authentication → Providers to use OAuth.';
  }
  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return 'Unable to reach the authentication server. Check your internet connection and try again.';
  }

  return rawMessage;
}

function hasRecoveryUrlIndicator(): boolean {
  if (typeof window === 'undefined') return false;
  const searchParams = new URLSearchParams(window.location.search);
  const hashString = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hashString);
  if (
    searchParams.get('error') ||
    searchParams.get('error_description') ||
    hashParams.get('error') ||
    hashParams.get('error_description')
  ) {
    return false;
  }
  if (hashParams.get('type') === 'recovery') return true;
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return path === '/reset-password' && Boolean(searchParams.get('code') || hashParams.get('access_token'));
}

function extractUrlAuthError(): string | null {
  if (typeof window === 'undefined') return null;
  const searchParams = new URLSearchParams(window.location.search);
  const hashString = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hashString);

  const errDesc =
    searchParams.get('error_description') ||
    hashParams.get('error_description') ||
    searchParams.get('error') ||
    hashParams.get('error');

  if (!errDesc) return null;

  if (window.history?.replaceState) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  return mapAuthError(decodeURIComponent(errDesc.replace(/\+/g, ' ')));
}

export function resolveDisplayName(user: User | null): string {
  if (!user) return '';
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const fullName =
    (typeof meta?.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta?.name === 'string' && meta.name.trim());
  if (fullName) return fullName;
  if (user.email) return user.email.split('@')[0] ?? user.email;
  return 'Cipher Operator';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);
  const [isGuest, setIsGuest] = useState<boolean>(() => readGuestMode());
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(() =>
    hasRecoveryUrlIndicator()
  );
  const [oauthError, setOAuthError] = useState<string | null>(() => extractUrlAuthError());
  const [rememberMe, setRememberMeState] = useState<boolean>(() => getRememberMePreference());
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>(() => readSavedAccounts());
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  const completePasswordRecovery = useCallback(() => {
    setIsPasswordRecovery(false);
  }, []);

  const syncSavedAccounts = useCallback((nextSession: Session | null) => {
    if (!nextSession) return;
    setSavedAccounts((prev) => {
      const next = upsertAccountFromSession(prev, nextSession);
      writeSavedAccounts(next);
      return next;
    });
  }, []);

  const setRememberMe = useCallback((value: boolean) => {
    setRememberMeState(value);
    setRememberMePreference(value);
  }, []);

  const clearOAuthError = useCallback(() => setOAuthError(null), []);
  const startAddAccount = useCallback(() => setIsAddingAccount(true), []);
  const cancelAddAccount = useCallback(() => setIsAddingAccount(false), []);

  const continueAsGuest = useCallback(() => {
    setIsGuest(true);
    writeGuestMode(true);
    setIsAddingAccount(false);
  }, []);

  const exitGuest = useCallback(() => {
    setIsGuest(false);
    writeGuestMode(false);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error('Failed to restore Supabase session:', error);
        }
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
        if (data.session) {
          setIsGuest(false);
          writeGuestMode(false);
          syncSavedAccounts(data.session);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Unexpected session restoration error:', err);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setIsAddingAccount(false);
      } else if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false);
      }
      if (nextSession) {
        setIsGuest(false);
        writeGuestMode(false);
        syncSavedAccounts(nextSession);
        if (event === 'SIGNED_IN') {
          setIsAddingAccount(false);
        }
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncSavedAccounts]);

  const signInWithPassword = useCallback(
    async (email: string, password: string, remember = rememberMe): Promise<AuthActionResult> => {
      if (!isSupabaseConfigured) {
        return { error: 'Supabase environment variables are missing.' };
      }

      const trimmedEmail = email.trim().toLowerCase();
      saveRememberedEmail(trimmedEmail, remember);
      setRememberMeState(remember);

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (error) {
          return { error: mapAuthError(error.message) };
        }

        setSession(data.session ?? null);
        setUser(data.user ?? data.session?.user ?? null);
        setIsGuest(false);
        writeGuestMode(false);
        syncSavedAccounts(data.session ?? null);
        setIsAddingAccount(false);
        return { error: null };
      } catch (err) {
        return { error: mapAuthError(err instanceof Error ? err.message : undefined) };
      }
    },
    [rememberMe, syncSavedAccounts]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string): Promise<SignUpActionResult> => {
      if (!isSupabaseConfigured) {
        return { error: 'Supabase environment variables are missing.' };
      }

      const trimmedEmail = email.trim().toLowerCase();

      try {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: getAuthRedirectUrl('/'),
          },
        });

        if (error) {
          return { error: mapAuthError(error.message) };
        }

        // Supabase returns empty identities when a confirmed user with this email already exists
        if (
          data.user &&
          Array.isArray(data.user.identities) &&
          data.user.identities.length === 0
        ) {
          return {
            error: 'An account with this email address already exists. Please sign in instead.',
          };
        }

        if (data.session) {
          setSession(data.session);
          setUser(data.user ?? data.session.user);
          setIsGuest(false);
          writeGuestMode(false);
          syncSavedAccounts(data.session);
          setIsAddingAccount(false);
          return { error: null, needsEmailVerification: false, email: trimmedEmail };
        }

        return { error: null, needsEmailVerification: true, email: trimmedEmail };
      } catch (err) {
        return { error: mapAuthError(err instanceof Error ? err.message : undefined) };
      }
    },
    [syncSavedAccounts]
  );

  const resendVerificationEmail = useCallback(
    async (email: string): Promise<AuthActionResult> => {
      if (!isSupabaseConfigured) {
        return { error: 'Supabase environment variables are missing.' };
      }

      const trimmedEmail = email.trim().toLowerCase();

      try {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: trimmedEmail,
          options: {
            emailRedirectTo: getAuthRedirectUrl('/'),
          },
        });

        if (error) {
          return { error: mapAuthError(error.message) };
        }

        return { error: null };
      } catch (err) {
        return { error: mapAuthError(err instanceof Error ? err.message : undefined) };
      }
    },
    []
  );

  const sendPasswordResetEmail = useCallback(async (email: string): Promise<AuthActionResult> => {
    if (!isSupabaseConfigured) {
      return { error: 'Supabase environment variables are missing.' };
    }

    const trimmedEmail = email.trim().toLowerCase();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: getAuthRedirectUrl('/reset-password'),
      });

      if (error) {
        return { error: mapAuthError(error.message) };
      }

      return { error: null };
    } catch (err) {
      return { error: mapAuthError(err instanceof Error ? err.message : undefined) };
    }
  }, []);

  const updatePassword = useCallback(
    async (newPassword: string): Promise<AuthActionResult> => {
      if (!isSupabaseConfigured) {
        return { error: 'Supabase environment variables are missing.' };
      }

      try {
        const { data, error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          return { error: mapAuthError(error.message) };
        }

        if (data.user) {
          setUser(data.user);
        }

        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          setSession(sessionData.session);
          syncSavedAccounts(sessionData.session);
        }

        return { error: null };
      } catch (err) {
        return { error: mapAuthError(err instanceof Error ? err.message : undefined) };
      }
    },
    [syncSavedAccounts]
  );

  const signInWithGoogle = useCallback(async (): Promise<AuthActionResult> => {
    if (!isSupabaseConfigured) {
      return { error: 'Supabase environment variables are missing.' };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getAuthRedirectUrl('/'),
        },
      });

      if (error) {
        return { error: mapAuthError(error.message) };
      }

      return { error: null };
    } catch (err) {
      return { error: mapAuthError(err instanceof Error ? err.message : undefined) };
    }
  }, []);

  const switchAccount = useCallback(
    async (accountId: string): Promise<AuthActionResult> => {
      const target = savedAccounts.find((acc) => acc.id === accountId);
      if (!target) {
        return { error: 'Saved account not found.' };
      }
      if (user?.id === accountId) {
        setIsAddingAccount(false);
        return { error: null };
      }

      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: target.accessToken,
          refresh_token: target.refreshToken,
        });

        if (error || !data.session) {
          setSavedAccounts((prev) => {
            const next = prev.filter((acc) => acc.id !== accountId);
            writeSavedAccounts(next);
            return next;
          });
          return { error: 'Session expired for that account. Please sign in again.' };
        }

        setSession(data.session);
        setUser(data.session.user);
        setIsGuest(false);
        writeGuestMode(false);
        syncSavedAccounts(data.session);
        setIsAddingAccount(false);
        return { error: null };
      } catch (err) {
        return { error: mapAuthError(err instanceof Error ? err.message : undefined) };
      }
    },
    [savedAccounts, user?.id, syncSavedAccounts]
  );

  const signOut = useCallback(async (): Promise<AuthActionResult> => {
    const activeId = user?.id;
    if (activeId) {
      setSavedAccounts((prev) => {
        const next = prev.filter((acc) => acc.id !== activeId);
        writeSavedAccounts(next);
        return next;
      });
    }

    setIsAddingAccount(false);
    setIsPasswordRecovery(false);
    setIsGuest(false);
    writeGuestMode(false);

    if (!isSupabaseConfigured) {
      setSession(null);
      setUser(null);
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        return { error: mapAuthError(error.message) };
      }

      setSession(null);
      setUser(null);
      return { error: null };
    } catch (err) {
      return { error: mapAuthError(err instanceof Error ? err.message : undefined) };
    }
  }, [user?.id]);

  const removeSavedAccount = useCallback(
    async (accountId: string): Promise<AuthActionResult> => {
      if (user?.id === accountId) {
        return signOut();
      }

      setSavedAccounts((prev) => {
        const next = prev.filter((acc) => acc.id !== accountId);
        writeSavedAccounts(next);
        return next;
      });
      return { error: null };
    },
    [user?.id, signOut]
  );

  const displayName = useMemo(() => resolveDisplayName(user), [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      isConfigured: isSupabaseConfigured,
      isGuest,
      isPasswordRecovery,
      oauthError,
      rememberMe,
      savedAccounts,
      isAddingAccount,
      setRememberMe,
      clearOAuthError,
      continueAsGuest,
      exitGuest,
      startAddAccount,
      cancelAddAccount,
      switchAccount,
      removeSavedAccount,
      signInWithPassword,
      signUpWithEmail,
      resendVerificationEmail,
      sendPasswordResetEmail,
      updatePassword,
      completePasswordRecovery,
      signInWithGoogle,
      signOut,
      displayName,
    }),
    [
      user,
      session,
      loading,
      isGuest,
      isPasswordRecovery,
      oauthError,
      rememberMe,
      savedAccounts,
      isAddingAccount,
      setRememberMe,
      clearOAuthError,
      continueAsGuest,
      exitGuest,
      startAddAccount,
      cancelAddAccount,
      switchAccount,
      removeSavedAccount,
      signInWithPassword,
      signUpWithEmail,
      resendVerificationEmail,
      sendPasswordResetEmail,
      updatePassword,
      completePasswordRecovery,
      signInWithGoogle,
      signOut,
      displayName,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }
  return ctx;
}
