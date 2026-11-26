import React, { useEffect, useRef } from 'react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

interface TurnstileRenderOptions {
  sitekey: string;
  action?: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
}

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function getTurnstileSiteKey(): string {
  return (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '').trim();
}

export function isTurnstileEnabled(): boolean {
  return Boolean(getTurnstileSiteKey());
}

export async function verifyTurnstileToken(
  token: string,
  action: 'login' | 'register' = 'login'
): Promise<{ error: string | null }> {
  if (!isTurnstileEnabled()) {
    return { error: null };
  }
  if (!token) {
    return { error: 'Please complete the Cloudflare security check to continue.' };
  }
  if (!isSupabaseConfigured || typeof supabase.functions?.invoke !== 'function') {
    return { error: 'Verification service is unavailable.' };
  }

  const { data, error } = await supabase.functions.invoke<{ verified?: boolean; error?: string }>(
    'verify-turnstile',
    {
      body: { token, action },
    }
  );

  if (error) {
    if (error && typeof error === 'object') {
      const ctx = (error as { context?: unknown }).context;
      if (ctx && typeof (ctx as Response).json === 'function') {
        try {
          const parsed = (await (ctx as Response).clone().json()) as { error?: unknown };
          if (typeof parsed?.error === 'string' && parsed.error.trim()) {
            return { error: parsed.error };
          }
        } catch {
          // Fall through
        }
      }
      const msg = (error as { message?: unknown }).message;
      if (typeof msg === 'string' && msg.trim()) {
        return { error: msg };
      }
    }
    return { error: 'Cloudflare security verification failed. Please try again.' };
  }

  if (!data?.verified) {
    return { error: data?.error ?? 'Cloudflare security verification failed. Please retry.' };
  }

  return { error: null };
}

interface TurnstileWidgetProps {
  action?: 'login' | 'register';
  resetKey?: number;
  verified?: boolean;
  onTokenChange: (token: string) => void;
  onError?: () => void;
}

const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TURNSTILE_POLL_INTERVAL_MS = 150;
const TURNSTILE_LOAD_TIMEOUT_MS = 12_000;

function ensureTurnstileScript(onScriptError: () => void): void {
  if (typeof document === 'undefined' || window.turnstile) return;
  const existing = document.querySelector<HTMLScriptElement>(
    'script[data-turnstile-script="true"], script[src*="challenges.cloudflare.com/turnstile"]'
  );
  if (existing) return;

  const script = document.createElement('script');
  script.src = TURNSTILE_SCRIPT_SRC;
  script.async = true;
  script.defer = true;
  script.dataset.turnstileScript = 'true';
  script.addEventListener('error', onScriptError, { once: true });
  document.head.appendChild(script);
}

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  action = 'login',
  resetKey = 0,
  verified = false,
  onTokenChange,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenChangeRef = useRef(onTokenChange);
  const onErrorRef = useRef(onError);
  const sitekey = getTurnstileSiteKey();

  onTokenChangeRef.current = onTokenChange;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!sitekey) return;

    let cancelled = false;
    let pollTimer: number | null = null;
    const startedAt = Date.now();

    const mountWidget = () => {
      if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) {
        return Boolean(widgetIdRef.current);
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey,
        action,
        theme: 'light',
        size: 'flexible',
        callback: (token: string) => {
          onTokenChangeRef.current(token);
        },
        'expired-callback': () => {
          onTokenChangeRef.current('');
        },
        'error-callback': () => {
          onTokenChangeRef.current('');
          onErrorRef.current?.();
        },
      });
      return true;
    };

    if (!mountWidget()) {
      ensureTurnstileScript(() => {
        if (!cancelled) {
          onErrorRef.current?.();
        }
      });

      pollTimer = window.setInterval(() => {
        if (mountWidget()) {
          if (pollTimer !== null) {
            window.clearInterval(pollTimer);
            pollTimer = null;
          }
          return;
        }
        if (Date.now() - startedAt >= TURNSTILE_LOAD_TIMEOUT_MS) {
          if (pollTimer !== null) {
            window.clearInterval(pollTimer);
            pollTimer = null;
          }
          if (!cancelled) {
            onErrorRef.current?.();
          }
        }
      }, TURNSTILE_POLL_INTERVAL_MS);
    }

    return () => {
      cancelled = true;
      if (pollTimer !== null) {
        window.clearInterval(pollTimer);
      }
      if (widgetIdRef.current && window.turnstile?.remove) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore unmount cleanup errors
        }
        widgetIdRef.current = null;
      }
    };
  }, [sitekey, action]);

  useEffect(() => {
    if (resetKey === 0) return;
    onTokenChangeRef.current('');
    if (widgetIdRef.current && window.turnstile?.reset) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        // Ignore reset failures
      }
    }
  }, [resetKey]);

  if (!sitekey) {
    return null;
  }

  return (
    <div
      data-testid="cloudflare-turnstile-container"
      className={`w-full h-[65px] rounded-xl overflow-hidden border transition-all bg-[#fafafa] ${
        verified
          ? 'border-emerald-300 ring-4 ring-emerald-500/10'
          : 'border-slate-200/90 shadow-sm'
      }`}
    >
      <div
        ref={containerRef}
        className="-mx-px -my-px w-[calc(100%+2px)] h-[65px] leading-none block [&>div]:!w-full [&>iframe]:!block [&>iframe]:!w-full [&>iframe]:!h-[65px]"
      />
    </div>
  );
};
