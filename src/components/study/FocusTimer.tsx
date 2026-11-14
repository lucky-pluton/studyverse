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
  ChevronDown,
  ChevronUp,
  Sliders,
} from 'lucide-react';
import { soundService } from '../../services/soundService';

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

const STORAGE_KEY = 'studyverse_focus_timer';

export const FocusTimer: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [mode, setMode] = useState<FocusMode>('pomodoro');
  const [customMinutes, setCustomMinutes] = useState<number>(30);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [completedNotification, setCompletedNotification] = useState<{
    show: boolean;
    mode: FocusMode;
    message: string;
  }>({ show: false, mode: 'pomodoro', message: '' });

  const endTimestampRef = useRef<number | null>(null);

  // 1. Restore timer from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
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
            setIsRunning(true);
          } else {
            // Expired while tab was closed
            endTimestampRef.current = null;
            setIsRunning(false);
            setRemainingSeconds(0);
          }
        } else {
          setRemainingSeconds(parsed.remainingSeconds || PRESETS[parsed.mode || 'pomodoro'].durationMinutes * 60);
          setIsRunning(false);
          endTimestampRef.current = null;
        }
      }
    } catch {
      // Storage fallback
    }
  }, []);

  // 2. Persist state helper
  const persistState = useCallback(
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {}
    },
    []
  );

  // 3. Accurate countdown ticker using target timestamp (immune to tab background throttling)
  useEffect(() => {
    if (!isRunning || !endTimestampRef.current) return;

    const tick = () => {
      if (!endTimestampRef.current) return;
      const now = Date.now();
      const left = Math.max(0, Math.ceil((endTimestampRef.current - now) / 1000));

      setRemainingSeconds(left);

      if (left <= 0) {
        // TIMER FINISHED!
        setIsRunning(false);
        endTimestampRef.current = null;

        const isBreak = PRESETS[mode].category === 'break';
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

        persistState(mode, 0, false, null, soundEnabled, customMinutes);
      }
    };

    // Run tick immediately and set interval
    tick();
    const interval = setInterval(tick, 500);

    // Also recalculate whenever tab becomes visible again
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
  }, [isRunning, mode, soundEnabled, customMinutes, persistState]);

  // Handlers
  const handleTogglePlayPause = () => {
    if (isRunning) {
      // PAUSE
      setIsRunning(false);
      endTimestampRef.current = null;
      persistState(mode, remainingSeconds, false, null, soundEnabled, customMinutes);
    } else {
      // RESUME or START
      let currentLeft = remainingSeconds;
      if (currentLeft <= 0) {
        currentLeft = (mode === 'custom' ? customMinutes : PRESETS[mode].durationMinutes) * 60;
      }
      const targetEnd = Date.now() + currentLeft * 1000;
      endTimestampRef.current = targetEnd;
      setRemainingSeconds(currentLeft);
      setIsRunning(true);
      persistState(mode, currentLeft, true, targetEnd, soundEnabled, customMinutes);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    endTimestampRef.current = null;
    const initialSec = (mode === 'custom' ? customMinutes : PRESETS[mode].durationMinutes) * 60;
    setRemainingSeconds(initialSec);
    persistState(mode, initialSec, false, null, soundEnabled, customMinutes);
  };

  const handleSelectMode = (newMode: FocusMode) => {
    setMode(newMode);
    setIsRunning(false);
    endTimestampRef.current = null;
    const durSec = (newMode === 'custom' ? customMinutes : PRESETS[newMode].durationMinutes) * 60;
    setRemainingSeconds(durSec);
    persistState(newMode, durSec, false, null, soundEnabled, customMinutes);
  };

  const handleCustomChange = (mins: number) => {
    const clamped = Math.max(1, Math.min(180, mins));
    setCustomMinutes(clamped);
    if (mode === 'custom') {
      setIsRunning(false);
      endTimestampRef.current = null;
      setRemainingSeconds(clamped * 60);
      persistState('custom', clamped * 60, false, null, soundEnabled, clamped);
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    persistState(mode, remainingSeconds, isRunning, endTimestampRef.current, next, customMinutes);
  };

  // Helper formatting mm:ss
  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(m)}:${pad(s)}`;
  };

  const currentPreset = PRESETS[mode];
  const totalDurationSec = (mode === 'custom' ? customMinutes : currentPreset.durationMinutes) * 60;
  const progressPercent = Math.max(0, Math.min(100, ((totalDurationSec - remainingSeconds) / totalDurationSec) * 100));

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
                      handleReset();
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

      {/* 2. FLOATING FOCUS TIMER TRIGGER / COMPACT PILL */}
      <div className={`fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-40 select-none ${className}`}>
        {/* COMPACT PILL (Visible when closed) */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className={`group flex items-center gap-2 px-3 py-2 rounded-full border shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${
              isRunning
                ? currentPreset.category === 'break'
                  ? 'bg-[#fffcf5]/95 border-[#d2ab7a] text-[#784824] ring-2 ring-[#e9c46a]/40'
                  : 'bg-[#fffdfa]/95 border-[#2d5a43] text-[#1b3d2b] ring-2 ring-[#52796f]/40'
                : 'bg-[#fffdfa]/90 hover:bg-[#fffdfa] border-[#d8cdbd] text-[#3d332a]'
            }`}
            title="Open Personal Focus Timer"
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-[#a39482]'
                }`}
              />
              <Timer className="w-3.5 h-3.5 text-[#52796f]" />
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="font-mono-timer text-xs font-bold tracking-tight">
                {formatTime(remainingSeconds)}
              </span>
              <span className="text-[10px] font-medium text-[#7a6e60] uppercase tracking-wider hidden sm:inline">
                {mode === 'custom' ? 'Custom' : currentPreset.label}
              </span>
            </div>

            <ChevronUp className="w-3.5 h-3.5 text-[#8f8274] group-hover:-translate-y-0.5 transition-transform ml-0.5" />
          </button>
        )}

        {/* EXPANDED FOCUS TIMER CARD */}
        {isOpen && (
          <div className="w-80 rounded-3xl bg-[#fffdfa]/98 backdrop-blur-md border-2 border-[#d5e2d9] shadow-2xl p-4 space-y-3.5 text-[#2d2824] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#e2ede6] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#2d5a43] text-white flex items-center justify-center text-xs">
                  ⏱️
                </span>
                <div>
                  <h4 className="font-serif-title text-xs font-bold text-[#1f3529] leading-tight">
                    Personal Focus Timer
                  </h4>
                  <span className="text-[9px] text-[#698576]">
                    Private to you • Silent Productivity
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleToggleSound}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    soundEnabled
                      ? 'text-[#2d5a43] hover:bg-[#eaf3ee]'
                      : 'text-[#a19588] hover:bg-[#f1eae0]'
                  }`}
                  title={soundEnabled ? 'Chime sound enabled' : 'Chime muted'}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-[#887b6e] hover:bg-[#f1eae0] transition-colors cursor-pointer"
                  title="Minimize Timer"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Presets Selector Chips */}
            <div className="grid grid-cols-3 gap-1 bg-[#f4eee6] p-1 rounded-2xl">
              {(['pomodoro', 'short-break', 'deep-focus', 'long-break', 'custom'] as FocusMode[]).map((m) => {
                const isSelected = mode === m;
                const p = PRESETS[m];
                return (
                  <button
                    key={m}
                    onClick={() => handleSelectMode(m)}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-medium transition-all text-center cursor-pointer ${
                      isSelected
                        ? p.category === 'break'
                          ? 'bg-[#c27d60] text-white font-bold shadow-2xs'
                          : 'bg-[#2d5a43] text-white font-bold shadow-2xs'
                        : 'text-[#6d5e4f] hover:text-[#2d2824] hover:bg-white/60'
                    }`}
                  >
                    {m === 'custom' ? 'Custom' : `${p.durationMinutes}m ${p.label.split(' ')[0]}`}
                  </button>
                );
              })}
            </div>

            {/* Custom Minutes Slider (When Custom mode is active) */}
            {mode === 'custom' && (
              <div className="p-2 bg-[#f8f5ee] rounded-xl border border-[#e2d8c9] space-y-1">
                <div className="flex items-center justify-between text-[10px] font-semibold text-[#5a4e40]">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-[#784824]" /> Custom Duration:
                  </span>
                  <span className="font-mono-timer font-bold text-xs text-[#2d5a43]">
                    {customMinutes} minutes
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="120"
                  value={customMinutes}
                  onChange={(e) => handleCustomChange(parseInt(e.target.value, 10))}
                  className="w-full accent-[#2d5a43] cursor-pointer"
                />
              </div>
            )}

            {/* Main Countdown Display */}
            <div className="text-center py-2 relative">
              <div className="text-[10px] font-semibold tracking-wider uppercase text-[#738a7c] mb-1">
                {currentPreset.category === 'break' ? '☕ Rest & Refresh' : '🎯 Deep Study Session'}
              </div>
              <div className="font-mono-timer text-4xl font-bold tracking-tight text-[#1b3d2b] drop-shadow-2xs">
                {formatTime(remainingSeconds)}
              </div>
              <div className="text-[10px] text-[#557060] font-medium mt-1">
                {mode === 'custom' ? `${customMinutes}m Custom Session` : currentPreset.label}
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-[#e5ede8] rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    currentPreset.category === 'break' ? 'bg-[#c27d60]' : 'bg-[#2d5a43]'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Timer Action Buttons: Play/Pause, Reset */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleTogglePlayPause}
                className={`flex-1 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                  isRunning
                    ? 'bg-[#c27d60] hover:bg-[#a6684e] text-white'
                    : 'bg-[#2d5a43] hover:bg-[#204432] text-white'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause Timer</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{remainingSeconds <= 0 ? 'Restart Session' : 'Start Focus'}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                className="p-2.5 rounded-2xl bg-[#f2eee9] hover:bg-[#e7ded2] text-[#5a4c3e] transition-colors cursor-pointer"
                title="Reset session to original duration"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
