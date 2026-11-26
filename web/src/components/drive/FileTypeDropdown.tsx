import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { DriveFileCategory } from '../../services/driveService';

export type FileCategoryFilter = 'all' | DriveFileCategory;

const FILE_TYPE_OPTIONS: Array<{ value: FileCategoryFilter; label: string; triggerLabel: string }> = [
  { value: 'all', label: 'All Types', triggerLabel: 'Type' },
  { value: 'image', label: 'Images', triggerLabel: 'Images' },
  { value: 'document', label: 'Documents', triggerLabel: 'Documents' },
  { value: 'archive', label: 'Archives', triggerLabel: 'Archives' },
  { value: 'text', label: 'Text & Code', triggerLabel: 'Text & Code' },
  { value: 'other', label: 'Other', triggerLabel: 'Other' },
];

interface FileTypeDropdownProps {
  value: FileCategoryFilter;
  onChange: (value: FileCategoryFilter) => void;
}

export const FileTypeDropdown: React.FC<FileTypeDropdownProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

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

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const currentOption =
    FILE_TYPE_OPTIONS.find((opt) => opt.value === value) ?? FILE_TYPE_OPTIONS[0];

  return (
    <div className="relative inline-block text-left shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Filter files by type"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="clay-btn-white px-3.5 py-2 text-xs sm:text-sm font-bold text-blue-950 rounded-xl flex items-center justify-between gap-2 min-w-[116px] cursor-pointer focus:outline-none"
      >
        <span>{currentOption.triggerLabel}</span>
        <ChevronDown
          className={`w-4 h-4 text-blue-700 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="File categories"
          className="absolute right-0 top-full mt-2 z-50 w-44 rounded-2xl bg-white/95 backdrop-blur-md border border-blue-200/90 shadow-[0_14px_30px_rgba(37,99,235,0.18),0_4px_12px_rgba(30,64,175,0.08)] p-1.5 space-y-0.5"
        >
          {FILE_TYPE_OPTIONS.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-1.5 text-xs font-bold rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-blue-950 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
