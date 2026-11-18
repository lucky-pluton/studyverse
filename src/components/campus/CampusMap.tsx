import React, { useState } from 'react';
import type { LocationId, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { LOCATIONS, VERIFIED_IITM_UPCOMING_DESTINATIONS } from '../../constants/locations';
import { CampusInfoPanel } from './CampusInfoPanel';
import { IsometricCampusMapCanvas } from './IsometricCampusMapCanvas';
import { Compass } from 'lucide-react';

interface CampusMapProps {
  students: StudentPresence[];
  currentUser: StudentPresence;
  onEnterLocation: (loc: LocationId) => void;
  timeOfDay: TimeOfDay;
}

export const CampusMap: React.FC<CampusMapProps> = ({
  students,
  currentUser,
  onEnterLocation,
  timeOfDay,
}) => {
  const [comingSoonModal, setComingSoonModal] = useState<typeof VERIFIED_IITM_UPCOMING_DESTINATIONS[0] | null>(null);

  // Group students by location
  const getStudentsAtLocation = (locId: string) =>
    students.filter((s) => s.location === locId);

  const getOccupantCount = (locId: string) =>
    getStudentsAtLocation(locId).length;

  const activeLocationsCount = Object.keys(LOCATIONS).filter(
    (locId) => getOccupantCount(locId) > 0
  ).length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-5 space-y-6 animate-in fade-in duration-300">
      {/* =========================================================================
          1. TOP CAMPUS EXPLORER HEADER & LIVE TELEMETRY
         ========================================================================= */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#eaf3ee] via-[#f7f3ec] to-[#e8eee9] p-3 sm:p-4 border-2 border-[#d5e2d9] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 overflow-hidden">
        <div className="space-y-0.5 z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#dbe8e0] text-[11px] font-semibold text-[#294d3a]">
            <Compass className="w-3.5 h-3.5 text-[#24523b]" />
            <span>Virtual Campus Explorer</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          </div>

          <h1 className="font-serif-title text-base sm:text-xl font-bold text-[#1f3529] tracking-tight">
            Explore Studyverse Campus, {currentUser.name}.
          </h1>
          <p className="text-[11px] sm:text-xs text-[#506357] max-w-xl leading-relaxed">
            Pan, zoom, and explore the grounds. Click any illustrated building or garden spot to walk over and begin studying.
          </p>
        </div>

        {/* Live Campus Telemetry Badge */}
        <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 z-10 w-full sm:w-auto">
          <div className="w-full sm:w-auto px-3.5 py-1.5 rounded-2xl bg-[#fffdfa] border border-[#ceddd4] shadow-2xs flex items-center justify-between sm:justify-end gap-3.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <div className="text-left sm:text-right">
              <span className="block text-[8.5px] uppercase font-bold text-[#62776a] tracking-wider">
                Online On Campus
              </span>
              <span className="font-serif-title text-sm sm:text-base font-bold text-[#1b3326]">
                {students.length} Student{students.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="h-5 w-[1px] bg-[#dce7e1]" />
            <div className="text-left sm:text-right">
              <span className="block text-[8.5px] uppercase font-bold text-[#62776a] tracking-wider">
                Occupied Spots
              </span>
              <span className="font-serif-title text-sm sm:text-base font-bold text-[#2d5a43]">
                {activeLocationsCount} of {Object.keys(LOCATIONS).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. SINGLE AUTHORITATIVE CAMPUS MAP VISUAL COMPOSITION
         ========================================================================= */}
      <IsometricCampusMapCanvas
        students={students}
        currentUser={currentUser}
        onEnterLocation={onEnterLocation}
        timeOfDay={timeOfDay}
      />

      {/* =========================================================================
          3. LIVE CAMPUS INFORMATION PANEL & WHERE EVERYONE IS STUDYING (TABLE)
         ========================================================================= */}
      <CampusInfoPanel
        students={students}
        onEnterLocation={onEnterLocation}
      />

      {/* Upcoming Destination Modal */}
      {comingSoonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#fffdfa] rounded-3xl border border-[#cbe0d3] p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#eaf3ee] border border-[#d2e3d8] flex items-center justify-center text-2xl shadow-inner">
              ✨
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#416652] bg-[#e2ede6] px-2.5 py-0.5 rounded-full">
                {comingSoonModal.badge}
              </span>
              <h3 className="font-serif-title text-xl font-bold text-[#1e382b] mt-2">
                {comingSoonModal.name}
              </h3>
              <p className="text-xs italic text-[#597364] mt-0.5">
                "{comingSoonModal.tagline}"
              </p>
            </div>
            <p className="text-xs text-[#486353] leading-relaxed">
              {comingSoonModal.description}
            </p>
            <div className="pt-2">
              <button
                onClick={() => setComingSoonModal(null)}
                className="w-full py-2.5 bg-[#2d5a43] text-white text-xs font-semibold rounded-xl hover:bg-[#234735] transition-colors cursor-pointer"
              >
                Return to Campus Map
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
