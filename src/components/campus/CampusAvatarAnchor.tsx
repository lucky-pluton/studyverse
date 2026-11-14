import React, { useState, useEffect, useRef } from 'react';
import type { StudentPresence } from '../../types/studyverse';
import { AvatarRenderer } from '../common/AvatarRenderer';
import { TinyFloatingTimer, formatDuration, formatDurationDescriptive } from '../common/TimerBadge';
import { ArrowRight, X } from 'lucide-react';

interface CampusAvatarAnchorProps {
  locationId: string;
  locationName: string;
  students: StudentPresence[];
  onOpenLocation: () => void;
  anchorCoords: { top: string; left: string };
}

export const CampusAvatarAnchor: React.FC<CampusAvatarAnchorProps> = ({
  locationId,
  locationName,
  students,
  onOpenLocation,
  anchorCoords,
}) => {
  const [hoveredStudent, setHoveredStudent] = useState<StudentPresence | null>(null);
  const [showClusterModal, setShowClusterModal] = useState<boolean>(false);
  const [arrivalPing, setArrivalPing] = useState<boolean>(false);

  const prevCountRef = useRef(students.length);

  // Trigger subtle arrival pulse when a new student arrives
  useEffect(() => {
    if (students.length > prevCountRef.current) {
      setArrivalPing(true);
      const timer = setTimeout(() => setArrivalPing(false), 2400);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = students.length;
  }, [students.length]);

  if (students.length === 0) return null;

  // Map location to appropriate sitting pose
  const getPoseForLocation = (id: string): 'desk' | 'bench' | 'cafe' | 'tree' => {
    switch (id) {
      case 'library':
      case 'lhc':
        return 'desk';
      case 'cafe':
        return 'cafe';
      case 'park':
      case 'oat':
        return 'bench';
      case 'banyan':
      case 'gc':
      default:
        return 'tree';
    }
  };

  const pose = getPoseForLocation(locationId);
  const maxVisible = 4;
  const visibleStudents = students.slice(0, maxVisible);
  const remainingCount = students.length - maxVisible;

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 z-35 pointer-events-auto transition-transform duration-300"
      style={{
        top: anchorCoords.top,
        left: anchorCoords.left,
      }}
    >
      {/* Subtle Arrival Wave Effect */}
      {arrivalPing && (
        <span className="absolute -inset-4 rounded-full bg-emerald-400/40 animate-ping pointer-events-none" />
      )}

      {/* Main Grounded Avatar Group */}
      <div
        className="relative flex items-end justify-center select-none"
        title={`Students studying at ${locationName}`}
      >
        {/* Overlapping actual illustrated chibi avatars */}
        <div className="flex items-end -space-x-3 sm:-space-x-4 select-none filter drop-shadow-md">
          {visibleStudents.map((student, idx) => {
            const isHovered = hoveredStudent?.sessionId === student.sessionId;

            return (
              <div
                key={student.sessionId || idx}
                onMouseEnter={() => setHoveredStudent(student)}
                onMouseLeave={() => setHoveredStudent(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (students.length > 1) {
                    setShowClusterModal(true);
                  } else {
                    // Toggle tooltip on mobile tap
                    setHoveredStudent((prev) =>
                      prev?.sessionId === student.sessionId ? null : student
                    );
                  }
                }}
                className={`relative cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  isHovered ? 'z-40 scale-110 -translate-y-1' : ''
                }`}
                style={{
                  zIndex: isHovered ? 40 : 10 + idx,
                }}
              >
                {/* Tiny Floating Study Timer immediately above chibi avatar's head */}
                {student.seatEnteredAt && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 pointer-events-none z-30 whitespace-nowrap">
                    <TinyFloatingTimer seatEnteredAt={student.seatEnteredAt} isDnd={student.isDnd} />
                  </div>
                )}

                {/* Actual Full Illustrated Chibi Avatar with pose & study prop */}
                <AvatarRenderer
                  config={student.avatarConfig}
                  size="map"
                  isSeated={true}
                  pose={pose}
                  showProp={true}
                  animate={true}
                  className="hover:brightness-105"
                />

                {/* COMPACT TOOLTIP: Nickname, Location, and Time Seated */}
                {isHovered && (
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-xl bg-[#fffdfa]/95 backdrop-blur-xs border border-[#cfdcd2] shadow-xl text-left whitespace-nowrap z-50 pointer-events-none animate-in fade-in zoom-in-95">
                    <div className="font-serif-title font-bold text-xs text-[#1e382b] leading-tight flex items-center gap-1">
                      <span>{student.name}</span>
                      {student.isDnd && <span title="Do Not Disturb (Quiet Study)">🌙</span>}
                    </div>
                    <div className="text-[10px] text-[#556e5f] font-medium mt-0.5">
                      {locationName}
                    </div>
                    <div className="text-[10px] text-[#2d5a43] font-bold font-mono-timer mt-0.5">
                      Studying for {formatDuration(student.seatEnteredAt)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* +N Overflow Indicator Badge */}
          {remainingCount > 0 && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setShowClusterModal(true);
              }}
              className="relative z-30 w-6 h-6 sm:w-7 sm:h-7 -ml-2 mb-1 rounded-full bg-[#fffcf5] text-[#2d5a43] border-2 border-[#2d5a43] text-[9.5px] font-mono-timer font-bold flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
              title={`${remainingCount} more student${remainingCount === 1 ? '' : 's'} here. Click to see all.`}
            >
              +{remainingCount}
            </div>
          )}
        </div>

        {/* Ground shadow beneath the group */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4/5 h-2.5 rounded-full bg-black/15 blur-xs pointer-events-none" />
      </div>

      {/* CLUSTER CLICK MODAL / POPOVER LIST */}
      {showClusterModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in"
          onClick={() => setShowClusterModal(false)}
        >
          <div
            className="bg-[#fffdfa] rounded-3xl border-2 border-[#d5e2d9] shadow-2xl p-5 max-w-sm w-full space-y-4 text-[#2d2824]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#e2ece5] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏛️</span>
                <div>
                  <h4 className="font-serif-title text-base font-bold text-[#1f3529] leading-tight">
                    {locationName}
                  </h4>
                  <span className="text-[10px] text-[#557060]">
                    {students.length} student{students.length === 1 ? '' : 's'} currently studying
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowClusterModal(false)}
                className="p-1 rounded-lg text-[#7c7062] hover:bg-[#f1eae0] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Seated Students with Chibi Avatars */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {students.map((student) => (
                <div
                  key={student.sessionId}
                  className="flex items-center justify-between p-2 rounded-2xl bg-[#f7faf8] border border-[#dce8e0] text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-[#e8e2d8] border border-[#d2c5b5] flex items-center justify-center shrink-0 shadow-2xs">
                      <AvatarRenderer config={student.avatarConfig} size="sm" showProp={false} />
                    </div>
                    <div>
                      <span className="font-serif-title font-bold text-xs text-[#1e382b] flex items-center gap-1 leading-tight">
                        <span>{student.name}</span>
                        {student.isDnd && <span title="Do Not Disturb (Quiet Study)">🌙</span>}
                      </span>
                      <span className="text-[10px] text-[#4d6b59] font-medium block">
                        {formatDurationDescriptive(student.seatEnteredAt)}
                      </span>
                      {student.studyTopic && (
                        <span className="text-[9px] text-[#806f5c] block">
                          Focus: {student.studyTopic}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono-timer font-semibold bg-[#e6eee8] text-[#2d5a43] px-2 py-0.5 rounded-full">
                    {student.seatEnteredAt ? formatDuration(student.seatEnteredAt) : 'Active'}
                  </span>
                </div>
              ))}
            </div>

            {/* Enter Location Action */}
            <button
              onClick={() => {
                setShowClusterModal(false);
                onOpenLocation();
              }}
              className="w-full py-2.5 rounded-2xl bg-[#2d5a43] hover:bg-[#204432] text-white font-serif-title text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span>ENTER {locationName.toUpperCase()}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
