import type { StudyStatistics } from '../types/statistics';

const STATS_STORAGE_KEY = 'studyverse_study_statistics';

const DEFAULT_STATS: StudyStatistics = {
  pomodoroFocusSeconds: 0,
  completedPomodoroSessions: 0,
  stopwatchTotalMs: 0,
  stopwatchSessionCount: 0,
  longestStopwatchMs: 0,
  lastUpdated: Date.now(),
};

class StudyStatsService {
  private stats: StudyStatistics;
  private listeners: Set<(stats: StudyStatistics) => void> = new Set();

  constructor() {
    this.stats = this.loadFromStorage();
  }

  private loadFromStorage(): StudyStatistics {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          pomodoroFocusSeconds: Math.max(0, parsed.pomodoroFocusSeconds || 0),
          completedPomodoroSessions: Math.max(0, parsed.completedPomodoroSessions || 0),
          stopwatchTotalMs: Math.max(0, parsed.stopwatchTotalMs || 0),
          stopwatchSessionCount: Math.max(0, parsed.stopwatchSessionCount || 0),
          longestStopwatchMs: Math.max(0, parsed.longestStopwatchMs || 0),
          lastUpdated: parsed.lastUpdated || Date.now(),
          sessionStartedAt: parsed.sessionStartedAt,
        };
      }
    } catch (e) {
      console.warn('[StudyStatsService] Failed to load statistics from storage:', e);
    }
    return { ...DEFAULT_STATS, lastUpdated: Date.now() };
  }

  private saveToStorage(): void {
    try {
      this.stats.lastUpdated = Date.now();
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(this.stats));
    } catch (e) {
      console.warn('[StudyStatsService] Failed to persist statistics to storage:', e);
    }
    this.notify();
  }

  private notify(): void {
    const copy = { ...this.stats };
    this.listeners.forEach((listener) => {
      try {
        listener(copy);
      } catch (e) {
        console.error('[StudyStatsService] Listener error:', e);
      }
    });
  }

  public getStats(): StudyStatistics {
    return { ...this.stats };
  }

  public subscribe(listener: (stats: StudyStatistics) => void): () => void {
    this.listeners.add(listener);
    listener({ ...this.stats });
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Add active Pomodoro focus time (in seconds).
   * Note: Break periods must NOT be passed here!
   */
  public addPomodoroFocusSeconds(deltaSec: number): void {
    if (deltaSec <= 0 || isNaN(deltaSec)) return;
    this.stats.pomodoroFocusSeconds = Math.round(this.stats.pomodoroFocusSeconds + deltaSec);
    this.saveToStorage();
  }

  /**
   * Increment count of completed Pomodoro focus sessions.
   */
  public incrementCompletedPomodoro(): void {
    this.stats.completedPomodoroSessions += 1;
    this.saveToStorage();
  }

  /**
   * Sync active stopwatch time and update longest uninterrupted run.
   */
  public updateStopwatchTime(accumulatedMs: number, runDurationMs: number): void {
    if (accumulatedMs < 0 || isNaN(accumulatedMs)) return;
    this.stats.stopwatchTotalMs = Math.round(accumulatedMs);
    if (runDurationMs > this.stats.longestStopwatchMs) {
      this.stats.longestStopwatchMs = Math.round(runDurationMs);
    }
    this.saveToStorage();
  }

  /**
   * Record a new stopwatch session initiation.
   */
  public recordStopwatchSessionStart(): void {
    this.stats.stopwatchSessionCount += 1;
    this.saveToStorage();
  }

  /**
   * Reset statistics back to zero upon user request.
   */
  public resetStats(): void {
    this.stats = {
      ...DEFAULT_STATS,
      lastUpdated: Date.now(),
    };
    this.saveToStorage();
  }

  /**
   * Format seconds into Studyverse readable format: "02h 45m" or "45m 12s"
   */
  public formatDurationHoursMins(totalSec: number): string {
    const total = Math.max(0, Math.floor(totalSec));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
    }
    return `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }

  /**
   * Format milliseconds into hours and minutes
   */
  public formatMsHoursMins(totalMs: number): string {
    return this.formatDurationHoursMins(Math.floor(totalMs / 1000));
  }
}

export const studyStatsService = new StudyStatsService();

