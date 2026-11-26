import React, { useId, useMemo } from 'react';

export interface DurationPreset {
  label: string;
  minutes: number;
  readout: string;
}

export const DURATION_PRESETS: DurationPreset[] = [
  { label: '5m', minutes: 5, readout: '5 mins' },
  { label: '30m', minutes: 30, readout: '30 mins' },
  { label: '1h', minutes: 60, readout: '1 hr' },
  { label: '3h', minutes: 180, readout: '3 hrs' },
  { label: '6h', minutes: 360, readout: '6 hrs' },
  { label: '9h', minutes: 540, readout: '9 hrs' },
  { label: '12h', minutes: 720, readout: '12 hrs' },
];

interface DurationSliderProps {
  valueMinutes: number;
  disabled?: boolean;
  sliderRef?: React.RefObject<HTMLInputElement>;
  onChange: (minutes: number) => void;
}

const SVG_WIDTH = 360;
const SVG_HEIGHT = 24;
const CENTER_Y = 12;
const WAVE_PERIOD = 36;

/**
 * Generates a tileable sine-wave path across [0, SVG_WIDTH + WAVE_PERIOD]
 * so a linear translateX(0 -> -WAVE_PERIOD) flows right-to-left seamlessly.
 */
function buildTileableWavePath(): string {
  const points: string[] = [];
  for (let x = 0; x <= SVG_WIDTH + WAVE_PERIOD; x += 2) {
    const y = CENTER_Y + Math.sin((x / WAVE_PERIOD) * Math.PI * 2) * 4.5;
    points.push(`${x === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return points.join(' ');
}

const FLOWING_WAVE_PATH = buildTileableWavePath();

export const DurationSlider: React.FC<DurationSliderProps> = ({
  valueMinutes,
  disabled = false,
  sliderRef,
  onChange,
}) => {
  const clipId = useId();
  const selectedIndex = useMemo(() => {
    const exact = DURATION_PRESETS.findIndex((p) => p.minutes === valueMinutes);
    return exact >= 0 ? exact : 1;
  }, [valueMinutes]);

  const maxIndex = DURATION_PRESETS.length - 1;
  const percent = (selectedIndex / maxIndex) * 100;
  const activeSvgX = (selectedIndex / maxIndex) * SVG_WIDTH;
  const activePreset = DURATION_PRESETS[selectedIndex];

  return (
    <div className="space-y-1.5">
      <label
        htmlFor="drive-session-duration"
        className="block text-xs sm:text-sm font-bold text-blue-950"
      >
        Session Duration
      </label>

      <div className="clay-well px-3.5 pt-2 pb-1.5 focus-within:ring-2 focus-within:ring-blue-400/70 transition-shadow">
        <div className="relative mx-2.5 h-6 flex items-center select-none">
          {/* Flowing wavy active + straight inactive SVG track */}
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            preserveAspectRatio="none"
            className="w-full h-6 overflow-visible pointer-events-none"
            aria-hidden="true"
          >
            <defs>
              <clipPath id={clipId}>
                <rect x="0" y="0" width={Math.max(0, activeSvgX)} height={SVG_HEIGHT} />
              </clipPath>
            </defs>

            {/* Inactive straight rail */}
            <line
              x1={activeSvgX}
              y1={CENTER_Y}
              x2={SVG_WIDTH}
              y2={CENTER_Y}
              stroke="#dbeafe"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Flowing royal-blue waveform clipped cleanly to the left of thumb */}
            <g clipPath={`url(#${clipId})`}>
              <path
                d={FLOWING_WAVE_PATH}
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drive-wave-flow"
                style={{ filter: 'drop-shadow(0 0 6px rgba(37, 99, 235, 0.55))' }}
              />
            </g>
          </svg>

          {/* Glowing circular thumb */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white border-[3px] border-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.65)] transition-all duration-150"
            style={{ left: `${percent}%` }}
          />

          {/* Native accessible range slider overlay */}
          <input
            ref={sliderRef}
            id="drive-session-duration"
            type="range"
            min={0}
            max={maxIndex}
            step={1}
            disabled={disabled}
            value={selectedIndex}
            aria-label="Session Duration"
            aria-valuetext={activePreset.readout}
            onChange={(e) => {
              const idx = Number(e.target.value);
              const preset = DURATION_PRESETS[idx];
              if (preset) {
                onChange(preset.minutes);
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 disabled:cursor-not-allowed"
          />
        </div>

        {/* Bottom tick marks & labels aligned cleanly under each stop */}
        <div className="relative mx-2.5 h-6 mt-0.5">
          {DURATION_PRESETS.map((preset, idx) => {
            const isSelected = idx === selectedIndex;
            const leftPct = (idx / maxIndex) * 100;
            return (
              <button
                key={preset.label}
                type="button"
                disabled={disabled}
                onClick={() => onChange(preset.minutes)}
                aria-pressed={isSelected}
                style={{ left: `${leftPct}%` }}
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center gap-0.5 cursor-pointer focus:outline-none disabled:cursor-not-allowed"
              >
                <span
                  aria-hidden="true"
                  className={`w-0.5 rounded-full transition-colors ${
                    isSelected ? 'h-2 bg-blue-600' : 'h-1.5 bg-slate-300'
                  }`}
                />
                <span
                  className={`text-[10px] sm:text-[11px] font-bold transition-all whitespace-nowrap ${
                    isSelected
                      ? 'text-blue-600 drop-shadow-[0_0_6px_rgba(37,99,235,0.45)]'
                      : 'text-slate-500 hover:text-blue-800'
                  }`}
                >
                  {preset.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
