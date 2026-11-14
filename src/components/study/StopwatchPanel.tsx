import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Flag,
  AlertTriangle,
} from 'lucide-react';
import type { StopwatchLap, StoredStopwatchState } from '../../types/stopwatch';
import { formatStopwatchTime, formatLapSplit } from '../../utils/stopwatchFormatters';

const STOPWATCH_STORAGE_KEY = 'studyverse_stopwatch_state';

interface StopwatchPanelProps {
  onRunningChange?: (isRunning: boolean) => void;
  onElapsedChange?: (elapsedMs: number) => void;
}

export const StopwatchPanel: React.FC<StopwatchPanelProps> = ({
  onRunningChange,
  onElapsedChange,
}) => {
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [laps, setLaps] = useState<StopwatchLap[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // References to guarantee exact timestamp math without interval drift
  const startTimeRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef<number>(0);

  // Helper to persist state to localStorage
  const persistState = useCallback(
    (
      running: boolean,
      startTime: number | null,
      accumulated: number,
      lapList: StopwatchLap[]
    ) => {
      try {
        const state: StoredStopwatchState = {
          isRunning: running,
          startTime,
          accumulatedMs: accumulated,
          laps: lapList,
        };
        localStorage.setItem(STOPWATCH_STORAGE_KEY, JSON.stringify(state));
      } catch (err) {
        console.warn('[Stopwatch] Failed to persist state:', err);
      }
    },
    []
  );

  // 1. Restore stopwatch state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STOPWATCH_STORAGE_KEY);
      if (saved) {
        const parsed: StoredStopwatchState = JSON.parse(saved);
        accumulatedMsRef.current = Math.max(0, parsed.accumulatedMs || 0);
        const restoredLaps = parsed.laps || [];
        setLaps(restoredLaps);

        if (parsed.isRunning && parsed.startTime) {
          startTimeRef.current = parsed.startTime;
          const now = Date.now();
          const currentElapsed = Math.max(0, parsed.accumulatedMs + (now - parsed.startTime));
          setElapsedMs(currentElapsed);
          setIsRunning(true);
          onRunningChange?.(true);
          onElapsedChange?.(currentElapsed);
        } else {
          startTimeRef.current = null;
          setElapsedMs(accumulatedMsRef.current);
          setIsRunning(false);
          onRunningChange?.(false);
          onElapsedChange?.(accumulatedMsRef.current);
        }
      }
    } catch {
      // Storage parsing fallback
    }
  }, []);

  // Notify parent on running/elapsed state changes
  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  useEffect(() => {
    onElapsedChange?.(elapsedMs);
  }, [elapsedMs, onElapsedChange]);

  // 2. High-precision timestamp calculation ticker
  useEffect(() => {
    if (!isRunning) return;

    const tick = () => {
      if (!startTimeRef.current) return;
      const now = Date.now();
      const current = accumulatedMsRef.current + (now - startTimeRef.current);
      setElapsedMs(current);
    };

    tick();
    // 33ms interval (~30fps) keeps millisecond counter smooth and CPU lightweight
    const interval = setInterval(tick, 33);

    // Synchronize immediately if tab was throttled in background and becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isRunning]);

  // Handlers
  const handleStart = () => {
    const now = Date.now();
    startTimeRef.current = now;
    accumulatedMsRef.current = 0;
    setElapsedMs(0);
    setIsRunning(true);
    setShowResetConfirm(false);
    persistState(true, now, 0, laps);
  };

  const handlePause = () => {
    if (!isRunning || !startTimeRef.current) return;
    const now = Date.now();
    const currentRunMs = now - startTimeRef.current;
    const totalMs = accumulatedMsRef.current + currentRunMs;

    accumulatedMsRef.current = totalMs;
    startTimeRef.current = null;
    setIsRunning(false);
    setElapsedMs(totalMs);
    setShowResetConfirm(false);
    persistState(false, null, totalMs, laps);
  };

  const handleResume = () => {
    const now = Date.now();
    startTimeRef.current = now;
    setIsRunning(true);
    setShowResetConfirm(false);
    persistState(true, now, accumulatedMsRef.current, laps);
  };

  const handleLap = () => {
    if (!isRunning) return;

    const currentTotal = startTimeRef.current
      ? accumulatedMsRef.current + (Date.now() - startTimeRef.current)
      : elapsedMs;

    const prevLapTotal = laps.length > 0 ? laps[0].totalMs : 0;
    const splitMs = Math.max(0, currentTotal - prevLapTotal);

    const newLap: StopwatchLap = {
      lapNumber: laps.length + 1,
      splitMs,
      totalMs: currentTotal,
      timestamp: Date.now(),
    };

    const updatedLaps = [newLap, ...laps]; // Newest lap first
    setLaps(updatedLaps);
    persistState(isRunning, startTimeRef.current, accumulatedMsRef.current, updatedLaps);
  };

  const handleResetClick = () => {
    if (isRunning) {
      setShowResetConfirm(true);
    } else {
      performReset();
    }
  };

  const performReset = () => {
    startTimeRef.current = null;
    accumulatedMsRef.current = 0;
    setIsRunning(false);
    setElapsedMs(0);
    setLaps([]);
    setShowResetConfirm(false);
    persistState(false, null, 0, []);
  };

  const time = formatStopwatchTime(elapsedMs);

  return (
    <div className="space-y-4 text-[#2d2824]">
      {/* 1. Large Elapsed Time Display */}
      <div className="p-4 bg-gradient-to-b from-[#f9f5ee] to-[#f2ece2] rounded-2xl border border-[#e3d7c7] text-center shadow-inner relative overflow-hidden">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7a6f62] mb-1">
          Elapsed Time
        </div>

        {/* Display: HH:MM:SS.ms */}
        <div className="flex items-baseline justify-center font-mono-timer select-none">
          <span className="text-3xl sm:text-4xl font-extrabold text-[#1c382b] tracking-tight">
            {time.hours}:{time.minutes}:{time.seconds}
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-[#52796f] ml-1">
            .{time.centiseconds}
          </span>
        </div>

        <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-[#6d7f74]">
          <span
            className={`w-2 h-2 rounded-full ${
              isRunning ? 'bg-emerald-500 animate-pulse' : elapsedMs > 0 ? 'bg-amber-500' : 'bg-[#aba094]'
            }`}
          />
          <span className="font-medium">
            {isRunning ? 'Counting...' : elapsedMs > 0 ? 'Paused' : 'Ready'}
          </span>
        </div>
      </div>

      {/* 2. Reset Confirmation Banner (when running) */}
      {showResetConfirm && (
        <div className="p-3 bg-[#fef2f2] border border-[#fecaca] rounded-2xl text-rose-950 text-xs space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Reset stopwatch? This will discard your current session and laps.</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={performReset}
              type="button"
              className="flex-1 py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Confirm Reset
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              type="button"
              className="py-1.5 px-3 rounded-xl bg-white hover:bg-neutral-100 text-[#4d4032] border border-[#e0d5c5] font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 3. Action Buttons */}
      <div className="flex items-center gap-2">
        {!isRunning ? (
          <>
            {elapsedMs === 0 ? (
              // Initial Start Button
              <button
                onClick={handleStart}
                type="button"
                className="flex-1 py-2.5 rounded-2xl bg-[#2d5a43] hover:bg-[#1e402e] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Stopwatch</span>
              </button>
            ) : (
              // Paused: Resume and Reset
              <>
                <button
                  onClick={handleResume}
                  type="button"
                  className="flex-1 py-2.5 rounded-2xl bg-[#2d5a43] hover:bg-[#1e402e] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Resume</span>
                </button>
                <button
                  onClick={handleResetClick}
                  type="button"
                  className="py-2.5 px-3.5 rounded-2xl bg-[#f2ede4] hover:bg-[#e4dcce] border border-[#d8cdbd] text-[#4d4033] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Reset Stopwatch"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </>
            )}
          </>
        ) : (
          // Running: Pause and Lap
          <>
            <button
              onClick={handlePause}
              type="button"
              className="flex-1 py-2.5 rounded-2xl bg-[#784824] hover:bg-[#5e371b] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Pause className="w-4 h-4 fill-white" />
              <span>Pause</span>
            </button>
            <button
              onClick={handleLap}
              type="button"
              className="py-2.5 px-4 rounded-2xl bg-[#f4ece1] hover:bg-[#e8decb] border border-[#dcd0bf] text-[#2b251e] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Record Lap"
            >
              <Flag className="w-3.5 h-3.5 text-[#52796f]" />
              <span>Lap</span>
            </button>
            <button
              onClick={handleResetClick}
              type="button"
              className="p-2.5 rounded-2xl bg-[#faf5ed] hover:bg-[#f0e7d8] border border-[#ded3c3] text-[#7a6f62] hover:text-[#332b24] transition-colors cursor-pointer"
              title="Reset Stopwatch"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* 4. Lap History */}
      {laps.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[#7a6d5f] px-2">
            <span>Lap History ({laps.length})</span>
            <span>Split / Total</span>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1 pr-1 rounded-xl bg-[#faf7f2] p-1.5 border border-[#e8ded0] text-xs">
            {laps.map((lap) => {
              const formattedTotal = formatStopwatchTime(lap.totalMs).formatted;
              const formattedSplit = formatLapSplit(lap.splitMs);

              return (
                <div
                  key={lap.lapNumber}
                  className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-white border border-[#ece3d5] shadow-2xs font-mono-timer text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#2d5a43] w-12 text-left">
                      Lap {lap.lapNumber}
                    </span>
                    <span className="text-[#6d8276] text-[10px]">
                      {formattedSplit}
                    </span>
                  </div>

                  <span className="font-bold text-[#2d2824]">
                    {formattedTotal}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
