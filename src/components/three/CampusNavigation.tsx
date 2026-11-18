import React, { useState, useEffect } from 'react';
import type { LocationId, TimeOfDay } from '../../types/studyverse';
import { Search, RotateCcw, Sun, Sunset, Moon } from 'lucide-react';
import { CAMPUS_3D_BUILDINGS } from '../../constants/threeDCoordinates';

interface CampusNavigationProps {
  onSelectBuilding: (id: LocationId) => void;
  onEnterBuilding: (id: LocationId) => void;
  onResetCamera: () => void;
  selectedBuilding: LocationId | null;
  timeOfDay: TimeOfDay;
  onChangeTimeOfDay: (time: TimeOfDay) => void;
}

export const CampusNavigation: React.FC<CampusNavigationProps> = ({
  onSelectBuilding,
  onEnterBuilding,
  onResetCamera,
  selectedBuilding,
  timeOfDay,
  onChangeTimeOfDay,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredBuildings = CAMPUS_3D_BUILDINGS.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* =======================================================================
          1. TOP-LEFT MINIMAL SEARCH & TELEMETRY HUD (Inspired by Reference 1)
         ======================================================================= */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-2">
        <div className="relative">
          <div
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white/92 backdrop-blur-md border border-[#cbe1d5] shadow-md hover:shadow-lg text-xs text-[#2c4737] cursor-pointer transition-all group"
            title="Search campus locations (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-[#3b664f] group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline font-medium">Search buildings...</span>
            <span className="text-[10px] bg-[#e6ede8] text-[#4d6957] font-semibold px-1.5 py-0.5 rounded-md border border-[#d2dfd5]">
              Ctrl K
            </span>
          </div>

          {/* Search Dropdown Modal */}
          {isSearchOpen && (
            <div className="absolute top-11 left-0 w-72 sm:w-80 bg-white/98 backdrop-blur-lg rounded-2xl border border-[#cbe1d5] shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#f3f7f4] rounded-xl border border-[#d6e3da] mb-2">
                <Search className="w-4 h-4 text-[#436e55]" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Find building, theatre, cafe..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-[#1c3325] w-full placeholder:text-[#789684]"
                />
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1">
                {filteredBuildings.length > 0 ? (
                  filteredBuildings.map((b) => (
                    <div
                      key={b.id}
                      className="w-full px-2.5 py-1.5 rounded-xl hover:bg-[#eaf3ed] transition-colors flex items-center justify-between group"
                    >
                      <button
                        onClick={() => {
                          onSelectBuilding(b.id as LocationId);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="text-left flex-1 cursor-pointer"
                        title="Focus camera on location"
                      >
                        <div className="text-xs font-semibold text-[#1a3326] group-hover:text-[#0f2419]">
                          {b.name}
                        </div>
                        <div className="text-[10px] text-[#557563]">{b.category}</div>
                      </button>
                      <button
                        onClick={() => {
                          onEnterBuilding(b.id as LocationId);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="px-2 py-1 rounded-lg bg-[#2d5a43] text-white text-[10px] font-bold hover:bg-[#1f4230] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                        title="Enter study room immediately"
                      >
                        Enter →
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-[#6e8a7a]">
                    No locations matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Camera Reset View Button */}
        <button
          onClick={onResetCamera}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3 sm:py-2 rounded-full bg-white/92 backdrop-blur-md border border-[#cbe1d5] shadow-md hover:shadow-lg text-xs font-medium text-[#2c4737] hover:bg-white transition-all cursor-pointer active:scale-95"
          title="Reset camera to isometric campus overview"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#3b664f]" />
          <span className="hidden sm:inline">Reset view</span>
        </button>
      </div>

      {/* =======================================================================
          2. TOP-RIGHT ENVIRONMENT HUD (Time of Day Toggle)
         ======================================================================= */}
      <div className="absolute top-4 right-32 sm:right-36 z-40 flex items-center gap-1 bg-white/92 backdrop-blur-md rounded-full p-1 border border-[#cbe1d5] shadow-md">
        <button
          onClick={() => onChangeTimeOfDay('day')}
          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
            timeOfDay === 'day' ? 'bg-[#2d5a43] text-white shadow-xs' : 'text-[#506e5d] hover:bg-black/5'
          }`}
          title="Campus Midday"
        >
          <Sun className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onChangeTimeOfDay('sunset')}
          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
            timeOfDay === 'sunset' ? 'bg-[#b45309] text-white shadow-xs' : 'text-[#506e5d] hover:bg-black/5'
          }`}
          title="Golden Hour / Sunset"
        >
          <Sunset className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onChangeTimeOfDay('night')}
          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
            timeOfDay === 'night' ? 'bg-[#1e293b] text-white shadow-xs' : 'text-[#506e5d] hover:bg-black/5'
          }`}
          title="Night Illumination"
        >
          <Moon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* =======================================================================
          3. BOTTOM QUICK JUMP DESTINATION BAR (Reference 1 Style)
         ======================================================================= */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-[calc(100vw-2rem)] overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/92 backdrop-blur-md border border-[#cbe1d5] shadow-lg">
          <button
            onClick={onResetCamera}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
              selectedBuilding === null
                ? 'bg-[#2d5a43] text-white shadow-xs'
                : 'text-[#355744] hover:bg-[#ebf4ef]'
            }`}
          >
            Overview
          </button>

          {CAMPUS_3D_BUILDINGS.map((b) => {
            const isSelected = selectedBuilding === b.id;
            return (
              <button
                key={b.id}
                onClick={() => {
                  if (isSelected) {
                    onEnterBuilding(b.id as LocationId);
                  } else {
                    onSelectBuilding(b.id as LocationId);
                  }
                }}
                onDoubleClick={() => onEnterBuilding(b.id as LocationId)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#2d5a43] text-white shadow-xs font-semibold'
                    : 'text-[#355744] hover:bg-[#ebf4ef]'
                }`}
                title={isSelected ? `Click to enter ${b.name}` : `Focus ${b.name} (Double-click to enter)`}
              >
                <span>{b.name}</span>
                {isSelected && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white text-[#1f3529] font-bold text-[9.5px] shadow-2xs">
                    Enter ↵
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
