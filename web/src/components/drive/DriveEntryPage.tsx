import React, { useEffect, useRef, useState } from 'react';
import {
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  Play,
} from 'lucide-react';
import { DurationSlider } from './DurationSlider';

type ActiveEntryCard = 'start' | 'access';
type PasswordStrength = 'none' | 'weak' | 'medium' | 'strong';

function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) return 'none';
  const classes = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;

  if ((password.length >= 10 && classes >= 3) || (password.length >= 12 && classes >= 2)) {
    return 'strong';
  }
  if (password.length >= 6 && classes >= 2) {
    return 'medium';
  }
  return 'weak';
}

const PASSWORD_STRENGTH_STYLES: Record<
  PasswordStrength,
  { borderClass: string; badgeText: string; badgeClass: string }
> = {
  none: {
    borderClass: '',
    badgeText: '',
    badgeClass: '',
  },
  weak: {
    borderClass: '!border-red-500 ring-2 ring-red-200/75',
    badgeText: 'Weak',
    badgeClass: 'text-red-600',
  },
  medium: {
    borderClass: '!border-orange-500 ring-2 ring-orange-200/75',
    badgeText: 'Medium',
    badgeClass: 'text-orange-600',
  },
  strong: {
    borderClass: '!border-emerald-500 ring-2 ring-emerald-200/75',
    badgeText: 'Strong',
    badgeClass: 'text-emerald-600',
  },
};

interface DriveEntryPageProps {
  onStartSession: (params: {
    durationMinutes: number;
    password: string;
    lockdownMode: boolean;
  }) => Promise<void>;
  onAccessSession: (params: { token: string; password: string }) => Promise<void>;
}

export const DriveEntryPage: React.FC<DriveEntryPageProps> = ({
  onStartSession,
  onAccessSession,
}) => {
  // Only one card is accessible at a time
  const [activeCard, setActiveCard] = useState<ActiveEntryCard>('start');
  const durationSliderRef = useRef<HTMLInputElement>(null);
  const accessTokenRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    durationSliderRef.current?.focus();
  }, []);

  // Start Your Session card state
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [startPassword, setStartPassword] = useState<string>('');
  const [showStartPassword, setShowStartPassword] = useState<boolean>(false);
  const [lockdownMode, setLockdownMode] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Access Session card state
  const [accessToken, setAccessToken] = useState<string>('');
  const [accessPassword, setAccessPassword] = useState<string>('');
  const [showAccessPassword, setShowAccessPassword] = useState<boolean>(false);
  const [isAccessing, setIsAccessing] = useState<boolean>(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  const passwordStrength = evaluatePasswordStrength(startPassword);
  const strengthStyle = PASSWORD_STRENGTH_STYLES[passwordStrength];

  const handleResetStart = () => {
    setDurationMinutes(30);
    setStartPassword('');
    setShowStartPassword(false);
    setLockdownMode(false);
    setStartError(null);
  };

  const handleResetAccess = () => {
    setAccessToken('');
    setAccessPassword('');
    setShowAccessPassword(false);
    setAccessError(null);
  };

  const handleSelectCard = (target: ActiveEntryCard) => {
    if (isStarting || isAccessing) return;
    if (activeCard !== target) {
      if (target === 'access') {
        handleResetStart();
      } else {
        handleResetAccess();
      }
      setActiveCard(target);
    }
    requestAnimationFrame(() => {
      if (target === 'access') {
        accessTokenRef.current?.focus();
      } else {
        durationSliderRef.current?.focus();
      }
    });
  };

  const handleStartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeCard !== 'start') return;

    setStartError(null);
    setIsStarting(true);
    try {
      await onStartSession({
        durationMinutes,
        password: startPassword,
        lockdownMode,
      });
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Unable to start Drive session.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeCard !== 'access') return;

    setAccessError(null);
    if (!accessToken.trim()) {
      setAccessError('Please enter a session token.');
      return;
    }

    setIsAccessing(true);
    try {
      await onAccessSession({
        token: accessToken.trim(),
        password: accessPassword,
      });
    } catch (err) {
      setAccessError(err instanceof Error ? err.message : 'Unable to access Drive session.');
    } finally {
      setIsAccessing(false);
    }
  };

  const isStartActive = activeCard === 'start';
  const isAccessActive = activeCard === 'access';

  return (
    <div className="max-w-5xl mx-auto space-y-3">
      {/* Compact Single-Screen Drive Hero */}
      <div className="text-center space-y-1.5">
        <div className="flex flex-col items-center space-y-1.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200/90 border border-white flex items-center justify-center shadow-[4px_6px_14px_rgba(30,64,175,0.12),inset_1px_1px_2px_rgba(255,255,255,0.9)]">
            <Lock className="w-4 h-4 text-blue-700" />
          </div>

          <h2 className="text-sm sm:text-base font-bold text-blue-950 leading-snug max-w-2xl">
            Transfer files. Share text. Open a session, share the code. Sync instantly across all your devices.
          </h2>

          {/* Signature orange hairline + centered diamond divider */}
          <div className="w-full max-w-md flex items-center justify-center gap-2">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-orange-400/80" />
            <span
              aria-hidden="true"
              className="w-2 h-2 rotate-45 border-2 border-orange-500 bg-white shrink-0"
            />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-orange-400/80" />
          </div>
        </div>
      </div>

      {/* Page 1 Mutually Exclusive Two-Card Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-start">
        {/* Left Card: Start Your Session */}
        <form
          onSubmit={handleStartSubmit}
          noValidate
          className={`clay-card p-4 sm:p-5 relative overflow-hidden transition-all duration-200 ${
            isStartActive ? 'ring-2 ring-blue-300/70' : 'opacity-65'
          }`}
        >
          {!isStartActive && (
            <button
              type="button"
              onClick={() => handleSelectCard('start')}
              aria-label="Switch to Start Your Session"
              className="absolute inset-0 z-20 rounded-[1.75rem] bg-white/45 backdrop-blur-[1.5px] flex items-center justify-center cursor-pointer group"
            >
              <span className="clay-btn-white px-4 py-2 text-xs font-bold shadow-md group-hover:scale-[1.02] transition-transform">
                Switch to Start Your Session
              </span>
            </button>
          )}

          <fieldset disabled={!isStartActive} className="space-y-3 disabled:pointer-events-none">
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="w-1.5 h-5 rounded-full bg-blue-600 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-blue-950 tracking-tight">
                Start Your Session
              </h3>
            </div>

            {startError && (
              <div
                role="alert"
                className="rounded-2xl bg-red-50/90 border border-red-200 px-3.5 py-2 text-xs font-medium text-red-700"
              >
                {startError}
              </div>
            )}

            {/* Unified Wavy Session Duration Slider */}
            <DurationSlider
              valueMinutes={durationMinutes}
              disabled={!isStartActive}
              sliderRef={durationSliderRef}
              onChange={setDurationMinutes}
            />

            {/* Session Password with Strength Outline (Red / Orange / Green) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="drive-start-password"
                  className="text-xs sm:text-sm font-bold text-blue-950"
                >
                  Session Password
                </label>
                {passwordStrength !== 'none' && (
                  <span
                    data-testid="password-strength-label"
                    className={`text-[11px] font-bold ${strengthStyle.badgeClass}`}
                  >
                    {strengthStyle.badgeText}
                  </span>
                )}
              </div>

              <div
                data-testid="drive-start-password-box"
                className={`clay-well px-3.5 py-2 flex items-center gap-2.5 transition-all ${strengthStyle.borderClass}`}
              >
                <Lock className="w-4 h-4 text-blue-900 shrink-0" />
                <input
                  id="drive-start-password"
                  type={showStartPassword ? 'text' : 'password'}
                  disabled={!isStartActive}
                  value={startPassword}
                  onChange={(e) => setStartPassword(e.target.value)}
                  placeholder="Enter password (no password sessions also available)"
                  autoComplete="new-password"
                  className="w-full bg-transparent text-xs sm:text-sm font-medium text-blue-950 placeholder:text-[11px] placeholder:text-slate-400 focus:outline-none select-text disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowStartPassword((prev) => !prev)}
                  aria-label={showStartPassword ? 'Hide session password' : 'Show session password'}
                  className="p-1 rounded-lg text-slate-500 hover:text-blue-800 cursor-pointer transition-colors shrink-0"
                >
                  {showStartPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Lockdown Mode Toggle */}
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs sm:text-sm font-bold text-blue-950">Lockdown Mode</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={lockdownMode}
                  aria-label="Lockdown Mode"
                  onClick={() => setLockdownMode((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors cursor-pointer ${
                    lockdownMode
                      ? 'bg-blue-600 border-blue-500 shadow-[0_4px_10px_rgba(37,99,235,0.35)]'
                      : 'bg-slate-200 border-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      lockdownMode ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="flex items-start gap-2 text-[11px] font-normal text-slate-500 leading-relaxed">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Prevents manual termination to ensure the session only closes upon timer expiration.
                </span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-0.5">
              <button
                type="button"
                onClick={handleResetStart}
                disabled={isStarting}
                className="clay-btn-white py-2 text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isStarting}
                className="clay-btn-blue py-2 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Start</span>
                  </>
                )}
              </button>
            </div>
          </fieldset>
        </form>

        {/* Right Card: Access Session */}
        <form
          onSubmit={handleAccessSubmit}
          noValidate
          className={`clay-card p-4 sm:p-5 relative overflow-hidden transition-all duration-200 ${
            isAccessActive ? 'ring-2 ring-blue-300/70' : 'opacity-65'
          }`}
        >
          {!isAccessActive && (
            <button
              type="button"
              onClick={() => handleSelectCard('access')}
              aria-label="Switch to Access Session"
              className="absolute inset-0 z-20 rounded-[1.75rem] bg-white/45 backdrop-blur-[1.5px] flex items-center justify-center cursor-pointer group"
            >
              <span className="clay-btn-white px-4 py-2 text-xs font-bold shadow-md group-hover:scale-[1.02] transition-transform">
                Switch to Access Session
              </span>
            </button>
          )}

          <fieldset disabled={!isAccessActive} className="space-y-3 disabled:pointer-events-none">
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="w-1.5 h-5 rounded-full bg-blue-600 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-blue-950 tracking-tight">
                Access Session
              </h3>
            </div>

            {accessError && (
              <div
                role="alert"
                className="rounded-2xl bg-red-50/90 border border-red-200 px-3.5 py-2 text-xs font-medium text-red-700"
              >
                {accessError}
              </div>
            )}

            {/* Session Token */}
            <div className="space-y-1.5">
              <label
                htmlFor="drive-access-token"
                className="block text-xs sm:text-sm font-bold text-blue-950"
              >
                Session Token
              </label>
              <div className="clay-well px-3.5 py-2.5 flex items-center gap-2.5 focus-within:border-blue-400">
                <KeyRound className="w-4 h-4 text-blue-900 shrink-0" />
                <input
                  ref={accessTokenRef}
                  id="drive-access-token"
                  type="text"
                  disabled={!isAccessActive}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Enter session token"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="w-full bg-transparent text-xs sm:text-sm font-medium text-blue-950 placeholder:text-slate-400 focus:outline-none select-text disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Session Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="drive-access-password"
                className="block text-xs sm:text-sm font-bold text-blue-950"
              >
                Session Password
              </label>
              <div className="clay-well px-3.5 py-2.5 flex items-center gap-2.5 focus-within:border-blue-400">
                <Lock className="w-4 h-4 text-blue-900 shrink-0" />
                <input
                  id="drive-access-password"
                  type={showAccessPassword ? 'text' : 'password'}
                  disabled={!isAccessActive}
                  value={accessPassword}
                  onChange={(e) => setAccessPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full bg-transparent text-xs sm:text-sm font-medium text-blue-950 placeholder:text-slate-400 focus:outline-none select-text disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowAccessPassword((prev) => !prev)}
                  aria-label={showAccessPassword ? 'Hide access password' : 'Show access password'}
                  className="p-1 rounded-lg text-slate-500 hover:text-blue-800 cursor-pointer transition-colors shrink-0"
                >
                  {showAccessPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-0.5">
              <button
                type="button"
                onClick={handleResetAccess}
                disabled={isAccessing}
                className="clay-btn-white py-2 text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAccessing}
                className="clay-btn-blue py-2 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isAccessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Accessing...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Access</span>
                  </>
                )}
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
};
