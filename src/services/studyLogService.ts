import { FOCUS_PRESETS, FOCUS_TIMER_STORAGE_KEY, type StoredFocusTimerState } from '../types/focusTimer';
import { STOPWATCH_STORAGE_KEY, type StoredStopwatchState } from '../types/stopwatch';

/**
 * A student's study history, kept only in their own browser (localStorage) and never sent anywhere.
 *
 * Study time is the time a focus timer (Pomodoro, Deep Focus or Custom; breaks are left out) or the
 * stopwatch is running while the app is open. Once a second the log checks the timers' saved state
 * and adds the time since its last check to today's total, so it keeps counting whichever timer tab
 * is open, and time while the app is closed is never counted.
 */
export const STUDY_LOG_STORAGE_KEY = 'studyverse_study_log';

interface StoredStudyLog {
  /** milliseconds studied on each calendar day (the student's own time zone), keyed YYYY-MM-DD */
  days: Record<string, number>;
  /** time up to which study has been counted, so two open tabs never count the same moment twice */
  countedUntil: number;
}

export interface StudyDay {
  date: string;
  /** short weekday name, such as "Mon" */
  label: string;
  seconds: number;
}

export interface StudySummary {
  todaySec: number;
  last7DaysSec: number;
  allTimeSec: number;
  /** days with any study time */
  daysStudied: number;
  /** the last seven days, oldest first, ending today */
  week: StudyDay[];
}

const DAY_LABEL = new Intl.DateTimeFormat('en-IN', { weekday: 'short' });

function dayKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

function readJson<T>(key: string): T | null {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : null;
  } catch {
    return null;
  }
}

function loadLog(): StoredStudyLog {
  const saved = readJson<Partial<StoredStudyLog>>(STUDY_LOG_STORAGE_KEY);
  const days: Record<string, number> = {};
  if (saved?.days && typeof saved.days === 'object') {
    for (const [key, ms] of Object.entries(saved.days)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(key) && typeof ms === 'number' && ms > 0) days[key] = ms;
    }
  }
  return { days, countedUntil: typeof saved?.countedUntil === 'number' ? saved.countedUntil : 0 };
}

/** the span the running study timers cover (from when they started until now), or null when none is running */
function runningStudySpan(now: number): { since: number; until: number } | null {
  let since = Infinity;
  let until = -Infinity;
  const stopwatch = readJson<StoredStopwatchState>(STOPWATCH_STORAGE_KEY);
  if (stopwatch?.isRunning) {
    since = Math.min(since, stopwatch.startTime ?? 0);
    until = now;
  }
  const focus = readJson<StoredFocusTimerState>(FOCUS_TIMER_STORAGE_KEY);
  if (focus?.isRunning && focus.endTimestamp && FOCUS_PRESETS[focus.mode]?.category === 'focus') {
    since = Math.min(since, focus.startTimestamp ?? 0);
    // a focus timer that ran out while the tab was in the background stops counting when it ended
    until = Math.max(until, Math.min(now, focus.endTimestamp));
  }
  return until === -Infinity ? null : { since, until };
}

class StudyLogService {
  private log: StoredStudyLog = loadLog();
  /** starts at page load, so time while the app was closed is never counted */
  private lastCheck = Date.now();
  private listeners = new Set<(summary: StudySummary) => void>();

  constructor() {
    if (typeof window === 'undefined') return;
    window.setInterval(() => this.tick(), 1000);
    window.addEventListener('pagehide', () => this.tick());
    document.addEventListener('visibilitychange', () => this.tick());
    // another open tab updated the history
    window.addEventListener('storage', (e) => {
      if (e.key === STUDY_LOG_STORAGE_KEY) {
        this.log = loadLog();
        this.notify();
      }
    });
  }

  /** adds the study time since the last check */
  tick(now = Date.now()): void {
    const since = this.lastCheck;
    this.lastCheck = now;
    const span = runningStudySpan(now);
    if (!span) return;
    this.log = loadLog(); // pick up what other tabs counted
    const counted = this.log.countedUntil <= now ? this.log.countedUntil : 0; // ignore a clock set back
    const from = Math.max(since, counted, span.since);
    if (span.until <= from) return;
    this.addTime(from, span.until);
  }

  private addTime(from: number, to: number): void {
    // split at midnight so each day gets its own share
    for (let t = from; t < to; ) {
      const day = new Date(t);
      const nextMidnight = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).getTime();
      const end = Math.min(to, nextMidnight);
      const key = dayKey(day);
      this.log.days[key] = (this.log.days[key] || 0) + (end - t);
      t = end;
    }
    this.log.countedUntil = to;
    this.save();
  }

  private save(): void {
    try {
      localStorage.setItem(STUDY_LOG_STORAGE_KEY, JSON.stringify(this.log));
    } catch (e) {
      console.warn('[StudyLog] Could not save the study history:', e);
    }
    this.notify();
  }

  private notify(): void {
    const summary = this.getSummary();
    this.listeners.forEach((listener) => listener(summary));
  }

  getSummary(now = Date.now()): StudySummary {
    const today = new Date(now);
    const week: StudyDay[] = [];
    for (let back = 6; back >= 0; back--) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back);
      const key = dayKey(date);
      week.push({ date: key, label: DAY_LABEL.format(date), seconds: Math.floor((this.log.days[key] || 0) / 1000) });
    }
    const all = Object.values(this.log.days);
    return {
      todaySec: week[6].seconds,
      last7DaysSec: week.reduce((sum, d) => sum + d.seconds, 0),
      allTimeSec: Math.floor(all.reduce((sum, ms) => sum + ms, 0) / 1000),
      daysStudied: all.filter((ms) => ms >= 1000).length,
      week,
    };
  }

  subscribe(listener: (summary: StudySummary) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSummary());
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** deletes the whole study history from this browser */
  clear(): void {
    this.log = { days: {}, countedUntil: Date.now() };
    this.save();
  }
}

export const studyLogService = new StudyLogService();

/** "2h 05m", "45m" or "30s" */
export function formatStudyTime(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m`;
  return sec > 0 ? `${sec}s` : '0m';
}
