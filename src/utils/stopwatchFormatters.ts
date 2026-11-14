/**
 * High-precision timestamp-based formatters for Studyverse Stopwatch
 */

export interface FormattedStopwatchTime {
  hours: string;
  minutes: string;
  seconds: string;
  centiseconds: string;
  formatted: string;
}

const pad = (num: number, len = 2): string => String(num).padStart(len, '0');

/**
 * Format milliseconds into HH:MM:SS.ms (e.g. 00:24:36.42)
 */
export const formatStopwatchTime = (ms: number): FormattedStopwatchTime => {
  const safeMs = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(safeMs / 1000);
  const centiseconds = Math.floor((safeMs % 1000) / 10); // 00 to 99
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);

  const hStr = pad(hours);
  const mStr = pad(minutes);
  const sStr = pad(seconds);
  const csStr = pad(centiseconds);

  return {
    hours: hStr,
    minutes: mStr,
    seconds: sStr,
    centiseconds: csStr,
    formatted: `${hStr}:${mStr}:${sStr}.${csStr}`,
  };
};

/**
 * Format lap split milliseconds into +MM:SS.ms (or +HH:MM:SS.ms if hours > 0)
 */
export const formatLapSplit = (ms: number): string => {
  const safeMs = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(safeMs / 1000);
  const centiseconds = Math.floor((safeMs % 1000) / 10);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);

  if (hours > 0) {
    return `+${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
  }
  return `+${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
};
