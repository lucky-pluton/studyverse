/**
 * Lets a button outside the timer card (the study timer icon at the top left of the campus map)
 * open and close the study timers and show their time.
 */
export type TimerTone = 'idle' | 'focus' | 'break' | 'stopwatch';

export interface TimerLauncherStatus {
  open: boolean;
  tone: TimerTone;
  /** the running timer's time, such as "24:13" */
  time: string;
}

const TOGGLE_EVENT = 'studyverse:toggle-timer';

let status: TimerLauncherStatus = { open: false, tone: 'idle', time: '' };
const listeners = new Set<(s: TimerLauncherStatus) => void>();

/** called by the timer card whenever what the launcher should show changes */
export function publishTimerStatus(next: TimerLauncherStatus): void {
  if (next.open === status.open && next.tone === status.tone && next.time === status.time) return;
  status = next;
  listeners.forEach((listener) => listener(status));
}

export function subscribeTimerStatus(listener: (s: TimerLauncherStatus) => void): () => void {
  listeners.add(listener);
  listener(status);
  return () => {
    listeners.delete(listener);
  };
}

export function getTimerStatus(): TimerLauncherStatus {
  return status;
}

/** opens the timer card, or closes it when it is open */
export function toggleStudyTimers(): void {
  window.dispatchEvent(new CustomEvent(TOGGLE_EVENT));
}

export function onToggleStudyTimers(handler: () => void): () => void {
  window.addEventListener(TOGGLE_EVENT, handler);
  return () => window.removeEventListener(TOGGLE_EVENT, handler);
}
