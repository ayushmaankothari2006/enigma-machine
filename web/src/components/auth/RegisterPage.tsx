import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  RefreshCw,
  User,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  validateConfirmPassword,
  validateEmail,
  validateNewPassword,
} from '../../utils/authValidation';
import { AuthLayout } from './AuthLayout';
import { RegisterSecurityIllustration } from './AuthIllustrations';
import { GoogleIcon } from './GoogleIcon';
import {
  TurnstileWidget,
  isTurnstileEnabled,
  verifyTurnstileToken,
} from './TurnstileWidget';

interface RegisterPageProps {
  onNavigateLogin: () => void;
  onAuthSuccess: () => void;
  onVisitLanding?: () => void;
}

type RegisterFieldErrors = {
  email?: string | null;
  password?: string | null;
  confirmPassword?: string | null;
  terms?: string | null;
};

const FEATURE_BADGES = [
  {
    icon: Lock,
    title: 'Secure & Private',
    subtitle: 'Your data stays yours.',
  },
  {
    icon: Zap,
    title: 'Powerful Tools',
    subtitle: 'Modern 96-character cipher engine.',
  },
  {
    icon: BarChart2,
    title: 'Built for Innovators',
    subtitle: 'Decode, analyze and more.',
  },
] as const;

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigateLogin,
  onAuthSuccess,
  onVisitLanding,
}) => {
  const { signUpWithEmail, resendVerificationEmail, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pasteNotice, setPasteNotice] = useState<'password' | 'confirm' | null>(null);

  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!legalModal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLegalModal(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [legalModal]);

  const hasBothPasswords = password.length > 0 || confirmPassword.length > 0;
  const showLiveMatchStatus = confirmPassword.length > 0 && hasBothPasswords;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const verifyBotChallenge = async (): Promise<boolean> => {
    if (!isTurnstileEnabled()) return true;
    if (!turnstileToken) {
      setServerError('Please complete the Cloudflare security check to block bots.');
      return false;
    }
    const { error } = await verifyTurnstileToken(turnstileToken, 'register');
    setTurnstileResetKey((prev) => prev + 1);
    setTurnstileToken('');
    if (error) {
      setServerError(error);
      return false;
    }
    return true;
  };

  const blockClipboardAction =
    (field: 'password' | 'confirm') => (e: React.ClipboardEvent | React.DragEvent) => {
      e.preventDefault();
      if (e.type === 'paste' || e.type === 'drop') {
        setPasteNotice(field);
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const emailErr = validateEmail(email);
    const passErr = validateNewPassword(password);
    const confirmErr = validateConfirmPassword(password, confirmPassword);
    const termsErr = agreedTerms ? null : 'You must agree to the Terms of Service and Privacy Policy.';

    if (emailErr || passErr || confirmErr || termsErr) {
      setFieldErrors({
        email: emailErr,
        password: passErr,
        confirmPassword: confirmErr,
        terms: termsErr,
      });
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const captchaPassed = await verifyBotChallenge();
      if (!captchaPassed) {
        return;
      }

      const outcome = await signUpWithEmail(email, password);
      if (outcome.error) {
        setServerError(outcome.error);
        return;
      }

      if (outcome.needsEmailVerification) {
        setPendingVerificationEmail(outcome.email ?? email.trim().toLowerCase());
        setResendCooldown(60);
        setResendNotice(null);
        setPassword('');
        setConfirmPassword('');
        return;
      }

      onAuthSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!pendingVerificationEmail || resending || resendCooldown > 0) return;
    setServerError(null);
    setResendNotice(null);
    setResending(true);
    try {
      const result = await resendVerificationEmail(pendingVerificationEmail);
      if (result.error) {
        setServerError(result.error);
        return;
      }
      setResendCooldown(60);
      setResendNotice('Verification email sent again. Please check your inbox and spam folder.');
    } finally {
      setResending(false);
    }
  };

  const handleUseDifferentEmail = () => {
    setPendingVerificationEmail(null);
    setServerError(null);
    setResendNotice(null);
    setResendCooldown(0);
    setTurnstileResetKey((prev) => prev + 1);
    setTurnstileToken('');
  };

  const handleGoogleSignUp = async () => {
    setServerError(null);
    setGoogleLoading(true);
    try {
      const captchaPassed = await verifyBotChallenge();
      if (!captchaPassed) {
        return;
      }

      const result = await signInWithGoogle();
      if (result.error) {
        setServerError(result.error);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const leftHero = (
    <div className="space-y-3 w-full flex flex-col items-center lg:items-start">
      <div className="space-y-1.5 max-w-lg">
        <h1 className="text-2xl sm:text-3xl lg:text-[2.2rem] font-bold tracking-tight text-[#111c4e] leading-[1.15]">
          Create Your Account<span className="text-[#f97316]">.</span>
        </h1>
        <p className="text-xs sm:text-sm font-normal text-[#253263]/85 leading-relaxed">
          Join ENIGMA96 and start exploring advanced cryptography tools.
        </p>
      </div>

      {/* Three Feature Badges */}
      <div className="w-full max-w-md space-y-2">
        {FEATURE_BADGES.map(({ icon: Icon, title, subtitle }) => (
          <div
            key={title}
            className="glass-feature-badge rounded-2xl px-3.5 py-2 flex items-center gap-3 text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-white shadow-[0_4px_12px_rgba(37,99,235,0.12)] border border-blue-50 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-[#111c4e] leading-snug">{title}</div>
              <div className="text-[11px] font-normal text-[#3b476e] truncate">{subtitle}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Isometric Padlock Illustration */}
      <div className="w-full flex justify-center lg:justify-start">
        <RegisterSecurityIllustration />
      </div>
    </div>
  );

  const rightCard = pendingVerificationEmail ? (
    <div className="glass-auth-card rounded-[2rem] p-5 sm:p-6 w-full max-w-[440px] space-y-4">
      <div className="flex items-center gap-3">
        <div className="glass-icon-tile w-11 h-11 rounded-2xl flex items-center justify-center shrink-0">
          <MailCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#111c4e] tracking-tight leading-tight">
            Verify Your Email
          </h2>
          <p className="text-[11px] sm:text-xs font-normal text-[#3b476e]">
            Confirm your inbox to activate your account
          </p>
        </div>
      </div>

      {serverError && (
        <div
          role="alert"
          className="rounded-xl bg-red-50/90 border border-red-200 px-3 py-2 flex items-start gap-2 text-xs font-medium text-red-700"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {resendNotice && (
        <div
          role="status"
          className="rounded-xl bg-emerald-50/90 border border-emerald-200 px-3 py-2 flex items-start gap-2 text-xs font-medium text-emerald-700"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{resendNotice}</span>
        </div>
      )}

      <div className="rounded-2xl bg-blue-50/85 border border-blue-200/80 px-4 py-4 space-y-2 text-xs text-[#111c4e]">
        <p className="font-medium leading-relaxed">
          We sent a verification link to{' '}
          <span className="font-bold text-blue-700 break-all">{pendingVerificationEmail}</span>.
        </p>
        <p className="text-[#3b476e] leading-relaxed">
          Open the email and click the <strong>Verify</strong> button to activate your account and
          sign in. Unverified accounts cannot log in and expired unverified registrations are
          automatically purged.
        </p>
      </div>

      <button
        type="button"
        onClick={handleResendVerification}
        disabled={resending || resendCooldown > 0}
        className="w-full rounded-full py-2.5 px-5 bg-white/95 hover:bg-blue-50/40 border border-blue-400/75 text-xs sm:text-sm font-semibold text-[#111c4e] flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {resending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Sending Verification Email...</span>
          </>
        ) : resendCooldown > 0 ? (
          <>
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span>Resend email in {resendCooldown}s</span>
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 text-blue-600" />
            <span>Resend Verification Email</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-between gap-2 pt-1 text-xs">
        <button
          type="button"
          onClick={handleUseDifferentEmail}
          className="font-semibold text-[#3b476e] hover:text-[#111c4e] hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Use a different email</span>
        </button>

        <button
          type="button"
          onClick={onNavigateLogin}
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  ) : (
    <div className="glass-auth-card rounded-[2rem] p-4 sm:p-5 w-full max-w-[440px]">
      {/* Card Header */}
      <div className="flex items-center gap-3 mb-2.5">
        <div className="glass-icon-tile w-10 h-10 rounded-2xl flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#111c4e] tracking-tight leading-tight">
            Register
          </h2>
          <p className="text-[11px] sm:text-xs font-normal text-[#3b476e]">
            Create your account to get started
          </p>
        </div>
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <div
          role="alert"
          className="mb-2 rounded-xl bg-red-50/90 border border-red-200 px-3 py-1.5 flex items-start gap-2 text-xs font-medium text-red-700"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-2">
        {/* Email Address */}
        <div className="space-y-0.5">
          <label htmlFor="register-email" className="block text-xs font-semibold text-[#111c4e]">
            Email Address
          </label>
          <div
            className={`flex items-center gap-2.5 rounded-xl px-3 py-1.5 bg-[#f4f7fc]/90 border transition-all ${
              fieldErrors.email
                ? 'border-red-400 focus-within:ring-4 focus-within:ring-red-500/10'
                : 'border-slate-200/90 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10'
            }`}
          >
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              id="register-email"
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
              aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
              className="w-full bg-transparent text-xs sm:text-sm font-normal text-[#111c4e] placeholder-slate-400 focus:outline-none"
            />
          </div>
          {fieldErrors.email && (
            <p id="register-email-error" className="text-[11px] font-medium text-red-600">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password (manual typing only) */}
        <div className="space-y-0.5">
          <label htmlFor="register-password" className="block text-xs font-semibold text-[#111c4e]">
            Password
          </label>
          <div
            className={`flex items-center gap-2.5 rounded-xl px-3 py-1.5 bg-[#f4f7fc]/90 border transition-all ${
              fieldErrors.password
                ? 'border-red-400 focus-within:ring-4 focus-within:ring-red-500/10'
                : 'border-slate-200/90 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10'
            }`}
          >
            <Lock className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onPaste={blockClipboardAction('password')}
              onCopy={blockClipboardAction('password')}
              onCut={blockClipboardAction('password')}
              onDrop={blockClipboardAction('password')}
              onChange={(e) => {
                const nextPass = e.target.value;
                setPassword(nextPass);
                if (pasteNotice === 'password') setPasteNotice(null);
                if (fieldErrors.password || fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    password: fieldErrors.password ? validateNewPassword(nextPass) : prev.password,
                    confirmPassword: fieldErrors.confirmPassword
                      ? validateConfirmPassword(nextPass, confirmPassword)
                      : prev.confirmPassword,
                  }));
                }
              }}
              placeholder="Create a password"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'register-password-error' : undefined}
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
            <p id="register-password-error" className="text-[11px] font-medium text-red-600">
              {fieldErrors.password}
            </p>
          )}
          {pasteNotice === 'password' && !fieldErrors.password && (
            <p className="text-[11px] font-medium text-amber-700">
              Copy and paste is disabled for password fields. Please type manually.
            </p>
          )}
        </div>

        {/* Confirm Password (manual typing only + live match status) */}
        <div className="space-y-0.5">
          <label
            htmlFor="register-confirm-password"
            className="block text-xs font-semibold text-[#111c4e]"
          >
            Confirm Password
          </label>
          <div
            className={`flex items-center gap-2.5 rounded-xl px-3 py-1.5 bg-[#f4f7fc]/90 border transition-all ${
              fieldErrors.confirmPassword || (showLiveMatchStatus && !passwordsMatch)
                ? 'border-red-400 focus-within:ring-4 focus-within:ring-red-500/10'
                : showLiveMatchStatus && passwordsMatch
                ? 'border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10'
                : 'border-slate-200/90 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10'
            }`}
          >
            <Lock className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              id="register-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onPaste={blockClipboardAction('confirm')}
              onCopy={blockClipboardAction('confirm')}
              onCut={blockClipboardAction('confirm')}
              onDrop={blockClipboardAction('confirm')}
              onChange={(e) => {
                const nextConfirm = e.target.value;
                setConfirmPassword(nextConfirm);
                if (pasteNotice === 'confirm') setPasteNotice(null);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    confirmPassword: validateConfirmPassword(password, nextConfirm),
                  }));
                }
              }}
              placeholder="Confirm your password"
              aria-invalid={
                Boolean(fieldErrors.confirmPassword) || (showLiveMatchStatus && !passwordsMatch)
              }
              aria-describedby="register-confirm-status"
              className="w-full bg-transparent text-xs sm:text-sm font-normal text-[#111c4e] placeholder-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="text-slate-500 hover:text-[#111c4e] p-0.5 rounded focus:outline-none cursor-pointer"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              aria-pressed={showConfirmPassword}
            >
              {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          {fieldErrors.confirmPassword && !showLiveMatchStatus ? (
            <p id="register-confirm-status" className="text-[11px] font-medium text-red-600">
              {fieldErrors.confirmPassword}
            </p>
          ) : showLiveMatchStatus ? (
            <p
              id="register-confirm-status"
              aria-live="polite"
              className={`text-[11px] font-medium flex items-center gap-1.5 ${
                passwordsMatch ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {passwordsMatch ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Passwords match</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Passwords do not match</span>
                </>
              )}
            </p>
          ) : null}

          {pasteNotice === 'confirm' && (
            <p className="text-[11px] font-medium text-amber-700">
              Copy and paste is disabled for password fields. Please type manually.
            </p>
          )}
        </div>

        {/* Terms of Service & Privacy Policy */}
        <div className="space-y-0.5 pt-0.5">
          <div className="flex items-start gap-2 text-[11px] font-normal text-[#111c4e]">
            <input
              id="register-terms"
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => {
                setAgreedTerms(e.target.checked);
                if (fieldErrors.terms) {
                  setFieldErrors((prev) => ({ ...prev, terms: null }));
                }
              }}
              className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600 shrink-0"
            />
            <label htmlFor="register-terms" className="leading-snug cursor-pointer">
              I agree to the{' '}
              <button
                type="button"
                onClick={() => setLegalModal('terms')}
                className="text-blue-600 underline hover:text-blue-700 cursor-pointer"
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => setLegalModal('privacy')}
                className="text-blue-600 underline hover:text-blue-700 cursor-pointer"
              >
                Privacy Policy
              </button>
            </label>
          </div>
          {fieldErrors.terms && (
            <p className="text-[11px] font-medium text-red-600">{fieldErrors.terms}</p>
          )}
        </div>

        {/* Cloudflare Turnstile Bot Verification (matches Login page box) */}
        <TurnstileWidget
          action="register"
          resetKey={turnstileResetKey}
          verified={Boolean(turnstileToken)}
          onTokenChange={(tok) => {
            setTurnstileToken(tok);
            if (tok && serverError?.toLowerCase().includes('cloudflare')) {
              setServerError(null);
            }
          }}
          onError={() =>
            setServerError('Cloudflare challenge failed to load. Please retry.')
          }
        />

        {/* Primary CTA */}
        <button
          type="submit"
          disabled={submitting || googleLoading}
          className="glass-primary-cta w-full rounded-full py-2 px-5 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* OR Divider */}
      <div className="flex items-center gap-3 my-2">
        <span className="h-px flex-1 bg-slate-200/90" />
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">OR</span>
        <span className="h-px flex-1 bg-slate-200/90" />
      </div>

      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={submitting || googleLoading}
        className="w-full rounded-full py-2 px-5 bg-white/95 hover:bg-blue-50/40 border border-blue-400/75 text-xs sm:text-sm font-semibold text-[#111c4e] flex items-center justify-center gap-2.5 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        ) : (
          <GoogleIcon className="w-4 h-4 shrink-0" />
        )}
        <span>Sign up with Google</span>
      </button>

      {/* Switch to Login */}
      <p className="text-center text-xs font-normal text-[#111c4e]/85 mt-2.5">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onNavigateLogin}
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
        >
          Sign In
        </button>
      </p>
    </div>
  );

  // Portal modal to document.body so backdrop-filter on .glass-auth-card never clips it into a sharp rectangle
  const legalDialog =
    legalModal && typeof document !== 'undefined'
      ? createPortal(
          <div
            onClick={() => setLegalModal(null)}
            className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-modal-title"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="glass-auth-card rounded-[2rem] p-6 max-w-md w-full space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 id="legal-modal-title" className="text-base font-bold text-[#111c4e]">
                  {legalModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                </h3>
                <button
                  type="button"
                  onClick={() => setLegalModal(null)}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-[#111c4e] hover:bg-slate-100 cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs font-normal text-[#3b476e] leading-relaxed">
                {legalModal === 'terms'
                  ? 'ENIGMA96 performs all 96-character cipher operations locally in your browser. Saved settings are stored under your personal account solely for your convenience across sessions.'
                  : 'ENIGMA96 is private by design: cipher keys and messages are stored securely under your authenticated account with strict Row-Level Security.'}
              </p>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="glass-primary-cta w-full rounded-full py-2.5 text-xs font-semibold text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <AuthLayout
        leftColumn={leftHero}
        rightColumn={rightCard}
        onVisitLanding={onVisitLanding}
      />
      {legalDialog}
    </>
  );
};
