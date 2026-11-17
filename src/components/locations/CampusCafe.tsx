import React from 'react';
import type { LocationDefinition, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { SeatSpot } from './SeatSpot';

interface CampusCafeProps {
  location: LocationDefinition;
  occupants: StudentPresence[];
  currentUser: StudentPresence;
  onSelectSeat: (seatId: string) => void;
  timeOfDay: TimeOfDay;
}

export const CampusCafe: React.FC<CampusCafeProps> = ({
  location,
  occupants,
  currentUser,
  onSelectSeat,
  timeOfDay,
}) => {
  const getOccupant = (seatId: string) => occupants.find((o) => o.seatId === seatId);

  return (
    <div className="relative w-full aspect-[16/10] max-h-[750px] min-h-[520px] rounded-3xl overflow-hidden border-2 border-[#e6dbc8] shadow-2xl bg-gradient-to-b select-none">
      {/* Background Architectural Vector Scenery */}
      <svg
        viewBox="0 0 1000 625"
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="cafeWallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={timeOfDay === 'night' ? '#2d1e18' : '#e8cfbd'} />
            <stop offset="100%" stopColor={timeOfDay === 'night' ? '#1f140f' : '#cbab94'} />
          </linearGradient>

          <linearGradient id="cafeFloorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={timeOfDay === 'night' ? '#2c1e18' : '#a87852'} />
            <stop offset="100%" stopColor={timeOfDay === 'night' ? '#180f0b' : '#734d31'} />
          </linearGradient>

          <radialGradient id="edisonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fde047" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Back Wall */}
        <rect x="0" y="0" width="1000" height="360" fill="url(#cafeWallGrad)" />

        {/* Warm Wooden Floor */}
        <polygon points="0,360 1000,360 1000,625 0,625" fill="url(#cafeFloorGrad)" />
        <line x1="150" y1="360" x2="0" y2="625" stroke="rgba(0,0,0,0.18)" strokeWidth="2" />
        <line x1="350" y1="360" x2="220" y2="625" stroke="rgba(0,0,0,0.18)" strokeWidth="2" />
        <line x1="650" y1="360" x2="720" y2="625" stroke="rgba(0,0,0,0.18)" strokeWidth="2" />
        <line x1="850" y1="360" x2="1000" y2="625" stroke="rgba(0,0,0,0.18)" strokeWidth="2" />

        {/* Hanging Warm Festoon Lights */}
        <path d="M 0 30 Q 250 80 500 35 Q 750 80 1000 30" stroke="#4a3728" strokeWidth="2" fill="none" />
        {[100, 250, 400, 600, 750, 900].map((x, i) => (
          <g key={i} transform={`translate(${x}, ${50 + (i % 2) * 15})`}>
            <line x1="0" y1="-20" x2="0" y2="0" stroke="#4a3728" strokeWidth="1.5" />
            <circle cx="0" cy="5" r="5" fill="#fef08a" />
            <circle cx="0" cy="5" r="28" fill="url(#edisonGlow)" />
          </g>
        ))}

        {/* Left Garden Window Looking onto Lush Campus Greenery */}
        <g transform="translate(40, 60)">
          <rect x="0" y="0" width="280" height="240" rx="8" fill={timeOfDay === 'night' ? '#1a232b' : '#cce5ff'} stroke="#6b4c35" strokeWidth="6" />
          <line x1="140" y1="0" x2="140" y2="240" stroke="#6b4c35" strokeWidth="4" />
          <line x1="0" y1="120" x2="280" y2="120" stroke="#6b4c35" strokeWidth="4" />
          <circle cx="60" cy="110" r="35" fill="#4ade80" opacity="0.6" />
          <circle cx="210" cy="100" r="40" fill="#22c55e" opacity="0.5" />
          <rect x="-10" y="235" width="300" height="24" rx="3" fill="#805433" stroke="#543722" strokeWidth="2" />
        </g>

        {/* Right Veranda with Striped Canvas Awning */}
        <g transform="translate(720, 60)">
          <polygon points="-15,0 275,0 260,35 -30,35" fill="#c2593f" />
          <polygon points="15,0 60,0 45,35 0,35" fill="#fdfbf7" />
          <polygon points="90,0 135,0 120,35 75,35" fill="#fdfbf7" />
          <polygon points="165,0 210,0 195,35 150,35" fill="#fdfbf7" />
          <polygon points="240,0 275,0 260,35 225,35" fill="#fdfbf7" />
          <rect x="0" y="35" width="240" height="210" fill={timeOfDay === 'night' ? '#17202a' : '#d2ebd9'} stroke="#6b4c35" strokeWidth="5" />
          <line x1="120" y1="35" x2="120" y2="245" stroke="#6b4c35" strokeWidth="3" />
        </g>

        {/* Center Filter Coffee Barista Counter & Blackboard Menu */}
        <g transform="translate(390, 80)">
          <rect x="25" y="0" width="170" height="95" rx="4" fill="#2d3748" stroke="#8b5e3c" strokeWidth="4" />
          <text x="110" y="22" textAnchor="middle" fill="#fef08a" fontSize="10" fontFamily="serif" fontWeight="bold">
            HIMALAYA CAMPUS CAFÉ
          </text>
          <line x1="45" y1="28" x2="175" y2="28" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />
          <text x="45" y="44" fill="#fff" fontSize="8" fontFamily="sans-serif">Filter Coffee (Degree) ... ₹20</text>
          <text x="45" y="58" fill="#fff" fontSize="8" fontFamily="sans-serif">Masala Chai .............. ₹15</text>
          <text x="45" y="72" fill="#fff" fontSize="8" fontFamily="sans-serif">Samosa / Puffs ........... ₹25</text>
          <text x="45" y="86" fill="#86efac" fontSize="7" fontFamily="sans-serif">✦ Quiet Study & Revisions Welcome</text>

          {/* Steaming Coffee / Brass Dabara Set */}
          <rect x="20" y="145" width="45" height="40" rx="4" fill="#ca8a04" stroke="#854d0e" strokeWidth="2" />
          {/* Steam wisps */}
          <path d="M 30 135 Q 26 125 30 115" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none" className="animate-steam" />
          <path d="M 50 133 Q 54 123 50 113" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none" className="animate-steam" style={{ animationDelay: '0.8s' }} />

          <rect x="0" y="185" width="220" height="45" rx="3" fill="#784824" stroke="#4a2e16" strokeWidth="3" />
        </g>

        {/* Center Marble Table (Seat 5) */}
        <g transform="translate(520, 390)">
          <ellipse cx="0" cy="0" rx="55" ry="20" fill="#f8fafc" stroke="#94a3b8" strokeWidth="3" />
          <line x1="0" y1="20" x2="0" y2="80" stroke="#334155" strokeWidth="6" />
          <ellipse cx="0" cy="80" rx="25" ry="8" fill="#334155" />
          <rect x="-6" y="-18" width="12" height="18" rx="2" fill="#15803d" />
        </g>
      </svg>

      {/* Location Badge top-left */}
      <div className="sv-location-badge absolute top-4 left-4 z-20 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl">
        <span className="w-6 h-6 rounded-lg bg-[#845328] text-white flex items-center justify-center text-xs">
          ☕
        </span>
        <div>
          <h2 className="font-serif-title text-xs sm:text-sm font-bold text-[#2a241f] leading-tight">
            {location.name}
          </h2>
          <span className="text-[10px] text-[#716557]">
            {occupants.length} student{occupants.length === 1 ? '' : 's'} enjoying filter coffee
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

