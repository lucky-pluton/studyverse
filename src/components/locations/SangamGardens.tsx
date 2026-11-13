import React from 'react';
import type { LocationDefinition, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { SeatSpot } from './SeatSpot';

interface SangamGardensProps {
  location: LocationDefinition;
  occupants: StudentPresence[];
  currentUser: StudentPresence;
  onSelectSeat: (seatId: string) => void;
  timeOfDay: TimeOfDay;
}

export const SangamGardens: React.FC<SangamGardensProps> = ({
  location,
  occupants,
  currentUser,
  onSelectSeat,
  timeOfDay,
}) => {
  const getOccupant = (seatId: string) => occupants.find((o) => o.seatId === seatId);

  return (
    <div className="relative w-full aspect-[16/10] max-h-[750px] min-h-[520px] rounded-3xl overflow-hidden border-2 border-[#bbf7d0] shadow-2xl bg-gradient-to-b select-none">
      {/* Background Architectural Vector Scenery */}
      <svg
        viewBox="0 0 1000 625"
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="sangamSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={timeOfDay === 'night' ? '#111827' : timeOfDay === 'sunset' ? '#fbcfe8' : '#e0f2fe'} />
            <stop offset="100%" stopColor={timeOfDay === 'night' ? '#1f2937' : timeOfDay === 'sunset' ? '#fdba74' : '#bae6fd'} />
          </linearGradient>

          <linearGradient id="sangamLawn" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={timeOfDay === 'night' ? '#14291e' : '#86efac'} />
            <stop offset="100%" stopColor={timeOfDay === 'night' ? '#0d1d15' : '#4ade80'} />
          </linearGradient>

          <radialGradient id="lotusPondGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#bae6fd" />
            <stop offset="70%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </radialGradient>
        </defs>

        {/* Sky */}
        <rect x="0" y="0" width="1000" height="230" fill="url(#sangamSky)" />

        {/* Distant Forest Green Canopy of IIT Madras Woods */}
        <ellipse cx="200" cy="230" rx="360" ry="75" fill={timeOfDay === 'night' ? '#1e382b' : '#2d5a3e'} opacity="0.9" />
        <ellipse cx="750" cy="230" rx="420" ry="85" fill={timeOfDay === 'night' ? '#193025' : '#1e462f'} opacity="0.9" />

        {/* Main Sangam Lawn */}
        <rect x="0" y="220" width="1000" height="405" fill="url(#sangamLawn)" />

        {/* Winding Cobblestone Walkway */}
        <path
          d="M 500 220 Q 420 340 500 440 Q 560 520 500 625"
          stroke="#e2e8f0"
          strokeWidth="110"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 500 220 Q 420 340 500 440 Q 560 520 500 625"
          stroke="#cbd5e1"
          strokeWidth="102"
          fill="none"
          strokeDasharray="4,6"
          opacity="0.5"
        />

        {/* Central Fountain Pool */}
        <circle cx="500" cy="350" r="100" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="8" />
        <g transform="translate(500, 350)">
          <ellipse cx="0" cy="0" rx="60" ry="26" fill="url(#lotusPondGrad)" stroke="#f8fafc" strokeWidth="4" />
          <ellipse cx="0" cy="0" rx="40" ry="16" fill="none" stroke="#e0f2fe" strokeWidth="1.5" opacity="0.7" />
          <rect x="-8" y="-35" width="16" height="35" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
          <ellipse cx="0" cy="-35" rx="24" ry="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
          <path d="M 0 -35 Q -18 -60 -25 -20" stroke="#7dd3fc" strokeWidth="2" fill="none" />
          <path d="M 0 -35 Q 18 -60 25 -20" stroke="#7dd3fc" strokeWidth="2" fill="none" />
        </g>

        {/* Flame-of-the-Forest Gulmohar Tree (Left) */}
        <g transform="translate(180, 240)">
          <path d="M 0 100 Q 15 40 -15 -10 Q 10 -40 0 -80 Q -25 30 -10 100 Z" fill="#583c27" />
          <circle cx="-50" cy="-70" r="55" fill="#ef4444" opacity="0.9" />
          <circle cx="20" cy="-90" r="65" fill="#f87171" opacity="0.85" />
          <circle cx="-10" cy="-120" r="50" fill="#dc2626" opacity="0.9" />
          <circle cx="60" cy="-60" r="45" fill="#fca5a5" opacity="0.85" />
          {/* Falling scarlet gulmohar petals */}
          <ellipse cx="-20" cy="0" rx="4" ry="2" fill="#ef4444" transform="rotate(25)" />
          <ellipse cx="30" cy="20" rx="4" ry="2" fill="#ef4444" transform="rotate(-35)" />
          <ellipse cx="-40" cy="50" rx="4" ry="2" fill="#dc2626" transform="rotate(15)" />
        </g>

        {/* Gentle Free-Roaming Spotted Chital Deer Family (IIT Madras Wildlife) */}
        <g transform="translate(780, 260)">
          {/* Chital Deer 1 */}
          <ellipse cx="0" cy="0" rx="24" ry="14" fill="#b45309" />
          <circle cx="20" cy="-10" r="8" fill="#b45309" />
          <polygon points="20,-18 17,-10 24,-10" fill="#b45309" />
          {/* White spots */}
          <circle cx="-8" cy="-2" r="1.5" fill="#ffffff" />
          <circle cx="0" cy="-4" r="1.5" fill="#ffffff" />
          <circle cx="8" cy="-2" r="1.5" fill="#ffffff" />
          <circle cx="14" cy="-5" r="1.5" fill="#ffffff" />
          {/* Slender legs */}
          <line x1="-12" y1="12" x2="-14" y2="35" stroke="#92400e" strokeWidth="2.5" />
          <line x1="-4" y1="12" x2="-2" y2="35" stroke="#92400e" strokeWidth="2.5" />
          <line x1="8" y1="12" x2="6" y2="35" stroke="#92400e" strokeWidth="2.5" />
          <line x1="16" y1="12" x2="18" y2="35" stroke="#92400e" strokeWidth="2.5" />

          {/* Fawn / Baby Chital Deer */}
          <g transform="translate(-40, 10) scale(0.65)">
            <ellipse cx="0" cy="0" rx="22" ry="13" fill="#d97706" />
            <circle cx="18" cy="-8" r="7" fill="#d97706" />
            <polygon points="18,-15 15,-8 21,-8" fill="#d97706" />
            <circle cx="-6" cy="-2" r="1.5" fill="#ffffff" />
            <circle cx="2" cy="-4" r="1.5" fill="#ffffff" />
            <line x1="-10" y1="10" x2="-12" y2="30" stroke="#b45309" strokeWidth="2.5" />
            <line x1="10" y1="10" x2="12" y2="30" stroke="#b45309" strokeWidth="2.5" />
          </g>
        </g>

        {/* Koi / Lotus Pond on Bottom Left */}
        <g transform="translate(110, 410)">
          <ellipse cx="0" cy="0" rx="65" ry="35" fill="#0284c7" opacity="0.75" stroke="#94a3b8" strokeWidth="6" />
          <circle cx="-25" cy="-8" r="9" fill="#15803d" />
          <circle cx="15" cy="8" r="11" fill="#16a34a" />
          <ellipse cx="-5" cy="5" rx="6" ry="2.5" fill="#ea580c" />
        </g>
      </svg>

      {/* Location Badge top-left */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 bg-[#fffdfa]/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-[#bbf7d0] shadow-sm">
        <span className="w-6 h-6 rounded-lg bg-[#2f6044] text-white flex items-center justify-center text-xs">
          🦌
        </span>
        <div>
          <h2 className="font-serif-title text-xs sm:text-sm font-bold text-[#1a402d] leading-tight">
            {location.name}
          </h2>
          <span className="text-[10px] text-[#3e7053]">
            {occupants.length} student{occupants.length === 1 ? '' : 's'} studying alongside nature
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

