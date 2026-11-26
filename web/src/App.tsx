import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Cpu, HeartHandshake, Loader2, MessageSquare, X } from 'lucide-react';
import {
  Header,
  InputCard,
  LoginPage,
  OutputCard,
  SettingsCard,
} from './components';
import type { WorkspaceMode } from './components/Header';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useEnigma } from './hooks';

const EnigmaDrive = lazy(() =>
  import('./components/drive/EnigmaDrive').then((mod) => ({ default: mod.EnigmaDrive }))
);
const RegisterPage = lazy(() =>
  import('./components/auth/RegisterPage').then((mod) => ({ default: mod.RegisterPage }))
);

type AppRoute = '/' | '/login' | '/register' | '/reset-password';

function normalizeRoute(pathname: string): AppRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/login') return '/login';
  if (clean === '/register') return '/register';
  if (clean === '/reset-password') return '/reset-password';
  return '/';
}

const EnigmaWorkspace: React.FC<{
  onNavigateLogin: () => void;
}> = ({ onNavigateLogin }) => {
  const {
    user,
    isGuest,
    displayName,
    savedAccounts,
    startAddAccount,
    switchAccount,
    removeSavedAccount,
    exitGuest,
    signOut,
  } = useAuth();
  const enigma = useEnigma(user?.id, { randomizeDefaults: true });
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('cipher');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [footerModal, setFooterModal] = useState<'feedback' | 'support' | null>(null);
  const plaintextRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!footerModal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFooterModal(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [footerModal]);

  const handleSelectMode = useCallback((mode: WorkspaceMode) => {
    setWorkspaceMode(mode);
    setWorkspaceError(null);
    if (mode === 'cipher') {
      requestAnimationFrame(() => {
        plaintextRef.current?.focus();
      });
    }
  }, []);

  useEffect(() => {
    if (workspaceMode === 'cipher') {
      plaintextRef.current?.focus();
    }
  }, [workspaceMode]);

  const handleExportPDF = async () => {
    if (isExportingPdf) return;
    setWorkspaceError(null);
    try {
      setIsExportingPdf(true);
      const { exportEnigmaPDF } = await import('./utils');
      exportEnigmaPDF({
        rotors: enigma.rotors,
        inputText: enigma.inputText,
        outputText: enigma.outputText,
      });
    } catch (err) {
      setWorkspaceError(
        err instanceof Error ? err.message : 'Unable to generate PDF export. Please try again.'
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSignOut = async () => {
    setWorkspaceError(null);
    const result = await signOut();
    if (result.error) {
      setWorkspaceError(result.error);
      return;
    }
    onNavigateLogin();
  };

  const handleExitGuest = () => {
    setWorkspaceError(null);
    exitGuest();
    onNavigateLogin();
  };

  const handleAddAccount = () => {
    setWorkspaceError(null);
    startAddAccount();
    onNavigateLogin();
  };

  const handleSwitchAccount = async (id: string) => {
    setWorkspaceError(null);
    const result = await switchAccount(id);
    if (result.error) {
      setWorkspaceError(result.error);
    }
  };

  const handleRemoveAccount = async (id: string) => {
    setWorkspaceError(null);
    const result = await removeSavedAccount(id);
    if (result.error) {
      setWorkspaceError(result.error);
    }
  };

  return (
    <div className="min-h-screen workspace-bold bg-gradient-to-br from-blue-50/70 via-slate-100 to-orange-50/40 text-slate-800 antialiased selection:bg-orange-500 selection:text-white pb-3 sm:pb-4 flex flex-col justify-between">
      <div>
        {/* Header with Brand, PDF Export & Rightmost Account Icon Menu */}
        <Header
          onExportPDF={handleExportPDF}
          isExportingPdf={isExportingPdf}
          activeMode={workspaceMode}
          onSelectMode={handleSelectMode}
          isAuthenticated={Boolean(user)}
          isGuest={isGuest}
          userEmail={user?.email ?? displayName}
          activeUserId={user?.id}
          savedAccounts={savedAccounts}
          onSwitchAccount={(id) => {
            void handleSwitchAccount(id);
          }}
          onRemoveAccount={(id) => {
            void handleRemoveAccount(id);
          }}
          onAddAccount={handleAddAccount}
          onSignOut={handleSignOut}
          onExitGuest={handleExitGuest}
        />

        {/* Main Workspace */}
        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 space-y-5 sm:space-y-6">
          {workspaceError && (
            <div
              role="alert"
              className="rounded-2xl bg-red-50/95 border border-red-200 px-4 py-2.5 text-xs font-medium text-red-700 flex items-center justify-between gap-3"
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{workspaceError}</span>
              </span>
              <button
                type="button"
                onClick={() => setWorkspaceError(null)}
                className="text-red-700 font-bold hover:underline cursor-pointer shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {workspaceMode === 'cipher' ? (
            <>
              {/* ROW 1: Input Text & Output Text Cards Side-by-Side */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
                <InputCard
                  value={enigma.inputText}
                  onChange={enigma.setInputText}
                  onClear={enigma.clearInput}
                  onLoadSample={enigma.loadSampleText}
                  textareaRef={plaintextRef}
                />

                <OutputCard
                  value={enigma.outputText}
                  onUseOutputAsInput={enigma.useOutputAsInput}
                />
              </section>

              {/* ROW 2: Machine Settings Dashboard Card Spanning Full Width */}
              <section>
                <SettingsCard
                  rotors={enigma.rotors}
                  onPositionStep={enigma.stepPosition}
                  onPositionDirectChange={enigma.setPosition}
                  onRingStep={enigma.stepRing}
                  onTurnoverNotchChange={enigma.setTurnoverNotch}
                  onResetPositions={enigma.resetPositionsToDefaults}
                  onRandomizeSettings={enigma.randomizeSettings}
                />
              </section>
            </>
          ) : (
            <Suspense
              fallback={
                <div className="clay-card p-8 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-blue-950">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Loading Enigma Drive...</span>
                </div>
              }
            >
              <EnigmaDrive userLabel={user?.email ?? (isGuest ? 'Guest Device' : 'Device')} />
            </Suspense>
          )}
        </main>
      </div>

      <footer className="max-w-7xl mx-auto w-full px-4 pt-3 sm:pt-4 text-center">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500">
          <button
            type="button"
            onClick={() => setFooterModal('feedback')}
            className="hover:text-blue-700 underline decoration-blue-200 underline-offset-4 cursor-pointer transition-colors"
          >
            Feedback
          </button>
          {' • '}
          <button
            type="button"
            onClick={() => setFooterModal('support')}
            className="hover:text-blue-700 underline decoration-blue-200 underline-offset-4 cursor-pointer transition-colors"
          >
            Support Enigma?
          </button>
        </p>
      </footer>

      {footerModal && typeof document !== 'undefined'
        ? createPortal(
            <div
              onClick={() => setFooterModal(null)}
              className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-sm flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="workspace-footer-modal-title"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="glass-auth-card rounded-[2rem] p-6 max-w-sm w-full space-y-4 text-center"
              >
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setFooterModal(null)}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-[#111c4e] hover:bg-slate-100 cursor-pointer"
                    aria-label="Close modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="glass-icon-tile w-12 h-12 rounded-2xl flex items-center justify-center mx-auto">
                  {footerModal === 'feedback' ? (
                    <MessageSquare className="w-6 h-6 text-white" />
                  ) : (
                    <HeartHandshake className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <h3 id="workspace-footer-modal-title" className="text-lg font-bold text-[#111c4e]">
                    {footerModal === 'feedback' ? 'Feedback' : 'Support Enigma?'}
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-[#3b476e]">
                    Currently under development
                  </p>
                  <p className="text-[11px] font-normal text-slate-500 leading-relaxed">
                    {footerModal === 'feedback'
                      ? 'User feedback submission for Enigma96 is coming soon.'
                      : 'Community sponsorship and support options for Enigma96 are coming soon.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFooterModal(null)}
                  className="glass-primary-cta w-full rounded-full py-2.5 text-xs font-semibold text-white cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
};

const AppRouter: React.FC = () => {
  const { user, loading, isGuest, isAddingAccount, cancelAddAccount } = useAuth();
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window !== 'undefined' ? normalizeRoute(window.location.pathname) : '/'
  );

  const navigate = useCallback((target: AppRoute) => {
    setRoute(target);
    if (typeof window !== 'undefined' && window.location.pathname !== target) {
      window.history.pushState({}, '', target);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPopState = () => {
      setRoute(normalizeRoute(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const isAuthGate = (!user && !isGuest) || isAddingAccount;
    if (isAuthGate) {
      document.title =
        route === '/register'
          ? 'Create Account | Modern Enigma 96'
          : route === '/reset-password'
            ? 'Reset Password | Modern Enigma 96'
            : 'Sign In | Modern Enigma 96';
    } else {
      document.title = 'Modern Enigma 96 | 96-Character Involutory Cryptographic Cipher Engine';
    }
  }, [user, isGuest, isAddingAccount, route]);

  if (loading) {
    return (
      <div className="min-h-screen auth-ambient-bg flex flex-col items-center justify-center p-6 gap-4">
        <div className="glass-icon-tile w-14 h-14 rounded-2xl flex items-center justify-center">
          <Cpu className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-[#111c4e]">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Initializing ENIGMA96...</span>
        </div>
      </div>
    );
  }

  // Require authentication or explicit Continue as Guest before entering the Enigma96 machine
  if ((!user && !isGuest) || isAddingAccount) {
    if (route === '/register') {
      return (
        <Suspense
          fallback={
            <div className="min-h-screen auth-ambient-bg flex items-center justify-center p-6">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            </div>
          }
        >
          <RegisterPage
            onNavigateLogin={() => navigate('/login')}
            onAuthSuccess={() => navigate('/')}
          />
        </Suspense>
      );
    }

    return (
      <LoginPage
        initialMode={route === '/reset-password' ? 'forgot' : 'login'}
        onNavigateRegister={() => navigate('/register')}
        onAuthSuccess={() => navigate('/')}
        onCancelAddAccount={
          (user || isGuest) && isAddingAccount
            ? () => {
                cancelAddAccount();
                navigate('/');
              }
            : undefined
        }
      />
    );
  }

  return <EnigmaWorkspace onNavigateLogin={() => navigate('/login')} />;
};

export function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
