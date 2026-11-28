import React, { useEffect, useState } from 'react';
import { CalendarDays, Lock } from 'lucide-react';
import { formatStudyTime, studyLogService, type StudySummary } from '../../services/studyLogService';

interface StudyHistoryCardProps {
  /** 'welcome' greets a returning student on the first screen; 'panel' sits in the Stats tab and can clear the history */
  variant: 'welcome' | 'panel';
}

/** How much the student has studied today, in the last 7 days and in all, read from their own browser. */
export const StudyHistoryCard: React.FC<StudyHistoryCardProps> = ({ variant }) => {
  const [summary, setSummary] = useState<StudySummary>(() => studyLogService.getSummary());
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => studyLogService.subscribe(setSummary), []);

  // nothing to welcome back to on a first visit
  if (variant === 'welcome' && summary.allTimeSec < 60) return null;

  const busiest = Math.max(...summary.week.map((d) => d.seconds), 1);
  const totals = [
    { label: 'Today', value: summary.todaySec },
    { label: 'Last 7 days', value: summary.last7DaysSec },
    { label: 'All time', value: summary.allTimeSec },
  ];

  return (
    <section
      data-testid={`study-history-${variant}`}
      className="p-3.5 bg-[#f6efe6] rounded-2xl border border-[#e5dacb] space-y-3 text-left"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <CalendarDays className="w-4 h-4 text-[#2d5a43] shrink-0" />
          <h3 className="font-serif-title font-bold text-xs sm:text-sm text-[#2b241e] truncate">
            {variant === 'welcome' ? 'Welcome back! Your study time' : 'Your study history'}
          </h3>
        </div>
        {summary.daysStudied > 0 && (
          <span className="text-[10px] text-[#716353] shrink-0">
            {summary.daysStudied} {summary.daysStudied === 1 ? 'day' : 'days'} studied
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {totals.map((t) => (
          <div key={t.label} className="p-2 bg-[#fffdfa] rounded-xl border border-[#e5dacb] text-center">
            <div className="font-mono-timer text-sm sm:text-base font-bold text-[#204a35]">{formatStudyTime(t.value)}</div>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold text-[#736353]">{t.label}</span>
          </div>
        ))}
      </div>

      {/* the last seven days, today on the right */}
      <div className="flex items-end justify-between gap-1.5 h-16" aria-label="Study time on each of the last 7 days">
        {summary.week.map((d, i) => (
          <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${d.label}: ${formatStudyTime(d.seconds)}`}>
            <div
              className={`w-full max-w-7 rounded-t-md ${i === 6 ? 'bg-[#2d5a43]' : 'bg-[#84a98c]'}`}
              style={{ height: `${d.seconds > 0 ? Math.max(6, (d.seconds / busiest) * 100) : 3}%`, opacity: d.seconds > 0 ? 1 : 0.35 }}
            />
            <span className={`text-[9px] ${i === 6 ? 'font-bold text-[#2d5a43]' : 'text-[#786b5c]'}`}>{i === 6 ? 'Today' : d.label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#e5dacb]">
        <p className="text-[10px] text-[#716353] flex items-center gap-1">
          <Lock className="w-3 h-3 shrink-0" />
          Counts focus-timer and stopwatch time. Saved only in this browser.
        </p>
        {variant === 'panel' && summary.allTimeSec > 0 && (
          confirmClear ? (
            <span className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  studyLogService.clear();
                  setConfirmClear(false);
                }}
                className="px-2 py-0.5 rounded-lg bg-[#8b4343] hover:bg-[#703333] text-white text-[10px] font-semibold cursor-pointer"
              >
                Delete history
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-2 py-0.5 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-[10px] font-medium cursor-pointer"
              >
                Keep
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="text-[10px] text-[#857463] hover:text-[#524436] underline shrink-0 cursor-pointer"
            >
              Clear history
            </button>
          )
        )}
      </div>
    </section>
  );
};
