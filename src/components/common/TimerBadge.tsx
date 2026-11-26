import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import type { StudyStatus } from '../../types/studyverse';

interface FloatingSeatTimerProps {
  seatEnteredAt: number | null;
  studentName: string;
  isSelf?: boolean;
  studyTopic?: string;
  status?: StudyStatus;
  isDnd?: boolean;
  className?: string;
}

export interface TinyFloatingTimerProps {
  seatEnteredAt: number | null;
  className?: string;
  isSelf?: boolean;
  isDnd?: boolean;
}

export const formatDuration = (timestampMs: number | null): string => {
  if (!timestampMs) return '1m';
  const elapsedSec = Math.max(0, Math.floor((Date.now() - timestampMs) / 1000));
  const minutes = Math.floor(elapsedSec / 60);
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;

  if (hours === 0) {
    if (minutes === 0) return '1m';
    return `${minutes}m`;
  }

  return `${hours}h ${remMinutes < 10 ? '0' : ''}${remMinutes}m`;
};

export const formatDetailedDuration = (timestampMs: number | null): string => {
  if (!timestampMs) return '00:00';
  const elapsedSec = Math.max(0, Math.floor((Date.now() - timestampMs) / 1000));
  const seconds = elapsedSec % 60;
  const minutes = Math.floor(elapsedSec / 60) % 60;
  const hours = Math.floor(elapsedSec / 3600);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
};

export const formatDurationDescriptive = (timestampMs: number | null): string => {
  if (!timestampMs) return 'Just seated';
  const elapsedSec = Math.max(0, Math.floor((Date.now() - timestampMs) / 1000));
  const minutes = Math.floor(elapsedSec / 60);
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;

  if (hours === 0) {
    if (minutes <= 1) return 'Studying for 1 minute';
    return `Studying for ${minutes} minutes`;
  }
  if (hours === 1) {
    return remMinutes > 0 ? `Studying for 1 hour ${remMinutes} minutes` : 'Studying for 1 hour';
  }
  return remMinutes > 0 ? `Studying for ${hours} hours ${remMinutes} minutes` : `Studying for ${hours} hours`;
};

export const formatStudyingTime = (timestampMs: number | null): string => {
  return `Studying for ${formatDuration(timestampMs)}`;
};

/**
 * Tiny floating study timer pill positioned directly above chibi avatar heads
 */
export const TinyFloatingTimer: React.FC<TinyFloatingTimerProps> = ({
  seatEnteredAt,
  className = '',
  isSelf = false,
  isDnd = false,
}) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    // Continuously update live timer
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!seatEnteredAt) return null;

  const timeString = formatDuration(seatEnteredAt);

  return (
    <div
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#fffcf5]/95 backdrop-blur-xs border text-[#2b241e] shadow-2xs select-none pointer-events-none transition-all ${
        isSelf ? 'border-[#3f6e52] ring-1 ring-[#52796f]/40 font-black' : 'border-[#ded4c5]'
      } ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
      <span className="font-mono-timer text-[8.5px] sm:text-[9px] font-bold tracking-tight leading-none text-[#2d251f]">
        {timeString}
      </span>
      {isDnd && <span className="text-[8px] leading-none ml-0.5">🌙</span>}
    </div>
  );
};

/**
 * Floating badge above each seated avatar in a study space
 */
export const FloatingSeatTimer: React.FC<FloatingSeatTimerProps> = ({
  seatEnteredAt,
  studentName,
  isSelf = false,
  studyTopic,
  status,
  isDnd = false,
  className = '',
}) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    // Update continuously for live timer precision
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const timeString = formatDuration(seatEnteredAt);
  const statusEmoji =
    status === 'deep-focus'
      ? '🎯'
      : status === 'break'
      ? '☕'
      : status === 'away'
      ? '🌙'
      : status === 'studying'
      ? '📖'
      : null;

  return (
    <div
      className={`absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30 transition-all duration-300 ${className}`}
    >
      {/* Student Name & Seat Timer Bubble */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm border backdrop-blur-md whitespace-nowrap ${
          isSelf
            ? 'bg-[#fffcf5] text-[#1b3d2b] border-[#52796f] ring-2 ring-[#84a98c]/35'
            : 'bg-[#fffdf9]/95 text-[#2b251f] border-[#e2d7c7]'
        }`}
      >
        <span className="font-semibold tracking-tight text-[11px] flex items-center gap-1">
          {statusEmoji && <span className="text-[10px]">{statusEmoji}</span>}
          <span>{studentName}</span>
          {isDnd && <span title="Do Not Disturb (Quiet Study)" className="text-[10px]">🌙</span>}
        </span>
        {isSelf && <span className="text-[9px] font-bold text-[#426b52]">(you)</span>}
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-mono-timer text-[10px] font-bold text-[#2d5a43] bg-[#f2ede4] px-1.5 py-0.2 rounded">
          {timeString}
        </span>
      </div>

      {/* Optional Study Goal / Subject tag */}
      {studyTopic && (
        <div className="mt-0.5 text-[9px] font-medium tracking-wide px-1.5 py-0.2 bg-[#f4ece1]/90 text-[#735740] rounded border border-[#e8dbcc] shadow-2xs whitespace-nowrap">
          {studyTopic}
        </div>
      )}

      {/* Cute downward pointer arrow */}
      <div
        className={`w-1.5 h-1.5 rotate-45 -mt-1 border-r border-b ${
          isSelf ? 'bg-[#fffcf5] border-[#52796f]' : 'bg-[#fffdf9] border-[#e2d7c7]'
        }`}
      />
    </div>
  );
};

/**
 * Top Navbar or Floating Dock Session Duration counter
 */
export const SessionTimeDisplay: React.FC<{
  sessionEnteredAt: number;
  className?: string;
}> = ({ sessionEnteredAt, className = '' }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const displayTime = formatDetailedDuration(sessionEnteredAt);

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs font-mono-timer bg-[#f4efe6] text-[#4f463f] px-2.5 py-1 rounded-full border border-[#ded5c7] shadow-inner ${className}`}
      title="Total time spent in Sahej-Shala this session"
    >
      <Clock className="w-3.5 h-3.5 text-[#8a7258]" />
      <span className="font-semibold text-xs">{displayTime}</span>
    </div>
  );
};
