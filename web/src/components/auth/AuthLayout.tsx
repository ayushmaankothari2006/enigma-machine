import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Construction, Cpu, HeartHandshake, MessageSquare, X } from 'lucide-react';

interface AuthLayoutProps {
  leftColumn: React.ReactNode;
  rightColumn: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  leftColumn,
  rightColumn,
}) => {
  const [activeModal, setActiveModal] = useState<'cover' | 'feedback' | 'support' | null>(null);

  useEffect(() => {
    if (!activeModal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveModal(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeModal]);

  const infoModal =
    activeModal && typeof document !== 'undefined'
      ? createPortal(
          <div
            onClick={() => setActiveModal(null)}
            className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-info-modal-title"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="glass-auth-card rounded-[2rem] p-6 max-w-sm w-full space-y-4 text-center"
            >
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-[#111c4e] hover:bg-slate-100 cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="glass-icon-tile w-12 h-12 rounded-2xl flex items-center justify-center mx-auto">
                {activeModal === 'cover' ? (
                  <Construction className="w-6 h-6 text-white" />
                ) : activeModal === 'feedback' ? (
                  <MessageSquare className="w-6 h-6 text-white" />
                ) : (
                  <HeartHandshake className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="space-y-1.5">
                <h3 id="auth-info-modal-title" className="text-lg font-bold text-[#111c4e]">
                  {activeModal === 'cover'
                    ? 'Cover Page'
                    : activeModal === 'feedback'
                      ? 'Feedback'
                      : 'Support Enigma?'}
                </h3>
                <p className="text-xs sm:text-sm font-medium text-[#3b476e]">
                  Currently under development
                </p>
                <p className="text-[11px] font-normal text-slate-500 leading-relaxed">
                  {activeModal === 'cover'
                    ? 'Sign in or create an account to access the Enigma96 workspace.'
                    : activeModal === 'feedback'
                      ? 'User feedback submission for Enigma96 is coming soon.'
                      : 'Community sponsorship and support options for Enigma96 are coming soon.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
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
    <div className="min-h-screen auth-ambient-bg text-[#111c4e] flex flex-col justify-between antialiased selection:bg-orange-500 selection:text-white">
      {/* Top Floating Neo-Glassmorphic Brand Bar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2.5 sm:pt-3">
        <div className="glass-auth-bar rounded-2xl px-4 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="glass-icon-tile w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-bold tracking-wide text-[#111c4e] truncate leading-tight">
                ENIGMA<span className="text-[#f97316]">96</span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-normal text-[#3b476e] truncate">
                Cipher Engine | Enigma Drive
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveModal('cover')}
            className="rounded-xl px-3.5 py-1.5 bg-blue-50/85 hover:bg-blue-100/80 border border-blue-200/80 text-xs sm:text-sm font-semibold text-[#111c4e] hover:text-blue-700 shrink-0 transition-colors cursor-pointer"
          >
            Visit Cover Page
          </button>
        </div>
      </header>

      {/* Centered Split-Screen Main Stage */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          <section className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
            {leftColumn}
          </section>
          <section className="lg:col-span-6 w-full flex justify-center lg:justify-end">
            {rightColumn}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-2.5 pt-1">
        <div className="flex items-center justify-center gap-4">
          <span className="h-px w-12 sm:w-28 bg-gradient-to-r from-transparent to-blue-200/90" />
          <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.14em] text-[#111c4e]/85 text-center">
            <button
              type="button"
              onClick={() => setActiveModal('feedback')}
              className="hover:text-blue-600 underline decoration-blue-300/80 underline-offset-4 cursor-pointer transition-colors"
            >
              Feedback
            </button>
            {' • '}
            <button
              type="button"
              onClick={() => setActiveModal('support')}
              className="hover:text-blue-600 underline decoration-blue-300/80 underline-offset-4 cursor-pointer transition-colors"
            >
              Support Enigma?
            </button>
          </p>
          <span className="h-px w-12 sm:w-28 bg-gradient-to-l from-transparent to-blue-200/90" />
        </div>
      </footer>

      {infoModal}
    </div>
  );
};
