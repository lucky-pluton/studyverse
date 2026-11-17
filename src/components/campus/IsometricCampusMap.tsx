import React, { useState, useRef, useMemo } from 'react';
import type { LocationId, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { LOCATIONS } from '../../constants/locations';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  ChevronRight,
  Layers,
  ArrowRight,
} from 'lucide-react';

// Asset imports
import campusMapBg from '../../assets/campus_isometric_map.jpg';
import thumbLibrary from '../../assets/thumb_library.jpg';
import thumbLhc from '../../assets/thumb_lhc.jpg';
import thumbCafe from '../../assets/thumb_cafe.jpg';
import thumbOat from '../../assets/thumb_oat.jpg';
import thumbBanyan from '../../assets/thumb_banyan.jpg';
import thumbPark from '../../assets/thumb_park.jpg';

export type CategoryFilter = 'all' | 'academic' | 'study' | 'social' | 'green';

interface PrototypeLocationConfig {
  id: LocationId;
  name: string;
  categoryKey: 'academic' | 'study' | 'social' | 'green';
  categoryLabel: string;
  categoryDotColor: string;
  thumbnail: string;
  // Percentage coordinates on the 100% x 100% map canvas
  pinX: number; // Building center pin X%
  pinY: number; // Building center pin Y%
  // Desktop card anchor placement (for leader lines)
  cardX: number; // Card edge anchor X%
  cardY: number; // Card edge anchor Y%
  elbowX: number; // Intermediate connector line bend X%
  elbowY: number; // Intermediate connector line bend Y%
  // CSS desktop positioning
  desktopStyle: React.CSSProperties;
}

const PROTOTYPE_LOCATIONS: PrototypeLocationConfig[] = [
  {
    id: 'library',
    name: 'Central Library',
    categoryKey: 'study',
    categoryLabel: 'Study Spaces',
    categoryDotColor: '#8b5cf6', // Violet
    thumbnail: thumbLibrary,
    pinX: 49.5,
    pinY: 29.5,
    cardX: 30.5,
    cardY: 17.0,
    elbowX: 41.0,
    elbowY: 20.0,
    desktopStyle: { left: '16%', top: '9%' },
  },
  {
    id: 'lhc',
    name: 'Lecture Hall',
    categoryKey: 'academic',
    categoryLabel: 'Academic',
    categoryDotColor: '#f43f5e', // Rose / coral
    thumbnail: thumbLhc,
    pinX: 25.5,
    pinY: 37.5,
    cardX: 18.5,
    cardY: 31.0,
    elbowX: 20.5,
    elbowY: 34.0,
    desktopStyle: { left: '4%', top: '24%' },
  },
  {
    id: 'cafe',
    name: 'Campus Café',
    categoryKey: 'social',
    categoryLabel: 'Social Spaces',
    categoryDotColor: '#f59e0b', // Amber
    thumbnail: thumbCafe,
    pinX: 29.0,
    pinY: 71.0,
    cardX: 19.5,
    cardY: 67.0,
    elbowX: 22.0,
    elbowY: 70.0,
    desktopStyle: { left: '5%', top: '61%' },
  },
  {
    id: 'banyan',
    name: 'Banyan Tree',
    categoryKey: 'green',
    categoryLabel: 'Green Spaces',
    categoryDotColor: '#10b981', // Emerald
    thumbnail: thumbBanyan,
    pinX: 73.0,
    pinY: 23.5,
    cardX: 81.5,
    cardY: 16.5,
    elbowX: 78.0,
    elbowY: 18.5,
    desktopStyle: { right: '4%', top: '9%' },
  },
  {
    id: 'oat',
    name: 'Open Air Theatre',
    categoryKey: 'social',
    categoryLabel: 'Social Spaces',
    categoryDotColor: '#f59e0b', // Amber
    thumbnail: thumbOat,
    pinX: 77.0,
    pinY: 47.0,
    cardX: 82.5,
    cardY: 45.0,
    elbowX: 80.0,
    elbowY: 46.0,
    desktopStyle: { right: '3%', top: '39%' },
  },
  {
    id: 'park',
    name: 'Sangam Gardens',
    categoryKey: 'green',
    categoryLabel: 'Green Spaces',
    categoryDotColor: '#10b981', // Emerald
    thumbnail: thumbPark,
    pinX: 68.0,
    pinY: 73.0,
    cardX: 79.5,
    cardY: 69.5,
    elbowX: 73.5,
    elbowY: 71.5,
    desktopStyle: { right: '6%', top: '63%' },
  },
];

const CATEGORIES: { key: CategoryFilter; label: string; dotColor: string }[] = [
  { key: 'academic', label: 'Academic', dotColor: '#f43f5e' },
  { key: 'study', label: 'Study Spaces', dotColor: '#8b5cf6' },
  { key: 'social', label: 'Social Spaces', dotColor: '#f59e0b' },
  { key: 'green', label: 'Green Spaces', dotColor: '#10b981' },
];

interface IsometricCampusMapProps {
  students: StudentPresence[];
  currentUser: StudentPresence;
  onEnterLocation: (loc: LocationId) => void;
  timeOfDay: TimeOfDay;
  onSwitchToClassicView?: () => void;
}

export const IsometricCampusMap: React.FC<IsometricCampusMapProps> = ({
  students,
  currentUser: _currentUser,
  onEnterLocation,
  timeOfDay: _timeOfDay,
  onSwitchToClassicView,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedLocationId, setSelectedLocationId] = useState<LocationId | null>(null);
  const [hoveredLocationId, setHoveredLocationId] = useState<LocationId | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showExploreModal, setShowExploreModal] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Helper: Get student count at location
  const getOccupantCount = (locId: string) => {
    return students.filter((s) => s.location === locId).length;
  };

  // Zoom controls
  const handleZoomIn = () => setZoomLevel((z) => Math.min(1.8, Math.round((z + 0.15) * 100) / 100));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.75, Math.round((z - 0.15) * 100) / 100));
  const handleResetView = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.interactive-card') || (e.target as HTMLElement).closest('.interactive-control')) {
      return;
    }
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

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    if ((e.target as HTMLElement).closest('.search-modal')) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoomLevel((z) => Math.min(1.8, Math.max(0.75, Math.round((z + delta) * 100) / 100)));
  };

  // Toggle search
  const handleToggleSearch = () => {
    setIsSearchOpen((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => searchInputRef.current?.focus(), 150);
      } else {
        setSearchQuery('');
      }
      return next;
    });
  };

  // Filtered locations
  const filteredLocations = useMemo(() => {
    return PROTOTYPE_LOCATIONS.filter((loc) => {
      const matchesCategory = selectedCategory === 'all' || loc.categoryKey === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (LOCATIONS[loc.id]?.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Selected location details
  const activeLocationConfig = useMemo(() => {
    if (!selectedLocationId) return null;
    return PROTOTYPE_LOCATIONS.find((l) => l.id === selectedLocationId) || null;
  }, [selectedLocationId]);

  const activeLocationDef = useMemo(() => {
    if (!selectedLocationId) return null;
    return LOCATIONS[selectedLocationId] || null;
  }, [selectedLocationId]);

  return (
    <div className="relative w-full h-[calc(100vh-4.25rem)] min-h-[620px] bg-[#eef5f0] overflow-hidden select-none flex flex-col font-sans">
      {/* =========================================================================
          TOP-LEFT: Studyverse Campus Identity Panel
          ========================================================================= */}
      <div className="absolute top-4 left-4 z-40 interactive-control">
        <div className="bg-[#fffdfa]/95 backdrop-blur-md px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl border border-[#ded5c7] shadow-lg flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#2d5a43] text-white flex items-center justify-center text-lg sm:text-xl shadow-xs shrink-0">
            🏛️
          </div>
          <div className="pr-1">
            <div className="flex items-center gap-2">
              <h1 className="font-serif-title font-bold text-sm sm:text-base text-[#1f382b] tracking-tight leading-none">
                Studyverse
              </h1>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] tracking-wider uppercase font-semibold text-[#657d70] mt-0.5">
              Virtual Campus
            </p>
          </div>
          <div className="hidden sm:block h-7 w-[1px] bg-[#e2d8cb] ml-1" />
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[9px] uppercase font-bold text-[#798e82] tracking-wider">
              Campus Focus
            </span>
            <span className="text-xs font-bold text-[#234533]">
              {students.length} Studying
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TOP-CENTER: Location Category Legend ("INDEX")
          ========================================================================= */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 interactive-control max-w-[92vw] overflow-x-auto no-scrollbar">
        <div className="bg-[#fffdfa]/95 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[#ded5c7] shadow-md flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#2d5a43] text-white shadow-xs'
                : 'text-[#5f5144] hover:bg-[#ede5d8]'
            }`}
          >
            All Spots
          </button>

          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(isSelected ? 'all' : cat.key)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2d5a43] text-white shadow-xs'
                    : 'text-[#483d32] hover:bg-[#ede5d8]'
                }`}
                title={`Filter by ${cat.label}`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: cat.dotColor }}
                />
                <span className="whitespace-nowrap">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          TOP-RIGHT: Search & View Controls
          ========================================================================= */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-2 interactive-control">
        {/* Search Toggle Button */}
        <button
          onClick={handleToggleSearch}
          className={`p-2.5 sm:px-3 sm:py-2 rounded-2xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
            isSearchOpen
              ? 'bg-[#2d5a43] text-white border-[#224734]'
              : 'bg-[#fffdfa]/95 backdrop-blur-md text-[#483d32] hover:bg-[#ede5d8] border-[#ded5c7]'
          }`}
          title="Search campus destinations"
          aria-label="Search campus"
        >
          <Search className="w-4 h-4" />
          <span className="text-xs font-semibold hidden md:inline">Search</span>
        </button>

        {/* View Switcher: Prototype vs Classic */}
        {onSwitchToClassicView && (
          <button
            onClick={onSwitchToClassicView}
            className="px-3 py-2 rounded-2xl bg-[#fffdfa]/95 backdrop-blur-md border border-[#ded5c7] text-[#483d32] hover:bg-[#ede5d8] text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Switch to detailed campus occupancy view"
          >
            <Layers className="w-3.5 h-3.5 text-[#2d5a43]" />
            <span className="hidden sm:inline">Classic Map</span>
          </button>
        )}
      </div>

      {/* =========================================================================
          SEARCH DROPDOWN OVERLAY (WHEN OPEN)
          ========================================================================= */}
      {isSearchOpen && (
        <div className="absolute top-16 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 bg-[#fffdfa] rounded-3xl border border-[#ded5c7] shadow-2xl p-3.5 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150 search-modal interactive-control text-[#302a24]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8a7a6a] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search library, cafe, quiet lawn..."
              className="w-full pl-9 pr-8 py-2 rounded-2xl bg-[#faf6f0] border border-[#ded2c1] text-xs text-[#29221b] placeholder-[#938272] focus:outline-hidden focus:border-[#2d5a43] focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a7a6a] hover:text-[#332a21] text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {filteredLocations.length === 0 ? (
              <p className="text-center py-4 text-[#8a7c6e] text-xs">
                No matching campus spots found.
              </p>
            ) : (
              filteredLocations.map((loc) => {
                const occupants = getOccupantCount(loc.id);
                return (
                  <button
                    key={loc.id}
                    onClick={() => {
                      setSelectedLocationId(loc.id);
                      setIsSearchOpen(false);
                      onEnterLocation(loc.id);
                    }}
                    className="w-full text-left p-2 rounded-2xl hover:bg-[#f5ece1] flex items-center justify-between transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={loc.thumbnail}
                        alt={loc.name}
                        className="w-9 h-9 rounded-xl object-cover border border-[#ded2c1]"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: loc.categoryDotColor }}
                          />
                          <span className="font-serif-title font-bold text-xs text-[#1f382b] group-hover:text-[#164e32]">
                            {loc.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#706152]">
                          {loc.categoryLabel}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-[#55473a]">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#e8eee9] text-[#244b36] font-medium">
                        {occupants > 0 ? `${occupants} seated` : 'Quiet'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#887766] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MAIN CAMPUS CANVAS: Pan & Zoom Interactive Stage
          ========================================================================= */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`relative flex-1 w-full h-full overflow-hidden ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Scaled & Panned Campus Scene Wrapper */}
        <div
          className="relative w-full h-full transition-transform duration-75 origin-center"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          }}
        >
          {/* Base Illustrated Campus Diorama Image */}
          <div className="absolute inset-0 w-full h-full flex items-center justify-center p-2 sm:p-4 pointer-events-none">
            <div className="relative w-full h-full max-w-[1500px] aspect-[16/10] shadow-2xl rounded-3xl overflow-hidden border-2 border-[#d5cbbe]">
              <img
                src={campusMapBg}
                alt="Studyverse Illustrated Isometric Campus Map"
                className="w-full h-full object-cover object-center select-none"
                draggable={false}
              />
              <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/10 pointer-events-none" />
            </div>
          </div>

          {/* SVG LAYER: Connecting Leader Lines & Target Pin Rings */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="#000000" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Render connector lines for active/filtered locations (Desktop view) */}
            {filteredLocations.map((loc) => {
              const isHovered = hoveredLocationId === loc.id;
              const isSelected = selectedLocationId === loc.id;
              const pathD = `M ${loc.cardX} ${loc.cardY} L ${loc.elbowX} ${loc.elbowY} L ${loc.pinX} ${loc.pinY}`;

              return (
                <g key={`leader-${loc.id}`} className="hidden md:inline">
                  {/* Subtle outer stroke for contrast */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#1b3829"
                    strokeWidth={isHovered || isSelected ? 0.45 : 0.28}
                    strokeOpacity={0.35}
                  />
                  {/* Core crisp white leader line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isHovered || isSelected ? '#ffffff' : '#fcfaf6'}
                    strokeWidth={isHovered || isSelected ? 0.35 : 0.22}
                    filter="url(#softGlow)"
                  />
                  {/* Anchor bend dot */}
                  <circle
                    cx={loc.elbowX}
                    cy={loc.elbowY}
                    r={0.35}
                    fill="#ffffff"
                    stroke="#2d5a43"
                    strokeWidth={0.15}
                  />
                </g>
              );
            })}

            {/* Render Target Pin Rings at building locations */}
            {filteredLocations.map((loc) => {
              const isHovered = hoveredLocationId === loc.id;
              const isSelected = selectedLocationId === loc.id;
              const occupants = getOccupantCount(loc.id);

              return (
                <g
                  key={`pin-${loc.id}`}
                  data-testid={`pin-${loc.id}`}
                  className="cursor-pointer pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLocationId(loc.id);
                    onEnterLocation(loc.id);
                  }}
                  onMouseEnter={() => setHoveredLocationId(loc.id)}
                  onMouseLeave={() => setHoveredLocationId(null)}
                >
                  {/* Occupancy Ping Aura */}
                  {(occupants > 0 || isHovered || isSelected) && (
                    <circle
                      cx={loc.pinX}
                      cy={loc.pinY}
                      r={isHovered || isSelected ? 2.4 : 1.8}
                      fill={loc.categoryDotColor}
                      opacity={0.35}
                      className="animate-ping"
                    />
                  )}

                  {/* Outer White Ring */}
                  <circle
                    cx={loc.pinX}
                    cy={loc.pinY}
                    r={isHovered || isSelected ? 1.4 : 1.05}
                    fill="#ffffff"
                    stroke="#1a3528"
                    strokeWidth={0.2}
                    filter="url(#softGlow)"
                  />

                  {/* Inner Category Center Dot */}
                  <circle
                    cx={loc.pinX}
                    cy={loc.pinY}
                    r={isHovered || isSelected ? 0.8 : 0.6}
                    fill={loc.categoryDotColor}
                  />
                </g>
              );
            })}
          </svg>

          {/* =========================================================================
              FLOATING LOCATION CARDS (DESKTOP ISOMETRIC OVERLAYS)
              ========================================================================= */}
          <div className="absolute inset-0 w-full h-full pointer-events-none z-30 hidden md:block">
            {filteredLocations.map((loc) => {
              const isHovered = hoveredLocationId === loc.id;
              const isSelected = selectedLocationId === loc.id;
              const occupants = getOccupantCount(loc.id);

              return (
                <div
                  key={`card-${loc.id}`}
                  style={loc.desktopStyle}
                  className="absolute pointer-events-auto interactive-card transition-all duration-200"
                  onMouseEnter={() => setHoveredLocationId(loc.id)}
                  onMouseLeave={() => setHoveredLocationId(null)}
                >
                  <button
                    type="button"
                    data-testid={`card-${loc.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLocationId(loc.id);
                      onEnterLocation(loc.id);
                    }}
                    className={`group w-64 lg:w-72 p-2 rounded-2xl bg-[#fffdfa]/95 backdrop-blur-md border transition-all duration-200 flex items-center gap-2.5 cursor-pointer shadow-lg hover:shadow-2xl text-left ${
                      isHovered || isSelected
                        ? 'border-[#2d5a43] -translate-y-1 ring-2 ring-[#2d5a43]/20 shadow-2xl'
                        : 'border-[#ded4c5] hover:border-[#b8a994]'
                    }`}
                  >
                    {/* Thumbnail Image */}
                    <div className="relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border border-[#e4dcd0] bg-[#eee6da]">
                      <img
                        src={loc.thumbnail}
                        alt={loc.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {occupants > 0 && (
                        <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded-md bg-[#2d5a43] text-white text-[8px] font-bold shadow-xs">
                          {occupants} seated
                        </span>
                      )}
                    </div>

                    {/* Card Information */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: loc.categoryDotColor }}
                        />
                        <span className="text-[10px] font-semibold text-[#66776b] uppercase tracking-wider truncate">
                          {loc.categoryLabel}
                        </span>
                      </div>
                      <h3 className="font-serif-title font-bold text-xs sm:text-sm text-[#233d2e] leading-tight truncate group-hover:text-[#18462f]">
                        {loc.name}
                      </h3>
                      <p className="text-[10px] text-[#786b5d] truncate mt-0.5">
                        {occupants > 0 ? `${occupants} student${occupants > 1 ? 's' : ''} focusing` : 'Quiet & peaceful now'}
                      </p>
                    </div>

                    {/* Navigation Arrow */}
                    <div className="w-6 h-6 rounded-full bg-[#f4ece1] group-hover:bg-[#2d5a43] group-hover:text-white text-[#5d4f40] flex items-center justify-center shrink-0 transition-colors">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          MOBILE / TABLET: Responsive Bottom Location Carousel
          ========================================================================= */}
      <div className="md:hidden absolute bottom-16 left-0 right-0 z-30 px-3 pb-1 interactive-control">
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-2">
          {filteredLocations.map((loc) => {
            const occupants = getOccupantCount(loc.id);
            return (
              <button
                type="button"
                key={`mobile-card-${loc.id}`}
                data-testid={`mobile-card-${loc.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedLocationId(loc.id);
                  onEnterLocation(loc.id);
                }}
                className="w-56 p-2 rounded-2xl bg-[#fffdfa]/95 backdrop-blur-md border border-[#ded5c7] shadow-xl flex items-center gap-2.5 shrink-0 active:scale-98 transition-all cursor-pointer text-left"
              >
                <img
                  src={loc.thumbnail}
                  alt={loc.name}
                  className="w-14 h-12 rounded-xl object-cover border border-[#e2d8cb] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: loc.categoryDotColor }}
                    />
                    <span className="text-[9px] font-semibold text-[#6d7f73] uppercase tracking-wider truncate">
                      {loc.categoryLabel}
                    </span>
                  </div>
                  <h4 className="font-serif-title font-bold text-xs text-[#20392b] truncate">
                    {loc.name}
                  </h4>
                  <span className="text-[9px] text-[#2d5a43] font-semibold">
                    {occupants > 0 ? `${occupants} studying` : 'Quiet spot'}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8a7a6a] shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          BOTTOM-LEFT: Explore Pill / Slogan
          ========================================================================= */}
      <div className="absolute bottom-4 left-4 z-40 interactive-control">
        <button
          onClick={() => setShowExploreModal(true)}
          className="bg-[#fffdfa]/95 backdrop-blur-md px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl border border-[#ded5c7] shadow-md hover:bg-[#faf4ec] transition-all flex items-center gap-2 text-[#354f40] cursor-pointer group"
          title="Campus guide & orientation"
        >
          <span className="text-base">🏛️</span>
          <div className="text-left">
            <span className="font-serif-title font-bold text-xs sm:text-sm text-[#1e392a] group-hover:text-[#174e30] block leading-none">
              Explore Studyverse
            </span>
            <span className="text-[9px] sm:text-[10px] text-[#6d8276] italic">
              Explore. Learn. Belong.
            </span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#73887c] group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* =========================================================================
          BOTTOM-RIGHT: Zoom & Fit Controls
          ========================================================================= */}
      <div className="absolute bottom-4 right-4 z-40 interactive-control">
        <div className="bg-[#fffdfa]/95 backdrop-blur-md p-1 sm:p-1.5 rounded-2xl border border-[#ded5c7] shadow-lg flex flex-col items-center gap-1">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-xl text-[#354f40] hover:bg-[#ede5d8] transition-colors cursor-pointer"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-4 h-[1px] bg-[#e4dacd]" />
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-xl text-[#354f40] hover:bg-[#ede5d8] transition-colors cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-4 h-[1px] bg-[#e4dacd]" />
          <button
            onClick={handleResetView}
            className="p-2 rounded-xl text-[#354f40] hover:bg-[#ede5d8] transition-colors cursor-pointer"
            title="Reset Campus View"
            aria-label="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          EXPLORE CAMPUS MODAL
          ========================================================================= */}
      {showExploreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#fffdfa] rounded-3xl border border-[#ded5c7] shadow-2xl p-5 space-y-4 text-[#332b24]">
            <div className="flex items-center justify-between border-b border-[#e8ded0] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏛️</span>
                <div>
                  <h3 className="font-serif-title font-bold text-base text-[#1c3829]">
                    Welcome to Studyverse
                  </h3>
                  <p className="text-[10px] text-[#697d72] uppercase tracking-wider font-semibold">
                    IIT Madras Virtual Campus Simulation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExploreModal(false)}
                className="w-8 h-8 rounded-full bg-[#f2e9dc] hover:bg-[#e4d6c4] text-[#4d4032] flex items-center justify-center text-xs transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#5f5144] leading-relaxed">
              Studyverse is designed for silent online study companionship. Pick any campus destination, occupy an open desk or garden bench, and focus peacefully alongside fellow learners from around the world.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-[#f5ede2] border border-[#e2d4c2]">
                <span className="text-[10px] uppercase font-bold text-[#62776a] block">Online Learners</span>
                <span className="text-base font-serif-title font-bold text-[#1f3729]">
                  {students.length} Student{students.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[#f5ede2] border border-[#e2d4c2]">
                <span className="text-[10px] uppercase font-bold text-[#62776a] block">Available Spots</span>
                <span className="text-base font-serif-title font-bold text-[#1f3729]">
                  {PROTOTYPE_LOCATIONS.length} Illustrated Destinations
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowExploreModal(false)}
                className="px-4 py-2 rounded-2xl bg-[#2d5a43] hover:bg-[#204231] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Back to Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SELECTED LOCATION PREVIEW DRAWER (OPTIONAL DETAIL)
          ========================================================================= */}
      {activeLocationConfig && activeLocationDef && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 w-[92vw] max-w-md bg-[#fffdfa] rounded-3xl border-2 border-[#2d5a43]/40 shadow-2xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-200 interactive-control">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <img
                src={activeLocationConfig.thumbnail}
                alt={activeLocationConfig.name}
                className="w-12 h-12 rounded-xl object-cover border border-[#d8cfc0]"
              />
              <div>
                <span
                  className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full inline-block"
                  style={{
                    backgroundColor: activeLocationConfig.categoryDotColor + '20',
                    color: activeLocationConfig.categoryDotColor,
                  }}
                >
                  {activeLocationConfig.categoryLabel}
                </span>
                <h4 className="font-serif-title font-bold text-sm text-[#1f382a] mt-0.5">
                  {activeLocationDef.name}
                </h4>
              </div>
            </div>
            <button
              onClick={() => setSelectedLocationId(null)}
              className="text-[#8a7a6b] hover:text-[#33281e] p-1 text-xs"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-[#5e5143] leading-relaxed line-clamp-2">
            {activeLocationDef.description}
          </p>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-[#2d5a43]">
              {getOccupantCount(activeLocationConfig.id)} of {activeLocationDef.seats.length} seats occupied
            </span>
            <button
              onClick={() => onEnterLocation(activeLocationConfig.id)}
              className="px-4 py-2 rounded-xl bg-[#2d5a43] hover:bg-[#1f3f2f] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>Enter Study Room</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
