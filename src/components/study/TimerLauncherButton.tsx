import React, { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { getTimerStatus, subscribeTimerStatus, toggleStudyTimers } from './timerLauncher';

const DOT: Record<string, string> = {
  focus: 'bg-emerald-500 animate-pulse',
  break: 'bg-amber-500 animate-pulse',
  stopwatch: 'bg-amber-500 animate-pulse',
};

/** The study timer icon among the map's top-left icons; shows the time while a timer runs. */
export const TimerLauncherButton: React.FC = () => {
  const [status, setStatus] = useState(getTimerStatus);
  useEffect(() => subscribeTimerStatus(setStatus), []);
  const running = status.tone !== 'idle';

  return (
    <button
      type="button"
      onClick={toggleStudyTimers}
      aria-label={status.open ? 'Close Study Timers' : 'Open Study Timers'}
      aria-expanded={status.open}
      title="Study timers"
      className={`h-[38px] min-w-[38px] px-2.5 flex items-center justify-center gap-1.5 rounded-2xl backdrop-blur-md border shadow-lg hover:shadow-xl transition-all cursor-pointer ${
        status.open ? 'bg-[#2d5a43] border-[#2d5a43] text-white' : 'bg-white/95 border-[#cbe1d5] text-[#2d5a43] hover:bg-[#edf5f0]'
      }`}
    >
      {running && <span className={`w-2 h-2 rounded-full ${DOT[status.tone]}`} aria-hidden="true" />}
      <Timer className="w-4 h-4" />
      {running && <span className="font-mono-timer text-xs font-bold tracking-tight">{status.time}</span>}
    </button>
  );
};
