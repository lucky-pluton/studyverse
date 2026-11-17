import React, { useState, useRef } from 'react';
import type { LocationId, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { Layers, ChevronRight, ChevronDown, Sparkles, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { AvatarRenderer } from '../common/AvatarRenderer';

// Definitive Campus Roundabout Artwork (Exact reference artwork with zero baked-in labels)
import campusRoundaboutMap from '../../assets/campus_roundabout_map.jpg';

export interface FinalCampusLocation {
  id: string;
  locationId: LocationId;
  name: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  style: {
    left: string;
    top: string;
    transform?: string;
  };
  tagline: string;
}

/**
 * EXACTLY SEVEN ACTUAL STUDYVERSE LOCATIONS MATCHING THE DEFINITIVE REFERENCE:
 * 1. Library - Central Library building (upper-center)
 * 2. LHC     - Lecture Hall Complex building (upper-left)
 * 3. Banyan  - Ancient Banyan Tree (center-left)
 * 4. OAT     - Open Air Theatre amphitheatre (upper-right)
 * 5. GC      - Gajendra Circle / Central Roundabout (center)
 * 6. Café    - Campus Café with patio umbrellas (lower-left)
 * 7. Sangam  - Sangam botanical gardens with gazebo (lower-right)
 */
export const SEVEN_CAMPUS_LOCATIONS: FinalCampusLocation[] = [
  // 1. Library (Central Library at upper-center)
  {
    id: 'library',
    locationId: 'library',
    name: 'Library',
    icon: '🏛️',
    iconBg: '#f3e8ff',
    iconColor: '#7e22ce',
    style: {
      left: '43.5%',
      top: '21.0%',
      transform: 'translateX(-50%)',
    },
    tagline: 'Quiet study desks, academic archives & reading halls',
  },
  // 2. LHC (Lecture Hall Complex at upper-left)
  {
    id: 'lhc',
    locationId: 'lhc',
    name: 'LHC',
    icon: '🎓',
    iconBg: '#e0e7ff',
    iconColor: '#4338ca',
    style: {
      left: '23.5%',
      top: '30.0%',
      transform: 'translateX(-50%)',
    },
    tagline: 'Tiered auditorium seating & collaborative lecture reviews',
  },
  // 3. Banyan (Banyan Tree at center-left)
  {
    id: 'banyan',
    locationId: 'banyan',
    name: 'Banyan',
    icon: '🌳',
    iconBg: '#dcfce7',
    iconColor: '#15803d',
    style: {
      left: '39.0%',
      top: '48.5%',
      transform: 'translateX(-50%)',
    },
    tagline: 'Ancient banyan grove with shaded benches & gentle breeze',
  },
  // 4. OAT (Open Air Theatre at upper-right)
  {
    id: 'oat',
    locationId: 'oat',
    name: 'OAT',
    icon: '🎭',
    iconBg: '#fae8ff',
    iconColor: '#a21caf',
    style: {
      left: '72.0%',
      top: '29.0%',
      transform: 'translateX(-50%)',
    },
    tagline: 'Open Air Theatre amphitheater with stepped stone tiers',
  },
  // 5. GC (Gajendra Circle at central roundabout)
  {
    id: 'gc',
    locationId: 'gc',
    name: 'GC',
    icon: '🐘',
    iconBg: '#fef3c7',
    iconColor: '#b45309',
    style: {
      left: '56.5%',
      top: '54.5%',
      transform: 'translateX(-50%)',
    },
    tagline: 'Gajendra Circle roundabout & campus focal landmark',
  },
  // 6. Café (Campus Café at lower-left)
  {
    id: 'cafe',
    locationId: 'cafe',
    name: 'Café',
    icon: '☕',
    iconBg: '#ffedd5',
    iconColor: '#c2410c',
    style: {
      left: '21.0%',
      top: '71.5%',
      transform: 'translateX(-50%)',
    },
    tagline: 'Fresh filter coffee, sunlit study tables & relaxed focus',
  },
  // 7. Sangam (Sangam Gardens at lower-right)
  {
    id: 'sangam',
    locationId: 'park',
    name: 'Sangam',
    icon: '🌿',
    iconBg: '#dcfce7',
    iconColor: '#166534',
    style: {
      left: '72.0%',
      top: '69.0%',
      transform: 'translateX(-50%)',
    },
    tagline: 'Sangam botanical gardens, gazebo pavilion & flowerbeds',
  },
];

interface IsometricCampusMapCanvasProps {
  students: StudentPresence[];
  currentUser?: StudentPresence;
  onEnterLocation: (loc: LocationId) => void;
  timeOfDay?: TimeOfDay;
}

export const IsometricCampusMapCanvas: React.FC<IsometricCampusMapCanvasProps> = ({
  students,
  onEnterLocation,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Live student count per location
  const getStudentsAtLocation = (locId: LocationId): StudentPresence[] => {
    return students.filter((s) => s.location === locId);
  };

  const getStudentCount = (locId: LocationId): number => {
    return getStudentsAtLocation(locId).length;
  };

  // Zoom controls
  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomLevel((z) => Math.min(2.0, Number((z + 0.2).toFixed(2))));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomLevel((z) => Math.max(1.0, Number((z - 0.2).toFixed(2))));
    if (zoomLevel <= 1.2) {
      setPanOffset({ x: 0, y: 0 });
    }
  };

  const handleResetZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Mouse pan handlers when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    if ((e.target as HTMLElement).closest('.interactive-clickable')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="space-y-3">
      {/* =========================================================================
          MAIN MAP CANVAS CONTAINER (1376 / 768 Aspect Ratio)
         ========================================================================= */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative w-full max-w-6xl mx-auto aspect-[1376/768] max-h-[76vh] rounded-3xl overflow-hidden border-2 border-[#c5d8cc] shadow-2xl bg-[#e5efe7] select-none ${
          zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
      >
        {/* Transformable Canvas for Pan & Zoom */}
        <div
          className="w-full h-full relative origin-center transition-transform duration-200 ease-out"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          }}
        >
          {/* =====================================================================
              1. PURE CAMPUS ARTWORK (Exact Reference Artwork with Zero Baked-in UI)
             ===================================================================== */}
          <img
            src={campusRoundaboutMap}
            alt="Studyverse Campus Map"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />

          {/* =====================================================================
              2. MINIMALIST TOP-LEFT HEADER PILL (Exact Reference Style)
             ===================================================================== */}
          <div
            className="interactive-clickable absolute top-2.5 sm:top-4 left-2.5 sm:left-4 z-40 bg-white/92 backdrop-blur-md rounded-full px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 border border-white/95 shadow-md transition-transform hover:scale-[1.02]"
            title="Click any campus location to enter"
          >
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-[#e6f7f3] flex items-center justify-center text-[#0d9488] shrink-0">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0d9488]" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-[#1b3326] tracking-tight">
              Live Campus Occupancy
            </span>
            <span className="text-slate-300 font-light hidden md:inline">|</span>
            <span className="text-[10px] sm:text-[11px] font-medium text-[#557563] hidden md:inline">
              Click any spot to preview &amp; join
            </span>
          </div>

          {/* =====================================================================
              3. MINIMALIST TOP-RIGHT ZOOM CONTROLS PILL (Exact Reference Style)
             ===================================================================== */}
          <div className="interactive-clickable absolute top-2.5 sm:top-4 right-2.5 sm:right-4 z-40 bg-white/92 backdrop-blur-md rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 flex items-center gap-0.5 sm:gap-1 border border-white/95 shadow-md">
            <button
              onClick={handleZoomIn}
              className="w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#2c4235] hover:bg-black/5 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4 text-[#2c4235]" />
            </button>
            <button
              onClick={handleZoomOut}
              className="w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#2c4235] hover:bg-black/5 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3 sm:w-4 sm:h-4 text-[#2c4235]" />
            </button>
            <button
              onClick={handleResetZoom}
              className="w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#2c4235] hover:bg-black/5 transition-colors cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-[#2c4235]" />
            </button>
          </div>

          {/* =====================================================================
              4. EXACTLY SEVEN STUDYVERSE FLOATING LOCATION LABELS
             ===================================================================== */}
          {SEVEN_CAMPUS_LOCATIONS.map((loc) => {
            const occupants = getStudentsAtLocation(loc.locationId);
            const count = occupants.length;
            const hasOccupants = count > 0;
            const firstOccupant = occupants[0];

            return (
              <button
                key={`loc-pill-${loc.id}`}
                onClick={() => onEnterLocation(loc.locationId)}
                className={`interactive-clickable absolute z-30 bg-white/96 backdrop-blur-md rounded-full px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1 sm:gap-1.5 border border-white/95 shadow-md transition-all duration-200 cursor-pointer active:scale-95 ${
                  hasOccupants
                    ? 'ring-2 ring-emerald-500/80 shadow-emerald-500/15'
                    : 'hover:ring-2 hover:ring-emerald-400 hover:shadow-lg hover:-translate-y-0.5'
                }`}
                style={loc.style}
                title={`Enter ${loc.name} (${count} studying)`}
              >
                {/* Location Icon Badge */}
                <div
                  className="w-4 h-4 sm:w-5 sm:h-5 md:w-5.5 md:h-5.5 rounded-full flex items-center justify-center text-[10px] sm:text-xs shrink-0"
                  style={{ background: loc.iconBg, color: loc.iconColor }}
                >
                  {loc.icon}
                </div>

                {/* Location Name */}
                <span className="font-serif text-[9px] sm:text-[11px] md:text-xs font-bold text-[#1b3326] tracking-wider uppercase whitespace-nowrap">
                  {loc.name}
                </span>

                {/* Dot Separator (Desktop / Tablet) */}
                <span className="text-slate-300 text-[8px] sm:text-[9px] leading-none shrink-0 font-bold hidden sm:inline">
                  ••
                </span>

                {/* Live Occupancy Count (Desktop / Tablet) */}
                <span
                  className={`text-[8.5px] sm:text-[10px] whitespace-nowrap font-semibold hidden sm:inline ${
                    hasOccupants ? 'text-[#0f766e] font-bold' : 'text-[#64748b]'
                  }`}
                >
                  {count} studying
                </span>

                {/* Mobile-only compact student count badge if > 0 */}
                {hasOccupants && (
                  <span className="sm:hidden text-[8px] font-bold text-emerald-800 bg-emerald-100 px-1 rounded-full leading-none">
                    {count}
                  </span>
                )}

                {/* Avatar Preview for Active Students */}
                {hasOccupants && firstOccupant && (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full overflow-hidden bg-slate-100 border border-emerald-400 shrink-0 shadow-xs flex items-center justify-center">
                    <AvatarRenderer config={firstOccupant.avatarConfig} size="xs" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Zoom Reset Pill when Zoomed */}
        {zoomLevel > 1 && (
          <div className="absolute bottom-4 right-4 z-50 animate-in fade-in">
            <button
              onClick={handleResetZoom}
              className="px-3 py-1.5 rounded-full bg-[#1b3326]/90 text-white text-xs font-semibold shadow-lg hover:bg-[#1b3326] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Reset Zoom ({Math.round(zoomLevel * 100)}%)</span>
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          RESPONSIVE COLLAPSIBLE LOCATION QUICK-NAV (FOR MOBILE / QUICK ACCESS)
         ========================================================================= */}
      <div className="max-w-6xl mx-auto rounded-2xl bg-[#fffdfa] border border-[#d5e2d9] shadow-xs overflow-hidden">
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-[#1b3326] hover:bg-[#f4faf6] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Campus Study Spaces (All 7 Locations)</span>
            <span className="px-2 py-0.5 bg-[#eaf3ee] text-emerald-800 rounded-full text-[10px]">
              7 Active
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#556e5f]">
            <span>{drawerOpen ? 'Hide Quick List' : 'Show Quick List'}</span>
            {drawerOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </button>

        {drawerOpen && (
          <div className="p-3 border-t border-[#e8efe9] grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 animate-in fade-in duration-150">
            {SEVEN_CAMPUS_LOCATIONS.map((loc) => {
              const count = getStudentCount(loc.locationId);
              return (
                <button
                  key={`quick-${loc.id}`}
                  onClick={() => onEnterLocation(loc.locationId)}
                  className="p-2 text-left rounded-xl bg-[#f8faf8] hover:bg-[#eef5f0] border border-[#e0eae3] hover:border-emerald-500/50 transition-all flex flex-col justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm shrink-0">{loc.icon}</span>
                    <span className="font-serif text-[11px] font-bold text-[#1b3326] truncate">
                      {loc.name}
                    </span>
                  </div>
                  <div className="text-[9px] text-[#556e5f] font-semibold">
                    {count > 0 ? `${count} studying` : '0 studying'}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
