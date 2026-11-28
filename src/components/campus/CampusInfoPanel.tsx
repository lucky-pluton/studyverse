import React, { useState } from 'react';
import type { LocationId, StudentPresence } from '../../types/studyverse';
import { LOCATIONS, ALL_CAMPUS_NAV_ITEMS } from '../../constants/locations';
import { AvatarRenderer } from '../common/AvatarRenderer';
import { formatDuration } from '../common/TimerBadge';
import {
  Compass,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';

interface CampusInfoPanelProps {
  students: StudentPresence[];
  onEnterLocation: (loc: LocationId) => void;
  className?: string;
  onClose?: () => void;
  defaultExpanded?: boolean;
}

export const CampusInfoPanel: React.FC<CampusInfoPanelProps> = ({
  students,
  onEnterLocation,
  className = '',
  onClose,
  defaultExpanded = true,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'discovery'>('overview');
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  // Calculate live campus metrics
  const totalStudents = students.length;

  const locationCounts: Record<string, { total: number; occupied: number; students: StudentPresence[] }> = {};
  let totalOccupiedSeats = 0;
  let totalAvailableSeats = 0;
  let activeLocationsCount = 0;

  Object.values(LOCATIONS).forEach((loc) => {
    const locStudents = students.filter((s) => s.location === loc.id);
    const occupiedInLoc = locStudents.filter((s) => s.seatId !== null).length;
    const capacity = loc.seats.length;

    locationCounts[loc.id] = {
      total: capacity,
      occupied: occupiedInLoc,
      students: locStudents,
    };

    totalOccupiedSeats += occupiedInLoc;
    totalAvailableSeats += Math.max(0, capacity - occupiedInLoc);
    if (locStudents.length > 0) activeLocationsCount++;
  });

  // Students who are currently seated
  const seatedStudents = students.filter((s) => s.seatId !== null);
  const unseatedStudents = students.filter((s) => s.seatId === null);

  return (
    <div
      className={`rounded-3xl bg-[#fffdfa] border-2 border-[#d5e2d9] shadow-2xl p-5 sm:p-6 text-[#2d2824] space-y-5 ${className}`}
    >
      {/* Panel Header */}
      <div className="space-y-3.5 border-b border-[#e2ece5] pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Perfectly sized circular emblem that never squashes */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#244b36] to-[#183626] text-white flex items-center justify-center shrink-0 shadow-md ring-1 ring-emerald-600/30">
              <Compass className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif-title text-base sm:text-lg font-bold text-[#142e20] leading-tight truncate">
                Live Campus Census
              </h3>
              <p className="text-xs text-[#526d5d] font-medium mt-0.5 leading-snug">
                Real-time student occupancy across IIT Madras study destinations
              </p>
            </div>
          </div>

          {onClose ? (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#f1f6f3] hover:bg-[#e1ece4] text-[#4d6657] hover:text-[#163022] flex items-center justify-center transition-colors shrink-0 cursor-pointer shadow-2xs"
              title="Close Quick List Panel"
              aria-label="Close Quick List Panel"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-8 h-8 rounded-full bg-[#f1f6f3] hover:bg-[#e1ece4] text-[#4d6657] hover:text-[#163022] flex items-center justify-center transition-colors shrink-0 cursor-pointer shadow-2xs"
              title={isExpanded ? 'Collapse panel' : 'Expand panel'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Dedicated Full-Width Segmented Tab Bar */}
        <div className="grid grid-cols-2 p-1 bg-[#edf4f0] rounded-2xl text-xs font-semibold border border-[#d8e6de]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-[#152f22] shadow-xs font-bold ring-1 ring-black/5'
                : 'text-[#486b57] hover:text-[#152f22]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Destination Census</span>
          </button>
          <button
            onClick={() => setActiveTab('discovery')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'discovery'
                ? 'bg-white text-[#152f22] shadow-xs font-bold ring-1 ring-black/5'
                : 'text-[#486b57] hover:text-[#152f22]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Who's Studying ({students.length})</span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Top 4 Quick Stat Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 sm:p-3.5 rounded-2xl bg-[#f4faf6] border border-[#d0e5d8] text-center flex flex-col justify-between">
              <span className="block text-[9.5px] uppercase font-bold tracking-wider text-[#49705a] whitespace-nowrap">
                Total Online
              </span>
              <span className="font-serif-title text-2xl font-bold text-[#1b3829] my-0.5">
                {totalStudents}
              </span>
              <span className="block text-[9.5px] text-[#638070] whitespace-nowrap">Active peers</span>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-[#fbf7f0] border border-[#ebdcce] text-center flex flex-col justify-between">
              <span className="block text-[9.5px] uppercase font-bold tracking-wider text-[#7c6a56] whitespace-nowrap">
                Active Spots
              </span>
              <span className="font-serif-title text-2xl font-bold text-[#443627] my-0.5">
                {activeLocationsCount} / {Object.keys(LOCATIONS).length}
              </span>
              <span className="block text-[9.5px] text-[#857666] whitespace-nowrap">Campuses occupied</span>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-[#f4faf6] border border-[#d0e5d8] text-center flex flex-col justify-between">
              <span className="block text-[9.5px] uppercase font-bold tracking-wider text-[#49705a] whitespace-nowrap">
                Occupied Seats
              </span>
              <span className="font-serif-title text-2xl font-bold text-[#2d5a43] my-0.5">
                {totalOccupiedSeats}
              </span>
              <span className="block text-[9.5px] text-[#638070] whitespace-nowrap">Desks claimed</span>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-[#f0f9ff] border border-[#bce4fa] text-center flex flex-col justify-between">
              <span className="block text-[9.5px] uppercase font-bold tracking-wider text-[#0369a1] whitespace-nowrap">
                Available Seats
              </span>
              <span className="font-serif-title text-2xl font-bold text-[#0c4a6e] my-0.5">
                {totalAvailableSeats}
              </span>
              <span className="block text-[9.5px] text-[#0284c7] whitespace-nowrap">Open for you</span>
            </div>
          </div>

          {/* TAB 1: LOCATION-WISE OCCUPANCY LIST */}
          {activeTab === 'overview' && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#63806f] block">
                Destination Occupancy Status
              </span>

              <div className="divide-y divide-[#edf3ef] border border-[#d9e5dd] rounded-2xl overflow-hidden bg-white">
                {Object.values(LOCATIONS).map((loc) => {
                  const data = locationCounts[loc.id] || { total: loc.seats.length, occupied: 0, students: [] };
                  const percent = Math.round((data.occupied / data.total) * 100);

                  const getStatusTag = () => {
                    if (data.occupied === 0) {
                      return { text: 'Empty', color: 'bg-[#f1f5f2] text-[#556e5f]' };
                    }
                    if (percent >= 100) {
                      return { text: 'Full', color: 'bg-rose-100 text-rose-800' };
                    }
                    if (percent >= 75) {
                      return { text: 'Nearly Full', color: 'bg-amber-100 text-amber-800' };
                    }
                    return { text: `${data.occupied} Studying`, color: 'bg-emerald-100 text-emerald-800 font-semibold' };
                  };

                  const tag = getStatusTag();

                  return (
                    <div
                      key={loc.id}
                      onClick={() => onEnterLocation(loc.id)}
                      className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-[#f6faf7] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl shrink-0 p-2 rounded-2xl bg-[#f0f6f2] border border-[#d8e6de] group-hover:bg-[#2d5a43] group-hover:border-[#2d5a43] transition-colors">
                          {loc.icon}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-serif-title text-sm sm:text-base font-bold text-[#1f3529] group-hover:text-[#2d5a43] transition-colors truncate">
                              {loc.name}
                            </span>
                            <span className={`text-[9.5px] px-2.5 py-0.5 rounded-full font-semibold ${tag.color}`}>
                              {tag.text}
                            </span>
                          </div>
                          <span className="text-xs text-[#5c7566] block mt-0.5">
                            {data.occupied} of {data.total} seats occupied ({data.total - data.occupied} available)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Compact bar */}
                        <div className="w-16 h-1.5 rounded-full bg-[#e2ede6] hidden sm:block overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              percent >= 100 ? 'bg-rose-500' : percent >= 75 ? 'bg-amber-500' : 'bg-[#2d5a43]'
                            }`}
                            style={{ width: `${Math.max(4, percent)}%` }}
                          />
                        </div>

                        <div className="w-7 h-7 rounded-full bg-[#f1f7f3] group-hover:bg-[#2d5a43] group-hover:text-white flex items-center justify-center transition-all group-hover:translate-x-1">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Upcoming Campus Facilities */}
              <div className="pt-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#7a6b5d] block mb-1.5">
                  Upcoming Campus Facilities (Under Setup)
                </span>
                {/* one card per row so each full name fits; names and details wrap instead of cutting off */}
                <div className="grid grid-cols-1 gap-2">
                  {ALL_CAMPUS_NAV_ITEMS.filter((i) => !i.isAvailable).map((item) => (
                    <div
                      key={`info-upcoming-${item.id}`}
                      className="p-2.5 rounded-2xl bg-[#fbf8f3] border border-[#e8ded0] flex items-start gap-2.5 select-none"
                    >
                      <span className="text-lg grayscale-[25%] leading-none mt-0.5 shrink-0">{item.icon}</span>
                      <div className="min-w-0 flex-1">
                        <span className="font-serif-title text-xs font-bold text-[#3d3328] block leading-snug break-words">
                          {item.name}
                        </span>
                        {item.statusDetail && (
                          <span className="text-[10px] text-[#786a5a] block leading-snug mt-0.5 break-words">
                            {item.statusDetail}
                          </span>
                        )}
                        <span className="inline-block mt-1.5 text-[8.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-[#ede3d5] text-[#6d5b4a]">
                          {item.statusBadge}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: "WHERE EVERYONE IS STUDYING" (Student Discovery Section) */}
          {activeTab === 'discovery' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#63806f] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Live Learners on Campus
                </span>
                <span className="text-[10px] text-[#6b8577] font-semibold">
                  {students.length} student{students.length === 1 ? '' : 's'} online ({seatedStudents.length} seated)
                </span>
              </div>

              {students.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#faf6f0] border border-[#e8ded0] text-center space-y-2">
                  <p className="text-xs text-[#6e6152] font-medium">
                    No other students are currently connected.
                  </p>
                  <p className="text-[11px] text-[#8a7a67]">
                    Click any destination on the map to claim a desk and start your study session!
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[50vh] sm:max-h-[55vh] overflow-y-auto pr-1">
                  {/* Seated Learners */}
                  {seatedStudents.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#244c36] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Seated at Desks ({seatedStudents.length})
                      </span>
                      <div className="space-y-2.5">
                        {seatedStudents.map((student) => {
                          const locDef = LOCATIONS[student.location] || LOCATIONS.library;
                          const timeSeated = student.seatEnteredAt ? formatDuration(student.seatEnteredAt) : 'Just seated';

                          return (
                            <div
                              key={student.sessionId}
                              onClick={() => onEnterLocation(student.location)}
                              className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#d8e5dd] hover:border-[#2d5a43] hover:shadow-sm transition-all cursor-pointer flex items-center justify-between gap-3 group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#e8e2d8] border border-[#d2c5b5] flex items-center justify-center shrink-0 shadow-2xs">
                                  <AvatarRenderer config={student.avatarConfig} size="xs" showProp={false} />
                                </div>

                                <div className="text-left min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-xs sm:text-sm text-[#1b3326]">
                                      {student.name}
                                    </span>
                                    <span className="text-[9.5px] font-semibold text-[#244c36] bg-[#eaf3ee] px-2 py-0.5 rounded-full shrink-0">
                                      Seated
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-[#41634f] mt-0.5">
                                    <span className="text-sm shrink-0">{locDef.icon}</span>
                                    <span className="font-medium">{locDef.name}</span>
                                  </div>
                                  <span className="text-[11px] text-[#716150] block mt-0.5">
                                    {student.studyTopic || 'Deep Focus'}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                                <span className="text-[11px] font-mono-timer font-bold bg-[#e8f2ec] text-[#244c37] px-2.5 py-1 rounded-xl block">
                                  {timeSeated}
                                </span>
                                <span className="text-[10px] font-semibold text-[#2d5a43] group-hover:underline flex items-center gap-0.5">
                                  Join desk <ArrowRight className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Exploring / Campus Grounds Learners */}
                  {unseatedStudents.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#635140] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Exploring Campus & Spots ({unseatedStudents.length})
                      </span>
                      <div className="space-y-2.5">
                        {unseatedStudents.map((student) => {
                          const isCampus = student.location === 'campus' || student.location === 'city';
                          const locDef = isCampus ? null : LOCATIONS[student.location];
                          const locName = isCampus ? 'Campus Common (Roundabout)' : `${locDef?.name || 'Study Room'} (Browsing desks)`;
                          const locIcon = isCampus ? '🏛️' : locDef?.icon || '📍';

                          return (
                            <div
                              key={student.sessionId}
                              onClick={() => onEnterLocation(student.location)}
                              className="p-3.5 sm:p-4 rounded-2xl bg-[#faf8f5] border border-[#e5dcd0] hover:border-[#2d5a43] hover:shadow-sm transition-all cursor-pointer flex items-center justify-between gap-3 group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#e8e2d8] border border-[#d2c5b5] flex items-center justify-center shrink-0 shadow-2xs">
                                  <AvatarRenderer config={student.avatarConfig} size="xs" showProp={false} />
                                </div>

                                <div className="text-left min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-xs sm:text-sm text-[#1b3326]">
                                      {student.name}
                                    </span>
                                    <span className="text-[9.5px] font-semibold text-[#665442] bg-[#f0e7dc] px-2 py-0.5 rounded-full shrink-0">
                                      Exploring
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-[#526a5c] mt-0.5">
                                    <span className="text-sm shrink-0">{locIcon}</span>
                                    <span className="font-medium">{locName}</span>
                                  </div>
                                  <span className="text-[11px] text-[#716150] block mt-0.5">
                                    {student.studyTopic || 'Exploring campus'}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#ebdccb] text-[#594735] block">
                                  Active
                                </span>
                                <span className="text-[10px] font-semibold text-[#2d5a43] group-hover:underline flex items-center gap-0.5">
                                  Join spot <ArrowRight className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
