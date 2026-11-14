import React, { useEffect, useState } from 'react';
import type { StudentPresence } from '../../types/studyverse';
import { formatDuration, formatDetailedDuration } from '../common/TimerBadge';
import { STUDY_TOPICS } from '../../constants/avatars';
import { LogOut, Tag, Sparkles, CheckCircle2, Moon } from 'lucide-react';
import { soundService } from '../../services/soundService';

interface StudyDockProps {
  currentUser: StudentPresence;
  currentSeatName: string;
  onLeaveSeat: () => void;
  onChangeTopic: (topic: string) => void;
  onToggleDnd?: () => void;
}

export const StudyDock: React.FC<StudyDockProps> = ({
  currentUser,
  currentSeatName,
  onLeaveSeat,
  onChangeTopic,
  onToggleDnd,
}) => {
  const [, setTick] = useState(0);
  const [showTopicMenu, setShowTopicMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const seatTime = formatDetailedDuration(currentUser.seatEnteredAt);
  const sessionTime = formatDuration(currentUser.sessionEnteredAt);

  const handleLeave = () => {
    soundService.playLeaveSound();
    onLeaveSeat();
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-[450px] px-3 sm:px-4 animate-in slide-in-from-bottom-5 duration-300 pointer-events-none select-none">
      <div className="pointer-events-auto bg-[#fffdfa]/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border-2 border-[#d9cdbe] shadow-2xl p-3 sm:p-3.5 text-[#35302a] flex flex-col gap-2.5 transition-all">
        {/* TIER 1: Seat Info & Dual Live Timers */}
        <div className="flex items-center justify-between gap-2.5 min-w-0 w-full">
          {/* Left: Seat info & Seat status */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#52796f] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-200" />
            </div>

            <div className="text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7a6d5f]">
                  Currently Seated
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <div
                className="font-serif-title font-bold text-xs sm:text-sm text-[#27231f] truncate max-w-[140px] sm:max-w-[170px]"
                title={currentSeatName}
              >
                {currentSeatName}
              </div>
            </div>
          </div>

          {/* Right: Dual Live Timers (Seat Time vs Session) */}
          <div className="flex items-center gap-2.5 py-1 px-2.5 bg-[#f3ece0] rounded-xl border border-[#e5d9c7] shrink-0">
            <div className="text-center">
              <span className="block text-[8px] uppercase tracking-wider text-[#7a6f62] font-semibold">
                Seat Time
              </span>
              <span className="font-mono-timer text-xs font-bold text-[#345946]">
                {seatTime}
              </span>
            </div>

            <div className="w-[1px] h-5 bg-[#d9cdbe]" />

            <div className="text-center">
              <span className="block text-[8px] uppercase tracking-wider text-[#7a6f62] font-semibold">
                Session
              </span>
              <span className="font-mono-timer text-[11px] font-semibold text-[#665a4c]">
                {sessionTime}
              </span>
            </div>
          </div>
        </div>

        {/* TIER 2: Action Controls Row (DND + Focus Topic + Leave Seat) */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#ebdcd0]/80 w-full min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {/* DND Toggle Button */}
            {onToggleDnd && (
              <button
                onClick={onToggleDnd}
                type="button"
                className={`px-2.5 py-1.5 rounded-xl border text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  currentUser.isDnd
                    ? 'bg-[#253f31] text-amber-200 border-[#1a2d23] shadow-xs ring-1 ring-amber-300/40'
                    : 'bg-[#f5ede3] hover:bg-[#ebdccf] border-[#e2d5c3] text-[#5a4d3f]'
                }`}
                title={
                  currentUser.isDnd
                    ? 'Do Not Disturb is ON (Notifications silenced). Click to turn OFF.'
                    : 'Enable Do Not Disturb (Enjoy studying alongside others without interruptions).'
                }
                aria-label="Toggle Do Not Disturb Mode"
              >
                <Moon
                  className={`w-3.5 h-3.5 ${
                    currentUser.isDnd ? 'fill-amber-300 text-amber-300' : 'text-[#8b6540]'
                  }`}
                />
                <span>{currentUser.isDnd ? 'DND On' : 'DND'}</span>
              </button>
            )}

            {/* Study Topic Picker Button */}
            <div className="relative min-w-0">
              <button
                onClick={() => setShowTopicMenu(!showTopicMenu)}
                type="button"
                className="px-2.5 py-1.5 rounded-xl bg-[#f5ede3] hover:bg-[#ebdccf] border border-[#e2d5c3] text-[11px] sm:text-xs font-medium text-[#5a4d3f] flex items-center gap-1.5 transition-colors cursor-pointer max-w-[130px] sm:max-w-[160px]"
                title="Change your study focus tag"
              >
                <Tag className="w-3.5 h-3.5 text-[#916a44] shrink-0" />
                <span className="truncate">
                  {currentUser.studyTopic || 'Set Focus'}
                </span>
              </button>

              {/* Topic Dropdown (Positioned safely above the dock) */}
              {showTopicMenu && (
                <div
                  className="absolute bottom-full mb-2 left-0 w-48 bg-[#fffdfa] rounded-xl border border-[#ded3c2] shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                  onMouseLeave={() => setShowTopicMenu(false)}
                >
                  <div className="text-[10px] font-semibold text-[#8a7a69] uppercase tracking-wider px-2 py-1">
                    Select Study Focus
                  </div>
                  {STUDY_TOPICS.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => {
                        onChangeTopic(topic);
                        setShowTopicMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                        currentUser.studyTopic === topic
                          ? 'bg-[#3b584a] text-white'
                          : 'text-[#4e4337] hover:bg-[#f3ece0]'
                      }`}
                    >
                      <span className="truncate">{topic}</span>
                      {currentUser.studyTopic === topic && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0 ml-1" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Leave Seat button (Always safely inside the container's right boundary) */}
          <button
            onClick={handleLeave}
            type="button"
            className="px-3 sm:px-3.5 py-1.5 bg-[#8b4343] hover:bg-[#723232] text-white text-[11px] sm:text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer active:scale-95"
            title="Leave this seat and stand up"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Leave Seat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
