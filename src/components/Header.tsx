import React from 'react';
import { Download, Cpu, Loader2 } from 'lucide-react';

interface HeaderProps {
  onExportPDF?: () => void;
  isExportingPdf?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onExportPDF, isExportingPdf = false }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-blue-100/70 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Brand & Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-600 text-white flex items-center justify-center shadow-[4px_6px_14px_rgba(30,64,175,0.35),inset_2px_2px_3px_rgba(255,255,255,0.4)] border border-white/40 shrink-0">
            <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-normal text-blue-900 font-mono truncate" style={{ fontFamily: "'Cascadia Mono', 'Cascadia Code', Consolas, monospace", fontWeight: 700 }}>
              ENIGMA<span className="text-orange-500">96</span>
            </h1>
            <p className="text-[11px] sm:text-xs font-bold text-slate-500 truncate mt-0.5" style={{ fontFamily: "'Cascadia Mono', 'Cascadia Code', Consolas, monospace", fontWeight: 700 }}>
              Modern 96-Character Involutory Cipher Engine
            </p>
          </div>
        </div>

        {/* Action: Export PDF */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onExportPDF}
            disabled={isExportingPdf}
            className="clay-btn-orange px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export 3-Page PDF (Page 1: Settings, Page 2: Input Text, Page 3: Output Text)"
            style={{ fontFamily: "'Cascadia Mono', 'Cascadia Code', Consolas, monospace", fontWeight: 700 }}
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white animate-spin shrink-0" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
                <span>Export PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
