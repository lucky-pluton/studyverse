import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  Coffee,
  Sparkles,
  Timer,
  ChevronUp,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import { soundService } from '../../services/soundService';
import { StopwatchPanel } from './StopwatchPanel';
import { StudyStatsPanel } from './StudyStatsPanel';
import { studyStatsService } from '../../services/studyStatsService';
import { formatDuration } from '../common/TimerBadge';
import type { StudentPresence } from '../../types/studyverse';

export type TimerTab = 'pomodoro' | 'stopwatch' | 'stats';
export type FocusMode = 'pomodoro' | 'short-break' | 'deep-focus' | 'long-break' | 'custom';

interface FocusPreset {
  id: FocusMode;
  label: string;
  durationMinutes: number;
  category: 'focus' | 'break';
  color: string;
}

const PRESETS: Record<FocusMode, FocusPreset> = {
  pomodoro: {
    id: 'pomodoro',
    label: 'Pomodoro',
    durationMinutes: 25,
    category: 'focus',
    color: '#2d5a43',
  },
  'short-break': {
    id: 'short-break',
    label: 'Short Break',
    durationMinutes: 5,
    category: 'break',
    color: '#784824',
  },
  'deep-focus': {
    id: 'deep-focus',
    label: 'Deep Focus',
    durationMinutes: 50,
    category: 'focus',
    color: '#1e382b',
  },
  'long-break': {
    id: 'long-break',
    label: 'Long Break',
    durationMinutes: 10,
    category: 'break',
    color: '#845328',
  },
  custom: {
    id: 'custom',
    label: 'Custom',
    durationMinutes: 30,
    category: 'focus',
    color: '#2a4365',
  },
};

interface StoredTimerState {
  mode: FocusMode;
  customMinutes: number;
  remainingSeconds: number;
  isRunning: boolean;
  endTimestamp: number | null;
  soundEnabled: boolean;
  completedCount: number;
}

const POMODORO_STORAGE_KEY = 'studyverse_focus_timer';

interface StudyTimerUtilityProps {
  currentUser?: StudentPresence | null;
  className?: string;
}

export const StudyTimerUtility: React.FC<StudyTimerUtilityProps> = ({
  currentUser,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TimerTab>('pomodoro');

  // --- Pomodoro State ---
  const [mode, setMode] = useState<FocusMode>('pomodoro');
  const [customMinutes, setCustomMinutes] = useState<number>(30);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [completedNotification, setCompletedNotification] = useState<{
    show: boolean;
    mode: FocusMode;
    message: string;
  }>({ show: false, mode: 'pomodoro', message: '' });

  // --- Stopwatch State tracking (for launcher pill & tabs) ---
  const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(false);
  const [stopwatchElapsedMs, setStopwatchElapsedMs] = useState<number>(0);

  const endTimestampRef = useRef<number | null>(null);

  // 1. Restore Pomodoro from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(POMODORO_STORAGE_KEY);
      if (saved) {
        const parsed: StoredTimerState = JSON.parse(saved);
        setMode(parsed.mode || 'pomodoro');
        setCustomMinutes(parsed.customMinutes || 30);
        setSoundEnabled(parsed.soundEnabled ?? true);

        if (parsed.isRunning && parsed.endTimestamp) {
          const now = Date.now();
          const left = Math.max(0, Math.ceil((parsed.endTimestamp - now) / 1000));
          if (left > 0) {
            endTimestampRef.current = parsed.endTimestamp;
            setRemainingSeconds(left);
            setIsPomodoroRunning(true);
          } else {
            endTimestampRef.current = null;
            setIsPomodoroRunning(false);
            setRemainingSeconds(0);
          }
        } else {
          const defaultSec = PRESETS[parsed.mode || 'pomodoro'].durationMinutes * 60;
          setRemainingSeconds(parsed.remainingSeconds ?? defaultSec);
          setIsPomodoroRunning(false);
          endTimestampRef.current = null;
        }
      }
    } catch {
      // Storage fallback
    }
  }, []);

  // 2. Persist Pomodoro State
  const persistPomodoroState = useCallback(
    (
      newMode: FocusMode,
      newRemaining: number,
      newRunning: boolean,
      newEndTs: number | null,
      newSound: boolean,
      newCustom: number
    ) => {
      try {
        const data: StoredTimerState = {
          mode: newMode,
          customMinutes: newCustom,
          remainingSeconds: newRemaining,
          isRunning: newRunning,
          endTimestamp: newEndTs,
          soundEnabled: newSound,
          completedCount: 0,
        };
        localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(data));
      } catch {}
    },
    []
  );

  // 3. Accurate Pomodoro countdown ticker & Study Statistics focus tracker
  const lastFocusTickRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isPomodoroRunning || !endTimestampRef.current) return;

    lastFocusTickRef.current = Date.now();

    const tick = () => {
      if (!endTimestampRef.current) return;
      const now = Date.now();
      const left = Math.max(0, Math.ceil((endTimestampRef.current - now) / 1000));

      setRemainingSeconds(left);

      // Accumulate active focus time strictly during focus categories (breaks are excluded!)
      const isFocus = PRESETS[mode].category === 'focus';
      if (isFocus) {
        const deltaSec = Math.floor((now - lastFocusTickRef.current) / 1000);
        if (deltaSec >= 1) {
          studyStatsService.addPomodoroFocusSeconds(deltaSec);
          lastFocusTickRef.current = now;
        }
      }

      if (left <= 0) {
        setIsPomodoroRunning(false);
        endTimestampRef.current = null;

        const isBreak = PRESETS[mode].category === 'break';
        if (!isBreak) {
          studyStatsService.incrementCompletedPomodoro();
        }

        const msg = isBreak
          ? 'Break complete! Ready to begin your next focus session?'
          : 'Focus session complete! Time for a short break.';

        setCompletedNotification({
          show: true,
          mode,
          message: msg,
        });

        if (soundEnabled) {
          soundService.playFocusChime();
        }

        persistPomodoroState(mode, 0, false, null, soundEnabled, customMinutes);
      }
    };

    tick();
    const interval = setInterval(tick, 500);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      // Flush any pending focus seconds when pausing/unmounting
      if (PRESETS[mode].category === 'focus') {
        const deltaSec = Math.floor((Date.now() - lastFocusTickRef.current) / 1000);
        if (deltaSec >= 1) {
          studyStatsService.addPomodoroFocusSeconds(deltaSec);
        }
      }
    };
  }, [isPomodoroRunning, mode, soundEnabled, customMinutes, persistPomodoroState]);

  // Listen for open-timer-stats custom event from Navbar or shortcuts
  useEffect(() => {
    const handleOpenStats = () => {
      setActiveTab('stats');
      setIsOpen(true);
    };
    window.addEventListener('studyverse:open-timer-stats', handleOpenStats);
    return () => window.removeEventListener('studyverse:open-timer-stats', handleOpenStats);
  }, []);

  const handleOpenUtility = () => {
    setIsOpen(true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studyverse:panel-opened', { detail: { panel: 'timer' } }));
    }
  };

  const handleCloseUtility = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studyverse:panel-closed', { detail: { panel: 'timer' } }));
    }
  };

  // Pomodoro Handlers
  const handleTogglePlayPause = () => {
    if (isPomodoroRunning) {
      setIsPomodoroRunning(false);
      endTimestampRef.current = null;
      persistPomodoroState(mode, remainingSeconds, false, null, soundEnabled, customMinutes);
    } else {
      let currentLeft = remainingSeconds;
      if (currentLeft <= 0) {
        currentLeft = (mode === 'custom' ? customMinutes : PRESETS[mode].durationMinutes) * 60;
      }
      const targetEnd = Date.now() + currentLeft * 1000;
      endTimestampRef.current = targetEnd;
      setRemainingSeconds(currentLeft);
      setIsPomodoroRunning(true);
      persistPomodoroState(mode, currentLeft, true, targetEnd, soundEnabled, customMinutes);
    }
  };

  const handleResetPomodoro = () => {
    setIsPomodoroRunning(false);
    endTimestampRef.current = null;
    const initialSec = (mode === 'custom' ? customMinutes : PRESETS[mode].durationMinutes) * 60;
    setRemainingSeconds(initialSec);
    persistPomodoroState(mode, initialSec, false, null, soundEnabled, customMinutes);
  };

  const handleSelectMode = (newMode: FocusMode) => {
    setMode(newMode);
    setIsPomodoroRunning(false);
    endTimestampRef.current = null;
    const durSec = (newMode === 'custom' ? customMinutes : PRESETS[newMode].durationMinutes) * 60;
    setRemainingSeconds(durSec);
    persistPomodoroState(newMode, durSec, false, null, soundEnabled, customMinutes);
  };

  const handleCustomChange = (mins: number) => {
    const clamped = Math.max(1, Math.min(180, mins));
    setCustomMinutes(clamped);
    if (mode === 'custom') {
      setIsPomodoroRunning(false);
      endTimestampRef.current = null;
      setRemainingSeconds(clamped * 60);
      persistPomodoroState('custom', clamped * 60, false, null, soundEnabled, clamped);
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    persistPomodoroState(mode, remainingSeconds, isPomodoroRunning, endTimestampRef.current, next, customMinutes);
  };

  const formatPomodoroTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(m)}:${pad(s)}`;
  };

  const formatStopwatchPillTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(m)}:${pad(s)}`;
  };

  const currentPreset = PRESETS[mode];
  const totalDurationSec = (mode === 'custom' ? customMinutes : currentPreset.durationMinutes) * 60;
  const progressPercent = Math.max(0, Math.min(100, ((totalDurationSec - remainingSeconds) / totalDurationSec) * 100));

  // Study duration formatting
  const sessionDuration = currentUser?.sessionEnteredAt ? formatDuration(currentUser.sessionEnteredAt) : '45m';

  return (
    <>
      {/* 1. GENTLE COMPLETION NOTIFICATION BANNER */}
      {completedNotification.show && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-[#fffdfa] rounded-2xl border-2 border-[#52796f] shadow-2xl p-4 text-[#2d2824] space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#e3ede6] text-[#2d5a43] flex items-center justify-center text-base shadow-inner">
                  ✨
                </div>
                <div>
                  <h4 className="font-serif-title font-bold text-sm text-[#1e382b] leading-tight">
                    {completedNotification.mode === 'short-break' || completedNotification.mode === 'long-break'
                      ? 'Break Completed'
                      : 'Focus Session Complete!'}
                  </h4>
                  <p className="text-xs text-[#526e5e] mt-0.5">
                    {completedNotification.message}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCompletedNotification({ show: false, mode: 'pomodoro', message: '' })}
                className="p-1 rounded-lg text-[#887b6e] hover:bg-[#f1eae0] transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {completedNotification.mode !== 'short-break' && completedNotification.mode !== 'long-break' ? (
                <>
                  <button
                    onClick={() => {
                      setCompletedNotification({ show: false, mode: 'pomodoro', message: '' });
                      handleSelectMode('short-break');
                      setTimeout(handleTogglePlayPause, 100);
                    }}
                    className="flex-1 py-2 rounded-xl bg-[#2d5a43] hover:bg-[#204432] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Coffee className="w-3.5 h-3.5" />
                    <span>Take 5m Break</span>
                  </button>
                  <button
                    onClick={() => {
                      setCompletedNotification({ show: false, mode: 'pomodoro', message: '' });
                      handleResetPomodoro();
                      setTimeout(handleTogglePlayPause, 100);
                    }}
                    className="px-3 py-2 rounded-xl bg-[#f2eee9] hover:bg-[#e7dfd4] text-[#4d4033] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Repeat Focus
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setCompletedNotification({ show: false, mode: 'pomodoro', message: '' });
                    handleSelectMode('pomodoro');
                    setTimeout(handleTogglePlayPause, 100);
                  }}
                  className="flex-1 py-2 rounded-xl bg-[#2d5a43] hover:bg-[#204432] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start 25m Focus</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. UNIFIED STUDY TIMER UTILITY (Anchored Bottom-Left to Prevent Chat Overlap) */}
      <div
        className={`fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 select-none ${className}`}
        style={{ maxWidth: 'calc(100vw - 2rem)' }}
      >
        {/* COMPACT LAUNCHER PILL (Visible when closed) */}
        {!isOpen && (
          <button
            onClick={handleOpenUtility}
            type="button"
            className={`group flex items-center gap-2.5 px-3.5 py-2.5 rounded-full border-2 shadow-xl hover:shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${
              isPomodoroRunning
                ? 'bg-[#fffdfa]/95 border-[#2d5a43] text-[#1b3d2b] ring-2 ring-[#52796f]/30'
                : isStopwatchRunning
                ? 'bg-[#fffcf5]/95 border-[#b27e46] text-[#613816] ring-2 ring-[#e9c46a]/40'
                : 'bg-[#fffdfa]/95 hover:bg-[#fffdfa] border-[#ded4c5] text-[#332b24]'
            }`}
            title="Open Study Timers (Pomodoro & Stopwatch)"
            aria-label="Open Study Timers"
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPomodoroRunning
                    ? 'bg-emerald-500 animate-pulse'
                    : isStopwatchRunning
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-[#a39482]'
                }`}
              />
              <Timer className="w-4 h-4 text-[#2d5a43]" />
            </div>

            {/* Status Display in Pill */}
            <div className="flex items-baseline gap-1.5">
              {isPomodoroRunning ? (
                <>
                  <span className="font-mono-timer text-xs font-bold tracking-tight text-[#1c382b]">
                    {formatPomodoroTime(remainingSeconds)}
                  </span>
                  <span className="text-[10px] font-semibold text-[#52796f] uppercase tracking-wider hidden sm:inline">
                    {mode === 'custom' ? 'Custom' : currentPreset.label}
                  </span>
                  {isStopwatchRunning && (
                    <span className="text-[10px] px-1 py-0.2 rounded-md bg-amber-100 text-amber-900 font-mono-timer font-semibold">
                      +{formatStopwatchPillTime(stopwatchElapsedMs)}
                    </span>
                  )}
                </>
              ) : isStopwatchRunning ? (
                <>
                  <span className="font-mono-timer text-xs font-bold tracking-tight text-[#613816]">
                    {formatStopwatchPillTime(stopwatchElapsedMs)}
                  </span>
                  <span className="text-[10px] font-semibold text-[#8c5c30] uppercase tracking-wider hidden sm:inline">
                    Stopwatch
                  </span>
                </>
              ) : (
                <>
                  <span className="font-serif-title text-xs font-bold tracking-wide text-[#2b241e]">
                    Study Timers
                  </span>
                  <span className="font-mono-timer text-[10px] text-[#786c5e] hidden sm:inline">
                    (25:00)
                  </span>
                </>
              )}
            </div>

            <ChevronUp className="w-3.5 h-3.5 text-[#8f8274] group-hover:-translate-y-0.5 transition-transform ml-0.5" />
          </button>
        )}

        {/* EXPANDED UNIFIED TIMER CARD */}
        {isOpen && (
          <div className="w-[calc(100vw-2rem)] sm:w-88 max-w-sm rounded-3xl bg-[#fffdfa]/98 backdrop-blur-md border-2 border-[#d5e2d9] shadow-2xl p-4 space-y-3.5 text-[#2d2824] animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col overflow-hidden">
            {/* 1. Header with Minimize and Controls */}
            <div className="flex items-center justify-between border-b border-[#e2ede6] pb-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-[#2d5a43] text-white flex items-center justify-center text-xs shadow-xs">
                  ⏱️
                </span>
                <div>
                  <h4 className="font-serif-title text-xs sm:text-sm font-bold text-[#1f3529] leading-tight">
                    Study Timers
                  </h4>
                  <span className="text-[9px] text-[#698576]">
                    Focus • Stopwatch • Study Duration
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {activeTab === 'pomodoro' && (
                  <button
                    onClick={handleToggleSound}
                    type="button"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      soundEnabled
                        ? 'text-[#2d5a43] hover:bg-[#eaf3ee]'
                        : 'text-[#a19588] hover:bg-[#f1eae0]'
                    }`}
                    title={soundEnabled ? 'Chime sound enabled' : 'Chime muted'}
                  >
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>
                )}

                <button
                  onClick={handleCloseUtility}
                  type="button"
                  className="p-1.5 rounded-lg text-[#887b6e] hover:bg-[#f1eae0] transition-colors cursor-pointer"
                  title="Minimize Timers"
                  aria-label="Minimize Timers"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Segmented Tab Switcher (Pomodoro vs Stopwatch vs Statistics) */}
            <div className="flex p-1 bg-[#ede4d8] rounded-2xl gap-1 shrink-0">
              <button
                onClick={() => setActiveTab('pomodoro')}
                type="button"
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'pomodoro'
                    ? 'bg-white text-[#2d5a43] shadow-xs'
                    : 'text-[#6b5d4f] hover:text-[#332b24]'
                }`}
              >
                <span>🍅 Pomodoro</span>
                {isPomodoroRunning && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('stopwatch')}
                type="button"
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'stopwatch'
                    ? 'bg-white text-[#784824] shadow-xs'
                    : 'text-[#6b5d4f] hover:text-[#332b24]'
                }`}
              >
                <span>⏱️ Stopwatch</span>
                {isStopwatchRunning && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('stats')}
                type="button"
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'stats'
                    ? 'bg-white text-[#2d5a43] shadow-xs font-bold'
                    : 'text-[#6b5d4f] hover:text-[#332b24]'
                }`}
              >
                <span>📊 Stats</span>
              </button>
            </div>

            {/* 3. Tab Body Container */}
            <div className="flex-1 overflow-y-auto pr-0.5 space-y-3.5">
              {/* TAB 1: POMODORO TIMER */}
              {activeTab === 'pomodoro' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  {/* Preset Buttons */}
                  <div className="grid grid-cols-4 gap-1">
                    {(['pomodoro', 'short-break', 'deep-focus', 'long-break'] as FocusMode[]).map((key) => {
                      const preset = PRESETS[key];
                      const isSelected = mode === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleSelectMode(key)}
                          className={`py-1 px-1.5 rounded-xl text-[10px] font-semibold border transition-all cursor-pointer truncate ${
                            isSelected
                              ? 'bg-[#2d5a43] text-white border-[#1e382b] shadow-xs'
                              : 'bg-[#faf6f0] hover:bg-[#ede5d8] text-[#554737] border-[#ded2c1]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Main Pomodoro Countdown Clock */}
                  <div className="p-3.5 bg-gradient-to-b from-[#f9f5ee] to-[#f2ece2] rounded-2xl border border-[#e3d7c7] text-center shadow-inner relative overflow-hidden">
                    {/* Progress Bar Header */}
                    <div className="flex items-center justify-between text-[10px] text-[#7a6f62] mb-1 font-medium">
                      <span>{currentPreset.label}</span>
                      <span>{Math.round(progressPercent)}% completed</span>
                    </div>

                    <div className="w-full h-1.5 bg-[#ded3c3] rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-[#2d5a43] transition-all duration-500 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {/* Time Digits MM:SS */}
                    <div className="font-mono-timer text-4xl sm:text-5xl font-black text-[#1c382b] tracking-tight select-none">
                      {formatPomodoroTime(remainingSeconds)}
                    </div>

                    <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-[#6d7f74]">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isPomodoroRunning ? 'bg-emerald-500 animate-pulse' : 'bg-[#aba094]'
                        }`}
                      />
                      <span className="font-medium">
                        {isPomodoroRunning ? 'Focusing...' : 'Paused'}
                      </span>
                    </div>
                  </div>

                  {/* Custom Minutes Slider (if custom) */}
                  {mode === 'custom' && (
                    <div className="p-2.5 bg-[#f6efe6] rounded-xl border border-[#e5dacb] space-y-1 text-xs">
                      <div className="flex justify-between text-[11px] font-semibold text-[#5a4c3e]">
                        <span>Custom Duration</span>
                        <span>{customMinutes} mins</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="120"
                        value={customMinutes}
                        onChange={(e) => handleCustomChange(Number(e.target.value))}
                        className="w-full accent-[#2d5a43] cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Pomodoro Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTogglePlayPause}
                      type="button"
                      className={`flex-1 py-2.5 rounded-2xl text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
                        isPomodoroRunning
                          ? 'bg-[#784824] hover:bg-[#5e371b]'
                          : 'bg-[#2d5a43] hover:bg-[#1e402e]'
                      }`}
                    >
                      {isPomodoroRunning ? (
                        <>
                          <Pause className="w-4 h-4 fill-white" />
                          <span>Pause Session</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white" />
                          <span>{remainingSeconds < totalDurationSec ? 'Resume Session' : 'Start Focus'}</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleResetPomodoro}
                      type="button"
                      className="py-2.5 px-3.5 rounded-2xl bg-[#f2ede4] hover:bg-[#e4dcce] border border-[#d8cdbd] text-[#4d4033] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Reset Pomodoro"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: STOPWATCH */}
              {activeTab === 'stopwatch' && (
                <div className="animate-in fade-in duration-150">
                  <StopwatchPanel
                    onRunningChange={setIsStopwatchRunning}
                    onElapsedChange={setStopwatchElapsedMs}
                  />
                </div>
              )}

              {/* TAB 3: STUDY STATISTICS */}
              {activeTab === 'stats' && (
                <div className="animate-in fade-in duration-150">
                  <StudyStatsPanel
                    currentUser={currentUser}
                    isPomodoroRunning={isPomodoroRunning}
                    isStopwatchRunning={isStopwatchRunning}
                    currentPomodoroMode={mode}
                  />
                </div>
              )}
            </div>

            {/* 4. Footer: Persistent Study Duration Readout & Stats Shortcut */}
            <div className="pt-2 border-t border-[#e8ded0] flex items-center justify-between text-[11px] text-[#6d5e4f] shrink-0 bg-[#fbf8f3] -mx-4 -mb-4 p-3 rounded-b-3xl">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#2d5a43]" />
                <span>
                  Session: <strong className="text-[#2b241e]">{sessionDuration}</strong>
                </span>
              </div>

              <button
                onClick={() => setActiveTab(activeTab === 'stats' ? 'pomodoro' : 'stats')}
                type="button"
                className="text-[10px] px-2.5 py-1 rounded-full bg-[#eee5d8] hover:bg-[#e2d5c3] font-medium text-[#4a3f32] flex items-center gap-1.5 transition-colors cursor-pointer"
                title={activeTab === 'stats' ? 'Return to Pomodoro timer' : 'View study statistics breakdown'}
              >
                <TrendingUp className="w-3 h-3 text-[#2d5a43]" />
                <span>{activeTab === 'stats' ? 'Timers' : 'Stats'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// Backwards-compatible export for existing imports
export const FocusTimer = StudyTimerUtility;
