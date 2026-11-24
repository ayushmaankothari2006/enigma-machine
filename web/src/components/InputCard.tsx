import React from 'react';
import { FileText, Trash2, Sparkles } from 'lucide-react';

interface InputCardProps {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
  onLoadSample: () => void;
}

export const InputCard: React.FC<InputCardProps> = ({
  value,
  onChange,
  onClear,
  onLoadSample,
}) => {
  return (
    <div className="clay-card p-4 sm:p-6 flex flex-col h-full space-y-3.5 sm:space-y-4">
      {/* Header & Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-blue-100 gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-[3px_4px_10px_rgba(37,99,235,0.35),inset_1px_1px_2px_rgba(255,255,255,0.4)] shrink-0">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-blue-950 font-mono tracking-tight leading-tight">
              Plaintext Input
            </h2>
            <p className="text-[11px] sm:text-xs font-mono text-slate-500">
              Length: <strong className="text-blue-900">{value.length}</strong> chars
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={onLoadSample}
            className="clay-btn-blue px-2.5 sm:px-3.5 py-1.5 text-xs flex items-center gap-1.5"
            title="Load Predefined Sample Text"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-300" />
            <span className="hidden sm:inline">Sample Text</span>
            <span className="sm:hidden">Sample</span>
          </button>

          <button
            onClick={onClear}
            disabled={!value}
            className="clay-btn-white p-2 text-xs flex items-center justify-center disabled:opacity-40"
            title="Clear"
            aria-label="Clear"
          >
            <Trash2 className="w-4 h-4 text-orange-600" />
          </button>
        </div>
      </div>

      {/* Clay Inset Textarea Well */}
      <div className="clay-well p-2.5 sm:p-3 flex-1 min-h-[160px] sm:min-h-[200px] lg:min-h-[220px]">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type or paste text here to encipher in real-time..."
          className="w-full h-full min-h-[150px] sm:min-h-[190px] lg:min-h-[210px] bg-transparent text-slate-800 font-mono text-xs sm:text-sm leading-relaxed resize-none focus:outline-none select-text"
          spellCheck={false}
        />
      </div>
    </div>
  );
};
