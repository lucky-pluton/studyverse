export interface StudyStatistics {
  // 1. Pomodoro Focus Tracking
  pomodoroFocusSeconds: number;
  completedPomodoroSessions: number;

  // 2. Stopwatch Tracking
  stopwatchTotalMs: number;
  stopwatchSessionCount: number;
  longestStopwatchMs: number;

  // 3. Metadata
  lastUpdated: number;
  sessionStartedAt?: number;
}

export interface StatisticsDisplayMetrics {
  sessionDurationSec: number;
  stopwatchDurationSec: number;
  pomodoroFocusDurationSec: number;
  completedPomodoroCount: number;
  stopwatchRunCount: number;
  longestStopwatchSec: number;
}

