import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  Timer,
  ChevronUp,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import { CircularProgressRing } from './CircularProgressRing';
import { FocusPresetSelector } from './FocusPresetSelector';
import { TimerCompletionModal } from './TimerCompletionModal';
import { StopwatchPanel } from './StopwatchPanel';
import { StudyStatsPanel } from './StudyStatsPanel';
import { formatDuration } from '../common/TimerBadge';
import type { StudentPresence } from '../../types/studyverse';
import type { TimerTab, FocusMode } from '../../types/focusTimer';

export type { TimerTab, FocusMode };

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

  // Shared Focus Timer State (Hook)
  const {
    mode,
    customMinutes,
    remainingSeconds,
    totalDurationSeconds,
    isRunning: isPomodoroRunning,
    soundEnabled,
    currentPreset,
    isCompletionModalOpen,
    completedMode,
    togglePlayPause,
    reset,
    selectMode,
    setCustomMinutes,
    toggleSound,
    dismissCompletionModal,
    startNextSession,
  } = useFocusTimer();

  // Stopwatch state tracking for launcher pill & badges
  const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(false);
  const [stopwatchElapsedMs, setStopwatchElapsedMs] = useState<number>(0);

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

  const formatPillTime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    if (hours > 0) {
      return `${hours}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  };

  const formatStopwatchPillTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(m)}:${pad(s)}`;
  };

  const isBreak = currentPreset.category === 'break';
  const sessionDuration = currentUser?.sessionEnteredAt ? formatDuration(currentUser.sessionEnteredAt) : '45m';

  return (
    <>
      {/* 1. VISUALLY APPEALING COMPLETION MODAL */}
      <TimerCompletionModal
        isOpen={isCompletionModalOpen}
        completedMode={completedMode}
        onStartFocus={() => startNextSession('pomodoro')}
        onTakeShortBreak={() => startNextSession('short-break')}
        onTakeLongBreak={() => startNextSession('long-break')}
        onClose={dismissCompletionModal}
      />

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
                ? isBreak
                  ? 'bg-[#fffdfa]/95 border-[#845328] text-[#553012] ring-2 ring-[#b27e46]/30'
                  : 'bg-[#fffdfa]/95 border-[#2d5a43] text-[#1b3d2b] ring-2 ring-[#52796f]/30'
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
                    ? isBreak
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-emerald-500 animate-pulse'
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
                    {formatPillTime(remainingSeconds)}
                  </span>
                  <span className="text-[10px] font-semibold text-[#52796f] uppercase tracking-wider hidden sm:inline">
                    {mode === 'custom' ? `Custom (${customMinutes}m)` : currentPreset.label}
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
                    ({formatPillTime(remainingSeconds)})
                  </span>
                </>
              )}
            </div>

            <ChevronUp className="w-3.5 h-3.5 text-[#8f8274] group-hover:-translate-y-0.5 transition-transform ml-0.5" />
          </button>
        )}

        {/* EXPANDED UNIFIED TIMER CARD */}
        {isOpen && (
          <div className="w-[calc(100vw-2rem)] sm:w-96 max-w-sm rounded-3xl bg-[#fffdfa]/98 backdrop-blur-md border-2 border-[#d5e2d9] shadow-2xl p-4 space-y-3 text-[#2d2824] animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col overflow-hidden">
            {/* 1. Header with Minimize and Sound Toggle */}
            <div className="flex items-center justify-between border-b border-[#e2ede6] pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-[#2d5a43] text-white flex items-center justify-center text-xs shadow-xs">
                  ⏱️
                </span>
                <div>
                  <h4 className="font-serif-title text-xs sm:text-sm font-bold text-[#1f3529] leading-tight">
                    Personal Focus Timer
                  </h4>
                  <span className="text-[9px] text-[#698576]">
                    5 Presets • Circular Progress • Independent Focus
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {activeTab === 'pomodoro' && (
                  <button
                    onClick={toggleSound}
                    type="button"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      soundEnabled
                        ? 'text-[#2d5a43] hover:bg-[#eaf3ee]'
                        : 'text-[#a19588] hover:bg-[#f1eae0]'
                    }`}
                    title={soundEnabled ? 'Completion chime enabled' : 'Completion chime muted'}
                    aria-label={soundEnabled ? 'Mute completion chime' : 'Unmute completion chime'}
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
                className={`flex-1 py-1 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'pomodoro'
                    ? 'bg-white text-[#2d5a43] shadow-xs'
                    : 'text-[#6b5d4f] hover:text-[#332b24]'
                }`}
              >
                <span>🍅 Focus</span>
                {isPomodoroRunning && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                      isBreak ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                )}
              </button>

              <button
                onClick={() => setActiveTab('stopwatch')}
                type="button"
                className={`flex-1 py-1 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
                className={`flex-1 py-1 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'stats'
                    ? 'bg-white text-[#2d5a43] shadow-xs font-bold'
                    : 'text-[#6b5d4f] hover:text-[#332b24]'
                }`}
              >
                <span>📊 Stats</span>
              </button>
            </div>

            {/* 3. Tab Body Container */}
            <div className="flex-1 overflow-y-auto pr-0.5 space-y-3">
              {/* TAB 1: FOCUS / POMODORO TIMER */}
              {activeTab === 'pomodoro' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  {/* Preset Selector with 5 presets & Custom Slider */}
                  <FocusPresetSelector
                    currentMode={mode}
                    customMinutes={customMinutes}
                    onSelectMode={selectMode}
                    onCustomMinutesChange={setCustomMinutes}
                  />

                  {/* Circular Progress Ring with Monospace Countdown */}
                  <div className="p-2 bg-gradient-to-b from-[#fbf8f3] to-[#f4eee6] rounded-2xl border border-[#e5dacb] shadow-inner">
                    <CircularProgressRing
                      remainingSeconds={remainingSeconds}
                      totalDurationSeconds={totalDurationSeconds}
                      isRunning={isPomodoroRunning}
                      preset={currentPreset}
                      customMinutes={customMinutes}
                      size={180}
                    />
                  </div>

                  {/* Action Buttons: Play/Pause/Resume & Reset */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      onClick={togglePlayPause}
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
                          <span>Pause Countdown</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white" />
                          <span>
                            {remainingSeconds < totalDurationSeconds ? 'Resume Countdown' : 'Start Focus'}
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={reset}
                      type="button"
                      className="py-2.5 px-3.5 rounded-2xl bg-[#f2ede4] hover:bg-[#e4dcce] border border-[#d8cdbd] text-[#4d4033] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Reset Timer"
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

            {/* 4. Footer: Campus Session Duration Readout & Stats Shortcut */}
            <div className="pt-2 border-t border-[#e8ded0] flex items-center justify-between text-[11px] text-[#6d5e4f] shrink-0 bg-[#fbf8f3] -mx-4 -mb-4 p-3 rounded-b-3xl">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#2d5a43]" />
                <span>
                  Campus Time: <strong className="text-[#2b241e]">{sessionDuration}</strong>
                </span>
              </div>

              <button
                onClick={() => setActiveTab(activeTab === 'stats' ? 'pomodoro' : 'stats')}
                type="button"
                className="text-[10px] px-2.5 py-1 rounded-full bg-[#eee5d8] hover:bg-[#e2d5c3] font-medium text-[#4a3f32] flex items-center gap-1.5 transition-colors cursor-pointer"
                title={activeTab === 'stats' ? 'Return to Focus timer' : 'View study statistics breakdown'}
              >
                <TrendingUp className="w-3 h-3 text-[#2d5a43]" />
                <span>{activeTab === 'stats' ? 'Timer' : 'Stats'}</span>
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
