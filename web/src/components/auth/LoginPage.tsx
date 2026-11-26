import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getRememberedEmail } from '../../lib/supabase';
import { validateEmail, validateLoginPassword } from '../../utils/authValidation';
import { AuthLayout } from './AuthLayout';
import { LoginRotorIllustration } from './AuthIllustrations';
import { GoogleIcon } from './GoogleIcon';

interface LoginPageProps {
  onNavigateRegister: () => void;
  onAuthSuccess: () => void;
  onCancelAddAccount?: () => void;
  onVisitLanding?: () => void;
  initialMode?: 'login' | 'forgot';
}

type FieldErrors = {
  email?: string | null;
  password?: string | null;
};

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateRegister,
  onAuthSuccess,
  onCancelAddAccount,
  onVisitLanding,
  initialMode = 'login',
}) => {
  const {
    oauthError,
    rememberMe,
    setRememberMe,
    clearOAuthError,
    continueAsGuest,
    signInWithPassword,
    sendPasswordResetEmail,
    signInWithGoogle,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'forgot'>(initialMode);
  const [email, setEmail] = useState<string>(() => getRememberedEmail());
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pasteNotice, setPasteNotice] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [resetEmailSentTo, setResetEmailSentTo] = useState<string | null>(null);
  const [resetCooldown, setResetCooldown] = useState(0);
  const [resetSuccessNotice, setResetSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = window.setTimeout(() => {
      setResetCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resetCooldown]);

  const displayError = serverError ?? oauthError;

  const switchMode = (nextMode: 'login' | 'forgot') => {
    setMode(nextMode);
    setFieldErrors({});
    setServerError(null);
    setPasteNotice(false);
    setResetEmailSentTo(null);
    setResetCooldown(0);
    setResetSuccessNotice(null);
    clearOAuthError();
  };

  const blockClipboardAction = (e: React.ClipboardEvent | React.DragEvent) => {
    e.preventDefault();
    if (e.type === 'paste' || e.type === 'drop') {
      setPasteNotice(true);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearOAuthError();
    setServerError(null);

    const emailErr = validateEmail(email);
    const passwordErr = validateLoginPassword(password);

    if (emailErr || passwordErr) {
      setFieldErrors({ email: emailErr, password: passwordErr });
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const result = await signInWithPassword(email, password, rememberMe);
      if (result.error) {
        setServerError(result.error);
        return;
      }

      onAuthSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearOAuthError();
    setServerError(null);
    setResetSuccessNotice(null);

    const emailErr = validateEmail(email);
    if (emailErr) {
      setFieldErrors({ email: emailErr });
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const result = await sendPasswordResetEmail(email);
      if (result.error) {
        setServerError(result.error);
        return;
      }

      setResetEmailSentTo(email.trim().toLowerCase());
      setResetCooldown(60);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendResetEmail = async () => {
    if (!resetEmailSentTo || submitting || resetCooldown > 0) return;
    clearOAuthError();
    setServerError(null);
    setResetSuccessNotice(null);
    setSubmitting(true);
    try {
      const result = await sendPasswordResetEmail(resetEmailSentTo);
      if (result.error) {
        setServerError(result.error);
        return;
      }

      setResetCooldown(60);
      setResetSuccessNotice(
        'Password reset link sent again. Please check your inbox and spam folder.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearOAuthError();
    setServerError(null);
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        setServerError(result.error);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    clearOAuthError();
    setServerError(null);
    continueAsGuest();
    onAuthSuccess();
  };

  const leftHero = (
    <div className="space-y-4 w-full flex flex-col items-center lg:items-start">
      <div className="space-y-2.5 max-w-lg">
        <h1 className="text-2xl sm:text-3xl lg:text-[2.35rem] font-bold tracking-tight text-[#111c4e] leading-[1.15]">
          Secure your messages<span className="text-[#f97316]">.</span>
        </h1>
        <p className="text-xs sm:text-sm font-normal text-[#253263]/85 leading-relaxed">
          Access your Enigma96 workspace and continue encrypting with precision.
        </p>
      </div>

      <div className="w-full flex justify-center lg:justify-start pt-1">
        <LoginRotorIllustration />
      </div>
    </div>
  );

  const rightCard = (
    <div className="glass-auth-card rounded-[2rem] p-4 sm:p-5 w-full max-w-[440px]">
      {mode === 'login' && (
        <>
          {/* Card Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="glass-icon-tile w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#111c4e] tracking-tight">Welcome Back</h2>
              <p className="text-xs font-normal text-[#3b476e] mt-0.5">
                Sign in to your account
              </p>
            </div>
          </div>

          {/* Global Error Alert */}
          {displayError && (
            <div
              role="alert"
              className="mb-2.5 rounded-xl bg-red-50/90 border border-red-200 px-3 py-2 flex items-start gap-2 text-xs font-medium text-red-700"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} noValidate className="space-y-2.5">
            {/* Email Field */}
            <div className="space-y-1">
              <label htmlFor="login-email" className="block text-xs font-semibold text-[#111c4e]">
                Email Address
              </label>
              <div
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 bg-[#f4f7fc]/90 border transition-all ${
                  fieldErrors.email
                    ? 'border-red-400 focus-within:ring-4 focus-within:ring-red-500/10'
                    : 'border-slate-200/90 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10'
                }`}
              >
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
                    }
                  }}
                  placeholder="you@example.com"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
                  className="w-full bg-transparent text-xs sm:text-sm font-normal text-[#111c4e] placeholder-slate-400 focus:outline-none"
                />
              </div>
              {fieldErrors.email && (
                <p id="login-email-error" className="text-[11px] font-medium text-red-600">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field (manual typing only — copy/paste/cut/drop blocked) */}
            <div className="space-y-1">
              <label htmlFor="login-password" className="block text-xs font-semibold text-[#111c4e]">
                Password
              </label>
              <div
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 bg-[#f4f7fc]/90 border transition-all ${
                  fieldErrors.password
                    ? 'border-red-400 focus-within:ring-4 focus-within:ring-red-500/10'
                    : 'border-slate-200/90 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10'
                }`}
              >
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onPaste={blockClipboardAction}
                  onCopy={blockClipboardAction}
                  onCut={blockClipboardAction}
                  onDrop={blockClipboardAction}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasteNotice(false);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        password: validateLoginPassword(e.target.value),
                      }));
                    }
                  }}
                  placeholder="Enter your password"
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                  className="w-full bg-transparent text-xs sm:text-sm font-normal text-[#111c4e] placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-slate-500 hover:text-[#111c4e] p-0.5 rounded focus:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="login-password-error" className="text-[11px] font-medium text-red-600">
                  {fieldErrors.password}
                </p>
              )}
              {pasteNotice && !fieldErrors.password && (
                <p className="text-[11px] font-medium text-amber-700">
                  Copy and paste is disabled for password fields. Please type manually.
                </p>
              )}
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <label className="inline-flex items-center gap-2 text-xs font-normal text-[#111c4e] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {/* Primary CTA */}
            <button
              type="submit"
              disabled={submitting || googleLoading}
              className="glass-primary-cta w-full rounded-full py-2.5 px-5 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* OR Divider */}
          <div className="flex items-center gap-3 my-2.5">
            <span className="h-px flex-1 bg-slate-200/90" />
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">OR</span>
            <span className="h-px flex-1 bg-slate-200/90" />
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={submitting || googleLoading}
            className="w-full rounded-full py-2 px-5 bg-white/95 hover:bg-blue-50/40 border border-blue-400/75 text-xs sm:text-sm font-semibold text-[#111c4e] flex items-center justify-center gap-2.5 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <GoogleIcon className="w-4 h-4 shrink-0" />
            )}
            <span>Sign in with Google</span>
          </button>

          {/* Continue as Guest (matches Sign In button design) */}
          <button
            type="button"
            onClick={handleContinueAsGuest}
            disabled={submitting || googleLoading}
            className="glass-primary-cta mt-2 w-full rounded-full py-2.5 px-5 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Continue as Guest</span>
          </button>

          {/* Switch to Register */}
          <p className="text-center text-xs font-normal text-[#111c4e]/85 mt-3">
            New to ENIGMA96?{' '}
            <button
              type="button"
              onClick={onNavigateRegister}
              className="font-semibold text-[#f97316] hover:text-orange-600 hover:underline cursor-pointer"
            >
              Create an account
            </button>
          </p>

          {onCancelAddAccount && (
            <button
              type="button"
              onClick={onCancelAddAccount}
              className="mt-2 w-full text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to active session</span>
            </button>
          )}
        </>
      )}

      {mode === 'forgot' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="glass-icon-tile w-11 h-11 rounded-2xl flex items-center justify-center shrink-0">
              {resetEmailSentTo ? (
                <MailCheck className="w-5 h-5 text-white" />
              ) : (
                <KeyRound className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#111c4e] tracking-tight">
                {resetEmailSentTo ? 'Check Your Email' : 'Forgot Password'}
              </h2>
              <p className="text-xs font-normal text-[#3b476e] mt-0.5">
                {resetEmailSentTo
                  ? 'Follow the link in your inbox to reset your password'
                  : 'Enter your account email to receive a reset link'}
              </p>
            </div>
          </div>

          {displayError && (
            <div
              role="alert"
              className="rounded-xl bg-red-50/90 border border-red-200 px-3 py-2 flex items-start gap-2 text-xs font-medium text-red-700"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{displayError}</span>
            </div>
          )}

          {resetSuccessNotice && (
            <div
              role="status"
              className="rounded-xl bg-emerald-50/90 border border-emerald-200 px-3 py-2 flex items-start gap-2 text-xs font-medium text-emerald-700"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{resetSuccessNotice}</span>
            </div>
          )}

          {resetEmailSentTo ? (
            <div className="space-y-3">
              <div className="rounded-2xl bg-blue-50/85 border border-blue-200/80 px-4 py-4 space-y-2 text-xs text-[#111c4e]">
                <p className="font-medium leading-relaxed">
                  We sent a password reset link to{' '}
                  <span className="font-bold text-blue-700 break-all">{resetEmailSentTo}</span>.
                </p>
                <p className="text-[#3b476e] leading-relaxed">
                  Open the email and click the reset link to open the password reset page and choose
                  a new password.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResendResetEmail}
                disabled={submitting || resetCooldown > 0}
                className="w-full rounded-full py-2.5 px-5 bg-white/95 hover:bg-blue-50/40 border border-blue-400/75 text-xs sm:text-sm font-semibold text-[#111c4e] flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : resetCooldown > 0 ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-slate-400" />
                    <span>Resend email in {resetCooldown}s</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                    <span>Resend Reset Link</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setResetEmailSentTo(null);
                    setResetCooldown(0);
                    setResetSuccessNotice(null);
                    setServerError(null);
                  }}
                  className="font-semibold text-[#3b476e] hover:text-[#111c4e] hover:underline cursor-pointer"
                >
                  Use a different email
                </button>

                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit} noValidate className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="forgot-email" className="block text-xs font-semibold text-[#111c4e]">
                  Email Address
                </label>
                <div
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 bg-[#f4f7fc]/90 border transition-all ${
                    fieldErrors.email
                      ? 'border-red-400 focus-within:ring-4 focus-within:ring-red-500/10'
                      : 'border-slate-200/90 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10'
                  }`}
                >
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
                      }
                    }}
                    placeholder="you@example.com"
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? 'forgot-email-error' : undefined}
                    className="w-full bg-transparent text-xs sm:text-sm font-normal text-[#111c4e] placeholder-slate-400 focus:outline-none"
                  />
                </div>
                {fieldErrors.email && (
                  <p id="forgot-email-error" className="text-[11px] font-medium text-red-600">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="glass-primary-cta w-full rounded-full py-2.5 px-5 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full pt-1 text-xs font-semibold text-[#3b476e] hover:text-[#111c4e] hover:underline inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );

  return (
    <AuthLayout
      leftColumn={leftHero}
      rightColumn={rightCard}
      onVisitLanding={onVisitLanding}
    />
  );
};
