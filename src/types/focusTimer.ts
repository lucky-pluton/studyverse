// Focus Timer Types for Studyverse — Personal Productivity System

export type FocusMode = 'pomodoro' | 'short-break' | 'deep-focus' | 'long-break' | 'custom';

export type TimerTab = 'pomodoro' | 'stopwatch' | 'stats';

export interface FocusPreset {
  id: FocusMode;
  label: string;
  durationMinutes: number;
  category: 'focus' | 'break';
  color: string;
  description: string;
}

export const FOCUS_PRESETS: Record<FocusMode, FocusPreset> = {
  pomodoro: {
    id: 'pomodoro',
    label: 'Pomodoro',
    durationMinutes: 25,
    category: 'focus',
    color: '#2d5a43',
    description: 'Standard 25-minute focused study interval',
  },
  'short-break': {
    id: 'short-break',
    label: 'Short Break',
    durationMinutes: 5,
    category: 'break',
    color: '#784824',
    description: '5-minute refreshing pause between focus blocks',
  },
  'deep-focus': {
    id: 'deep-focus',
    label: 'Deep Focus',
    durationMinutes: 50,
    category: 'focus',
    color: '#1e382b',
    description: '50-minute deep immersion session for complex tasks',
  },
  'long-break': {
    id: 'long-break',
    label: 'Long Break',
    durationMinutes: 10,
    category: 'break',
    color: '#845328',
    description: '10-minute extended restorative break',
  },
  custom: {
    id: 'custom',
    label: 'Custom',
    durationMinutes: 30,
    category: 'focus',
    color: '#2a4365',
    description: 'User-configured timer from 1 to 120 minutes',
  },
};

export const FOCUS_TIMER_STORAGE_KEY = 'studyverse_focus_timer';

export interface StoredFocusTimerState {
  mode: FocusMode;
  customMinutes: number;
  remainingSeconds: number;
  isRunning: boolean;
  startTimestamp: number | null;
  endTimestamp: number | null;
  soundEnabled: boolean;
  completedCount: number;
  isCompleted: boolean;
  lastUpdated: number;
}

