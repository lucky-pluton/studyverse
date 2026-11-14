import React, { useState, useEffect } from 'react';
import {
  Compass,
  Timer,
  Sparkles,
  Award,
  Flame,
  RotateCcw,
  AlertCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import type { StudentPresence } from '../../types/studyverse';
import type { StudyStatistics } from '../../types/statistics';
import { studyStatsService } from '../../services/studyStatsService';

interface StudyStatsPanelProps {
  currentUser?: StudentPresence | null;
  isPomodoroRunning?: boolean;
  isStopwatchRunning?: boolean;
  currentPomodoroMode?: string;
}

export const StudyStatsPanel: React.FC<StudyStatsPanelProps> = ({
  currentUser,
  isPomodoroRunning = false,
  isStopwatchRunning = false,
  currentPomodoroMode = 'pomodoro',
}) => {
  const [stats, setStats] = useState<StudyStatistics>(studyStatsService.getStats());
  const [sessionSec, setSessionSec] = useState<number>(0);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Subscribe to persistent stats updates
  useEffect(() => {
    const unsub = studyStatsService.subscribe((newStats) => {
      setStats(newStats);
    });
    return () => unsub();
  }, []);

  // Live ticker for session duration
  useEffect(() => {
    const calculateSession = () => {
      if (currentUser?.sessionEnteredAt) {
        const elapsed = Math.max(0, Math.floor((Date.now() - currentUser.sessionEnteredAt) / 1000));
        setSessionSec(elapsed);
      } else {
        setSessionSec(0);
      }
    };

    calculateSession();
    const interval = setInterval(calculateSession, 1000);
    return () => clearInterval(interval);
  }, [currentUser?.sessionEnteredAt]);

  const stopwatchSec = Math.floor(stats.stopwatchTotalMs / 1000);
  const pomodoroSec = stats.pomodoroFocusSeconds;
  const totalFocusSec = stopwatchSec + pomodoroSec;

  // Calculate focus efficiency ratio vs total session duration
  const focusRatio = sessionSec > 0
    ? Math.min(100, Math.round((totalFocusSec / sessionSec) * 100))
    : 0;

  const handleReset = () => {
    studyStatsService.resetStats();
    setShowResetConfirm(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="p-3 bg-[#f6efe6] rounded-2xl border border-[#e5dacb] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2d5a43] text-white flex items-center justify-center shadow-xs">
            <TrendingUp className="w-4 h-4 text-emerald-200" />
          </div>
          <div>
            <h3 className="font-serif-title font-bold text-xs sm:text-sm text-[#2b241e]">
              Study Statistics
            </h3>
            <p className="text-[10px] text-[#716353]">
              Independent breakdown of your session & focus time
            </p>
          </div>
        </div>

        {focusRatio > 0 && (
          <div className="text-right">
            <span className="text-[9px] uppercase font-bold tracking-wider text-[#736353] block">
              Focus Ratio
            </span>
            <span className="font-mono-timer text-xs font-bold text-[#2d5a43]">
              {focusRatio}%
            </span>
          </div>
        )}
      </div>

      {/* 2. Core 3 Metrics Table / Cards */}
      <div className="space-y-2">
        {/* Metric 1: Total Study Session Duration */}
        <div className="p-3 bg-[#fffdfa] rounded-2xl border border-[#e5dacb] shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#eaf2ed] text-[#2d5a43] flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-[#2e261f]">Study Session</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="text-[10px] text-[#796b5b] truncate block">
                Total campus presence duration
              </span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="font-mono-timer font-bold text-sm sm:text-base text-[#241f1a]">
              {studyStatsService.formatDurationHoursMins(sessionSec)}
            </div>
            <span className="text-[9px] font-medium text-[#7a6d5d] uppercase tracking-wider">
              Elapsed
            </span>
          </div>
        </div>

        {/* Metric 2: Stopwatch Time */}
        <div className="p-3 bg-[#fffdfa] rounded-2xl border border-[#e5dacb] shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#fbf0e4] text-[#b27e46] flex items-center justify-center shrink-0">
              <Timer className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-[#2e261f]">Stopwatch</span>
                {isStopwatchRunning && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 font-bold uppercase animate-pulse">
                    Running
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[#796b5b] truncate block">
                Accumulated active stopwatch time
              </span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="font-mono-timer font-bold text-sm sm:text-base text-[#805021]">
              {studyStatsService.formatDurationHoursMins(stopwatchSec)}
            </div>
            <span className="text-[9px] font-medium text-[#7a6d5d] uppercase tracking-wider">
              Active
            </span>
          </div>
        </div>

        {/* Metric 3: Pomodoro Focus Time */}
        <div className="p-3 bg-[#fffdfa] rounded-2xl border border-[#e5dacb] shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#eaf3ed] text-[#2d5a43] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-[#2e261f]">Pomodoro Focus</span>
                {isPomodoroRunning && !currentPomodoroMode.includes('break') && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-900 font-bold uppercase animate-pulse">
                    Focusing
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[#796b5b] truncate block">
                Pure focus time (breaks excluded)
              </span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="font-mono-timer font-bold text-sm sm:text-base text-[#204a35]">
              {studyStatsService.formatDurationHoursMins(pomodoroSec)}
            </div>
            <span className="text-[9px] font-medium text-[#7a6d5d] uppercase tracking-wider">
              Completed
            </span>
          </div>
        </div>
      </div>

      {/* 3. Proportional Focus Distribution Bar */}
      {sessionSec > 0 && (
        <div className="space-y-1.5 p-2.5 bg-[#fcf9f5] rounded-xl border border-[#ece3d6]">
          <div className="flex justify-between text-[10px] font-medium text-[#6e5f50]">
            <span>Focus Time Distribution</span>
            <span>{studyStatsService.formatDurationHoursMins(totalFocusSec)} total focused</span>
          </div>
          <div className="w-full h-2.5 bg-[#e8ded0] rounded-full overflow-hidden flex">
            {pomodoroSec > 0 && (
              <div
                style={{ width: `${Math.min(100, (pomodoroSec / sessionSec) * 100)}%` }}
                className="bg-[#2d5a43] h-full"
                title={`Pomodoro Focus: ${studyStatsService.formatDurationHoursMins(pomodoroSec)}`}
              />
            )}
            {stopwatchSec > 0 && (
              <div
                style={{ width: `${Math.min(100 - (pomodoroSec / sessionSec) * 100, (stopwatchSec / sessionSec) * 100)}%` }}
                className="bg-[#b27e46] h-full"
                title={`Stopwatch Time: ${studyStatsService.formatDurationHoursMins(stopwatchSec)}`}
              />
            )}
          </div>
          <div className="flex items-center gap-3 text-[9px] text-[#786b5c] pt-0.5">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#2d5a43]" /> Pomodoro
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#b27e46]" /> Stopwatch
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#e8ded0]" /> Other Study Time
            </span>
          </div>
        </div>
      )}

      {/* 4. Secondary Helpful Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 bg-[#f6efe6] rounded-xl border border-[#e5dacb] text-center">
          <div className="flex items-center justify-center gap-1 text-[#2d5a43] mb-0.5">
            <Award className="w-3.5 h-3.5" />
            <span className="font-mono-timer text-xs font-bold text-[#234433]">
              {stats.completedPomodoroSessions}
            </span>
          </div>
          <span className="text-[9px] text-[#736353] block leading-tight">
            Pomodoro Cycles
          </span>
        </div>

        <div className="p-2.5 bg-[#f6efe6] rounded-xl border border-[#e5dacb] text-center">
          <div className="flex items-center justify-center gap-1 text-[#b27e46] mb-0.5">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono-timer text-xs font-bold text-[#6a421a]">
              {stats.stopwatchSessionCount}
            </span>
          </div>
          <span className="text-[9px] text-[#736353] block leading-tight">
            Stopwatch Runs
          </span>
        </div>

        <div className="p-2.5 bg-[#f6efe6] rounded-xl border border-[#e5dacb] text-center">
          <div className="flex items-center justify-center gap-1 text-[#2d5a43] mb-0.5">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-mono-timer text-xs font-bold text-[#241d17]">
              {studyStatsService.formatDurationHoursMins(Math.floor(stats.longestStopwatchMs / 1000))}
            </span>
          </div>
          <span className="text-[9px] text-[#736353] block leading-tight truncate">
            Longest Run
          </span>
        </div>
      </div>

      {/* 5. Reset Confirmation Controls */}
      <div className="pt-2 border-t border-[#e8ded0]">
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            type="button"
            className="text-[11px] text-[#857463] hover:text-[#524436] flex items-center justify-center gap-1.5 w-full py-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Statistics for New Session</span>
          </button>
        ) : (
          <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-amber-900 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>Reset focus tracking metrics?</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleReset}
                type="button"
                className="px-2.5 py-1 rounded-lg bg-[#8b4343] hover:bg-[#703333] text-white text-[10px] font-semibold transition-colors cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                type="button"
                className="px-2 py-1 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-[10px] font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
