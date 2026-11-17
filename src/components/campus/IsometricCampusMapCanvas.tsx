import React, { useState, useRef, useMemo } from 'react';
import type { LocationId, StudentPresence, TimeOfDay } from '../../types/studyverse';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  ChevronRight,
  X,
} from 'lucide-react';

// Illustrated watercolor isometric campus background matching user reference image
import campusIllustratedPastel from '../../assets/campus_illustrated_pastel.jpg';

// Consistent location thumbnails
import thumbLibrary from '../../assets/ref_libraryThumb.jpg';
import thumbAcademic from '../../assets/ref_lectureThumb.jpg';
import thumbCafe from '../../assets/ref_cafeThumb.jpg';
import thumbLecture from '../../assets/ref_oatThumb.jpg';
import thumbHostel from '../../assets/ref_hostelThumb.jpg';
import thumbGardens from '../../assets/ref_sangamThumb.jpg';

export type CategoryFilter = 'all' | 'academic' | 'study' | 'social' | 'green';

interface FeaturedLocationConfig {
  id: string;
  locationId: LocationId;
  name: string;
  categoryKey: 'academic' | 'study' | 'social' | 'green';
  categoryLabel: string;
  categoryDotColor: string;
  thumbnail: string;
  // Perimeter card coordinates on 1024 x 682 canvas
  cardX: number;
  cardY: number;
  cardWidth: number;
  // Connector line start point (on the inner edge of the card)
  lineStart: { x: number; y: number };
  // Connector line building endpoint on campus grounds
  pinEndpoint: { x: number; y: number };
}

/**
 * EXACT SIX FEATURED LOCATIONS IN DELIBERATE PERIMETER ARRANGEMENT
 * - Top-left: Academic Blocks
 * - Top-centre: Central Library
 * - Top-right: Gardens
 * - Middle-left: Campus Café
 * - Middle-right: Lecture Hall
 * - Bottom-left: Hostel Area
 * 
 * Safe spacing: minimum 80px vertical gap, minimum 200px horizontal gap, 0 card overlap, 0 line crossing!
 */
const FEATURED_LOCATIONS: FeaturedLocationConfig[] = [
  {
    id: 'academic',
    locationId: 'lhc',
    name: 'Academic Blocks',
    categoryKey: 'academic',
    categoryLabel: 'Academic',
    categoryDotColor: '#ef4444', // Coral red
    thumbnail: thumbAcademic,
    cardX: 25,
    cardY: 65,
    cardWidth: 180,
    lineStart: { x: 205, y: 130 },
    pinEndpoint: { x: 260, y: 195 },
  },
  {
    id: 'library',
    locationId: 'library',
    name: 'Central Library',
    categoryKey: 'study',
    categoryLabel: 'Study Spaces',
    categoryDotColor: '#8b5cf6', // Violet
    thumbnail: thumbLibrary,
    cardX: 422,
    cardY: 40,
    cardWidth: 180,
    lineStart: { x: 512, y: 175 },
    pinEndpoint: { x: 512, y: 205 },
  },
  {
    id: 'gardens',
    locationId: 'park',
    name: 'Gardens',
    categoryKey: 'green',
    categoryLabel: 'Green Spaces',
    categoryDotColor: '#10b981', // Emerald green
    thumbnail: thumbGardens,
    cardX: 815,
    cardY: 65,
    cardWidth: 180,
    lineStart: { x: 815, y: 130 },
    pinEndpoint: { x: 775, y: 185 },
  },
  {
    id: 'cafe',
    locationId: 'cafe',
    name: 'Campus Café',
    categoryKey: 'social',
    categoryLabel: 'Social Spaces',
    categoryDotColor: '#f59e0b', // Warm amber
    thumbnail: thumbCafe,
    cardX: 25,
    cardY: 285,
    cardWidth: 180,
    lineStart: { x: 205, y: 345 },
    pinEndpoint: { x: 245, y: 345 },
  },
  {
    id: 'lecture',
    locationId: 'oat',
    name: 'Lecture Hall',
    categoryKey: 'academic',
    categoryLabel: 'Academic',
    categoryDotColor: '#ef4444', // Coral red
    thumbnail: thumbLecture,
    cardX: 815,
    cardY: 285,
    cardWidth: 180,
    lineStart: { x: 815, y: 345 },
    pinEndpoint: { x: 735, y: 345 },
  },
  {
    id: 'hostel',
    locationId: 'gc',
    name: 'Hostel Area',
    categoryKey: 'social',
    categoryLabel: 'Hostel',
    categoryDotColor: '#f59e0b', // Warm amber
    thumbnail: thumbHostel,
    cardX: 25,
    cardY: 495,
    cardWidth: 180,
    lineStart: { x: 205, y: 550 },
    pinEndpoint: { x: 240, y: 550 },
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
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);

  // Filter locations by active category and search
  const filteredLocations = useMemo(() => {
    return FEATURED_LOCATIONS.filter((loc) => {
      const matchesCategory =
        selectedCategory === 'all' || loc.categoryKey === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Group students by location
  const getStudentsAtLocation = (locId: LocationId): StudentPresence[] =>
    students.filter((s) => s.location === locId);

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.0, Number((z + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.85, Number((z - 0.15).toFixed(2))));
  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Mouse drag pan handlers
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

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full h-[76vh] min-h-[560px] max-h-[820px] rounded-3xl overflow-hidden border-2 border-[#c5d8cc] shadow-xl bg-[#f4f7f4] select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* =========================================================================
          TOP-LEFT COMPACT BRANDING (Restrained & Minimal)
         ========================================================================= */}
      <div className="absolute top-4 left-4 z-40 interactive-control">
        <div className="flex items-center gap-2.5 bg-[#fffdfa]/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-[#e2ece5] shadow-xs">
          <span className="text-sm">🏛️</span>
          <div className="flex items-baseline gap-1.5">
            <h2 className="font-serif-title text-xs sm:text-sm font-bold text-[#1b3326] tracking-tight">
              Studyverse
            </h2>
            <span className="text-[10px] text-[#63806f] font-medium hidden sm:inline">
              • Campus Explorer
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TOP-CENTER COMPACT CATEGORY LEGEND PILL
         ========================================================================= */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 interactive-control hidden md:flex items-center gap-2 bg-[#fffdfa]/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-[#e2ece5] shadow-xs text-xs font-semibold text-[#2d4938]">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#2d5a43] text-white shadow-2xs'
              : 'hover:text-[#1b3326] text-[#556e5f]'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setSelectedCategory('academic')}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
            selectedCategory === 'academic'
              ? 'bg-[#ef4444]/15 text-[#b91c1c] font-bold'
              : 'hover:text-[#1b3326] text-[#556e5f]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
          <span>Academic</span>
        </button>
        <button
          onClick={() => setSelectedCategory('study')}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
            selectedCategory === 'study'
              ? 'bg-[#8b5cf6]/15 text-[#6d28d9] font-bold'
              : 'hover:text-[#1b3326] text-[#556e5f]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
          <span>Study Spaces</span>
        </button>
        <button
          onClick={() => setSelectedCategory('social')}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
            selectedCategory === 'social'
              ? 'bg-[#f59e0b]/15 text-[#b45309] font-bold'
              : 'hover:text-[#1b3326] text-[#556e5f]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
          <span>Social Spaces</span>
        </button>
        <button
          onClick={() => setSelectedCategory('green')}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
            selectedCategory === 'green'
              ? 'bg-[#10b981]/15 text-[#047857] font-bold'
              : 'hover:text-[#1b3326] text-[#556e5f]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#10b981]" />
          <span>Green Spaces</span>
        </button>
      </div>

      {/* =========================================================================
          TOP-RIGHT CONTROLS: SEARCH & RECENTER
         ========================================================================= */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-1.5 interactive-control">
        {searchOpen ? (
          <div className="flex items-center bg-[#fffdfa]/95 backdrop-blur-md px-3 py-1 rounded-2xl border border-[#e2ece5] shadow-xs">
            <Search className="w-3.5 h-3.5 text-[#527763] mr-1.5" />
            <input
              type="text"
              placeholder="Search spots..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-[#1e382b] focus:outline-hidden w-28 sm:w-36"
              autoFocus
            />
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
              className="p-1 text-gray-400 hover:text-gray-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="w-8 h-8 rounded-xl bg-[#fffdfa]/95 backdrop-blur-md border border-[#e2ece5] shadow-xs flex items-center justify-center text-[#2d4938] hover:bg-[#eaf3ee] transition-colors cursor-pointer"
            title="Search campus spots"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={handleResetView}
          className="w-8 h-8 rounded-xl bg-[#fffdfa]/95 backdrop-blur-md border border-[#e2ece5] shadow-xs flex items-center justify-center text-[#2d4938] hover:bg-[#eaf3ee] transition-colors cursor-pointer"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* =========================================================================
          BOTTOM-RIGHT ZOOM CONTROLS
         ========================================================================= */}
      <div className="absolute bottom-4 right-4 z-40 flex flex-col bg-[#fffdfa]/95 backdrop-blur-md rounded-2xl border border-[#e2ece5] shadow-md overflow-hidden interactive-control">
        <button
          onClick={handleZoomIn}
          className="p-2 text-[#2d4938] hover:bg-[#eaf3ee] transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <div className="h-[1px] bg-[#dbe8e0]" />
        <button
          onClick={handleZoomOut}
          className="p-2 text-[#2d4938] hover:bg-[#eaf3ee] transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* =========================================================================
          MAIN ILLUSTRATED ISOMETRIC CAMPUS CANVAS (1024 x 682 Base Coordinate Space)
         ========================================================================= */}
      <div
        className="w-full h-full transition-transform duration-75 relative flex items-center justify-center"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: '50% 50%',
        }}
      >
        <div className="relative w-[1024px] h-[682px] shrink-0">
          {/* Continuous Illustrated Watercolor Campus Backdrop */}
          <img
            src={campusIllustratedPastel}
            alt="Studyverse Illustrated Isometric Campus Map"
            className="w-full h-full object-cover rounded-2xl shadow-inner pointer-events-none select-none"
            draggable={false}
          />

          {/* SVG Connector Leader Lines & Building Pins (1024 x 682 ViewBox) */}
          <svg
            viewBox="0 0 1024 682"
            className="absolute inset-0 w-full h-full pointer-events-none z-10 hidden md:block"
          >
            <defs>
              <filter id="cleanLineShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.25" />
              </filter>
            </defs>

            {filteredLocations.map((loc) => {
              const studentsHere = getStudentsAtLocation(loc.locationId);
              const isHovered = hoveredLocationId === loc.id;
              const hasStudents = studentsHere.length > 0;

              return (
                <g key={`leader-${loc.id}`}>
                  {/* Subtle white halo underneath connector line */}
                  <line
                    x1={loc.lineStart.x}
                    y1={loc.lineStart.y}
                    x2={loc.pinEndpoint.x}
                    y2={loc.pinEndpoint.y}
                    stroke="#ffffff"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    opacity="0.9"
                  />

                  {/* Clean neutral connector line */}
                  <line
                    x1={loc.lineStart.x}
                    y1={loc.lineStart.y}
                    x2={loc.pinEndpoint.x}
                    y2={loc.pinEndpoint.y}
                    stroke={isHovered ? '#2d5a43' : '#475569'}
                    strokeWidth={isHovered ? '2.2' : '1.5'}
                    strokeLinecap="round"
                    filter="url(#cleanLineShadow)"
                  />

                  {/* Optional live occupancy pulsing ring */}
                  {hasStudents && (
                    <circle
                      cx={loc.pinEndpoint.x}
                      cy={loc.pinEndpoint.y}
                      r="11"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2"
                      className="animate-ping"
                      opacity="0.6"
                    />
                  )}

                  {/* Building Endpoint Circular Marker */}
                  <circle
                    cx={loc.pinEndpoint.x}
                    cy={loc.pinEndpoint.y}
                    r={isHovered ? 6 : 4.5}
                    fill="#ffffff"
                    stroke={isHovered ? '#2d5a43' : '#475569'}
                    strokeWidth="1.5"
                    filter="url(#cleanLineShadow)"
                  />
                  <circle
                    cx={loc.pinEndpoint.x}
                    cy={loc.pinEndpoint.y}
                    r={isHovered ? 3.5 : 2.5}
                    fill={loc.categoryDotColor}
                  />
                </g>
              );
            })}
          </svg>

          {/* =========================================================================
              DESKTOP PERIMETER CARDS (Clean, Separated, Exactly One Consistent Structure)
             ========================================================================= */}
          <div className="hidden md:block">
            {filteredLocations.map((loc) => {
              const studentsHere = getStudentsAtLocation(loc.locationId);
              const isHovered = hoveredLocationId === loc.id;

              return (
                <div
                  key={`card-${loc.id}`}
                  onClick={() => onEnterLocation(loc.locationId)}
                  onMouseEnter={() => setHoveredLocationId(loc.id)}
                  onMouseLeave={() => setHoveredLocationId(null)}
                  className={`absolute interactive-card rounded-2xl bg-[#fffdfa]/95 backdrop-blur-md p-2 border transition-all duration-200 cursor-pointer shadow-md select-none group ${
                    isHovered
                      ? 'scale-105 shadow-xl border-[#2d5a43] ring-2 ring-[#2d5a43]/20 z-30'
                      : 'hover:scale-102 hover:shadow-lg border-[#e2ece5] z-20'
                  }`}
                  style={{
                    left: `${loc.cardX}px`,
                    top: `${loc.cardY}px`,
                    width: `${loc.cardWidth}px`,
                  }}
                  title={`Enter ${loc.name} (${studentsHere.length} studying)`}
                >
                  {/* 1. Exactly One Location Thumbnail Image */}
                  <div className="aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-100 mb-1.5 border border-black/5">
                    <img
                      src={loc.thumbnail}
                      alt={loc.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      draggable={false}
                    />
                  </div>

                  {/* 2. One Title, 3. One Category Dot, 4. One Navigation Arrow */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: loc.categoryDotColor }}
                      />
                      <span className="font-serif-title text-xs font-bold text-[#1b3326] truncate group-hover:text-[#2d5a43] transition-colors">
                        {loc.name}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#2d5a43] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                  </div>

                  {/* Live Student Occupancy Badge if Active */}
                  {studentsHere.length > 0 && (
                    <div className="mt-1 px-1 flex items-center justify-between text-[9px] text-[#527763]">
                      <span className="flex items-center gap-1 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        {studentsHere.length} studying
                      </span>
                      <span className="text-[8px] text-[#718b7c] font-medium">Join &rarr;</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          MOBILE / TABLET RESPONSIVE LOCATION DRAWER (Prevents crowding & screen overflow)
         ========================================================================= */}
      <div className="absolute bottom-3 left-3 right-14 flex md:hidden gap-2 overflow-x-auto pb-1 no-scrollbar z-30 interactive-control">
        {filteredLocations.map((loc) => {
          const studentsHere = getStudentsAtLocation(loc.locationId);

          return (
            <button
              key={`mobile-card-${loc.id}`}
              onClick={() => onEnterLocation(loc.locationId)}
              className="flex items-center gap-2 bg-[#fffdfa]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#e2ece5] shadow-xs shrink-0 text-left active:scale-95 transition-transform"
            >
              <img
                src={loc.thumbnail}
                alt={loc.name}
                className="w-7 h-7 rounded-lg object-cover"
              />
              <div>
                <span className="font-serif-title text-xs font-bold text-[#1b3326] block leading-tight">
                  {loc.name}
                </span>
                <span className="text-[9px] text-[#63806f] flex items-center gap-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: loc.categoryDotColor }}
                  />
                  {studentsHere.length > 0 ? `${studentsHere.length} studying` : loc.categoryLabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
