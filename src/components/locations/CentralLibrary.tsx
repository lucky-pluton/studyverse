import React from 'react';
import type { LocationDefinition, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { SeatSpot } from './SeatSpot';

interface CentralLibraryProps {
  location: LocationDefinition;
  occupants: StudentPresence[];
  currentUser: StudentPresence;
  onSelectSeat: (seatId: string) => void;
  timeOfDay: TimeOfDay;
}

export const CentralLibrary: React.FC<CentralLibraryProps> = ({
  location,
  occupants,
  currentUser,
  onSelectSeat,
  timeOfDay,
}) => {
  const getOccupant = (seatId: string) => occupants.find((o) => o.seatId === seatId);

  return (
    <div className="relative w-full aspect-[16/10] max-h-[750px] min-h-[520px] rounded-3xl overflow-hidden border-2 border-[#c5d6cc] shadow-2xl bg-gradient-to-b select-none">
      {/* Background Architectural Vector Scenery */}
      <svg
        viewBox="0 0 1000 625"
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="iitmLibWallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={timeOfDay === 'night' ? '#18241f' : '#e6ede8'} />
            <stop offset="100%" stopColor={timeOfDay === 'night' ? '#101a16' : '#d2dfd6'} />
          </linearGradient>

          <linearGradient id="iitmLibFloorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={timeOfDay === 'night' ? '#211e1b' : '#b28e6c'} />
            <stop offset="100%" stopColor={timeOfDay === 'night' ? '#141210' : '#886242'} />
          </linearGradient>

          <radialGradient id="iitmBankerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#86efac" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#22c55e" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#15803d" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="iitmSunbeam" cx="50%" cy="0%" r="90%">
            <stop offset="0%" stopColor="#fef3c7" stopOpacity={timeOfDay === 'night' ? '0.06' : '0.45'} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Back Wall */}
        <rect x="0" y="0" width="1000" height="375" fill="url(#iitmLibWallGrad)" />

        {/* Polished Teak Wood Floor */}
        <polygon points="0,375 1000,375 1000,625 0,625" fill="url(#iitmLibFloorGrad)" />
        <line x1="200" y1="375" x2="0" y2="625" stroke="rgba(0,0,0,0.12)" strokeWidth="2" />
        <line x1="400" y1="375" x2="250" y2="625" stroke="rgba(0,0,0,0.12)" strokeWidth="2" />
        <line x1="600" y1="375" x2="750" y2="625" stroke="rgba(0,0,0,0.12)" strokeWidth="2" />
        <line x1="800" y1="375" x2="1000" y2="625" stroke="rgba(0,0,0,0.12)" strokeWidth="2" />

        {/* IIT Madras Central Library Wall Banner */}
        <g transform="translate(500, 35)">
          <rect x="-140" y="0" width="280" height="36" rx="10" fill="#2d5a43" stroke="#1d3d2c" strokeWidth="2" />
          <text x="0" y="23" textAnchor="middle" fill="#f0fdf4" fontSize="13" fontFamily="serif" fontWeight="bold" letterSpacing="1">
            IIT MADRAS • CENTRAL LIBRARY
          </text>
        </g>

        {/* Left Double-Height Window with Shady Rain Trees & Spotted Deer */}
        <g transform="translate(50, 60)">
          <rect x="0" y="0" width="160" height="280" rx="8" fill={timeOfDay === 'night' ? '#142028' : '#d8eff8'} stroke="#44594c" strokeWidth="6" />
          <line x1="80" y1="0" x2="80" y2="280" stroke="#44594c" strokeWidth="3" />
          <line x1="0" y1="90" x2="160" y2="90" stroke="#44594c" strokeWidth="3" />
          <line x1="0" y1="180" x2="160" y2="180" stroke="#44594c" strokeWidth="3" />
          {/* Outdoor lush tree canopy visible through window */}
          <circle cx="50" cy="110" r="45" fill="#4ade80" opacity="0.6" />
          <circle cx="110" cy="100" r="50" fill="#22c55e" opacity="0.5" />
          {/* Gentle deer silhouette grazing outside */}
          <ellipse cx="65" cy="245" rx="14" ry="8" fill="#a16207" opacity="0.7" />
          <circle cx="78" cy="238" r="5" fill="#a16207" opacity="0.7" />
          <line x1="60" y1="250" x2="58" y2="265" stroke="#a16207" strokeWidth="2" opacity="0.7" />
          <line x1="70" y1="250" x2="72" y2="265" stroke="#a16207" strokeWidth="2" opacity="0.7" />
          {/* Sunbeam pouring onto desk */}
          <polygon points="0,90 160,90 260,460 0,460" fill="url(#iitmSunbeam)" />
        </g>

        {/* Right Double-Height Window */}
        <g transform="translate(790, 60)">
          <rect x="0" y="0" width="160" height="280" rx="8" fill={timeOfDay === 'night' ? '#142028' : '#d8eff8'} stroke="#44594c" strokeWidth="6" />
          <line x1="80" y1="0" x2="80" y2="280" stroke="#44594c" strokeWidth="3" />
          <line x1="0" y1="90" x2="160" y2="90" stroke="#44594c" strokeWidth="3" />
          <line x1="0" y1="180" x2="160" y2="180" stroke="#44594c" strokeWidth="3" />
          <circle cx="50" cy="110" r="45" fill="#22c55e" opacity="0.5" />
          <circle cx="110" cy="100" r="50" fill="#16a34a" opacity="0.6" />
          <polygon points="0,90 160,90 180,460 -40,460" fill="url(#iitmSunbeam)" />
        </g>

        {/* Center Modern Tiered Bookshelves */}
        <g transform="translate(250, 90)">
          {/* Main Bookcase Structure */}
          <rect x="0" y="0" width="500" height="240" rx="6" fill="#452f1e" stroke="#2e1f13" strokeWidth="4" />
          {/* Shelves */}
          {[60, 120, 180].map((y, i) => (
            <line key={i} x1="0" y1={y} x2="500" y2={y} stroke="#2e1f13" strokeWidth="4" />
          ))}
          {/* Vertical dividers */}
          {[125, 250, 375].map((x, i) => (
            <line key={i} x1={x} y1="0" x2={x} y2="240" stroke="#2e1f13" strokeWidth="3" />
          ))}
          {/* Books row 1 */}
          {[
            { c: '#dc2626', w: 14, h: 46 }, { c: '#2563eb', w: 16, h: 48 }, { c: '#16a34a', w: 12, h: 42 },
            { c: '#d97706', w: 18, h: 47 }, { c: '#9333ea', w: 14, h: 44 }, { c: '#0891b2', w: 15, h: 49 },
            { c: '#e11d48', w: 12, h: 43 }, { c: '#65a30d', w: 16, h: 46 }, { c: '#475569', w: 13, h: 45 },
          ].map((b, idx) => (
            <rect key={idx} x={15 + idx * 14} y={60 - b.h} width={b.w} height={b.h} rx="1" fill={b.c} />
          ))}
          {/* Books row 2 */}
          {[
            { c: '#475569', w: 16, h: 46 }, { c: '#0284c7', w: 13, h: 49 }, { c: '#b45309', w: 17, h: 44 },
            { c: '#059669', w: 14, h: 47 }, { c: '#e11d48', w: 15, h: 43 }, { c: '#7c3aed', w: 12, h: 45 },
            { c: '#ea580c', w: 16, h: 48 }, { c: '#1d4ed8', w: 14, h: 42 },
          ].map((b, idx) => (
            <rect key={idx} x={140 + idx * 15} y={120 - b.h} width={b.w} height={b.h} rx="1" fill={b.c} />
          ))}
          {/* Books row 3 */}
          {[
            { c: '#0d9488', w: 15, h: 47 }, { c: '#d97706', w: 13, h: 43 }, { c: '#3b82f6', w: 16, h: 49 },
            { c: '#dc2626', w: 14, h: 45 }, { c: '#16a34a', w: 12, h: 46 }, { c: '#8b5cf6', w: 15, h: 44 },
          ].map((b, idx) => (
            <rect key={idx} x={270 + idx * 15} y={180 - b.h} width={b.w} height={b.h} rx="1" fill={b.c} />
          ))}
        </g>

        {/* Study Cubicle Desks Row (Middle Tier) */}
        {[
          { x: 130, y: 240 }, { x: 330, y: 240 }, { x: 570, y: 240 }, { x: 770, y: 240 },
        ].map((desk, idx) => (
          <g key={idx} transform={`translate(${desk.x}, ${desk.y})`}>
            {/* Walnut Cubicle Panel */}
            <rect x="0" y="30" width="100" height="35" rx="3" fill="#69482f" stroke="#4a311e" strokeWidth="2" />
            <rect x="0" y="10" width="8" height="30" fill="#4a311e" />
            <rect x="92" y="10" width="8" height="30" fill="#4a311e" />
            {/* Emerald Banker Lamp */}
            <ellipse cx="50" cy="22" rx="13" ry="5.5" fill="#15803d" stroke="#166534" strokeWidth="1" />
            <line x1="50" y1="22" x2="50" y2="30" stroke="#ca8a04" strokeWidth="2.5" />
            <circle cx="50" cy="22" r="32" fill="url(#iitmBankerGlow)" />
          </g>
        ))}

        {/* Long Shared Teak Table in Foreground */}
        <g transform="translate(280, 455)">
          <polygon points="0,25 440,25 460,65 -20,65" fill="#583c27" stroke="#3b2718" strokeWidth="3" />
          <rect x="15" y="65" width="22" height="65" fill="#3b2718" />
          <rect x="405" y="65" width="22" height="65" fill="#3b2718" />
          {/* Table blotters / study stationery */}
          <rect x="60" y="32" width="70" height="24" rx="2" fill="#d6c7b2" opacity="0.7" />
          <rect x="185" y="32" width="70" height="24" rx="2" fill="#d6c7b2" opacity="0.7" />
          <rect x="310" y="32" width="70" height="24" rx="2" fill="#d6c7b2" opacity="0.7" />
        </g>

        {/* Potted Areca Palms in corners */}
        <g transform="translate(18, 360)">
          <polygon points="12,65 38,65 32,100 18,100" fill="#b45309" />
          <circle cx="25" cy="45" r="20" fill="#15803d" />
          <circle cx="15" cy="30" r="15" fill="#22c55e" />
          <circle cx="38" cy="35" r="16" fill="#16a34a" />
        </g>
        <g transform="translate(940, 360)">
          <polygon points="12,65 38,65 32,100 18,100" fill="#b45309" />
          <circle cx="25" cy="45" r="20" fill="#15803d" />
          <circle cx="15" cy="30" r="15" fill="#22c55e" />
          <circle cx="38" cy="35" r="16" fill="#16a34a" />
        </g>
      </svg>

      {/* Location Badge top-left */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 bg-[#fffdfa]/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-[#c2d6ca] shadow-sm">
        <span className="w-6 h-6 rounded-lg bg-[#2d5a43] text-white flex items-center justify-center text-xs">
          🏛️
        </span>
        <div>
          <h2 className="font-serif-title text-xs sm:text-sm font-bold text-[#1a3829] leading-tight">
            {location.name}
          </h2>
          <span className="text-[10px] text-[#4f6e5b]">
            {occupants.length} student{occupants.length === 1 ? '' : 's'} in deep focus
          </span>
        </div>
      </div>

      {/* Seats Placement Grid */}
      <div className="absolute inset-0 z-30">
        {location.seats.map((seat) => {
          const occupant = getOccupant(seat.id);
          const isSelf = occupant?.sessionId === currentUser.sessionId;

          return (
            <SeatSpot
              key={seat.id}
              seat={seat}
              occupant={occupant}
              isSelf={isSelf}
              onSelectSeat={onSelectSeat}
            />
          );
        })}
      </div>
    </div>
  );
};

