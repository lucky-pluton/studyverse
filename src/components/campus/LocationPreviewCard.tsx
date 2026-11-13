import React from 'react';
import type { LocationDefinition, StudentPresence } from '../../types/studyverse';
import { AvatarRenderer } from '../common/AvatarRenderer';
import { formatDuration } from '../common/TimerBadge';
import { ArrowRight, Sparkles, X } from 'lucide-react';

interface LocationPreviewCardProps {
  location: LocationDefinition;
  students: StudentPresence[];
  onEnter: () => void;
  onClose?: () => void;
  className?: string;
}

export const LocationPreviewCard: React.FC<LocationPreviewCardProps> = ({
  location,
  students,
  onEnter,
  onClose,
  className = '',
}) => {
  const totalSeats = location.seats.length;
  const occupiedSeats = students.filter((s) => s.seatId !== null).length;
  const availableSeats = Math.max(0, totalSeats - occupiedSeats);
  const percentFull = Math.round((occupiedSeats / totalSeats) * 100);

  // Status badge logic
  const getStatusBadge = () => {
    if (occupiedSeats === 0) {
      return {
        label: 'Empty • Quiet',
        bgColor: 'bg-[#f1f5f2] text-[#4d6657] border-[#d2e0d7]',
        dotColor: 'bg-[#84a98c]',
      };
    }
    if (percentFull >= 100) {
      return {
        label: 'Full Capacity',
        bgColor: 'bg-[#fef2f2] text-[#991b1b] border-[#fecaca]',
        dotColor: 'bg-[#ef4444]',
      };
    }
    if (percentFull >= 75) {
      return {
        label: 'Nearly Full',
        bgColor: 'bg-[#fffbeb] text-[#92400e] border-[#fde68a]',
        dotColor: 'bg-[#f59e0b]',
      };
    }
    return {
      label: `${occupiedSeats} Studying Now`,
      bgColor: 'bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]',
      dotColor: 'bg-[#22c55e]',
    };
  };

  const status = getStatusBadge();

  return (
    <div
      className={`w-72 sm:w-80 p-4 rounded-3xl bg-[#fffdfa] border-2 border-[#d5e2d9] shadow-xl text-[#2d2824] space-y-3.5 animate-in fade-in zoom-in-95 duration-200 z-50 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-inner shrink-0"
            style={{ backgroundColor: location.badgeBg }}
          >
            {location.icon}
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-[#63806f] block">
              {location.category}
            </span>
            <h4 className="font-serif-title text-base font-bold text-[#1f3529] leading-tight">
              {location.name}
            </h4>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#7c7062] hover:bg-[#f1eae0] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Occupancy Status Pill & Seat Capacity */}
      <div className="space-y-1.5 p-2.5 rounded-2xl bg-[#f7faf8] border border-[#dce8e0]">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${status.dotColor} animate-pulse`} />
            <span className="font-semibold text-[11px] text-[#294233]">{status.label}</span>
          </div>
          <span className="text-[11px] font-bold text-[#446351]">
            {occupiedSeats} / {totalSeats} seats
          </span>
        </div>

        {/* Capacity Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-[#e2ede6] overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              percentFull >= 100
                ? 'bg-rose-500'
                : percentFull >= 75
                ? 'bg-amber-500'
                : 'bg-[#2d5a43]'
            }`}
            style={{ width: `${Math.max(6, percentFull)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-[#698072] font-medium pt-0.5">
          <span>Occupied: <strong>{occupiedSeats}</strong></span>
          <span>Available: <strong>{availableSeats}</strong></span>
        </div>
      </div>

      {/* Currently Studying Students Avatars List */}
      <div className="space-y-1.5">
        <span className="text-[10px] uppercase font-bold tracking-wider text-[#6b8273] flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Currently Here:
        </span>

        {students.length === 0 ? (
          <p className="text-[11px] text-[#718579] italic py-1">
            No students seated here yet. Be the first to claim a quiet desk!
          </p>
        ) : (
          <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
            {students.slice(0, 4).map((student) => {
              const timeSeated = student.seatEnteredAt ? formatDuration(student.seatEnteredAt) : null;
              return (
                <div
                  key={student.sessionId}
                  className="flex items-center justify-between p-1.5 rounded-xl bg-[#faf5ee] border border-[#e8ded2] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-[#e8e2d8] border border-[#d2c5b5] flex items-center justify-center shrink-0">
                      <AvatarRenderer config={student.avatarConfig} size="xs" showProp={false} />
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-[11px] text-[#2c2824] block leading-tight truncate max-w-[110px]">
                        {student.name}
                      </span>
                      <span className="text-[9px] text-[#786b5d] line-clamp-1">
                        {student.studyTopic || 'Deep Focus'}
                      </span>
                    </div>
                  </div>

                  {timeSeated && (
                    <span className="text-[9.5px] font-mono-timer font-bold bg-[#fffcf5] text-[#2b251f] border border-[#ded5c6] px-1.5 py-0.5 rounded-full shadow-2xs">
                      {timeSeated}
                    </span>
                  )}
                </div>
              );
            })}
            {students.length > 4 && (
              <p className="text-[10px] text-center text-[#5f7a6a] font-semibold pt-0.5">
                +{students.length - 4} more student{students.length - 4 === 1 ? '' : 's'} studying quietly
              </p>
            )}
          </div>
        )}
      </div>

      {/* Enter Action Button */}
      <button
        onClick={onEnter}
        className="w-full py-2.5 rounded-2xl bg-[#2d5a43] hover:bg-[#204432] text-white font-serif-title text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all group cursor-pointer"
      >
        <span>ENTER {location.name.toUpperCase()}</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};

