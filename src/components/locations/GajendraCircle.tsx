import React from 'react';
import type { LocationDefinition, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { SeatSpot } from './SeatSpot';

interface GajendraCircleProps {
  location: LocationDefinition;
  occupants: StudentPresence[];
  currentUser: StudentPresence;
  onSelectSeat: (seatId: string) => void;
  timeOfDay: TimeOfDay;
}

export const GajendraCircle: React.FC<GajendraCircleProps> = ({
  location,
  occupants,
  currentUser,
  onSelectSeat,
  timeOfDay,
}) => {
  const getOccupant = (seatId: string) => occupants.find((o) => o.seatId === seatId);

  return (
    <div className="relative w-full aspect-[16/10] max-h-[750px] min-h-[520px] rounded-3xl overflow-hidden border-2 border-[#bfdbfe] shadow-2xl bg-gradient-to-b select-none">
      {/* Background Architectural Vector Scenery */}
      <svg
        viewBox="0 0 1000 625"
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="gcSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={timeOfDay === 'night' ? '#0f172a' : timeOfDay === 'sunset' ? '#fde047' : '#dbeafe'} />
            <stop offset="60%" stopColor={timeOfDay === 'night' ? '#1e293b' : timeOfDay === 'sunset' ? '#fb923c' : '#bfdbfe'} />
            <stop offset="100%" stopColor={timeOfDay === 'night' ? '#1e3a5f' : timeOfDay === 'sunset' ? '#f472b6' : '#93c5fd'} />
          </linearGradient>

          <linearGradient id="gcLawn" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={timeOfDay === 'night' ? '#152b1e' : '#86efac'} />
            <stop offset="100%" stopColor={timeOfDay === 'night' ? '#0d1f14' : '#4ade80'} />
          </linearGradient>

          <radialGradient id="gcFountainWater" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="60%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </radialGradient>
        </defs>

        {/* Sky */}
        <rect x="0" y="0" width="1000" height="260" fill="url(#gcSky)" />

        {/* Shady Avenue Canopy Trees Background */}
        <ellipse cx="200" cy="230" rx="260" ry="80" fill="#1e3a2b" opacity="0.85" />
        <ellipse cx="800" cy="230" rx="260" ry="80" fill="#1e3a2b" opacity="0.85" />
        <ellipse cx="500" cy="210" rx="300" ry="70" fill="#2d523e" opacity="0.9" />

        {/* Main Plaza Paving & Lawn */}
        <rect x="0" y="240" width="1000" height="385" fill="#f1f5f9" />

        {/* Circular Asphalt Campus Road Around GC */}
        <circle cx="500" cy="390" r="240" fill="none" stroke="#64748b" strokeWidth="60" />
        <circle cx="500" cy="390" r="240" fill="none" stroke="#f8fafc" strokeWidth="4" strokeDasharray="12,14" />

        {/* Inner Landscaped Garden Island of Gajendra Circle */}
        <circle cx="500" cy="390" r="200" fill="url(#gcLawn)" stroke="#cbd5e1" strokeWidth="8" />

        {/* Flowerbeds in concentric ring */}
        <circle cx="500" cy="390" r="160" fill="none" stroke="#ec4899" strokeWidth="12" strokeDasharray="18,12" opacity="0.85" />

        {/* Central Fountain Pool */}
        <circle cx="500" cy="390" r="110" fill="url(#gcFountainWater)" stroke="#ffffff" strokeWidth="6" />
        <circle cx="500" cy="390" r="70" fill="none" stroke="#bae6fd" strokeWidth="3" opacity="0.7" />
        <circle cx="500" cy="390" r="30" fill="none" stroke="#e0f2fe" strokeWidth="3" opacity="0.8" />

        {/* ICONIC GAJENDRA (ELEPHANT) STATUE MONUMENT */}
        <g transform="translate(500, 390)">
          {/* Stone Plinth */}
          <rect x="-40" y="-30" width="80" height="30" rx="4" fill="#64748b" stroke="#334155" strokeWidth="3" />
          {/* Twin Elephant Silhouettes facing outward */}
          {/* Left Elephant */}
          <g transform="translate(-18, -45) scale(0.8)">
            <ellipse cx="0" cy="0" rx="18" ry="14" fill="#334155" />
            <circle cx="-16" cy="-8" r="9" fill="#334155" />
            {/* Trunk */}
            <path d="M -22 -6 Q -32 -4 -30 10 Q -28 16 -24 12" stroke="#334155" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            {/* Tusk */}
            <path d="M -22 -2 Q -28 4 -26 8" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Legs */}
            <rect x="-14" y="8" width="6" height="15" fill="#334155" />
            <rect x="6" y="8" width="6" height="15" fill="#334155" />
          </g>
          {/* Right Elephant */}
          <g transform="translate(18, -45) scale(-0.8, 0.8)">
            <ellipse cx="0" cy="0" rx="18" ry="14" fill="#334155" />
            <circle cx="-16" cy="-8" r="9" fill="#334155" />
            <path d="M -22 -6 Q -32 -4 -30 10 Q -28 16 -24 12" stroke="#334155" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M -22 -2 Q -28 4 -26 8" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <rect x="-14" y="8" width="6" height="15" fill="#334155" />
            <rect x="6" y="8" width="6" height="15" fill="#334155" />
          </g>

          {/* Central Water Jet */}
          <line x1="0" y1="-30" x2="0" y2="-75" stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round" />
          <path d="M 0 -75 Q -15 -90 -25 -50" stroke="#bae6fd" strokeWidth="2" fill="none" />
          <path d="M 0 -75 Q 15 -90 25 -50" stroke="#bae6fd" strokeWidth="2" fill="none" />
        </g>

        {/* Shaded Rain Trees at Delhi Avenue & Bonn Avenue intersections */}
        <g transform="translate(100, 300)">
          <rect x="-6" y="10" width="12" height="30" fill="#4a3728" />
          <circle cx="0" cy="0" r="45" fill="#15803d" opacity="0.9" />
          <circle cx="-10" cy="-10" r="35" fill="#16a34a" opacity="0.9" />
        </g>
        <g transform="translate(900, 300)">
          <rect x="-6" y="10" width="12" height="30" fill="#4a3728" />
          <circle cx="0" cy="0" r="45" fill="#15803d" opacity="0.9" />
          <circle cx="10" cy="-10" r="35" fill="#16a34a" opacity="0.9" />
        </g>
      </svg>

      {/* Location Badge top-left */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 bg-[#fffdfa]/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-[#bfdbfe] shadow-sm">
        <span className="w-6 h-6 rounded-lg bg-[#1e40af] text-white flex items-center justify-center text-xs">
          🐘
        </span>
        <div>
          <h2 className="font-serif-title text-xs sm:text-sm font-bold text-[#172554] leading-tight">
            {location.name}
          </h2>
          <span className="text-[10px] text-[#2563eb]">
            {occupants.length} student{occupants.length === 1 ? '' : 's'} at the landmark roundabout
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

