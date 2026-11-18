import React from 'react';
import type { FocusMode } from '../../types/focusTimer';
import { FOCUS_PRESETS } from '../../types/focusTimer';
import { Coffee, BatteryCharging, X, Play } from 'lucide-react';

interface TimerCompletionModalProps {
  isOpen: boolean;
  completedMode: FocusMode;
  onStartFocus: () => void;
  onTakeShortBreak: () => void;
  onTakeLongBreak: () => void;
  onClose: () => void;
}

export const TimerCompletionModal: React.FC<TimerCompletionModalProps> = ({
  isOpen,
  completedMode,
  onStartFocus,
  onTakeShortBreak,
  onTakeLongBreak,
  onClose,
}) => {
  if (!isOpen) return null;

  const preset = FOCUS_PRESETS[completedMode] || FOCUS_PRESETS.pomodoro;
  const isBreak = preset.category === 'break';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="timer-completion-title"
    >
      <div className="w-full max-w-sm rounded-3xl bg-[#fffdfa] border-2 border-[#2d5a43]/40 shadow-2xl p-5 space-y-4 text-[#2d2824] animate-in zoom-in-95 duration-200 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#887b6e] hover:bg-[#f1eae0] hover:text-[#332a22] transition-colors cursor-pointer"
          title="Close notification"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with celebratory icon */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#e5efe8] to-[#d3e5da] border border-[#bcd3c6] text-[#2d5a43] flex items-center justify-center text-2xl shadow-inner">
            {isBreak ? '☕' : '✨'}
          </div>

          <div>
            <h3
              id="timer-completion-title"
              className="font-serif-title font-bold text-lg text-[#1e382b]"
            >
              {isBreak ? 'Break Completed!' : 'Focus Session Complete!'}
            </h3>
            <p className="text-xs text-[#526e5e] mt-0.5 max-w-xs mx-auto">
              {isBreak
                ? 'Hope you feel refreshed and restored. Ready to return to focused study?'
                : 'Excellent focus work! A quiet milestone achieved on campus.'}
            </p>
          </div>
        </div>

        {/* Action Buttons Section offering all 4 required choices */}
        <div className="space-y-2 pt-1">
          {/* Action 1: Start Focus Session */}
          <button
            onClick={onStartFocus}
            type="button"
            className="w-full py-2.5 px-4 rounded-xl bg-[#2d5a43] hover:bg-[#204432] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99]"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{isBreak ? 'Begin Focus Session (25m)' : 'Repeat Focus Session (25m)'}</span>
          </button>

          {/* Action 2: Take Short Break */}
          <button
            onClick={onTakeShortBreak}
            type="button"
            className="w-full py-2.5 px-4 rounded-xl bg-[#f5ede3] hover:bg-[#ede0d2] border border-[#dec9b5] text-[#6d3e18] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Coffee className="w-3.5 h-3.5 text-[#884d1e]" />
            <span>Take Short Break (5m)</span>
          </button>

          {/* Action 3: Take Long Break */}
          <button
            onClick={onTakeLongBreak}
            type="button"
            className="w-full py-2.5 px-4 rounded-xl bg-[#f2ede4] hover:bg-[#e7dfd3] border border-[#d8cdbd] text-[#554637] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <BatteryCharging className="w-3.5 h-3.5 text-[#554637]" />
            <span>Take Long Break (10m)</span>
          </button>

          {/* Action 4: Close Notification */}
          <button
            onClick={onClose}
            type="button"
            className="w-full py-2 text-xs font-medium text-[#7d7062] hover:text-[#3e342a] transition-colors cursor-pointer"
          >
            Dismiss for now
          </button>
        </div>
      </div>
    </div>
  );
};
