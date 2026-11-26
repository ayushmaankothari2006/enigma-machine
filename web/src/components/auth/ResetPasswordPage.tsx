import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { validateConfirmPassword, validateNewPassword } from '../../utils/authValidation';
import { AuthLayout } from './AuthLayout';
import { LoginRotorIllustration } from './AuthIllustrations';

interface ResetPasswordPageProps {
  onResetComplete: () => void;
  onBackToLogin: () => void;
  onVisitLanding?: () => void;
}

type ResetFieldErrors = {
  password?: string | null;
  confirmPassword?: string | null;
};

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  onResetComplete,
  onBackToLogin,
  onVisitLanding,
}) => {
  const { user, updatePassword, completePasswordRecovery, signOut } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pasteNotice, setPasteNotice] = useState<'password' | 'confirm' | null>(null);

  const [fieldErrors, setFieldErrors] = useState<ResetFieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false);

  const hasBothPasswords = password.length > 0 || confirmPassword.length > 0;
  const showLiveMatchStatus = confirmPassword.length > 0 && hasBothPasswords;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

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

    const passErr = validateNewPassword(password);
    const confirmErr = validateConfirmPassword(password, confirmPassword);

    if (passErr || confirmErr) {
      setFieldErrors({ password: passErr, confirmPassword: confirmErr });
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const result = await updatePassword(password);
      if (result.error) {
        setServerError(result.error);
        return;
      }

      setPassword('');
      setConfirmPassword('');
      setResetCompleted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueWorkspace = () => {
    completePasswordRecovery();
    onResetComplete();
  };

  const handleReturnToLogin = async () => {
    await signOut();
    completePasswordRecovery();
    onBackToLogin();
  };

  const leftHero = (
    <div className="space-y-4 w-full flex flex-col items-center lg:items-start">
      <div className="space-y-2.5 max-w-lg">
        <h1 className="text-2xl sm:text-3xl lg:text-[2.35rem] font-bold tracking-tight text-[#111c4e] leading-[1.15]">
          Reset your password<span className="text-[#f97316]">.</span>
        </h1>
        <p className="text-xs sm:text-sm font-normal text-[#253263]/85 leading-relaxed">
          Choose a strong new password to secure your Enigma96 account.
        </p>
      </div>

      <div className="w-full flex justify-center lg:justify-start pt-1">
        <LoginRotorIllustration />
      </div>
    </div>
  );

  const rightCard = resetCompleted ? (
    <div className="glass-auth-card rounded-[2rem] p-5 sm:p-6 w-full max-w-[440px] space-y-5">
      <div className="flex items-center gap-3">
        <div className="glass-icon-tile w-11 h-11 rounded-2xl flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#111c4e] tracking-tight">Password Updated</h2>
          <p className="text-xs font-normal text-[#3b476e] mt-0.5">
            Your new password is now active
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-emerald-50/90 border border-emerald-200 px-4 py-4 text-xs text-emerald-900 leading-relaxed">
        Your password{user?.email ? ` for ${user.email}` : ''} has been updated successfully. You
        can continue directly into your Enigma96 workspace.
      </div>

      <button
        type="button"
        onClick={handleContinueWorkspace}
        className="glass-primary-cta w-full rounded-full py-2.5 px-5 text-sm font-semibold text-white flex items-center justify-center gap-2 cursor-pointer"
      >
        <span>Continue to ENIGMA96</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => {
          void handleReturnToLogin();
        }}
        className="w-full text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Sign in with new password</span>
      </button>
    </div>
  ) : (
    <div className="glass-auth-card rounded-[2rem] p-5 sm:p-6 w-full max-w-[440px]">
      <div className="flex items-center gap-3 mb-3">
        <div className="glass-icon-tile w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0">
          <KeyRound className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-[#111c4e] tracking-tight">
            Set New Password
          </h2>
          <p className="text-xs font-normal text-[#3b476e] mt-0.5 truncate">
            {user?.email ? `Updating password for ${user.email}` : 'Enter a new account password'}
          </p>
        </div>
      </div>

      {serverError && (
        <div
          role="alert"
          className="mb-3 rounded-xl bg-red-50/90 border border-red-200 px-3 py-2 flex items-start gap-2 text-xs font-medium text-red-700"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        {/* New Password */}
        <div className="space-y-1">
          <label htmlFor="reset-new-password" className="block text-xs font-semibold text-[#111c4e]">
            New Password
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
              id="reset-new-password"
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
              placeholder="Create a new password"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'reset-password-error' : undefined}
              className="w-full bg-transparent text-xs sm:text-sm font-normal text-[#111c4e] placeholder-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-slate-500 hover:text-[#111c4e] p-0.5 rounded focus:outline-none cursor-pointer"
              aria-label={showPassword ? 'Hide new password' : 'Show new password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p id="reset-password-error" className="text-[11px] font-medium text-red-600">
              {fieldErrors.password}
            </p>
          )}
          {pasteNotice === 'password' && !fieldErrors.password && (
            <p className="text-[11px] font-medium text-amber-700">
              Copy and paste is disabled for password fields. Please type manually.
            </p>
          )}
        </div>

        {/* Confirm New Password */}
        <div className="space-y-1">
          <label
            htmlFor="reset-confirm-password"
            className="block text-xs font-semibold text-[#111c4e]"
          >
            Confirm New Password
          </label>
          <div
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 bg-[#f4f7fc]/90 border transition-all ${
              fieldErrors.confirmPassword || (showLiveMatchStatus && !passwordsMatch)
                ? 'border-red-400 focus-within:ring-4 focus-within:ring-red-500/10'
                : showLiveMatchStatus && passwordsMatch
                ? 'border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10'
                : 'border-slate-200/90 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10'
            }`}
          >
            <Lock className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              id="reset-confirm-password"
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
              placeholder="Confirm your new password"
              aria-invalid={
                Boolean(fieldErrors.confirmPassword) || (showLiveMatchStatus && !passwordsMatch)
              }
              aria-describedby="reset-confirm-status"
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
            <p id="reset-confirm-status" className="text-[11px] font-medium text-red-600">
              {fieldErrors.confirmPassword}
            </p>
          ) : showLiveMatchStatus ? (
            <p
              id="reset-confirm-status"
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

        <button
          type="submit"
          disabled={submitting}
          className="glass-primary-cta w-full rounded-full py-2.5 px-5 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-1"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Updating Password...</span>
            </>
          ) : (
            <>
              <span>Update Password</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          void handleReturnToLogin();
        }}
        className="mt-3 w-full text-xs font-semibold text-[#3b476e] hover:text-[#111c4e] hover:underline inline-flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Sign In</span>
      </button>
    </div>
  );

  return <AuthLayout leftColumn={leftHero} rightColumn={rightCard} onVisitLanding={onVisitLanding} />;
};
