import React, { useState, useRef, useMemo } from 'react';
import type { LocationId, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { AvatarRenderer } from '../common/AvatarRenderer';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  ChevronRight,
  X,
} from 'lucide-react';

// Asset imports — exact crops and aerial campus art inspired by primary reference image
import campusAerialBg from '../../assets/campus_aerial_map.jpg';
import thumbLibrary from '../../assets/ref_libraryThumb.jpg';
import thumbLecture from '../../assets/ref_lectureThumb.jpg';
import thumbCafe from '../../assets/ref_cafeThumb.jpg';
import thumbOat from '../../assets/ref_oatThumb.jpg';
import thumbHostel from '../../assets/ref_hostelThumb.jpg';
import thumbBanyan from '../../assets/ref_banyanThumb.jpg';
import thumbSangam from '../../assets/ref_sangamThumb.jpg';

export type CategoryFilter = 'all' | 'academic' | 'study' | 'social' | 'green';

interface CampusCardDefinition {
  id: LocationId;
  name: string;
  categoryKey: 'academic' | 'study' | 'social' | 'green';
  categoryLabel: string;
  categoryDotColor: string;
  thumbnail: string;
  // Scaled coordinates relative to the 1024 x 682 canvas
  cardLeft: number;
  cardTop: number;
  cardWidth: number;
  // Leader line anchor on card (where line starts)
  lineStart: { x: number; y: number };
  // Intermediate elbow point for line
  lineElbow?: { x: number; y: number };
  // Building anchor point on campus grounds
  pinPoint: { x: number; y: number };
}

const CAMPUS_LOCATIONS: CampusCardDefinition[] = [
  {
    id: 'library',
    name: 'Central Library',
    categoryKey: 'study',
    categoryLabel: 'Study Spaces',
    categoryDotColor: '#8b5cf6', // Purple
    thumbnail: thumbLibrary,
    cardLeft: 172,
    cardTop: 147,
    cardWidth: 216,
    lineStart: { x: 388, y: 217 },
    lineElbow: { x: 440, y: 250 },
    pinPoint: { x: 440, y: 380 },
  },
  {
    id: 'lhc',
    name: 'Lecture Hall',
    categoryKey: 'academic',
    categoryLabel: 'Academic',
    categoryDotColor: '#ef4444', // Coral Red
    thumbnail: thumbLecture,
    cardLeft: 624,
    cardTop: 101,
    cardWidth: 202,
    lineStart: { x: 624, y: 170 },
    lineElbow: { x: 555, y: 235 },
    pinPoint: { x: 555, y: 370 },
  },
  {
    id: 'banyan',
    name: 'Banyan Tree',
    categoryKey: 'green',
    categoryLabel: 'Green Spaces',
    categoryDotColor: '#10b981', // Emerald
    thumbnail: thumbBanyan,
    cardLeft: 785,
    cardTop: 45,
    cardWidth: 195,
    lineStart: { x: 825, y: 155 },
    pinPoint: { x: 825, y: 220 },
  },
  {
    id: 'oat',
    name: 'Open Air Theatre',
    categoryKey: 'study',
    categoryLabel: 'Facilities',
    categoryDotColor: '#8b5cf6', // Purple
    thumbnail: thumbOat,
    cardLeft: 820,
    cardTop: 310,
    cardWidth: 193,
    lineStart: { x: 820, y: 375 },
    lineElbow: { x: 765, y: 430 },
    pinPoint: { x: 765, y: 510 },
  },
  {
    id: 'cafe',
    name: 'Campus Café',
    categoryKey: 'social',
    categoryLabel: 'Social Spaces',
    categoryDotColor: '#f59e0b', // Amber
    thumbnail: thumbCafe,
    cardLeft: 614,
    cardTop: 467,
    cardWidth: 201,
    lineStart: { x: 614, y: 530 },
    lineElbow: { x: 540, y: 570 },
    pinPoint: { x: 520, y: 640 },
  },
  {
    id: 'gc',
    name: 'Hostel Rooms',
    categoryKey: 'social',
    categoryLabel: 'Hostel',
    categoryDotColor: '#f59e0b', // Amber
    thumbnail: thumbHostel,
    cardLeft: 16,
    cardTop: 397,
    cardWidth: 202,
    lineStart: { x: 218, y: 468 },
    lineElbow: { x: 270, y: 500 },
    pinPoint: { x: 315, y: 530 },
  },
  {
    id: 'park',
    name: 'Sangam Gardens',
    categoryKey: 'green',
    categoryLabel: 'Green Spaces',
    categoryDotColor: '#10b981', // Emerald
    thumbnail: thumbSangam,
    cardLeft: 810,
    cardTop: 520,
    cardWidth: 190,
    lineStart: { x: 810, y: 580 },
    lineElbow: { x: 730, y: 540 },
    pinPoint: { x: 700, y: 440 },
  },
];

interface IsometricCampusMapCanvasProps {
  students: StudentPresence[];
  currentUser: StudentPresence;
  onEnterLocation: (loc: LocationId) => void;
  timeOfDay: TimeOfDay;
}

export const IsometricCampusMapCanvas: React.FC<IsometricCampusMapCanvasProps> = ({
  students,
  currentUser: _currentUser,
  onEnterLocation,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [hoveredLocationId, setHoveredLocationId] = useState<LocationId | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [exploreModalOpen, setExploreModalOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Group students by location
  const getStudentsAtLocation = (locId: string): StudentPresence[] =>
    students.filter((s) => s.location === locId);

  // Filter locations by active category or search query
  const filteredLocations = useMemo(() => {
    return CAMPUS_LOCATIONS.filter((loc) => {
      const matchesCategory =
        selectedCategory === 'all' || loc.categoryKey === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

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
      className={`relative w-full h-[76vh] min-h-[580px] max-h-[820px] rounded-3xl overflow-hidden border-2 border-[#c5d8cc] shadow-2xl bg-[#e5efe7] select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* =========================================================================
          TOP-LEFT CAMPUS IDENTITY PANEL (Directly from Reference Image 1)
         ========================================================================= */}
      <div className="absolute top-4 left-4 z-40 interactive-control">
        <div className="flex items-center gap-3 bg-[#fffdfa]/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/80 shadow-md">
          <div className="w-9 h-9 rounded-full bg-[#fcedeb] border border-[#f5b8b0] flex items-center justify-center text-lg shadow-inner">
            🏛️
          </div>
          <div>
            <h2 className="font-serif-title text-base sm:text-lg font-bold text-[#1b3326] leading-tight tracking-tight">
              IIT Madras
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#63806f] block">
              Campus Explorer
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TOP-CENTER CATEGORY LEGEND PILL (Directly from Reference Image 1)
         ========================================================================= */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 interactive-control hidden md:flex items-center gap-3.5 bg-[#fffdfa]/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/80 shadow-md text-xs font-semibold text-[#2d4938]">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
            selectedCategory === 'all' ? 'bg-[#2d5a43] text-white shadow-2xs' : 'hover:text-[#1b3326]'
          }`}
        >
          <span>All</span>
        </button>
        <button
          onClick={() => setSelectedCategory('academic')}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
            selectedCategory === 'academic' ? 'bg-[#ef4444]/15 text-[#b91c1c] font-bold' : 'hover:text-[#1b3326]'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
          <span>Academic</span>
        </button>
        <button
          onClick={() => setSelectedCategory('study')}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
            selectedCategory === 'study' ? 'bg-[#8b5cf6]/15 text-[#6d28d9] font-bold' : 'hover:text-[#1b3326]'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" />
          <span>Study Spaces</span>
        </button>
        <button
          onClick={() => setSelectedCategory('social')}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
            selectedCategory === 'social' ? 'bg-[#f59e0b]/15 text-[#b45309] font-bold' : 'hover:text-[#1b3326]'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
          <span>Social Spaces</span>
        </button>
        <button
          onClick={() => setSelectedCategory('green')}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
            selectedCategory === 'green' ? 'bg-[#10b981]/15 text-[#047857] font-bold' : 'hover:text-[#1b3326]'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
          <span>Green Spaces</span>
        </button>
      </div>

      {/* =========================================================================
          TOP-RIGHT CONTROLS: SEARCH & RECENTER (Reference Image 1)
         ========================================================================= */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-2 interactive-control">
        {searchOpen ? (
          <div className="flex items-center bg-[#fffdfa]/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/80 shadow-md">
            <Search className="w-4 h-4 text-[#527763] mr-2" />
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
            className="w-10 h-10 rounded-2xl bg-[#fffdfa]/95 backdrop-blur-md border border-white/80 shadow-md flex items-center justify-center text-[#2d4938] hover:bg-[#eaf3ee] transition-colors cursor-pointer"
            title="Search campus spots"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={handleResetView}
          className="w-10 h-10 rounded-2xl bg-[#fffdfa]/95 backdrop-blur-md border border-white/80 shadow-md flex items-center justify-center text-[#2d4938] hover:bg-[#eaf3ee] transition-colors cursor-pointer"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* =========================================================================
          BOTTOM-LEFT EXPLORE BADGE (Reference Image 1)
         ========================================================================= */}
      <div className="absolute bottom-4 left-4 z-40 interactive-control">
        <button
          onClick={() => setExploreModalOpen(true)}
          className="flex items-center gap-2 bg-[#fffdfa]/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/80 shadow-md hover:bg-[#f6faf7] transition-all cursor-pointer group"
        >
          <span className="text-sm">🏛️</span>
          <span className="font-serif-title text-xs font-bold text-[#1e382b] group-hover:text-[#2d5a43]">
            Explore IIT Madras
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 group-hover:text-[#2d5a43] transition-all" />
        </button>
      </div>

      {/* =========================================================================
          BOTTOM-RIGHT ZOOM CONTROLS (+ / -) (Reference Image 1)
         ========================================================================= */}
      <div className="absolute bottom-4 right-4 z-40 flex flex-col bg-[#fffdfa]/95 backdrop-blur-md rounded-2xl border border-white/80 shadow-md overflow-hidden interactive-control">
        <button
          onClick={handleZoomIn}
          className="p-2.5 text-[#2d4938] hover:bg-[#eaf3ee] transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="h-[1px] bg-[#dbe8e0]" />
        <button
          onClick={handleZoomOut}
          className="p-2.5 text-[#2d4938] hover:bg-[#eaf3ee] transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* =========================================================================
          SCALABLE & PANNABLE ISOMETRIC CAMPUS CANVAS (1024 x 682 Base Coordinate Space)
         ========================================================================= */}
      <div
        className="w-full h-full transition-transform duration-75 relative flex items-center justify-center"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: '50% 50%',
        }}
      >
        <div className="relative w-[1024px] h-[682px] shrink-0">
          {/* Main Realistic Illustrated Isometric Campus Map Backdrop */}
          <img
            src={campusAerialBg}
            alt="IIT Madras Aerial Isometric Campus Map"
            className="w-full h-full object-cover rounded-2xl shadow-inner pointer-events-none select-none"
            draggable={false}
          />

          {/* SVG Connector Leader Lines & Building Pins (1024 x 682 ViewBox) */}
          <svg
            viewBox="0 0 1024 682"
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          >
            <defs>
              <filter id="leaderShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.4" />
              </filter>
            </defs>

            {filteredLocations.map((loc) => {
              const studentsHere = getStudentsAtLocation(loc.id);
              const isHovered = hoveredLocationId === loc.id;
              const hasStudents = studentsHere.length > 0;

              // Generate path d string with optional elbow
              let pathD = `M ${loc.lineStart.x} ${loc.lineStart.y}`;
              if (loc.lineElbow) {
                pathD += ` L ${loc.lineElbow.x} ${loc.lineElbow.y}`;
              }
              pathD += ` L ${loc.pinPoint.x} ${loc.pinPoint.y}`;

              return (
                <g key={`leader-${loc.id}`}>
                  {/* Outer shadow/glow when hovered */}
                  {isHovered && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="5"
                      opacity="0.8"
                    />
                  )}

                  {/* Clean white connector line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={isHovered ? 2.8 : 2.0}
                    filter="url(#leaderShadow)"
                  />

                  {/* Building Ground Pin */}
                  {hasStudents && (
                    <circle
                      cx={loc.pinPoint.x}
                      cy={loc.pinPoint.y}
                      r="14"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2.5"
                      className="animate-ping"
                      opacity="0.75"
                    />
                  )}

                  <circle
                    cx={loc.pinPoint.x}
                    cy={loc.pinPoint.y}
                    r={isHovered ? 8 : 6.5}
                    fill="#ffffff"
                    filter="url(#leaderShadow)"
                  />
                  <circle
                    cx={loc.pinPoint.x}
                    cy={loc.pinPoint.y}
                    r={isHovered ? 5 : 4}
                    fill={loc.categoryDotColor}
                  />
                </g>
              );
            })}
          </svg>

          {/* =========================================================================
              FLOATING INTERACTIVE LOCATION CARDS (Reproducing Reference Image 1)
             ========================================================================= */}
          {filteredLocations.map((loc) => {
            const studentsHere = getStudentsAtLocation(loc.id);
            const isHovered = hoveredLocationId === loc.id;
            const hasStudents = studentsHere.length > 0;

            return (
              <div
                key={`card-${loc.id}`}
                onClick={() => onEnterLocation(loc.id)}
                onMouseEnter={() => setHoveredLocationId(loc.id)}
                onMouseLeave={() => setHoveredLocationId(null)}
                className={`absolute interactive-card rounded-2xl bg-[#fffdfa]/95 backdrop-blur-md p-2 shadow-xl border border-white/90 cursor-pointer transition-all duration-200 group ${
                  isHovered ? 'scale-105 shadow-2xl z-30 ring-2 ring-[#2d5a43]' : 'hover:scale-102 z-20'
                }`}
                style={{
                  left: `${loc.cardLeft}px`,
                  top: `${loc.cardTop}px`,
                  width: `${loc.cardWidth}px`,
                }}
                title={`Enter ${loc.name} (${studentsHere.length} studying)`}
              >
                {/* Photographic Interior Thumbnail */}
                <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-100 border border-black/5">
                  <img
                    src={loc.thumbnail}
                    alt={loc.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    draggable={false}
                  />

                  {/* Live Student Occupancy Tag on top-left of photo */}
                  {hasStudents && (
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[9px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>{studentsHere.length} studying</span>
                    </div>
                  )}
                </div>

                {/* Card Bottom Row: Category Dot, Name, and Chevron */}
                <div className="mt-1.5 px-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: loc.categoryDotColor }}
                    />
                    <span className="font-serif-title text-xs font-bold text-[#1b3326] truncate group-hover:text-[#2d5a43] transition-colors">
                      {loc.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {/* Tiny avatar cluster preview if students present */}
                    {hasStudents && (
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {studentsHere.slice(0, 2).map((s) => (
                          <div
                            key={s.sessionId}
                            className="w-4 h-4 rounded-full border border-white overflow-hidden bg-emerald-100 flex items-center justify-center text-[7px]"
                            title={s.name}
                          >
                            <AvatarRenderer config={s.avatarConfig} size="xs" animate={false} />
                          </div>
                        ))}
                      </div>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#2d5a43] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          CAMPUS EXPLORE INFORMATION MODAL
         ========================================================================= */}
      {exploreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#fffdfa] rounded-3xl border border-[#cbe0d3] p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#eaf3ee] border border-[#d2e3d8] flex items-center justify-center text-2xl shadow-inner">
              🏛️
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#416652] bg-[#e2ede6] px-2.5 py-0.5 rounded-full">
                Heritage & Innovation
              </span>
              <h3 className="font-serif-title text-xl font-bold text-[#1e382b] mt-2">
                IIT Madras Virtual Campus
              </h3>
              <p className="text-xs text-[#597364] mt-0.5">
                Explore 630 acres of nature, iconic heritage buildings, and quiet study alcoves.
              </p>
            </div>
            <p className="text-xs text-[#486353] leading-relaxed">
              From the historic Central Library with its vast academic archives to the open-air terraces of the OAT and the ancient Banyan Tree grove, find your ideal sanctuary to study together in real time.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setExploreModalOpen(false)}
                className="w-full py-2.5 bg-[#2d5a43] text-white text-xs font-semibold rounded-xl hover:bg-[#234735] transition-colors cursor-pointer"
              >
                Close Explorer Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
