import React, { useState, useRef, useEffect } from 'react';
import { Lock, Copy, Check, ArrowLeftRight } from 'lucide-react';

interface OutputCardProps {
  value: string;
  onUseOutputAsInput: () => void;
}

export const OutputCard: React.FC<OutputCardProps> = ({
  value,
  onUseOutputAsInput,
}) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    if (!value) return;

    let success = false;
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        success = true;
      } catch {
        // Fallback to execCommand below
      }
    }

    if (!success) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (err) {
        console.error('Fallback clipboard copy failed:', err);
      }
    }

    if (success) {
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="clay-card p-4 sm:p-6 flex flex-col h-full space-y-3.5 sm:space-y-4">
      {/* Header & Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-blue-100 gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-[3px_4px_10px_rgba(249,115,22,0.35),inset_1px_1px_2px_rgba(255,255,255,0.4)] shrink-0">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-blue-950 font-mono tracking-tight leading-tight">
              Ciphertext Output
            </h2>
            <p className="text-[11px] sm:text-xs font-mono text-slate-500">
              Length: <strong className="text-orange-600">{value.length}</strong> chars
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onUseOutputAsInput}
            disabled={!value}
            className="clay-btn-orange px-2.5 sm:px-3.5 py-1.5 text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Reciprocal Decipherment: Move Ciphertext into Input and reset positions"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Use as Input</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!value}
            className={`p-2 text-xs flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer ${
              copied
                ? 'clay-btn-orange text-white'
                : 'clay-btn-blue text-white'
            }`}
            title={copied ? 'Copied to Clipboard!' : 'Copy'}
            aria-label={copied ? 'Copied to Clipboard!' : 'Copy'}
          >
            {copied ? (
              <Check className="w-4 h-4 text-white" />
            ) : (
              <Copy className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Clay Inset Textarea Well */}
      <div className="clay-well p-2.5 sm:p-3 flex-1 min-h-[160px] sm:min-h-[200px] lg:min-h-[220px]">
        <textarea
          readOnly
          value={value}
          placeholder="Ciphertext appears here automatically..."
          className="w-full h-full bg-transparent resize-none border-none outline-none text-xs sm:text-sm font-mono text-slate-800 placeholder-slate-400 select-all cursor-default leading-relaxed"
          rows={6}
          aria-label="Enciphered Ciphertext Output"
        />
      </div>
    </div>
  );
};
