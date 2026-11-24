import React from 'react';
import { RotorConfig } from '../engine/types';
import { formatGlyph } from '../engine/alphabet';
import { Sliders, Dices } from 'lucide-react';
import { NotchDropdown } from './NotchDropdown';
import { HoldButton } from './HoldButton';

interface SettingsCardProps {
  rotors: {
    left: RotorConfig;
    middle: RotorConfig;
    right: RotorConfig;
  };
  onPositionStep: (slot: 'left' | 'middle' | 'right', delta: number) => void;
  onPositionDirectChange?: (slot: 'left' | 'middle' | 'right', pos: number) => void;
  onRingStep: (slot: 'left' | 'middle' | 'right', delta: number) => void;
  onTurnoverNotchChange: (slot: 'left' | 'middle' | 'right', notch: number) => void;
  onResetPositions?: () => void;
  onRandomizeSettings?: () => void;
}

const ROTOR_SLOTS: Array<{ key: 'left' | 'middle' | 'right'; label: string; badge: string; color: string }> = [
  { key: 'left', label: 'Left Rotor', badge: 'R₁ • Slow', color: 'blue' },
  { key: 'middle', label: 'Middle Rotor', badge: 'R₂ • Medium', color: 'orange' },
  { key: 'right', label: 'Right Rotor', badge: 'R₃ • Fast', color: 'blue' },
];

export const SettingsCard: React.FC<SettingsCardProps> = ({
  rotors,
  onPositionStep,
  onRingStep,
  onTurnoverNotchChange,
  onRandomizeSettings,
}) => {
  return (
    <div className="clay-card p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header & Global Controls */}
      <div className="flex items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-blue-100">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-[3px_4px_10px_rgba(30,64,175,0.35),inset_1px_1px_2px_rgba(255,255,255,0.4)] shrink-0">
            <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-blue-950 font-mono tracking-tight">
              Machine Settings Dashboard
            </h2>
          </div>
        </div>

        {/* Quick Actions (Randomize) */}
        <div className="flex items-center gap-2 shrink-0">
          {onRandomizeSettings && (
            <button
              onClick={onRandomizeSettings}
              className="clay-btn-blue px-2.5 sm:px-3.5 py-1.5 text-xs flex items-center gap-1.5"
              title="Randomize starting positions, notches, and ring offsets"
            >
              <Dices className="w-3.5 h-3.5 text-orange-300" />
              <span>Random Key</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Rotor Bays */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5">
        {ROTOR_SLOTS.map(({ key, label, badge, color }) => {
          const rotor = rotors[key];
          const glyph = formatGlyph(rotor.position);
          const displayIndex = rotor.position + 1; // 1 to 96
          const displayRing = rotor.ringSetting + 1; // 1 to 96

          return (
            <div
              key={key}
              className="clay-bay p-3.5 sm:p-4 lg:p-5 space-y-3 sm:space-y-4 relative"
            >
              {/* Top Slot Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <h3 className="text-xs sm:text-sm font-bold text-blue-950 font-mono flex items-center gap-2">
                  {label}
                </h3>
                <span className={`text-[10px] font-mono px-2 sm:px-2.5 py-0.5 rounded-full inline-block ${
                  color === 'orange' ? 'clay-pill-orange' : 'clay-pill-blue'
                }`}>
                  {badge}
                </span>
              </div>

              {/* Rotor Position & Editable Notch Control */}
              <div className="space-y-1 sm:space-y-1.5">
                <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono text-slate-500">
                  <span className="font-semibold text-blue-900">Position (P):</span>
                  
                  {/* Custom Rounded-Rectangle Notch Dropdown showing up to 5 entries */}
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="font-bold text-slate-600">Notch:</span>
                    <NotchDropdown
                      value={rotor.turnoverNotch}
                      onChange={(notch) => onTurnoverNotchChange(key, notch)}
                    />
                  </div>
                </div>

                <div className="clay-well p-2 sm:p-3 flex items-center justify-between">
                  <HoldButton
                    onStep={() => onPositionStep(key, -1)}
                    className="clay-stepper"
                    title="Previous Position (Click or Hold)"
                    aria-label={`Decrease ${label} position`}
                  >
                    -
                  </HoldButton>

                  <div className="text-center px-2 sm:px-3">
                    <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-blue-950 drop-shadow-sm">
                      {glyph}
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-mono text-slate-500">
                      Index <strong className="text-orange-600">{displayIndex}</strong> / 96
                    </div>
                  </div>

                  <HoldButton
                    onStep={() => onPositionStep(key, 1)}
                    className="clay-stepper"
                    title="Next Position (Click or Hold)"
                    aria-label={`Increase ${label} position`}
                  >
                    +
                  </HoldButton>
                </div>
              </div>

              {/* Ring Setting Control Bay */}
              <div className="space-y-1 sm:space-y-1.5 pt-0.5 sm:pt-1">
                <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono text-slate-500">
                  <span className="font-semibold text-blue-900">Ring Offset (R):</span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500">Range: 1..96</span>
                </div>

                <div className="flex items-center justify-between bg-white/70 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-blue-100 shadow-sm">
                  <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-700">
                    Ring: <strong className="text-blue-900 text-xs sm:text-sm">{displayRing}</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <HoldButton
                      onStep={() => onRingStep(key, -1)}
                      className="clay-stepper w-6 h-6 sm:w-7 sm:h-7 text-xs"
                      title="Decrease Ring Setting (Click or Hold)"
                      aria-label={`Decrease ${label} ring setting`}
                    >
                      -
                    </HoldButton>
                    <HoldButton
                      onStep={() => onRingStep(key, 1)}
                      className="clay-stepper w-6 h-6 sm:w-7 sm:h-7 text-xs"
                      title="Increase Ring Setting (Click or Hold)"
                      aria-label={`Increase ${label} ring setting`}
                    >
                      +
                    </HoldButton>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
