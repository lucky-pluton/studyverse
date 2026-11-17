import React, { useState, useRef } from 'react';
import type { LocationId, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { LOCATIONS, VERIFIED_IITM_UPCOMING_DESTINATIONS } from '../../constants/locations';
import { LocationAvatarCluster } from './LocationAvatarCluster';
import { LocationPreviewCard } from './LocationPreviewCard';
import { CampusInfoPanel } from './CampusInfoPanel';
import { CampusAvatarAnchor } from './CampusAvatarAnchor';
import { IsometricCampusMapCanvas } from './IsometricCampusMapCanvas';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Lock,
  Compass,
  Layers,
} from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<'isometric' | 'classic'>('isometric');
  const [selectedPreviewLocation, setSelectedPreviewLocation] = useState<LocationId | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [comingSoonModal, setComingSoonModal] = useState<typeof VERIFIED_IITM_UPCOMING_DESTINATIONS[0] | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Group students by location
  const getStudentsAtLocation = (locId: string) =>
    students.filter((s) => s.location === locId);

  const getOccupantCount = (locId: string) =>
    getStudentsAtLocation(locId).length;

  const activeLocationsCount = Object.keys(LOCATIONS).filter(
    (locId) => getOccupantCount(locId) > 0
  ).length;

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.0, z + 0.2));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.8, z - 0.2));
  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Mouse drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.interactive-destination') || (e.target as HTMLElement).closest('.preview-card-container')) return;
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
    <div className="w-full max-w-7xl mx-auto px-4 py-5 space-y-6 animate-in fade-in duration-300">
      {/* Top Campus Welcome Banner & Live Census Bar */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#eaf3ee] via-[#f7f3ec] to-[#e8eee9] p-4 sm:p-5 border-2 border-[#d5e2d9] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 overflow-hidden">
        <div className="absolute right-4 -bottom-8 w-44 h-44 opacity-5 pointer-events-none text-9xl font-serif">
          🏛️
        </div>

        <div className="space-y-1 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#dbe8e0] text-xs font-semibold text-[#294d3a]">
            <Compass className="w-3.5 h-3.5 text-[#24523b]" />
            <span>IIT Madras Virtual Campus</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          </div>

          <h1 className="font-serif-title text-xl sm:text-2xl font-bold text-[#1f3529] tracking-tight">
            Live Campus Occupancy Map, {currentUser.name}.
          </h1>
          <p className="text-xs text-[#506357] max-w-2xl leading-relaxed">
            {students.length <= 1
              ? "You're among the first learners to arrive today. Stroll down Delhi Avenue, settle under the Banyan Tree, or find a quiet desk in the Central Library."
              : `You are studying alongside ${students.length - 1} other student${
                  students.length === 2 ? '' : 's'
                } across ${activeLocationsCount || 1} campus locations. Real-time avatar clusters show where peers are currently focusing.`}
          </p>
        </div>

        {/* Live Campus Telemetry Badge */}
        <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 z-10 w-full sm:w-auto">
          <div className="w-full sm:w-auto px-3.5 py-2 rounded-2xl bg-[#fffdfa] border border-[#ceddd4] shadow-xs flex items-center justify-between sm:justify-end gap-3.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <div className="text-left sm:text-right">
              <span className="block text-[9px] uppercase font-bold text-[#62776a] tracking-wider">
                Online On Campus
              </span>
              <span className="font-serif-title text-base font-bold text-[#1b3326]">
                {students.length} Student{students.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="h-6 w-[1px] bg-[#dce7e1]" />
            <div className="text-left sm:text-right">
              <span className="block text-[9px] uppercase font-bold text-[#62776a] tracking-wider">
                Occupied Spots
              </span>
              <span className="font-serif-title text-base font-bold text-[#2d5a43]">
                {activeLocationsCount} of {Object.keys(LOCATIONS).length}
              </span>
            </div>
            <div className="h-6 w-[1px] bg-[#dce7e1]" />
            <button
              onClick={() => setViewMode(viewMode === 'isometric' ? 'classic' : 'isometric')}
              className="px-3 py-1.5 rounded-xl bg-[#2d5a43] hover:bg-[#1f4231] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Toggle between Isometric Explorer and Classic Map"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">
                {viewMode === 'isometric' ? 'Classic 2D View' : 'Isometric Explorer'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Illustrated Campus Canvas */}
      {viewMode === 'isometric' ? (
        <IsometricCampusMapCanvas
          students={students}
          currentUser={currentUser}
          onEnterLocation={onEnterLocation}
          timeOfDay={timeOfDay}
        />
      ) : (
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`relative w-full h-[78vh] min-h-[580px] max-h-[860px] rounded-3xl overflow-hidden border-2 border-[#c5d8cc] shadow-2xl bg-[#e5efe7] select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
        {/* Floating Zoom & Pan Controls in Top-Right */}
        <div className="absolute top-4 right-4 z-40 flex items-center gap-1.5 bg-[#fffdfa]/95 backdrop-blur-md p-1.5 rounded-2xl border border-[#cbe0d3] shadow-md">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-xl text-[#2f4d3d] hover:bg-[#eaf3ee] transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-xl text-[#2f4d3d] hover:bg-[#eaf3ee] transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-2 rounded-xl text-[#2f4d3d] hover:bg-[#eaf3ee] transition-colors"
            title="Fit Campus View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Live Occupancy Status Pill (Top Left) */}
        <div className="absolute top-4 left-4 z-40 flex items-center gap-2 bg-[#fffdfa]/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-[#cbe0d3] shadow-xs text-xs text-[#30523f]">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-bold text-[#1e3829]">Live Campus Occupancy</span>
          <span className="hidden sm:inline text-[10px] text-[#637d6e]">• Click any spot to preview & join</span>
        </div>

        {/* Scalable & Pannable Campus SVG Scene */}
        <div
          className="w-full h-full transition-transform duration-75 relative"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: '50% 50%',
          }}
        >
          <svg
            viewBox="0 0 1100 650"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="iitmSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={timeOfDay === 'night' ? '#0f172a' : timeOfDay === 'sunset' ? '#fde047' : '#e0f2fe'} />
                <stop offset="60%" stopColor={timeOfDay === 'night' ? '#1e293b' : timeOfDay === 'sunset' ? '#fb923c' : '#bae6fd'} />
                <stop offset="100%" stopColor={timeOfDay === 'night' ? '#142a1f' : timeOfDay === 'sunset' ? '#f472b6' : '#c8e6d2'} />
              </linearGradient>

              <linearGradient id="iitmForestFloor" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={timeOfDay === 'night' ? '#12251a' : '#88c9a3'} />
                <stop offset="100%" stopColor={timeOfDay === 'night' ? '#0a160f' : '#61a37c'} />
              </linearGradient>

              {/* Pulsing occupancy auras for occupied campus spots */}
              <radialGradient id="occupiedAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
                <stop offset="60%" stopColor="#16a34a" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#15803d" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Sky Background */}
            <rect x="0" y="0" width="1100" height="240" fill="url(#iitmSkyGrad)" />

            {/* Distant Forest Ridge of Guindy / IIT Madras Woods */}
            <ellipse cx="250" cy="220" rx="380" ry="70" fill={timeOfDay === 'night' ? '#193325' : '#498864'} opacity="0.9" />
            <ellipse cx="850" cy="220" rx="420" ry="85" fill={timeOfDay === 'night' ? '#142a1f' : '#396d50'} opacity="0.9" />

            {/* Main Verdant Campus Grounds */}
            <rect x="0" y="210" width="1100" height="440" fill="url(#iitmForestFloor)" />

            {/* IIT MADRAS CAMPUS ROAD NETWORK */}
            {/* Delhi Avenue (North down to GC) */}
            <path d="M 550 200 L 550 370" stroke="#f1f5f9" strokeWidth="55" fill="none" />
            <path d="M 550 200 L 550 370" stroke="#64748b" strokeWidth="48" fill="none" />
            <path d="M 550 200 L 550 370" stroke="#f8fafc" strokeWidth="2" strokeDasharray="10,12" />

            {/* Bonn Avenue (West towards Hostels & LHC) */}
            <path d="M 550 370 Q 320 370 100 420" stroke="#f1f5f9" strokeWidth="55" fill="none" />
            <path d="M 550 370 Q 320 370 100 420" stroke="#64748b" strokeWidth="48" fill="none" />
            <path d="M 550 370 Q 320 370 100 420" stroke="#f8fafc" strokeWidth="2" strokeDasharray="10,12" />

            {/* Alumni Avenue (East towards OAT & Chemplast) */}
            <path d="M 550 370 Q 780 370 1050 360" stroke="#f1f5f9" strokeWidth="55" fill="none" />
            <path d="M 550 370 Q 780 370 1050 360" stroke="#64748b" strokeWidth="48" fill="none" />
            <path d="M 550 370 Q 780 370 1050 360" stroke="#f8fafc" strokeWidth="2" strokeDasharray="10,12" />

            {/* South Boulevard to Sangam & Banyan Grove */}
            <path d="M 550 370 Q 560 520 540 650" stroke="#f1f5f9" strokeWidth="55" fill="none" />
            <path d="M 550 370 Q 560 520 540 650" stroke="#64748b" strokeWidth="48" fill="none" />
            <path d="M 550 370 Q 560 520 540 650" stroke="#f8fafc" strokeWidth="2" strokeDasharray="10,12" />

            {/* Internal Shaded Pathways */}
            <path d="M 280 280 Q 280 390 320 480" stroke="#e2d8cb" strokeWidth="24" fill="none" />
            <path d="M 320 480 Q 420 420 500 480" stroke="#e2d8cb" strokeWidth="20" fill="none" />
            <path d="M 500 480 Q 640 460 780 470" stroke="#e2d8cb" strokeWidth="22" fill="none" />
            <path d="M 800 370 Q 820 450 820 490" stroke="#e2d8cb" strokeWidth="20" fill="none" />

            {/* GAJENDRA CIRCLE (GC) ROUNDABOUT (Center Node) */}
            <circle cx="550" cy="370" r="62" fill="#64748b" stroke="#f8fafc" strokeWidth="4" />
            <circle cx="550" cy="370" r="46" fill="#22c55e" stroke="#f1f5f9" strokeWidth="3" />
            <circle cx="550" cy="370" r="34" fill="none" stroke="#ec4899" strokeWidth="4" strokeDasharray="6,6" />
            <g transform="translate(550, 370)">
              <circle cx="0" cy="0" r="14" fill="#334155" />
              <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">GC</text>
            </g>

            {/* Dynamic Occupancy Auras on SVG (Visual indication of student warmth) */}
            {getOccupantCount('library') > 0 && <circle cx="530" cy="180" r="85" fill="url(#occupiedAura)" />}
            {getOccupantCount('lhc') > 0 && <circle cx="260" cy="220" r="85" fill="url(#occupiedAura)" />}
            {getOccupantCount('banyan') > 0 && <circle cx="430" cy="390" r="95" fill="url(#occupiedAura)" />}
            {getOccupantCount('oat') > 0 && <circle cx="830" cy="230" r="85" fill="url(#occupiedAura)" />}
            {getOccupantCount('cafe') > 0 && <circle cx="270" cy="490" r="85" fill="url(#occupiedAura)" />}
            {getOccupantCount('park') > 0 && <circle cx="790" cy="480" r="85" fill="url(#occupiedAura)" />}
            {getOccupantCount('gc') > 0 && <circle cx="640" cy="320" r="85" fill="url(#occupiedAura)" />}

            {/* Lush Shady Campus Trees */}
            {[
              { x: 160, y: 260, r: 28 }, { x: 220, y: 240, r: 24 }, { x: 380, y: 260, r: 26 },
              { x: 440, y: 230, r: 30 }, { x: 660, y: 240, r: 32 }, { x: 740, y: 260, r: 26 },
              { x: 920, y: 250, r: 30 }, { x: 980, y: 280, r: 26 }, { x: 180, y: 460, r: 28 },
              { x: 390, y: 440, r: 32 }, { x: 680, y: 420, r: 30 }, { x: 920, y: 440, r: 32 },
              { x: 350, y: 560, r: 28 }, { x: 680, y: 560, r: 30 }, { x: 880, y: 560, r: 34 },
            ].map((t, idx) => (
              <g key={idx} transform={`translate(${t.x}, ${t.y})`}>
                <rect x="-3" y="10" width="6" height="15" fill="#4a3728" />
                <circle cx="0" cy="0" r={t.r} fill="#15803d" opacity="0.9" />
                <circle cx="-5" cy="-6" r={t.r * 0.75} fill="#22c55e" opacity="0.95" />
              </g>
            ))}

            {/* Spotted Chital Deer & Wildlife */}
            <g transform="translate(420, 290)">
              <ellipse cx="0" cy="0" rx="14" ry="8" fill="#b45309" />
              <circle cx="10" cy="-6" r="4.5" fill="#b45309" />
              <circle cx="-3" cy="-1" r="1" fill="#fff" />
              <circle cx="3" cy="-2" r="1" fill="#fff" />
              <line x1="-7" y1="7" x2="-8" y2="18" stroke="#92400e" strokeWidth="1.8" />
              <line x1="4" y1="7" x2="3" y2="18" stroke="#92400e" strokeWidth="1.8" />
            </g>
            <g transform="translate(430, 480)">
              <ellipse cx="0" cy="0" rx="14" ry="8" fill="#b45309" />
              <circle cx="-10" cy="-6" r="4.5" fill="#b45309" />
              <circle cx="-3" cy="-1" r="1" fill="#fff" />
              <circle cx="3" cy="-2" r="1" fill="#fff" />
              <line x1="-5" y1="7" x2="-4" y2="18" stroke="#92400e" strokeWidth="1.8" />
              <line x1="6" y1="7" x2="5" y2="18" stroke="#92400e" strokeWidth="1.8" />
            </g>
            <g transform="translate(710, 480)">
              <ellipse cx="0" cy="0" rx="15" ry="9" fill="#1f2937" />
              <circle cx="11" cy="-7" r="5" fill="#1f2937" />
              <line x1="11" y1="-10" x2="16" y2="-22" stroke="#475569" strokeWidth="1.5" />
              <line x1="8" y1="-10" x2="12" y2="-22" stroke="#475569" strokeWidth="1.5" />
              <line x1="-7" y1="7" x2="-8" y2="18" stroke="#1f2937" strokeWidth="1.8" />
              <line x1="4" y1="7" x2="3" y2="18" stroke="#1f2937" strokeWidth="1.8" />
            </g>
          </svg>

          {/* =========================================================================
              INTERACTIVE CLICKABLE CAMPUS DESTINATION PINS WITH AVATAR CLUSTERS
             ========================================================================= */}

          {/* 1. CENTRAL LIBRARY (IITM) */}
          <div
            onClick={() => setSelectedPreviewLocation(selectedPreviewLocation === 'library' ? null : 'library')}
            onMouseEnter={() => setHoveredLocation('library')}
            onMouseLeave={() => setHoveredLocation(null)}
            className="interactive-destination absolute top-[23%] left-[48%] -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-[#fffdfa]/95 backdrop-blur-md border shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group flex items-center gap-2 hover:scale-105 z-30"
            style={{
              borderColor: hoveredLocation === 'library' || selectedPreviewLocation === 'library' ? '#2d5a43' : '#cbd5e1',
            }}
          >
            <span className="text-sm">🏛️</span>
            <div className="flex items-center gap-1.5">
              <span className="font-serif-title text-xs font-bold text-[#1f382a] group-hover:text-[#2d5a43]">
                Central Library
              </span>
              <span className="text-[10px] text-[#556e5f] font-medium flex items-center gap-1">
                • <span className={`w-1.5 h-1.5 rounded-full ${getOccupantCount('library') > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-300'}`} />
                <span className="font-semibold text-[#294d3a]">{getOccupantCount('library')} studying</span>
              </span>
            </div>

            {getStudentsAtLocation('library').length > 0 && (
              <LocationAvatarCluster students={getStudentsAtLocation('library')} maxVisible={2} />
            )}

            {/* PREVIEW POPOVER (Desktop Hover / Mobile Click) */}
            {(hoveredLocation === 'library' || selectedPreviewLocation === 'library') && (
              <div className="preview-card-container absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
                <LocationPreviewCard
                  location={LOCATIONS.library}
                  students={getStudentsAtLocation('library')}
                  onEnter={() => onEnterLocation('library')}
                  onClose={() => setSelectedPreviewLocation(null)}
                />
              </div>
            )}
          </div>

          {/* 2. LECTURE HALL COMPLEX (LHC & Classrooms) */}
          <div
            onClick={() => setSelectedPreviewLocation(selectedPreviewLocation === 'lhc' ? null : 'lhc')}
            onMouseEnter={() => setHoveredLocation('lhc')}
            onMouseLeave={() => setHoveredLocation(null)}
            className="interactive-destination absolute top-[27%] left-[23%] -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-[#fffdfa]/95 backdrop-blur-md border shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group flex items-center gap-2 hover:scale-105 z-30"
            style={{
              borderColor: hoveredLocation === 'lhc' || selectedPreviewLocation === 'lhc' ? '#784824' : '#cbd5e1',
            }}
          >
            <span className="text-sm">🎓</span>
            <div className="flex items-center gap-1.5">
              <span className="font-serif-title text-xs font-bold text-[#442c1c] group-hover:text-[#784824]">
                Lecture Hall
              </span>
              <span className="text-[10px] text-[#715440] font-medium flex items-center gap-1">
                • <span className={`w-1.5 h-1.5 rounded-full ${getOccupantCount('lhc') > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-300'}`} />
                <span className="font-semibold text-[#442c1c]">{getOccupantCount('lhc')} studying</span>
              </span>
            </div>

            {getStudentsAtLocation('lhc').length > 0 && (
              <LocationAvatarCluster students={getStudentsAtLocation('lhc')} maxVisible={2} />
            )}

            {/* PREVIEW POPOVER */}
            {(hoveredLocation === 'lhc' || selectedPreviewLocation === 'lhc') && (
              <div className="preview-card-container absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
                <LocationPreviewCard
                  location={LOCATIONS.lhc}
                  students={getStudentsAtLocation('lhc')}
                  onEnter={() => onEnterLocation('lhc')}
                  onClose={() => setSelectedPreviewLocation(null)}
                />
              </div>
            )}
          </div>

          {/* 3. THE GRAND BANYAN TREE STUDY GROVE */}
          <div
            onClick={() => setSelectedPreviewLocation(selectedPreviewLocation === 'banyan' ? null : 'banyan')}
            onMouseEnter={() => setHoveredLocation('banyan')}
            onMouseLeave={() => setHoveredLocation(null)}
            className="interactive-destination absolute top-[51%] left-[39%] -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-[#fffdfa]/95 backdrop-blur-md border shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group flex items-center gap-2 hover:scale-105 z-30"
            style={{
              borderColor: hoveredLocation === 'banyan' || selectedPreviewLocation === 'banyan' ? '#365338' : '#cbd5e1',
            }}
          >
            <span className="text-sm">🌳</span>
            <div className="flex items-center gap-1.5">
              <span className="font-serif-title text-xs font-bold text-[#1e3822] group-hover:text-[#365338]">
                Banyan Tree
              </span>
              <span className="text-[10px] text-[#486b4e] font-medium flex items-center gap-1">
                • <span className={`w-1.5 h-1.5 rounded-full ${getOccupantCount('banyan') > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-300'}`} />
                <span className="font-semibold text-[#1e3822]">{getOccupantCount('banyan')} studying</span>
              </span>
            </div>

            {getStudentsAtLocation('banyan').length > 0 && (
              <LocationAvatarCluster students={getStudentsAtLocation('banyan')} maxVisible={2} />
            )}

            {/* PREVIEW POPOVER */}
            {(hoveredLocation === 'banyan' || selectedPreviewLocation === 'banyan') && (
              <div className="preview-card-container absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                <LocationPreviewCard
                  location={LOCATIONS.banyan}
                  students={getStudentsAtLocation('banyan')}
                  onEnter={() => onEnterLocation('banyan')}
                  onClose={() => setSelectedPreviewLocation(null)}
                />
              </div>
            )}
          </div>

          {/* 4. OPEN AIR THEATRE (OAT) */}
          <div
            onClick={() => setSelectedPreviewLocation(selectedPreviewLocation === 'oat' ? null : 'oat')}
            onMouseEnter={() => setHoveredLocation('oat')}
            onMouseLeave={() => setHoveredLocation(null)}
            className="interactive-destination absolute top-[29%] left-[76%] -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-[#fffdfa]/95 backdrop-blur-md border shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group flex items-center gap-2 hover:scale-105 z-30"
            style={{
              borderColor: hoveredLocation === 'oat' || selectedPreviewLocation === 'oat' ? '#475569' : '#cbd5e1',
            }}
          >
            <span className="text-sm">🎭</span>
            <div className="flex items-center gap-1.5">
              <span className="font-serif-title text-xs font-bold text-[#1e293b] group-hover:text-[#475569]">
                Open Air Theatre
              </span>
              <span className="text-[10px] text-[#64748b] font-medium flex items-center gap-1">
                • <span className={`w-1.5 h-1.5 rounded-full ${getOccupantCount('oat') > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-300'}`} />
                <span className="font-semibold text-[#1e293b]">{getOccupantCount('oat')} studying</span>
              </span>
            </div>

            {getStudentsAtLocation('oat').length > 0 && (
              <LocationAvatarCluster students={getStudentsAtLocation('oat')} maxVisible={2} />
            )}

            {/* PREVIEW POPOVER */}
            {(hoveredLocation === 'oat' || selectedPreviewLocation === 'oat') && (
              <div className="preview-card-container absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
                <LocationPreviewCard
                  location={LOCATIONS.oat}
                  students={getStudentsAtLocation('oat')}
                  onEnter={() => onEnterLocation('oat')}
                  onClose={() => setSelectedPreviewLocation(null)}
                />
              </div>
            )}
          </div>

          {/* 5. CAMPUS CAFÉ (HIMALAYA) */}
          <div
            onClick={() => setSelectedPreviewLocation(selectedPreviewLocation === 'cafe' ? null : 'cafe')}
            onMouseEnter={() => setHoveredLocation('cafe')}
            onMouseLeave={() => setHoveredLocation(null)}
            className="interactive-destination absolute top-[69%] left-[24%] -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-[#fffdfa]/95 backdrop-blur-md border shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group flex items-center gap-2 hover:scale-105 z-30"
            style={{
              borderColor: hoveredLocation === 'cafe' || selectedPreviewLocation === 'cafe' ? '#845328' : '#cbd5e1',
            }}
          >
            <span className="text-sm">☕</span>
            <div className="flex items-center gap-1.5">
              <span className="font-serif-title text-xs font-bold text-[#442817] group-hover:text-[#845328]">
                Campus Café
              </span>
              <span className="text-[10px] text-[#785b48] font-medium flex items-center gap-1">
                • <span className={`w-1.5 h-1.5 rounded-full ${getOccupantCount('cafe') > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-300'}`} />
                <span className="font-semibold text-[#442817]">{getOccupantCount('cafe')} studying</span>
              </span>
            </div>

            {getStudentsAtLocation('cafe').length > 0 && (
              <LocationAvatarCluster students={getStudentsAtLocation('cafe')} maxVisible={2} />
            )}

            {/* PREVIEW POPOVER */}
            {(hoveredLocation === 'cafe' || selectedPreviewLocation === 'cafe') && (
              <div className="preview-card-container absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                <LocationPreviewCard
                  location={LOCATIONS.cafe}
                  students={getStudentsAtLocation('cafe')}
                  onEnter={() => onEnterLocation('cafe')}
                  onClose={() => setSelectedPreviewLocation(null)}
                />
              </div>
            )}
          </div>

          {/* 6. SANGAM GARDENS & DEER TRAIL */}
          <div
            onClick={() => setSelectedPreviewLocation(selectedPreviewLocation === 'park' ? null : 'park')}
            onMouseEnter={() => setHoveredLocation('park')}
            onMouseLeave={() => setHoveredLocation(null)}
            className="interactive-destination absolute top-[67%] left-[72%] -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-[#fffdfa]/95 backdrop-blur-md border shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group flex items-center gap-2 hover:scale-105 z-30"
            style={{
              borderColor: hoveredLocation === 'park' || selectedPreviewLocation === 'park' ? '#2f6044' : '#cbd5e1',
            }}
          >
            <span className="text-sm">🦌</span>
            <div className="flex items-center gap-1.5">
              <span className="font-serif-title text-xs font-bold text-[#1b3d2b] group-hover:text-[#2f6044]">
                Sangam Gardens
              </span>
              <span className="text-[10px] text-[#4f6e5c] font-medium flex items-center gap-1">
                • <span className={`w-1.5 h-1.5 rounded-full ${getOccupantCount('park') > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-300'}`} />
                <span className="font-semibold text-[#1b3d2b]">{getOccupantCount('park')} studying</span>
              </span>
            </div>

            {getStudentsAtLocation('park').length > 0 && (
              <LocationAvatarCluster students={getStudentsAtLocation('park')} maxVisible={2} />
            )}

            {/* PREVIEW POPOVER */}
            {(hoveredLocation === 'park' || selectedPreviewLocation === 'park') && (
              <div className="preview-card-container absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                <LocationPreviewCard
                  location={LOCATIONS.park}
                  students={getStudentsAtLocation('park')}
                  onEnter={() => onEnterLocation('park')}
                  onClose={() => setSelectedPreviewLocation(null)}
                />
              </div>
            )}
          </div>

          {/* 7. GAJENDRA CIRCLE (GC) PAVILION */}
          <div
            onClick={() => setSelectedPreviewLocation(selectedPreviewLocation === 'gc' ? null : 'gc')}
            onMouseEnter={() => setHoveredLocation('gc')}
            onMouseLeave={() => setHoveredLocation(null)}
            className="interactive-destination absolute top-[43%] left-[58%] -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-[#fffdfa]/95 backdrop-blur-md border shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group flex items-center gap-2 hover:scale-105 z-30"
            style={{
              borderColor: hoveredLocation === 'gc' || selectedPreviewLocation === 'gc' ? '#1e40af' : '#cbd5e1',
            }}
          >
            <span className="text-sm">🐘</span>
            <div className="flex items-center gap-1.5">
              <span className="font-serif-title text-xs font-bold text-[#172554] group-hover:text-[#1e40af]">
                Gajendra Circle
              </span>
              <span className="text-[10px] text-[#2563eb] font-medium flex items-center gap-1">
                • <span className={`w-1.5 h-1.5 rounded-full ${getOccupantCount('gc') > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-300'}`} />
                <span className="font-semibold text-[#172554]">{getOccupantCount('gc')} studying</span>
              </span>
            </div>

            {getStudentsAtLocation('gc').length > 0 && (
              <LocationAvatarCluster students={getStudentsAtLocation('gc')} maxVisible={2} />
            )}

            {/* PREVIEW POPOVER */}
            {(hoveredLocation === 'gc' || selectedPreviewLocation === 'gc') && (
              <div className="preview-card-container absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
                <LocationPreviewCard
                  location={LOCATIONS.gc}
                  students={getStudentsAtLocation('gc')}
                  onEnter={() => onEnterLocation('gc')}
                  onClose={() => setSelectedPreviewLocation(null)}
                />
              </div>
            )}
          </div>

          {/* UPCOMING VERIFIED IITM DESTINATIONS (Chemplast, SAC, Aerospace, Hostels) */}
          {VERIFIED_IITM_UPCOMING_DESTINATIONS.map((dest, i) => {
            const positions = [
              { top: '16%', left: '86%' },
              { top: '20%', left: '12%' },
              { top: '82%', left: '46%' },
              { top: '80%', left: '90%' },
            ];
            const pos = positions[i];

            return (
              <button
                key={dest.id}
                onClick={() => setComingSoonModal(dest)}
                className="interactive-destination absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-2xl bg-[#fffdfa]/95 backdrop-blur-xs border border-[#ceddd4] shadow-sm hover:scale-110 transition-all cursor-pointer group flex items-center gap-1.5 text-left z-20"
                style={{ top: pos.top, left: pos.left }}
                title={`${dest.name} (${dest.badge})`}
              >
                <div className="w-7 h-7 rounded-xl bg-[#e8f1ec] flex items-center justify-center text-xs text-[#416351]">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div className="hidden lg:block pr-1">
                  <span className="text-[10px] font-bold text-[#2d493a] block line-clamp-1">
                    {dest.name}
                  </span>
                  <span className="text-[8px] text-[#6b8577] font-medium uppercase tracking-wider">
                    {dest.badge}
                  </span>
                </div>
              </button>
            );
          })}

          {/* =========================================================================
              VISUALLY ANCHORED ACTUAL STUDENT AVATARS DIRECTLY ON THE CAMPUS GROUNDS
             ========================================================================= */}
          <CampusAvatarAnchor
            locationId="library"
            locationName="Central Library"
            students={getStudentsAtLocation('library')}
            onOpenLocation={() => onEnterLocation('library')}
            anchorCoords={{ top: '34%', left: '48%' }}
          />

          <CampusAvatarAnchor
            locationId="lhc"
            locationName="Lecture Hall Complex"
            students={getStudentsAtLocation('lhc')}
            onOpenLocation={() => onEnterLocation('lhc')}
            anchorCoords={{ top: '38%', left: '23%' }}
          />

          <CampusAvatarAnchor
            locationId="banyan"
            locationName="Banyan Tree Study Grove"
            students={getStudentsAtLocation('banyan')}
            onOpenLocation={() => onEnterLocation('banyan')}
            anchorCoords={{ top: '64%', left: '39%' }}
          />

          <CampusAvatarAnchor
            locationId="oat"
            locationName="Open Air Theatre"
            students={getStudentsAtLocation('oat')}
            onOpenLocation={() => onEnterLocation('oat')}
            anchorCoords={{ top: '40%', left: '76%' }}
          />

          <CampusAvatarAnchor
            locationId="cafe"
            locationName="Campus Café"
            students={getStudentsAtLocation('cafe')}
            onOpenLocation={() => onEnterLocation('cafe')}
            anchorCoords={{ top: '80%', left: '24%' }}
          />

          <CampusAvatarAnchor
            locationId="park"
            locationName="Sangam Gardens"
            students={getStudentsAtLocation('park')}
            onOpenLocation={() => onEnterLocation('park')}
            anchorCoords={{ top: '78%', left: '72%' }}
          />

          <CampusAvatarAnchor
            locationId="gc"
            locationName="Gajendra Circle"
            students={getStudentsAtLocation('gc')}
            onOpenLocation={() => onEnterLocation('gc')}
            anchorCoords={{ top: '54%', left: '58%' }}
          />
        </div>
      </div>
      )}

      {/* LIVE CAMPUS INFORMATION PANEL & WHERE EVERYONE IS STUDYING */}
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
