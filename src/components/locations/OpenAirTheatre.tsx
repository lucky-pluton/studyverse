import React from 'react';
import type { LocationDefinition, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { SeatSpot } from './SeatSpot';

interface OpenAirTheatreProps {
  location: LocationDefinition;
  occupants: StudentPresence[];
  currentUser: StudentPresence;
  onSelectSeat: (seatId: string) => void;
  timeOfDay: TimeOfDay;
}

export const OpenAirTheatre: React.FC<OpenAirTheatreProps> = ({
  location,
  occupants,
  currentUser,
  onSelectSeat,
  timeOfDay,
}) => {
  const getOccupant = (seatId: string) => occupants.find((o) => o.seatId === seatId);

  return (
    <div className="relative w-full aspect-[16/10] max-h-[750px] min-h-[520px] rounded-3xl overflow-hidden border-2 border-[#cbd5e1] shadow-2xl bg-gradient-to-b select-none">
      {/* Background Architectural Vector Scenery */}
      <svg
        viewBox="0 0 1000 625"
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="oatSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={timeOfDay === 'night' ? '#0b1120' : timeOfDay === 'sunset' ? '#f472b6' : '#bfdbfe'} />
            <stop offset="60%" stopColor={timeOfDay === 'night' ? '#1e293b' : timeOfDay === 'sunset' ? '#fb923c' : '#93c5fd'} />
            <stop offset="100%" stopColor={timeOfDay === 'night' ? '#334155' : timeOfDay === 'sunset' ? '#fde047' : '#dbeafe'} />
          </linearGradient>

          <radialGradient id="oatBowlGrad" cx="50%" cy="100%" r="90%">
            <stop offset="0%" stopColor={timeOfDay === 'night' ? '#1e293b' : '#f1f5f9'} />
            <stop offset="50%" stopColor={timeOfDay === 'night' ? '#334155' : '#cbd5e1'} />
            <stop offset="100%" stopColor={timeOfDay === 'night' ? '#0f172a' : '#94a3b8'} />
          </radialGradient>
        </defs>

        {/* Expansive Open Chennai Sky */}
        <rect x="0" y="0" width="1000" height="280" fill="url(#oatSky)" />

        {/* Twinkling evening stars if night atmosphere */}
        {timeOfDay === 'night' && (
          <g fill="#ffffff" opacity="0.8">
            <circle cx="150" cy="50" r="1.5" />
            <circle cx="280" cy="80" r="1" />
            <circle cx="450" cy="30" r="2" />
            <circle cx="680" cy="70" r="1.5" />
            <circle cx="820" cy="40" r="1" />
            <circle cx="910" cy="90" r="2" />
          </g>
        )}

        {/* Surrounding Tall Rain Trees Framing the Amphitheatre Bowl */}
        <g transform="translate(100, 160)">
          <ellipse cx="0" cy="0" rx="140" ry="80" fill="#1e3a2b" opacity="0.9" />
          <ellipse cx="60" cy="-20" rx="120" ry="70" fill="#2d523e" opacity="0.85" />
        </g>
        <g transform="translate(900, 160)">
          <ellipse cx="0" cy="0" rx="140" ry="80" fill="#1e3a2b" opacity="0.9" />
          <ellipse cx="-60" cy="-20" rx="120" ry="70" fill="#2d523e" opacity="0.85" />
        </g>

        {/* THE FAMOUS STEPPED OAT STONE AMPHITHEATRE BOWL */}
        <g transform="translate(500, 480)">
          {/* Semicircular Terraces (Stepped Tiers) */}
          {/* Top Crest Tier */}
          <path d="M -460 -240 A 460 220 0 0 1 460 -240 L 410 -200 A 410 190 0 0 0 -410 -200 Z" fill="#94a3b8" stroke="#64748b" strokeWidth="3" />
          {/* Mid-Upper Tier */}
          <path d="M -410 -200 A 410 190 0 0 1 410 -200 L 360 -150 A 360 160 0 0 0 -360 -150 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="3" />
          {/* Mid Tier */}
          <path d="M -360 -150 A 360 160 0 0 1 360 -150 L 300 -100 A 300 130 0 0 0 -300 -100 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="3" />
          {/* Lower Tier */}
          <path d="M -300 -100 A 300 130 0 0 1 300 -100 L 230 -50 A 230 100 0 0 0 -230 -50 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="3" />
          {/* Lowest Tier */}
          <path d="M -230 -50 A 230 100 0 0 1 230 -50 L 160 0 A 160 65 0 0 0 -160 0 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" />

          {/* Stepped Aisle Walkways (Radial staircases down the bowl) */}
          <polygon points="-50,-240 -35,-240 -15,0 -30,0" fill="#64748b" opacity="0.35" />
          <polygon points="35,-240 50,-240 30,0 15,0" fill="#64748b" opacity="0.35" />
        </g>

        {/* Center Stage Wooden Floor (Bottom Ground) */}
        <g transform="translate(500, 520)">
          <ellipse cx="0" cy="10" rx="200" ry="40" fill="#784824" stroke="#4a2e16" strokeWidth="3" />
          <line x1="-120" y1="10" x2="120" y2="10" stroke="#4a2e16" strokeWidth="1.5" />
        </g>
      </svg>

      {/* Location Badge top-left */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 bg-[#fffdfa]/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-[#cbd5e1] shadow-sm">
        <span className="w-6 h-6 rounded-lg bg-[#475569] text-white flex items-center justify-center text-xs">
          🎭
        </span>
        <div>
          <h2 className="font-serif-title text-xs sm:text-sm font-bold text-[#1e293b] leading-tight">
            {location.name}
          </h2>
          <span className="text-[10px] text-[#64748b]">
            {occupants.length} student{occupants.length === 1 ? '' : 's'} enjoying open breeze
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

