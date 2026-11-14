import React, { useState } from 'react';
import type { LocationId, StudentPresence } from '../../types/studyverse';
import { LOCATIONS } from '../../constants/locations';
import { AvatarRenderer } from '../common/AvatarRenderer';
import { formatDuration } from '../common/TimerBadge';
import {
  Compass,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CampusInfoPanelProps {
  students: StudentPresence[];
  onEnterLocation: (loc: LocationId) => void;
  className?: string;
}

export const CampusInfoPanel: React.FC<CampusInfoPanelProps> = ({
  students,
  onEnterLocation,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'discovery'>('overview');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

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

  return (
    <div
      className={`rounded-3xl bg-[#fffdfa] border-2 border-[#d5e2d9] shadow-md p-5 text-[#2d2824] space-y-4 ${className}`}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-[#e2ece5] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2d5a43] text-white flex items-center justify-center text-sm shadow-xs">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif-title text-sm sm:text-base font-bold text-[#1a3326] leading-tight">
              Live Campus Occupancy
            </h3>
            <span className="text-[10px] text-[#556e5f] font-medium">
              Real-time student census across IIT Madras study spots
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Tab buttons */}
          <div className="flex bg-[#e8f1ec] p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'overview'
                  ? 'bg-white text-[#1a3326] shadow-2xs'
                  : 'text-[#486b57] hover:text-[#1a3326]'
              }`}
            >
              Census
            </button>
            <button
              onClick={() => setActiveTab('discovery')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'discovery'
                  ? 'bg-white text-[#1a3326] shadow-2xs'
                  : 'text-[#486b57] hover:text-[#1a3326]'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              Who's Studying
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-[#62776a] hover:bg-[#eaf3ee] transition-colors"
            title={isExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Top 4 Quick Stat Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-[#f4faf6] border border-[#d2e5da] text-center">
              <span className="block text-[9px] uppercase font-bold tracking-wider text-[#527763]">
                Total Online
              </span>
              <span className="font-serif-title text-xl font-bold text-[#1b3829]">
                {totalStudents}
              </span>
              <span className="block text-[9px] text-[#6b8577]">Active peers</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#fbf7f0] border border-[#ebdccb] text-center">
              <span className="block text-[9px] uppercase font-bold tracking-wider text-[#7c6a56]">
                Active Spots
              </span>
              <span className="font-serif-title text-xl font-bold text-[#443627]">
                {activeLocationsCount} / {Object.keys(LOCATIONS).length}
              </span>
              <span className="block text-[9px] text-[#857666]">Campuses occupied</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#f4faf6] border border-[#d2e5da] text-center">
              <span className="block text-[9px] uppercase font-bold tracking-wider text-[#527763]">
                Occupied Seats
              </span>
              <span className="font-serif-title text-xl font-bold text-[#2d5a43]">
                {totalOccupiedSeats}
              </span>
              <span className="block text-[9px] text-[#6b8577]">Desks claimed</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#f0f9ff] border border-[#bae6fd] text-center">
              <span className="block text-[9px] uppercase font-bold tracking-wider text-[#0369a1]">
                Available Seats
              </span>
              <span className="font-serif-title text-xl font-bold text-[#0c4a6e]">
                {totalAvailableSeats}
              </span>
              <span className="block text-[9px] text-[#0284c7]">Open for you</span>
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
                      className="p-3 flex items-center justify-between hover:bg-[#f6faf7] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{loc.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serif-title text-xs sm:text-sm font-bold text-[#1f3529] group-hover:text-[#2d5a43] transition-colors">
                              {loc.name}
                            </span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full ${tag.color}`}>
                              {tag.text}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#637d6e] block">
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
            </div>
          )}

          {/* TAB 2: "WHERE EVERYONE IS STUDYING" (Student Discovery Section) */}
          {activeTab === 'discovery' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#63806f] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Active Seated Learners on Campus
                </span>
                <span className="text-[10px] text-[#6b8577] font-semibold">
                  {seatedStudents.length} student{seatedStudents.length === 1 ? '' : 's'} seated
                </span>
              </div>

              {seatedStudents.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#faf6f0] border border-[#e8ded0] text-center space-y-2">
                  <p className="text-xs text-[#6e6152] font-medium">
                    No students are currently seated in a study spot.
                  </p>
                  <p className="text-[11px] text-[#8a7a67]">
                    Click any destination on the map to claim a desk and start your study session!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {seatedStudents.map((student) => {
                    const locDef = LOCATIONS[student.location] || LOCATIONS.library;
                    const timeSeated = student.seatEnteredAt ? formatDuration(student.seatEnteredAt) : 'Just seated';

                    return (
                      <div
                        key={student.sessionId}
                        onClick={() => onEnterLocation(student.location)}
                        className="p-3 rounded-2xl bg-white border border-[#d8e5dd] hover:border-[#2d5a43] hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-2 group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#e8e2d8] border border-[#d2c5b5] flex items-center justify-center shrink-0">
                            <AvatarRenderer config={student.avatarConfig} size="xs" showProp={false} />
                          </div>

                          <div className="text-left">
                            <span className="font-semibold text-xs text-[#203a2c] block truncate max-w-[120px]">
                              {student.name}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-[#557060]">
                              <span>{locDef.icon}</span>
                              <span className="truncate max-w-[110px]">{locDef.name}</span>
                            </div>
                            <span className="text-[9px] text-[#8a7866] block">
                              {student.studyTopic || 'Deep Focus'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono-timer font-bold bg-[#e6eee8] text-[#2d5a43] px-1.5 py-0.5 rounded block mb-1">
                            {timeSeated}
                          </span>
                          <span className="text-[9px] font-semibold text-[#2d5a43] group-hover:underline flex items-center gap-0.5 justify-end">
                            Join <ArrowRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
