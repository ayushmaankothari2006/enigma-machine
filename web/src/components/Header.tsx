import React, { useEffect, useRef, useState } from 'react';
import { Download, Cpu, Loader2, LogOut, User, UserPlus } from 'lucide-react';
import type { SavedAccount } from '../contexts/AuthContext';

export type WorkspaceMode = 'cipher' | 'drive';

interface HeaderProps {
  onExportPDF?: () => void;
  isExportingPdf?: boolean;
  activeMode?: WorkspaceMode;
  onSelectMode?: (mode: WorkspaceMode) => void;
  userEmail?: string;
  activeUserId?: string;
  savedAccounts?: SavedAccount[];
  isAuthenticated?: boolean;
  isGuest?: boolean;
  onSwitchAccount?: (accountId: string) => void;
  onRemoveAccount?: (accountId: string) => void;
  onAddAccount?: () => void;
  onSignOut?: () => void;
  onExitGuest?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onExportPDF,
  isExportingPdf = false,
  activeMode = 'cipher',
  onSelectMode,
  userEmail,
  activeUserId,
  savedAccounts = [],
  isAuthenticated = false,
  isGuest = false,
  onSwitchAccount,
  onRemoveAccount,
  onAddAccount,
  onSignOut,
  onExitGuest,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const accountsToDisplay: SavedAccount[] =
    savedAccounts.length > 0
      ? savedAccounts
      : isAuthenticated && userEmail
      ? [{ id: activeUserId ?? 'active', email: userEmail, accessToken: '', refreshToken: '' }]
      : [];

  const showAccountButton = isAuthenticated || isGuest;

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-blue-100/70 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Left: Brand & Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-600 text-white flex items-center justify-center shadow-[4px_6px_14px_rgba(30,64,175,0.35),inset_2px_2px_3px_rgba(255,255,255,0.4)] border border-white/40 shrink-0">
            <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold tracking-normal text-blue-900 font-mono truncate" style={{ fontFamily: "'Cascadia Mono', 'Cascadia Code', Consolas, monospace", fontWeight: 700 }}>
              ENIGMA<span className="text-orange-500">96</span>
            </h1>
            <div
              role="tablist"
              aria-label="Workspace mode"
              className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold mt-0.5 min-w-0 py-0.5 whitespace-nowrap"
              style={{ fontFamily: "'Cascadia Mono', 'Cascadia Code', Consolas, monospace", fontWeight: 700 }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeMode === 'cipher'}
                onClick={() => onSelectMode?.('cipher')}
                className={`truncate transition-all cursor-pointer focus:outline-none py-0.5 ${
                  activeMode === 'cipher'
                    ? 'text-blue-600 drop-shadow-[0_0_8px_rgba(37,99,235,0.55)]'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className="sr-only">Workspace: </span>Cipher Engine
              </button>
              <span aria-hidden="true" className="text-slate-300 select-none shrink-0">
                |
              </span>
              <button
                type="button"
                role="tab"
                aria-selected={activeMode === 'drive'}
                onClick={() => onSelectMode?.('drive')}
                className={`shrink-0 transition-all cursor-pointer focus:outline-none py-0.5 pr-1 ${
                  activeMode === 'drive'
                    ? 'text-blue-600 drop-shadow-[0_0_8px_rgba(37,99,235,0.55)]'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Enigma Drive
              </button>
            </div>
          </div>
        </div>

        {/* Right: Export PDF (Cipher Engine only) + Rightmost Account Icon Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {activeMode === 'cipher' && (
            <button
              type="button"
              onClick={onExportPDF}
              disabled={isExportingPdf}
              aria-label={isExportingPdf ? 'Generating PDF' : 'Export PDF'}
              className="clay-btn-orange px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              title="Export 3-Page PDF (Page 1: Settings, Page 2: Input Text, Page 3: Output Text)"
              style={{ fontFamily: "'Cascadia Mono', 'Cascadia Code', Consolas, monospace", fontWeight: 700 }}
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white animate-spin shrink-0" />
                  <span className="hidden sm:inline">Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
                  <span className="hidden sm:inline">Export PDF</span>
                </>
              )}
            </button>
          )}

          {showAccountButton && (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="clay-btn-white w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center cursor-pointer"
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                title={isGuest && !isAuthenticated ? 'Guest Session' : userEmail || 'Account'}
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 z-50 min-w-[260px] max-w-[320px] rounded-2xl bg-white/95 backdrop-blur-md border border-blue-100 shadow-[0_14px_34px_rgba(30,58,138,0.16)] p-1.5 space-y-1"
                >
                  {isGuest && !isAuthenticated && (
                    <div
                      role="menuitem"
                      className="group flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-amber-50/80"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          aria-label="Guest session"
                          className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] ring-2 ring-amber-200/80 shrink-0"
                        />
                        <span className="text-xs font-medium text-blue-950 truncate">
                          Guest Session
                        </span>
                      </div>
                      {onExitGuest && (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            onExitGuest();
                          }}
                          className="p-1.5 rounded-lg text-orange-600 hover:bg-orange-100/80 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 transition-opacity shrink-0 cursor-pointer"
                          aria-label="Exit guest"
                          title="Exit guest session"
                        >
                          <LogOut className="w-4 h-4 text-orange-600" />
                        </button>
                      )}
                    </div>
                  )}

                  {accountsToDisplay.map((account) => {
                    const isActive =
                      isAuthenticated &&
                      ((activeUserId && account.id === activeUserId) ||
                        (!activeUserId && account.email === userEmail));

                    return (
                      <div
                        key={account.id}
                        role="menuitem"
                        tabIndex={0}
                        onClick={() => {
                          if (!isActive && onSwitchAccount) {
                            setMenuOpen(false);
                            onSwitchAccount(account.id);
                          }
                        }}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ' ') && !isActive && onSwitchAccount) {
                            e.preventDefault();
                            setMenuOpen(false);
                            onSwitchAccount(account.id);
                          }
                        }}
                        className={`group flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl transition-colors ${
                          isActive
                            ? 'bg-blue-50/80 cursor-default'
                            : 'hover:bg-blue-50/70 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isActive ? (
                            <span
                              aria-label="Active account"
                              className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)] ring-2 ring-emerald-200/80 shrink-0"
                            />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0"
                            />
                          )}
                          <span className="text-xs font-medium text-blue-950 truncate select-text">
                            {account.email}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(false);
                            if (isActive) {
                              onSignOut?.();
                            } else {
                              onRemoveAccount?.(account.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-orange-600 hover:bg-orange-100/80 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 transition-opacity shrink-0 cursor-pointer"
                          aria-label={isActive ? 'Sign out' : `Remove ${account.email}`}
                          title={isActive ? 'Sign out' : 'Sign out of this account'}
                        >
                          <LogOut className="w-4 h-4 text-orange-600" />
                        </button>
                      </div>
                    );
                  })}

                  <div className="h-px bg-blue-100/80 my-1" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onAddAccount?.();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-blue-700 hover:bg-blue-50/80 transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Add Account</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
