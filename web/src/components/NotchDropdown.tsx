import React, { useState, useRef, useEffect } from 'react';
import { formatGlyph, ALPHABET_CHARS } from '../engine/alphabet';
import { ChevronDown, Check } from 'lucide-react';

interface NotchDropdownProps {
  value: number; // 0 to 95
  onChange: (val: number) => void;
}

export const NotchDropdown: React.FC<NotchDropdownProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Scroll active item into view when opening
  useEffect(() => {
    if (isOpen && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button - Rounded Rectangle with Clay style */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="clay-btn-white px-2.5 py-1 text-xs font-mono font-bold text-orange-600 rounded-xl border border-orange-200/90 flex items-center gap-1.5 shadow-sm hover:border-orange-400 focus:outline-none transition-all cursor-pointer"
        title="Editable turnover notch setting (1 to 96)"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>
          {formatGlyph(value)} ({value + 1})
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-orange-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown - Rounded Rectangle showing up to 5 entries at a time */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-2 z-50 w-36 rounded-2xl bg-white/95 backdrop-blur-md border-2 border-orange-200/90 shadow-[0_12px_28px_rgba(249,115,22,0.22),0_4px_12px_rgba(30,64,175,0.08)] p-1.5 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Scrollable container showing strictly up to 5 items (5 * 32px = 160px) */}
          <div className="max-h-[160px] overflow-y-auto space-y-0.5 rounded-xl pr-1">
            {ALPHABET_CHARS.map((_, idx) => {
              const isSelected = idx === value;
              return (
                <button
                  key={idx}
                  ref={isSelected ? activeItemRef : null}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(idx);
                    setIsOpen(false);
                  }}
                  className={`w-full h-8 px-2.5 py-1 text-xs font-mono font-bold rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  <span className="truncate">
                    {formatGlyph(idx)} ({idx + 1})
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 ml-1 shrink-0 text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
