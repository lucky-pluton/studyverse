export interface StopwatchLap {
  lapNumber: number;
  splitMs: number;
  totalMs: number;
  timestamp: number;
}

export interface StoredStopwatchState {
  isRunning: boolean;
  startTime: number | null; // Date.now() timestamp when current run streak started
  accumulatedMs: number;    // Accumulated milliseconds before current run streak
  laps: StopwatchLap[];
}

/** the browser storage key the stopwatch state is kept under */
export const STOPWATCH_STORAGE_KEY = 'studyverse_stopwatch_state';
