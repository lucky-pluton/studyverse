import React from 'react';
import type { StudentPresence } from '../../types/studyverse';
import { AvatarRenderer } from '../common/AvatarRenderer';
import { formatDuration } from '../common/TimerBadge';

interface LocationAvatarClusterProps {
  students: StudentPresence[];
  maxVisible?: number;
  onStudentClick?: (student: StudentPresence) => void;
  className?: string;
}

export const LocationAvatarCluster: React.FC<LocationAvatarClusterProps> = ({
  students,
  maxVisible = 3,
  className = '',
}) => {
  if (students.length === 0) return null;

  const visibleStudents = students.slice(0, maxVisible);
  const remainingCount = students.length - maxVisible;

  return (
    <div className={`flex items-center -space-x-2 relative group/cluster select-none ${className}`}>
      {visibleStudents.map((student, idx) => {
        const timeSeated = student.seatEnteredAt ? formatDuration(student.seatEnteredAt) : null;

        return (
          <div
            key={student.sessionId || idx}
            className="relative transition-transform duration-200 hover:scale-125 hover:z-30 cursor-pointer"
            title={`${student.name} • ${student.studyTopic || 'Studying'}${timeSeated ? ` (${timeSeated})` : ''}`}
          >
            {/* Avatar thumbnail container */}
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#f4ece1] border-2 border-white shadow-xs overflow-hidden flex items-center justify-center ring-1 ring-black/10">
              <AvatarRenderer config={student.avatarConfig} size="xs" showProp={false} animate={false} />
            </div>

            {/* Micro timer badge */}
            {timeSeated && (
              <span className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-[#fffcf5] text-[#2b251f] border border-[#ded5c6] text-[7.5px] font-mono-timer rounded-full shadow-2xs font-bold leading-none">
                {timeSeated}
              </span>
            )}
          </div>
        );
      })}

      {/* Overflow Badge (+N) */}
      {remainingCount > 0 && (
        <div
          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#fffcf5] text-[#2d5a43] border-2 border-[#2d5a43] text-[9px] font-bold flex items-center justify-center shadow-xs ring-1 ring-black/10"
          title={`${remainingCount} more student${remainingCount === 1 ? '' : 's'} studying here`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

