import { createClient, type SupabaseClient, type SupportedStorage } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const REMEMBER_ME_STORAGE_KEY = 'enigma96_remember_me';
const REMEMBERED_EMAIL_KEY = 'enigma96_remembered_email';

export function getRememberMePreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(REMEMBER_ME_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setRememberMePreference(remember: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(REMEMBER_ME_STORAGE_KEY, remember ? 'true' : 'false');
    if (!remember) {
      window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }
  } catch {
    // Ignore storage access errors in restricted browser contexts
  }
}

export function getRememberedEmail(): string {
  if (typeof window === 'undefined') return '';
  try {
    if (!getRememberMePreference()) return '';
    return window.localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveRememberedEmail(email: string, remember: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    setRememberMePreference(remember);
    if (remember && email.trim()) {
      window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
    } else {
      window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }
  } catch {
    // Ignore storage access errors
  }
}

/**
 * Storage adapter routing Supabase session keys to localStorage when
 * "Remember me" is enabled or sessionStorage for single-tab sessions.
 */
const adaptiveAuthStorage: SupportedStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      if (getRememberMePreference()) {
        window.localStorage.setItem(key, value);
        window.sessionStorage.removeItem(key);
      } else {
        window.sessionStorage.setItem(key, value);
        window.localStorage.removeItem(key);
      }
    } catch {
      // Ignore storage quota / privacy mode errors
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch {
      // Ignore storage access errors
    }
  },
};

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  ''
).trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

// Fallback placeholder prevents createClient from throwing during unit tests when .env is absent
const resolvedUrl = supabaseUrl || 'https://placeholder.supabase.co';
const resolvedKey = supabasePublishableKey || 'sb_publishable_placeholder';

export const supabase: SupabaseClient<Database> = createClient<Database>(
  resolvedUrl,
  resolvedKey,
  {
    auth: {
      storage: adaptiveAuthStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export function getAuthRedirectUrl(path = '/'): string {
  if (typeof window === 'undefined') return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${window.location.origin}${cleanPath}`;
}
