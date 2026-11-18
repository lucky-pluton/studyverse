import React from 'react';
import type { FocusPreset } from '../../types/focusTimer';

interface CircularProgressRingProps {
  remainingSeconds: number;
  totalDurationSeconds: number;
  isRunning: boolean;
  preset: FocusPreset;
  customMinutes?: number;
  size?: number;
}

export const CircularProgressRing: React.FC<CircularProgressRingProps> = ({
  remainingSeconds,
  totalDurationSeconds,
  isRunning,
  preset,
  customMinutes,
  size = 190,
}) => {
  const isBreak = preset.category === 'break';
  const strokeWidth = 7;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  // Safe progress percentage (0 to 100)
  const safeTotal = Math.max(1, totalDurationSeconds);
  const elapsed = Math.max(0, safeTotal - remainingSeconds);
  const progressPercent = Math.min(100, Math.max(0, (elapsed / safeTotal) * 100));
  const strokeDashoffset = circumference * (1 - progressPercent / 100);

  // Time format MM:SS or HH:MM:SS
  const formatTime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

    if (hours > 0) {
      return `${hours}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  };

  const statusText = isRunning
    ? isBreak
      ? 'Resting...'
      : 'Focusing...'
    : remainingSeconds === 0
    ? 'Completed'
    : remainingSeconds < totalDurationSeconds
    ? 'Paused'
    : 'Ready';

  // Ring theme colors
  const progressColor = isBreak ? '#b27e46' : '#2d5a43';

  return (
    <div
      className="relative mx-auto flex items-center justify-center my-1 select-none"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(progressPercent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${preset.label} timer: ${formatTime(remainingSeconds)} remaining`}
    >
      <svg
        className="w-full h-full -rotate-90 transform"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Subtle drop shadow filter for ring */}
        <defs>
          <filter id="ring-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5dbcf"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="opacity-60"
        />

        {/* Animated Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          filter="url(#ring-shadow)"
          style={{
            transition: isRunning ? 'stroke-dashoffset 0.4s linear' : 'stroke-dashoffset 0.25s ease-out',
          }}
        />
      </svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
        {/* Mode & Category Label */}
        <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#52796f] mb-0.5">
          <span>{isBreak ? '☕' : '🎯'}</span>
          <span>{preset.id === 'custom' ? `Custom (${customMinutes || 30}m)` : preset.label}</span>
        </div>

        {/* Large Prominent Monospace Timer Digits */}
        <div
          className="font-mono-timer text-4xl sm:text-[42px] font-black tracking-tight text-[#1c382b] leading-none my-1 select-none"
          aria-live="polite"
        >
          {formatTime(remainingSeconds)}
        </div>

        {/* Status Indicator with Pulsing Dot */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#6d7f74] font-medium mt-1">
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              isRunning
                ? isBreak
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-emerald-500 animate-pulse'
                : remainingSeconds === 0
                ? 'bg-emerald-600'
                : 'bg-[#aba094]'
            }`}
          />
          <span>{statusText}</span>
        </div>

        {/* Percentage Badge */}
        <div className="text-[10px] text-[#8c7e6f] font-mono-timer mt-1 font-semibold">
          {Math.round(progressPercent)}%
        </div>
      </div>
    </div>
  );
};

