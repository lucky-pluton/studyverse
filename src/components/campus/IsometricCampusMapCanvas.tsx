import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { LocationId, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { ZoomIn, ZoomOut, RotateCcw, ArrowRight, Users, Navigation } from 'lucide-react';
import { AvatarRenderer } from '../common/AvatarRenderer';
import { soundService } from '../../services/soundService';

// Definitive Campus Roundabout Artwork
import campusRoundaboutMap from '../../assets/campus_roundabout_map.jpg';

export interface FinalCampusLocation {
  id: string;
  locationId: LocationId;
  name: string;
  fullName: string;
  category: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  // Floating pill marker coordinate
  style: {
    left: string;
    top: string;
    transform?: string;
  };
  // Hotspot bounding box over physical building on map (percentages)
  hotspot: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  // Entrance waypoint where avatar walks to enter
  entrance: {
    x: number;
    y: number;
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
    fullName: 'Central Library',
    category: 'Academic Beacon',
    icon: '🏛️',
    iconBg: '#f3e8ff',
    iconColor: '#7e22ce',
    style: {
      left: '43.5%',
      top: '21.0%',
      transform: 'translateX(-50%)',
    },
    hotspot: {
      left: 34,
      top: 14,
      width: 18,
      height: 18,
    },
    entrance: {
      x: 43.5,
      y: 33.5,
    },
    tagline: 'Quiet teak study desks with emerald lamps & reference stacks',
  },
  // 2. LHC (Lecture Hall Complex at upper-left)
  {
    id: 'lhc',
    locationId: 'lhc',
    name: 'LHC',
    fullName: 'Lecture Hall Complex',
    category: 'Lecture Theatres',
    icon: '🎓',
    iconBg: '#e0e7ff',
    iconColor: '#4338ca',
    style: {
      left: '23.5%',
      top: '30.0%',
      transform: 'translateX(-50%)',
    },
    hotspot: {
      left: 15,
      top: 22,
      width: 17,
      height: 19,
    },
    entrance: {
      x: 23.5,
      y: 42.0,
    },
    tagline: 'Tiered auditorium seating & collaborative lecture reviews',
  },
  // 3. Banyan (Banyan Tree at center-left)
  {
    id: 'banyan',
    locationId: 'banyan',
    name: 'Banyan',
    fullName: 'Banyan Tree Study Grove',
    category: 'Outdoor Sanctuary',
    icon: '🌳',
    iconBg: '#dcfce7',
    iconColor: '#15803d',
    style: {
      left: '39.0%',
      top: '48.5%',
      transform: 'translateX(-50%)',
    },
    hotspot: {
      left: 30,
      top: 38,
      width: 18,
      height: 18,
    },
    entrance: {
      x: 39.0,
      y: 57.0,
    },
    tagline: 'Ancient banyan grove with shaded benches & gentle breeze',
  },
  // 4. OAT (Open Air Theatre at upper-right)
  {
    id: 'oat',
    locationId: 'oat',
    name: 'OAT',
    fullName: 'Open Air Theatre',
    category: 'Iconic Landmark',
    icon: '🎭',
    iconBg: '#fae8ff',
    iconColor: '#a21caf',
    style: {
      left: '72.0%',
      top: '29.0%',
      transform: 'translateX(-50%)',
    },
    hotspot: {
      left: 62,
      top: 20,
      width: 19,
      height: 20,
    },
    entrance: {
      x: 72.0,
      y: 41.5,
    },
    tagline: 'Open Air Theatre amphitheater with stepped stone tiers',
  },
  // 5. GC (Gajendra Circle at central roundabout)
  {
    id: 'gc',
    locationId: 'gc',
    name: 'GC',
    fullName: 'Gajendra Circle',
    category: 'Campus Focal Landmark',
    icon: '🐘',
    iconBg: '#fef3c7',
    iconColor: '#b45309',
    style: {
      left: '56.5%',
      top: '54.5%',
      transform: 'translateX(-50%)',
    },
    hotspot: {
      left: 45,
      top: 45,
      width: 12,
      height: 16,
    },
    entrance: {
      x: 50.0,
      y: 53.0,
    },
    tagline: 'Gajendra Circle roundabout & circular promenade benches',
  },
  // 6. Café (Campus Café at lower-left)
  {
    id: 'cafe',
    locationId: 'cafe',
    name: 'Café',
    fullName: 'Campus Café (Himalaya)',
    category: 'Cafeteria & Discussions',
    icon: '☕',
    iconBg: '#ffedd5',
    iconColor: '#c2410c',
    style: {
      left: '21.0%',
      top: '71.5%',
      transform: 'translateX(-50%)',
    },
    hotspot: {
      left: 8,
      top: 60,
      width: 22,
      height: 21,
    },
    entrance: {
      x: 21.0,
      y: 61.5,
    },
    tagline: 'Fresh filter coffee, sunlit study tables & relaxed focus',
  },
  // 7. Sangam (Sangam Gardens at lower-right)
  {
    id: 'sangam',
    locationId: 'park',
    name: 'Sangam',
    fullName: 'Sangam Gardens & Deer Trail',
    category: 'Botanical Gardens',
    icon: '🌿',
    iconBg: '#dcfce7',
    iconColor: '#166534',
    style: {
      left: '72.0%',
      top: '69.0%',
      transform: 'translateX(-50%)',
    },
    hotspot: {
      left: 60,
      top: 60,
      width: 21,
      height: 21,
    },
    entrance: {
      x: 72.0,
      y: 61.0,
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
  currentUser,
  onEnterLocation,
  timeOfDay = 'day',
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Interactive Hover State on buildings
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);

  // Avatar Presence & Smooth Walking Animation
  const [userPos, setUserPos] = useState<{ x: number; y: number }>({ x: 50, y: 64 });
  const [isWalking, setIsWalking] = useState<boolean>(false);
  const [transitioningLocation, setTransitioningLocation] = useState<LocationId | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const walkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (walkTimeoutRef.current) clearTimeout(walkTimeoutRef.current);
    };
  }, []);

  // Filter students by location
  const getStudentsAtLocation = (locId: LocationId): StudentPresence[] => {
    return students.filter((s) => s.location === locId);
  };

  // Zoom controls
  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomLevel((z) => Math.min(2.2, Number((z + 0.25).toFixed(2))));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomLevel((z) => {
      const next = Math.max(1.0, Number((z - 0.25).toFixed(2)));
      if (next <= 1.05) {
        setPanOffset({ x: 0, y: 0 });
        return 1.0;
      }
      return next;
    });
  };

  const handleResetZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoomLevel((z) => {
      const next = Math.min(2.2, Math.max(1.0, Number((z + delta).toFixed(2))));
      if (next <= 1.05) {
        setPanOffset({ x: 0, y: 0 });
        return 1.0;
      }
      return next;
    });
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
    const maxPan = (zoomLevel - 1) * 350;
    const newX = Math.min(maxPan, Math.max(-maxPan, e.clientX - dragStart.x));
    const newY = Math.min(maxPan, Math.max(-maxPan, e.clientY - dragStart.y));
    setPanOffset({ x: newX, y: newY });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Interactive Destination Selection with Avatar Walk & Cinematic Zoom
  const handleSelectDestination = useCallback(
    (loc: FinalCampusLocation) => {
      if (transitioningLocation) return; // Prevent double-triggering

      soundService.playSitSound();
      setTransitioningLocation(loc.locationId);
      setIsWalking(true);

      // 1. Move avatar to destination entrance waypoint
      setUserPos({ x: loc.entrance.x, y: loc.entrance.y });

      // 2. Camera smooth zoom toward destination building
      const targetPanX = (50 - loc.entrance.x) * 4 * zoomLevel;
      const targetPanY = (50 - loc.entrance.y) * 3 * zoomLevel;
      setPanOffset({ x: targetPanX, y: targetPanY });
      setZoomLevel(1.35);

      // 3. Complete transition after walk
      walkTimeoutRef.current = setTimeout(() => {
        setIsWalking(false);
        onEnterLocation(loc.locationId);
      }, 550);
    },
    [onEnterLocation, transitioningLocation, zoomLevel]
  );

  const hoveredLoc = SEVEN_CAMPUS_LOCATIONS.find((l) => l.id === hoveredLocationId);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* =========================================================================
          MAIN MAP CANVAS CONTAINER (Full-Screen Interactive Campus Explorer Viewport)
         ========================================================================= */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative w-full h-full min-h-[calc(100dvh-6.5rem)] overflow-hidden select-none bg-[#e3ede5] ${
          zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
      >
        {/* Transformable Canvas for Smooth Pan & Zoom */}
        <div
          className="w-full h-full relative origin-center transition-transform duration-300 ease-out"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          }}
        >
          {/* =====================================================================
              1. PURE ISOMETRIC CAMPUS ARTWORK
             ===================================================================== */}
          <img
            src={campusRoundaboutMap}
            alt="Sahej-Shala Campus Map"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
            style={{ imageRendering: '-webkit-optimize-contrast' }}
          />

          {/* Atmospheric Time of Day Tints */}
          {timeOfDay === 'sunset' && (
            <div className="absolute inset-0 pointer-events-none bg-amber-500/10 mix-blend-color-burn" />
          )}
          {timeOfDay === 'night' && (
            <div className="absolute inset-0 pointer-events-none bg-slate-950/25 mix-blend-multiply" />
          )}

          {/* =====================================================================
              2. INTERACTIVE BUILDING HOTSPOT ZONES (Glow on hover & direct click)
             ===================================================================== */}
          {SEVEN_CAMPUS_LOCATIONS.map((loc) => {
            const isHovered = hoveredLocationId === loc.id;
            const isTarget = transitioningLocation === loc.locationId;

            return (
              <div
                key={`hotspot-${loc.id}`}
                data-location-id={loc.locationId}
                onClick={() => handleSelectDestination(loc)}
                onMouseEnter={() => setHoveredLocationId(loc.id)}
                onMouseLeave={() => setHoveredLocationId(null)}
                className={`interactive-clickable absolute rounded-3xl transition-all duration-300 cursor-pointer ${
                  isHovered || isTarget
                    ? 'ring-4 ring-emerald-400/90 bg-emerald-500/15 backdrop-blur-[0.5px] shadow-2xl scale-[1.02] z-30'
                    : 'hover:ring-2 hover:ring-emerald-400/50 hover:bg-emerald-500/5 z-20'
                }`}
                style={{
                  left: `${loc.hotspot.left}%`,
                  top: `${loc.hotspot.top}%`,
                  width: `${loc.hotspot.width}%`,
                  height: `${loc.hotspot.height}%`,
                }}
                title={`Click to enter ${loc.fullName}`}
              />
            );
          })}

          {/* =====================================================================
              3. PEER STUDENT AVATARS STUDYING ON CAMPUS
             ===================================================================== */}
          {SEVEN_CAMPUS_LOCATIONS.map((loc) => {
            const occupants = getStudentsAtLocation(loc.locationId);
            if (occupants.length === 0) return null;

            return (
              <div
                key={`peers-${loc.id}`}
                className="absolute pointer-events-none z-25 flex items-center gap-1 transition-opacity"
                style={{
                  left: `${loc.entrance.x}%`,
                  top: `${loc.entrance.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {occupants.slice(0, 3).map((peer, idx) => (
                  <div
                    key={peer.sessionId || idx}
                    className="relative flex flex-col items-center animate-bounce-slow"
                    style={{ animationDelay: `${idx * 0.2}s` }}
                  >
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/90 border border-emerald-500/60 shadow-xs flex items-center justify-center overflow-hidden">
                      <AvatarRenderer config={peer.avatarConfig} size="xs" />
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {/* =====================================================================
              4. USER'S LIVE AVATAR ON CAMPUS (Walks when a building is clicked)
             ===================================================================== */}
          {currentUser && (
            <div
              className={`absolute z-35 transition-all ease-out pointer-events-none flex flex-col items-center ${
                isWalking ? 'duration-500' : 'duration-200'
              }`}
              style={{
                left: `${userPos.x}%`,
                top: `${userPos.y}%`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              {/* User Name Badge */}
              <div className="bg-[#1b3326]/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap mb-0.5 border border-white/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>{currentUser.name} (You)</span>
              </div>

              {/* Walking Chibi Avatar */}
              <div
                className={`relative transition-transform ${
                  isWalking ? 'animate-bounce scale-110' : 'hover:scale-105'
                }`}
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 border-2 border-emerald-600 shadow-lg flex items-center justify-center overflow-hidden">
                  <AvatarRenderer config={currentUser.avatarConfig} size="sm" animate={true} />
                </div>
                {/* Shadow */}
                <div className="w-6 h-1.5 bg-black/20 rounded-full blur-2xs mx-auto -mt-0.5" />
              </div>
            </div>
          )}

          {/* =====================================================================
              5. SEVEN FLOATING LOCATION PILLS (Exact Approved Design)
             ===================================================================== */}
          {SEVEN_CAMPUS_LOCATIONS.map((loc) => {
            const occupants = getStudentsAtLocation(loc.locationId);
            const count = occupants.length;
            const hasOccupants = count > 0;
            const firstOccupant = occupants[0];
            const isHovered = hoveredLocationId === loc.id;
            const isTarget = transitioningLocation === loc.locationId;

            return (
              <button
                key={`loc-pill-${loc.id}`}
                data-location-id={loc.locationId}
                onClick={() => handleSelectDestination(loc)}
                onMouseEnter={() => setHoveredLocationId(loc.id)}
                onMouseLeave={() => setHoveredLocationId(null)}
                className={`interactive-clickable absolute z-30 bg-white/96 backdrop-blur-md rounded-full px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1 sm:gap-1.5 border border-white/95 shadow-md transition-all duration-200 cursor-pointer active:scale-95 ${
                  isTarget
                    ? 'ring-4 ring-emerald-500 scale-105 shadow-xl bg-emerald-50'
                    : isHovered
                    ? 'ring-2 ring-emerald-500 shadow-xl scale-105 -translate-y-0.5'
                    : hasOccupants
                    ? 'ring-2 ring-emerald-500/80 shadow-emerald-500/15'
                    : 'hover:ring-2 hover:ring-emerald-400 hover:shadow-lg hover:-translate-y-0.5'
                }`}
                style={loc.style}
                title={`Enter ${loc.fullName} (${count} studying)`}
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

                {/* Dot Separator */}
                <span className="text-slate-300 text-[8px] sm:text-[9px] leading-none shrink-0 font-bold hidden sm:inline">
                  ••
                </span>

                {/* Live Occupancy Count */}
                <span
                  className={`text-[8.5px] sm:text-[10px] whitespace-nowrap font-semibold hidden sm:inline ${
                    hasOccupants ? 'text-[#0f766e] font-bold' : 'text-[#64748b]'
                  }`}
                >
                  {count} studying
                </span>

                {/* Mobile badge */}
                {hasOccupants && (
                  <span className="sm:hidden text-[8px] font-bold text-emerald-800 bg-emerald-100 px-1 rounded-full leading-none">
                    {count}
                  </span>
                )}

                {/* Avatar Preview */}
                {hasOccupants && firstOccupant && (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full overflow-hidden bg-slate-100 border border-emerald-400 shrink-0 shadow-xs flex items-center justify-center">
                    <AvatarRenderer config={firstOccupant.avatarConfig} size="xs" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* =====================================================================
            6. TOP-LEFT LIVE CAMPUS STATUS PILL
           ===================================================================== */}
        {/* sits below the app's fixed 2D/3D toggle (CampusMap) so the two never overlap */}
        <div className="interactive-clickable absolute top-14 sm:top-16 left-3 sm:left-6 z-30 bg-white/95 backdrop-blur-md rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-2 sm:gap-2.5 border border-[#cbe1d5] shadow-md pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-serif-title text-xs sm:text-sm font-bold text-[#1b3326]">
              {students.length} Online
            </span>
          </div>
          <span className="text-slate-300 font-light hidden md:inline">|</span>
          <span className="text-[11px] font-medium text-[#4f6e5c] hidden md:inline">
            {SEVEN_CAMPUS_LOCATIONS.filter((l) => getStudentsAtLocation(l.locationId).length > 0).length} of 7 Study Spots Active
          </span>
          <span className="text-slate-300 font-light hidden lg:inline">|</span>
          <span className="text-[11px] font-medium text-[#5c7a69] hidden lg:inline">
            Click any building to enter &amp; study
          </span>
        </div>

        {/* =====================================================================
            7. TOP-RIGHT INTERACTIVE ZOOM & VIEW CONTROLS HUD
           ===================================================================== */}
        {/* sits below the app's fixed Quick List button (CampusMap) */}
        <div className="interactive-clickable absolute top-14 sm:top-16 right-3 sm:right-4 z-40 bg-white/92 backdrop-blur-md rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 flex items-center gap-0.5 sm:gap-1 border border-white/95 shadow-md">
          <button
            onClick={handleZoomIn}
            className="w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#2c4235] hover:bg-black/5 transition-colors cursor-pointer"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4 text-[#2c4235]" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#2c4235] hover:bg-black/5 transition-colors cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3 h-3 sm:w-4 sm:h-4 text-[#2c4235]" />
          </button>
          <button
            onClick={handleResetZoom}
            className="w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#2c4235] hover:bg-black/5 transition-colors cursor-pointer"
            title="Reset View"
            aria-label="Reset View"
          >
            <RotateCcw className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-[#2c4235]" />
          </button>
          {zoomLevel > 1 && (
            <span className="text-[10px] font-bold text-[#2c4235] px-1 hidden sm:inline">
              {Math.round(zoomLevel * 100)}%
            </span>
          )}
        </div>

        {/* =====================================================================
            8. INTERACTIVE HOVER PREVIEW CARD (Floats at bottom-left when hovering)
           ===================================================================== */}
        {hoveredLoc && (
          <div className="absolute bottom-4 left-4 z-40 bg-white/96 backdrop-blur-md rounded-2xl p-3 border border-white/95 shadow-2xl max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">{hoveredLoc.icon}</span>
              <div>
                <h4 className="font-serif-title text-xs font-bold text-[#1b3326] leading-tight">
                  {hoveredLoc.fullName}
                </h4>
                <span className="text-[9.5px] font-semibold text-[#52796f] uppercase tracking-wider">
                  {hoveredLoc.category}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-[#4d5b53] leading-snug mb-2">
              {hoveredLoc.tagline}
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] font-medium text-emerald-800">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-emerald-700" />
                {getStudentsAtLocation(hoveredLoc.locationId).length} studying right now
              </span>
              <span className="font-bold flex items-center gap-0.5 text-emerald-700">
                Enter <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        )}

        {/* Transitioning Banner Overlay */}
        {transitioningLocation && (
          <div className="absolute inset-0 bg-[#1b3326]/20 backdrop-blur-[1px] flex items-center justify-center z-50 animate-in fade-in duration-200 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2 border border-white shadow-2xl flex items-center gap-2 text-xs font-bold text-[#1b3326]">
              <Navigation className="w-4 h-4 text-emerald-600 animate-spin" />
              <span>Entering study space...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
