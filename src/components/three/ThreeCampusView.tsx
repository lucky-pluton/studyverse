import React, { useState, useCallback } from 'react';
import type { LocationId, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { Campus3DCanvas } from './Campus3DCanvas';
import { LocationDetails } from './LocationDetails';
import { CampusNavigation } from './CampusNavigation';
import { CampusInfoPanel } from '../campus/CampusInfoPanel';
import { LOCATIONS } from '../../constants/locations';
import { Compass } from 'lucide-react';

interface ThreeCampusViewProps {
  students: StudentPresence[];
  currentUser: StudentPresence | null;
  onEnterLocation: (locationId: LocationId) => void;
  timeOfDay: TimeOfDay;
  onChangeTimeOfDay: (time: TimeOfDay) => void;
}

export const ThreeCampusView: React.FC<ThreeCampusViewProps> = ({
  students,
  currentUser,
  onEnterLocation,
  timeOfDay,
  onChangeTimeOfDay,
}) => {
  const [selectedBuilding, setSelectedBuilding] = useState<LocationId | null>(null);
  const [isQuickListOpen, setIsQuickListOpen] = useState(false);
  const [cameraResetTrigger, setCameraResetTrigger] = useState(0);
  const [cameraFocusTrigger, setCameraFocusTrigger] = useState<LocationId | null>(null);

  // Count occupants in location
  const getOccupancy = useCallback(
    (locId: LocationId) => {
      return students.filter((s) => s.location === locId).length;
    },
    [students]
  );

  const handleSelectBuilding = (id: LocationId | null) => {
    setSelectedBuilding(id);
    setCameraFocusTrigger(id);
  };

  const handleResetCamera = () => {
    setSelectedBuilding(null);
    setCameraResetTrigger((prev) => prev + 1);
  };

  const selectedLocationDef = selectedBuilding ? LOCATIONS[selectedBuilding] : null;

  return (
    <div
      data-test-id="3d-campus-explorer-root"
      className="relative w-full h-[calc(100dvh-5.5rem)] sm:h-[calc(100dvh-6rem)] overflow-hidden flex flex-col select-none"
    >
      {/* =========================================================================
          1. 3D WEBGL ISOMETRIC CAMPUS CANVAS (Spacious, Uncluttered, Modern)
         ========================================================================= */}
      <div className="w-full h-full flex-1 relative overflow-hidden">
        <Campus3DCanvas
          allStudents={students}
          currentUser={currentUser}
          onSelectBuilding={handleSelectBuilding}
          onEnterBuilding={onEnterLocation}
          selectedBuilding={selectedBuilding}
          timeOfDay={timeOfDay}
          cameraTriggerReset={cameraResetTrigger}
          cameraTriggerFocus={cameraFocusTrigger}
        />
      </div>

      {/* =========================================================================
          2. MINIMAL HUD NAVIGATION BAR (Search, Time of Day, Quick Destination Jump)
         ========================================================================= */}
      <CampusNavigation
        onSelectBuilding={handleSelectBuilding}
        onEnterBuilding={onEnterLocation}
        onResetCamera={handleResetCamera}
        selectedBuilding={selectedBuilding}
        timeOfDay={timeOfDay}
        onChangeTimeOfDay={onChangeTimeOfDay}
      />

      {/* =========================================================================
          3. COMPACT SELECTED BUILDING DETAILS CARD (Bottom-Left)
         ========================================================================= */}
      {selectedLocationDef && (
        <LocationDetails
          location={selectedLocationDef}
          occupantCount={getOccupancy(selectedBuilding!)}
          onEnter={() => onEnterLocation(selectedBuilding!)}
          onClose={() => setSelectedBuilding(null)}
        />
      )}

      {/* =========================================================================
          4. FLOATING QUICK LIST TAB (Right Screen Edge)
         ========================================================================= */}
      <button
        type="button"
        data-test-id="quick-list-toggle-3d"
        onClick={() => setIsQuickListOpen((prev) => !prev)}
        className="fixed right-3 sm:right-4 top-28 sm:top-32 z-40 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-white/95 hover:bg-white text-[#1f3529] backdrop-blur-md border border-[#cbe1d5] shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 group"
        title={isQuickListOpen ? 'Close Campus Quick List' : 'Open Campus Census & Quick List'}
      >
        <div className="w-5 h-5 rounded-lg bg-[#2d5a43] text-white flex items-center justify-center text-[10px] shadow-xs">
          <Compass className="w-3.5 h-3.5" />
        </div>
        <span className="font-serif-title font-bold text-xs">Quick List</span>
        <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
          {students.length}
        </span>
      </button>

      {/* =========================================================================
          5. FLOATING EXPANDABLE QUICK LIST SIDE DRAWER
         ========================================================================= */}
      <div
        className={`fixed top-28 sm:top-32 right-3 sm:right-4 bottom-4 w-96 max-w-[calc(100vw-1.5rem)] z-50 transition-all duration-300 ease-out transform ${
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
          className="h-full max-h-[calc(100dvh-9rem)] overflow-y-auto backdrop-blur-lg bg-[#fffdfa]/95 border-2 border-[#d5e2d9] shadow-2xl rounded-3xl"
        />
      </div>
    </div>
  );
};
