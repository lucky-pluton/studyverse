import { useState, useEffect, useRef, useCallback } from 'react';
import type { FocusMode, StoredFocusTimerState } from '../types/focusTimer';
import { FOCUS_PRESETS, FOCUS_TIMER_STORAGE_KEY } from '../types/focusTimer';
import { soundService } from '../services/soundService';
import { studyStatsService } from '../services/studyStatsService';

export function useFocusTimer() {
  const [mode, setMode] = useState<FocusMode>('pomodoro');
  const [customMinutes, setCustomMinutesState] = useState<number>(30);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [completedCount, setCompletedCount] = useState<number>(0);

  // Completion modal state
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState<boolean>(false);
  const [completedMode, setCompletedMode] = useState<FocusMode>('pomodoro');

  // Exact timestamp references to prevent interval drift
  const startTimestampRef = useRef<number | null>(null);
  const endTimestampRef = useRef<number | null>(null);
  const lastFocusTickRef = useRef<number>(0);
  const hasTriggeredCompletionRef = useRef<boolean>(false);

  // Helper to calculate total duration in seconds for current configuration
  const getTotalDurationSeconds = useCallback(
    (targetMode: FocusMode, targetCustomMins: number) => {
      if (targetMode === 'custom') {
        return Math.max(1, Math.min(120, targetCustomMins)) * 60;
      }
      return FOCUS_PRESETS[targetMode].durationMinutes * 60;
    },
    []
  );

  // Persist current state to localStorage
  const persistState = useCallback(
    (
      newMode: FocusMode,
      newRemaining: number,
      newIsRunning: boolean,
      newStartTs: number | null,
      newEndTs: number | null,
      newSound: boolean,
      newCustomMins: number,
      newCompletedCount: number,
      newIsCompleted: boolean
    ) => {
      try {
        const state: StoredFocusTimerState = {
          mode: newMode,
          customMinutes: newCustomMins,
          remainingSeconds: newRemaining,
          isRunning: newIsRunning,
          startTimestamp: newStartTs,
          endTimestamp: newEndTs,
          soundEnabled: newSound,
          completedCount: newCompletedCount,
          isCompleted: newIsCompleted,
          lastUpdated: Date.now(),
        };
        localStorage.setItem(FOCUS_TIMER_STORAGE_KEY, JSON.stringify(state));
      } catch (err) {
        console.warn('[FocusTimer] Failed to save state to localStorage:', err);
      }
    },
    []
  );

  // 1. Initial restoration from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FOCUS_TIMER_STORAGE_KEY);
      if (saved) {
        const parsed: StoredFocusTimerState = JSON.parse(saved);
        const restoredMode = parsed.mode || 'pomodoro';
        const restoredCustomMins = Math.max(1, Math.min(120, parsed.customMinutes || 30));
        const restoredSound = parsed.soundEnabled ?? true;
        const restoredCount = parsed.completedCount || 0;

        setMode(restoredMode);
        setCustomMinutesState(restoredCustomMins);
        setSoundEnabled(restoredSound);
        setCompletedCount(restoredCount);

        const totalSec = getTotalDurationSeconds(restoredMode, restoredCustomMins);

        if (parsed.isRunning && parsed.endTimestamp) {
          const now = Date.now();
          const left = Math.max(0, Math.ceil((parsed.endTimestamp - now) / 1000));

          if (left > 0) {
            // Timer is actively running
            startTimestampRef.current = parsed.startTimestamp || now;
            endTimestampRef.current = parsed.endTimestamp;
            setRemainingSeconds(left);
            setIsRunning(true);
            hasTriggeredCompletionRef.current = false;
          } else {
            // Timer expired while away/closed
            startTimestampRef.current = null;
            endTimestampRef.current = null;
            setRemainingSeconds(0);
            setIsRunning(false);
            setCompletedMode(restoredMode);
            setIsCompletionModalOpen(true);
            hasTriggeredCompletionRef.current = true;
          }
        } else {
          // Timer was paused or idle
          startTimestampRef.current = null;
          endTimestampRef.current = null;
          setIsRunning(false);
          const safeRemaining =
            typeof parsed.remainingSeconds === 'number' && parsed.remainingSeconds >= 0
              ? parsed.remainingSeconds
              : totalSec;
          setRemainingSeconds(safeRemaining);
        }
      }
    } catch (err) {
      console.warn('[FocusTimer] Corrupted localStorage state cleared:', err);
    }
  }, [getTotalDurationSeconds]);

  // 2. High-precision ticker based on absolute timestamps
  useEffect(() => {
    if (!isRunning || !endTimestampRef.current) return;

    lastFocusTickRef.current = Date.now();

    const tick = () => {
      if (!endTimestampRef.current) return;
      const now = Date.now();
      const left = Math.max(0, Math.ceil((endTimestampRef.current - now) / 1000));

      setRemainingSeconds(left);

      // Accumulate active focus stats (focus categories only; breaks excluded)
      const isFocus = FOCUS_PRESETS[mode].category === 'focus';
      if (isFocus) {
        const deltaSec = Math.floor((now - lastFocusTickRef.current) / 1000);
        if (deltaSec >= 1) {
          studyStatsService.addPomodoroFocusSeconds(deltaSec);
          lastFocusTickRef.current = now;
        }
      }

      if (left <= 0 && !hasTriggeredCompletionRef.current) {
        hasTriggeredCompletionRef.current = true;
        setIsRunning(false);
        endTimestampRef.current = null;
        startTimestampRef.current = null;
        setRemainingSeconds(0);

        const newCount = completedCount + 1;
        setCompletedCount(newCount);

        if (isFocus) {
          studyStatsService.incrementCompletedPomodoro();
        }

        // Trigger completion experience
        setCompletedMode(mode);
        setIsCompletionModalOpen(true);

        if (soundEnabled) {
          soundService.playFocusChime();
        }

        persistState(mode, 0, false, null, null, soundEnabled, customMinutes, newCount, true);
      }
    };

    tick();
    const timerInterval = setInterval(tick, 500);

    // Immediate resync when switching back to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };
    const handleFocus = () => {
      tick();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(timerInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);

      // Flush remaining focus time upon pausing/unmounting
      if (FOCUS_PRESETS[mode].category === 'focus') {
        const deltaSec = Math.floor((Date.now() - lastFocusTickRef.current) / 1000);
        if (deltaSec >= 1) {
          studyStatsService.addPomodoroFocusSeconds(deltaSec);
        }
      }
    };
  }, [isRunning, mode, soundEnabled, customMinutes, completedCount, persistState]);

  // 3. Multi-tab synchronization via storage event
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== FOCUS_TIMER_STORAGE_KEY || !e.newValue) return;
      try {
        const externalState: StoredFocusTimerState = JSON.parse(e.newValue);
        setMode(externalState.mode || 'pomodoro');
        setCustomMinutesState(externalState.customMinutes || 30);
        setSoundEnabled(externalState.soundEnabled ?? true);
        setCompletedCount(externalState.completedCount || 0);

        if (externalState.isRunning && externalState.endTimestamp) {
          const now = Date.now();
          const left = Math.max(0, Math.ceil((externalState.endTimestamp - now) / 1000));
          if (left > 0) {
            endTimestampRef.current = externalState.endTimestamp;
            startTimestampRef.current = externalState.startTimestamp;
            setRemainingSeconds(left);
            setIsRunning(true);
          } else {
            endTimestampRef.current = null;
            startTimestampRef.current = null;
            setRemainingSeconds(0);
            setIsRunning(false);
          }
        } else {
          endTimestampRef.current = null;
          startTimestampRef.current = null;
          setRemainingSeconds(externalState.remainingSeconds);
          setIsRunning(false);
        }
      } catch {}
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // --- Actions ---

  const start = useCallback(() => {
    const totalSec = getTotalDurationSeconds(mode, customMinutes);
    let currentLeft = remainingSeconds;
    if (currentLeft <= 0) {
      currentLeft = totalSec;
    }

    const now = Date.now();
    const targetEnd = now + currentLeft * 1000;
    startTimestampRef.current = now;
    endTimestampRef.current = targetEnd;
    hasTriggeredCompletionRef.current = false;

    setRemainingSeconds(currentLeft);
    setIsRunning(true);
    setIsCompletionModalOpen(false);

    persistState(mode, currentLeft, true, now, targetEnd, soundEnabled, customMinutes, completedCount, false);
  }, [mode, customMinutes, remainingSeconds, soundEnabled, completedCount, getTotalDurationSeconds, persistState]);

  const pause = useCallback(() => {
    let currentLeft = remainingSeconds;
    if (endTimestampRef.current) {
      currentLeft = Math.max(0, Math.ceil((endTimestampRef.current - Date.now()) / 1000));
    }
    endTimestampRef.current = null;
    startTimestampRef.current = null;

    setRemainingSeconds(currentLeft);
    setIsRunning(false);

    persistState(mode, currentLeft, false, null, null, soundEnabled, customMinutes, completedCount, false);
  }, [mode, remainingSeconds, soundEnabled, customMinutes, completedCount, persistState]);

  const togglePlayPause = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, pause, start]);

  const reset = useCallback(() => {
    endTimestampRef.current = null;
    startTimestampRef.current = null;
    hasTriggeredCompletionRef.current = false;

    const initialSec = getTotalDurationSeconds(mode, customMinutes);
    setRemainingSeconds(initialSec);
    setIsRunning(false);
    setIsCompletionModalOpen(false);

    persistState(mode, initialSec, false, null, null, soundEnabled, customMinutes, completedCount, false);
  }, [mode, customMinutes, soundEnabled, completedCount, getTotalDurationSeconds, persistState]);

  const selectMode = useCallback(
    (newMode: FocusMode) => {
      endTimestampRef.current = null;
      startTimestampRef.current = null;
      hasTriggeredCompletionRef.current = false;

      const newDurationSec = getTotalDurationSeconds(newMode, customMinutes);

      setMode(newMode);
      setRemainingSeconds(newDurationSec);
      setIsRunning(false);
      setIsCompletionModalOpen(false);

      persistState(newMode, newDurationSec, false, null, null, soundEnabled, customMinutes, completedCount, false);
    },
    [customMinutes, soundEnabled, completedCount, getTotalDurationSeconds, persistState]
  );

  const setCustomMinutes = useCallback(
    (mins: number) => {
      const clamped = Math.max(1, Math.min(120, Math.round(mins)));
      setCustomMinutesState(clamped);

      // If custom is currently active, immediately update duration & remaining
      if (mode === 'custom') {
        endTimestampRef.current = null;
        startTimestampRef.current = null;
        hasTriggeredCompletionRef.current = false;

        const newSec = clamped * 60;
        setRemainingSeconds(newSec);
        setIsRunning(false);

        persistState('custom', newSec, false, null, null, soundEnabled, clamped, completedCount, false);
      }
    },
    [mode, soundEnabled, completedCount, persistState]
  );

  const toggleSound = useCallback(() => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    persistState(
      mode,
      remainingSeconds,
      isRunning,
      startTimestampRef.current,
      endTimestampRef.current,
      next,
      customMinutes,
      completedCount,
      false
    );
  }, [mode, remainingSeconds, isRunning, customMinutes, completedCount, soundEnabled, persistState]);

  const dismissCompletionModal = useCallback(() => {
    setIsCompletionModalOpen(false);
  }, []);

  const startNextSession = useCallback(
    (targetMode: FocusMode) => {
      setIsCompletionModalOpen(false);
      selectMode(targetMode);
      // Brief delay to allow state update before auto-start
      setTimeout(() => {
        const totalSec = getTotalDurationSeconds(targetMode, customMinutes);
        const now = Date.now();
        const targetEnd = now + totalSec * 1000;
        startTimestampRef.current = now;
        endTimestampRef.current = targetEnd;
        hasTriggeredCompletionRef.current = false;

        setRemainingSeconds(totalSec);
        setIsRunning(true);

        persistState(targetMode, totalSec, true, now, targetEnd, soundEnabled, customMinutes, completedCount, false);
      }, 50);
    },
    [selectMode, getTotalDurationSeconds, customMinutes, soundEnabled, completedCount, persistState]
  );

  const currentPreset = FOCUS_PRESETS[mode];
  const totalDurationSeconds = getTotalDurationSeconds(mode, customMinutes);

  return {
    mode,
    customMinutes,
    remainingSeconds,
    totalDurationSeconds,
    isRunning,
    soundEnabled,
    completedCount,
    currentPreset,
    isCompletionModalOpen,
    completedMode,
    start,
    pause,
    togglePlayPause,
    reset,
    selectMode,
    setCustomMinutes,
    toggleSound,
    dismissCompletionModal,
    startNextSession,
  };
}
