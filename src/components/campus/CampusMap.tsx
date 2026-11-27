import React, { useState } from 'react';
import type { LocationId, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { VERIFIED_IITM_UPCOMING_DESTINATIONS } from '../../constants/locations';
import { CampusInfoPanel } from './CampusInfoPanel';
import { IsometricCampusMapCanvas } from './IsometricCampusMapCanvas';
import { ThreeCampusView } from '../three/ThreeCampusView';
import { Compass, Layers, Globe } from 'lucide-react';

interface CampusMapProps {
  students: StudentPresence[];
  currentUser: StudentPresence;
  onEnterLocation: (loc: LocationId) => void;
  timeOfDay: TimeOfDay;
  /** shared 2D/3D choice; when omitted the map keeps its own */
  viewMode?: '2d' | '3d';
  onViewModeChange?: (mode: '2d' | '3d') => void;
}

export const CampusMap: React.FC<CampusMapProps> = ({
  students,
  currentUser,
  onEnterLocation,
  timeOfDay,
  viewMode: viewModeProp,
  onViewModeChange,
}) => {
  const [comingSoonModal, setComingSoonModal] = useState<typeof VERIFIED_IITM_UPCOMING_DESTINATIONS[0] | null>(null);
  const [isQuickListOpen, setIsQuickListOpen] = useState(false);
  // When entering the campus it should show 2D only; 3D can be seen when clicked
  const [ownViewMode, setOwnViewMode] = useState<'2d' | '3d'>('2d');
  const viewMode = viewModeProp ?? ownViewMode;

  const handleSetViewMode = (mode: '2d' | '3d') => {
    setOwnViewMode(mode);
    onViewModeChange?.(mode);
  };

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col select-none">
      {/* =========================================================================
          VIEW MODE TOGGLE: [ 🗺️ 2D Map | 🌐 3D Campus ]
         ========================================================================= */}
      <div
        className="fixed top-18 sm:top-20 left-3 sm:left-6 z-40 flex items-center bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-[#cbe1d5] shadow-lg hover:shadow-xl transition-all"
        role="group"
        aria-label="Campus View Mode"
      >
        <button
          type="button"
          data-testid="view-mode-2d"
          onClick={() => handleSetViewMode('2d')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            viewMode === '2d'
              ? 'bg-[#2d5a43] text-white shadow-xs'
              : 'text-[#354f40] hover:bg-[#edf5f0]'
          }`}
          title="Switch to 2D Illustrated Map"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>2D Map</span>
        </button>
        <button
          type="button"
          data-testid="view-mode-3d"
          onClick={() => handleSetViewMode('3d')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            viewMode === '3d'
              ? 'bg-[#2d5a43] text-white shadow-xs'
              : 'text-[#354f40] hover:bg-[#edf5f0]'
          }`}
          title="Switch to Interactive 3D Campus"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>3D Campus</span>
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 leading-none">
            3D
          </span>
        </button>
      </div>

      {/* =========================================================================
          1. FULL-SCREEN CAMPUS VIEWPORT (3D Interactive Model or 2D Canvas)
         ========================================================================= */}
      <div className="w-full h-full flex-1 relative overflow-hidden">
        {viewMode === '3d' ? (
          <ThreeCampusView
            students={students}
            currentUser={currentUser}
            onEnterLocation={onEnterLocation}
            timeOfDay={timeOfDay}
            onSwitchViewMode={handleSetViewMode}
          />
        ) : (
          <IsometricCampusMapCanvas
            students={students}
            currentUser={currentUser}
            onEnterLocation={onEnterLocation}
            timeOfDay={timeOfDay}
          />
        )}
      </div>

      {/* =========================================================================
          2. FLOATING QUICK LIST TAB (Right Screen Edge)
         ========================================================================= */}
      <button
        type="button"
        data-test-id="quick-list-toggle"
        onClick={() => setIsQuickListOpen((prev) => !prev)}
        className="fixed right-3 sm:right-4 top-18 sm:top-20 z-40 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-white/95 hover:bg-white text-[#1f3529] backdrop-blur-md border border-[#cbe1d5] shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 group"
        title={isQuickListOpen ? 'Close Campus Quick List' : 'Open Campus Census & Quick List'}
        aria-label="Toggle Campus Quick List"
      >
        <div className="w-5 h-5 rounded-lg bg-[#2d5a43] text-white flex items-center justify-center text-[10px] shadow-xs group-hover:bg-[#234735] transition-colors">
          <Compass className="w-3.5 h-3.5" />
        </div>
        {/* icon and count only on phones, so the button clears the 2D/3D toggle */}
        <span className="font-serif-title font-bold text-xs hidden sm:inline">Quick List</span>
        <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
          {students.length}
        </span>
      </button>

      {/* =========================================================================
          3. FLOATING EXPANDABLE QUICK LIST SIDE DRAWER
         ========================================================================= */}
      <div
        data-test-id="quick-list-drawer"
        className={`fixed top-18 sm:top-20 right-3 sm:right-4 bottom-4 w-96 max-w-[calc(100vw-1.5rem)] z-50 transition-all duration-300 ease-out transform ${
          isQuickListOpen
            ? 'translate-x-0 opacity-100 pointer-events-auto'
            : 'translate-x-[115%] opacity-0 pointer-events-none'
        }`}
      >
        <CampusInfoPanel
          students={students}
          onEnterLocation={onEnterLocation}
          onClose={() => setIsQuickListOpen(false)}
          defaultExpanded={true}
          className="h-full max-h-[calc(100dvh-7rem)] overflow-y-auto backdrop-blur-lg bg-[#fffdfa]/95 border-2 border-[#d5e2d9] shadow-2xl rounded-3xl"
        />
      </div>

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
