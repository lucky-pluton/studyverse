import React from 'react';
import type { FocusMode, FocusPreset } from '../../types/focusTimer';
import { FOCUS_PRESETS } from '../../types/focusTimer';
import { Sliders, Clock } from 'lucide-react';

interface FocusPresetSelectorProps {
  currentMode: FocusMode;
  customMinutes: number;
  onSelectMode: (mode: FocusMode) => void;
  onCustomMinutesChange: (minutes: number) => void;
  disabled?: boolean;
}

const PRESET_DISPLAY: Record<FocusMode, { title: string; defaultMins: number }> = {
  pomodoro: { title: 'Pomo', defaultMins: 25 },
  'short-break': { title: 'Short', defaultMins: 5 },
  'deep-focus': { title: 'Deep', defaultMins: 50 },
  'long-break': { title: 'Long', defaultMins: 10 },
  custom: { title: 'Custom', defaultMins: 30 },
};

export const FocusPresetSelector: React.FC<FocusPresetSelectorProps> = ({
  currentMode,
  customMinutes,
  onSelectMode,
  onCustomMinutesChange,
  disabled = false,
}) => {
  const modes: FocusMode[] = ['pomodoro', 'short-break', 'deep-focus', 'long-break', 'custom'];

  const quickCustomPresets = [15, 25, 45, 60, 90, 120];

  return (
    <div className="space-y-2.5">
      {/* 5 Preset Selector Chips / Buttons */}
      <div className="grid grid-cols-5 gap-1 sm:gap-1.5" role="group" aria-label="Timer Presets">
        {modes.map((modeKey) => {
          const preset: FocusPreset = FOCUS_PRESETS[modeKey];
          const display = PRESET_DISPLAY[modeKey];
          const isSelected = currentMode === modeKey;
          const isBreak = preset.category === 'break';

          return (
            <button
              key={modeKey}
              type="button"
              disabled={disabled}
              onClick={() => onSelectMode(modeKey)}
              className={`py-1.5 px-0.5 sm:px-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                isSelected
                  ? isBreak
                    ? 'bg-[#784824] text-white border-[#5e371b] shadow-xs'
                    : 'bg-[#2d5a43] text-white border-[#1e382b] shadow-xs'
                  : 'bg-[#faf6f0] hover:bg-[#ede5d8] text-[#554737] border-[#ded2c1] hover:border-[#c8bba8]'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={`${preset.label} — ${preset.description}`}
              aria-pressed={isSelected}
            >
              <span className="leading-tight font-serif-title font-bold text-[11px]">
                {display.title}
              </span>
              <span
                className={`text-[9.5px] font-mono-timer mt-0.5 leading-none ${
                  isSelected ? 'text-white/85' : 'text-[#887868]'
                }`}
              >
                {modeKey === 'custom' ? `${customMinutes}m` : `${preset.durationMinutes}m`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Duration Slider Section (Revealed when 'custom' is active) */}
      {currentMode === 'custom' && (
        <div className="p-3 bg-gradient-to-b from-[#f9f4ed] to-[#f2eae0] rounded-2xl border border-[#e3d7c7] shadow-inner space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between text-xs text-[#4a3e31]">
            <div className="flex items-center gap-1.5 font-semibold">
              <Sliders className="w-3.5 h-3.5 text-[#2d5a43]" />
              <span>Custom Duration</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/80 border border-[#ded2c1] font-mono-timer font-bold text-[#1e382b]">
              <Clock className="w-3 h-3 text-[#2d5a43]" />
              <span>{customMinutes} min</span>
            </div>
          </div>

          {/* Interactive Range Slider (1 to 120 minutes) */}
          <div className="space-y-1">
            <input
              type="range"
              min="1"
              max="120"
              step="1"
              value={customMinutes}
              onChange={(e) => onCustomMinutesChange(Number(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-[#dfd4c5] rounded-lg appearance-none cursor-pointer accent-[#2d5a43] focus:outline-hidden"
              aria-label="Custom timer duration in minutes"
              aria-valuemin={1}
              aria-valuemax={120}
              aria-valuenow={customMinutes}
            />

            <div className="flex justify-between text-[9px] font-mono-timer text-[#8a7c6e] px-0.5">
              <span>1m</span>
              <span>30m</span>
              <span>60m</span>
              <span>90m</span>
              <span>120m</span>
            </div>
          </div>

          {/* Quick-Pick Interval Chips */}
          <div className="flex items-center gap-1 pt-0.5 flex-wrap">
            <span className="text-[10px] text-[#7d6f60] font-medium mr-1">Quick:</span>
            {quickCustomPresets.map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => onCustomMinutesChange(mins)}
                disabled={disabled}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono-timer font-semibold transition-colors cursor-pointer ${
                  customMinutes === mins
                    ? 'bg-[#2d5a43] text-white'
                    : 'bg-white/70 hover:bg-white text-[#5d4f40] border border-[#dcd0bf]'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
