import React from 'react';
import type { LocationDefinition, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { SeatSpot } from './SeatSpot';

interface BanyanTreeGroveProps {
  location: LocationDefinition;
  occupants: StudentPresence[];
  currentUser: StudentPresence;
  onSelectSeat: (seatId: string) => void;
  timeOfDay: TimeOfDay;
}

export const BanyanTreeGrove: React.FC<BanyanTreeGroveProps> = ({
  location,
  occupants,
  currentUser,
  onSelectSeat,
  timeOfDay,
}) => {
  const getOccupant = (seatId: string) => occupants.find((o) => o.seatId === seatId);

  return (
    <div className="relative w-full aspect-[16/10] max-h-[750px] min-h-[520px] rounded-3xl overflow-hidden border-2 border-[#b8d4c2] shadow-2xl bg-gradient-to-b select-none">
      {/* Background Architectural Vector Scenery */}
      <svg
        viewBox="0 0 1000 625"
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="banyanSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={timeOfDay === 'night' ? '#0f172a' : timeOfDay === 'sunset' ? '#fde047' : '#e0f2fe'} />
            <stop offset="60%" stopColor={timeOfDay === 'night' ? '#1e293b' : timeOfDay === 'sunset' ? '#fb923c' : '#bae6fd'} />
            <stop offset="100%" stopColor={timeOfDay === 'night' ? '#142a1f' : timeOfDay === 'sunset' ? '#f472b6' : '#dcfce7'} />
          </linearGradient>

          <linearGradient id="banyanGrass" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={timeOfDay === 'night' ? '#15291e' : '#94c9ad'} />
            <stop offset="100%" stopColor={timeOfDay === 'night' ? '#0d1a13' : '#5e9476'} />
          </linearGradient>

          <radialGradient id="sunbeamGlow" cx="50%" cy="0%" r="90%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity={timeOfDay === 'night' ? '0.05' : '0.45'} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sky */}
        <rect x="0" y="0" width="1000" height="240" fill="url(#banyanSky)" />

        {/* Shady Green Glade & Lawn */}
        <rect x="0" y="220" width="1000" height="405" fill="url(#banyanGrass)" />

        {/* Winding Clay & Gravel Footpath */}
        <path
          d="M 100 625 Q 350 480 500 480 Q 650 480 900 625"
          stroke="#e2d8cb"
          strokeWidth="90"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 100 625 Q 350 480 500 480 Q 650 480 900 625"
          stroke="#c7b9a5"
          strokeWidth="80"
          fill="none"
          strokeDasharray="4,6"
          opacity="0.5"
        />

        {/* Circular Stone Plinth surrounding the Banyan Base */}
        <ellipse cx="500" cy="330" rx="260" ry="70" fill="#d6cebe" stroke="#b0a390" strokeWidth="6" />
        <ellipse cx="500" cy="326" rx="240" ry="62" fill="#ede6d8" />

        {/* THE GRAND BANYAN TREE (Centerpiece) */}
        <g transform="translate(500, 290)">
          {/* Main Massive Ancient Trunk */}
          <path
            d="M -70 40 Q -90 -60 -40 -160 Q 0 -220 40 -160 Q 90 -60 70 40 Z"
            fill="#4a3525"
          />
          {/* Bark grooves and texture */}
          <path d="M -30 35 Q -40 -50 -20 -140" stroke="#332419" strokeWidth="4" fill="none" />
          <path d="M 0 38 Q 10 -40 5 -150" stroke="#332419" strokeWidth="5" fill="none" />
          <path d="M 30 35 Q 40 -50 20 -140" stroke="#332419" strokeWidth="4" fill="none" />

          {/* Cascading Aerial Prop Roots dropping to ground */}
          {/* Left prop roots */}
          <path d="M -160 -80 Q -180 0 -190 40" stroke="#5a4231" strokeWidth="12" fill="none" strokeLinecap="round" />
          <path d="M -120 -100 Q -130 -10 -135 40" stroke="#4d3727" strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M -80 -120 Q -95 -20 -90 40" stroke="#3e2b1d" strokeWidth="9" fill="none" strokeLinecap="round" />
          {/* Right prop roots */}
          <path d="M 80 -120 Q 95 -20 90 40" stroke="#3e2b1d" strokeWidth="9" fill="none" strokeLinecap="round" />
          <path d="M 120 -100 Q 130 -10 135 40" stroke="#4d3727" strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M 160 -80 Q 180 0 190 40" stroke="#5a4231" strokeWidth="12" fill="none" strokeLinecap="round" />

          {/* Immense Shady Leaf Canopies */}
          <circle cx="-200" cy="-140" r="110" fill="#2d4f3b" opacity="0.9" />
          <circle cx="200" cy="-140" r="110" fill="#2d4f3b" opacity="0.9" />
          <circle cx="-100" cy="-190" r="125" fill="#38634a" opacity="0.95" />
          <circle cx="100" cy="-190" r="125" fill="#38634a" opacity="0.95" />
          <circle cx="0" cy="-220" r="140" fill="#437759" opacity="0.95" />
          {/* Sunlit top highlights */}
          <circle cx="-60" cy="-240" r="80" fill="#52916c" opacity="0.8" />
          <circle cx="60" cy="-240" r="80" fill="#5ea37a" opacity="0.8" />

          {/* Dappled Sunbeams filtering through foliage */}
          <polygon points="-80,-150 -10,-150 60,60 -30,60" fill="url(#sunbeamGlow)" />
          <polygon points="40,-160 100,-160 180,60 90,60" fill="url(#sunbeamGlow)" />

          {/* Friendly singing bird on a bough */}
          <g transform="translate(130, -110)">
            <ellipse cx="0" cy="0" rx="7" ry="5" fill="#f59e0b" />
            <circle cx="6" cy="-3" r="3.5" fill="#f59e0b" />
            <polygon points="9,-3 14,-2 9,-1" fill="#ea580c" />
            <ellipse cx="-4" cy="2" rx="6" ry="2.5" fill="#d97706" />
          </g>
        </g>

        {/* Spotted Chital Deer Resting peacefully under distant glade trees */}
        <g transform="translate(140, 220)">
          {/* Mother Chital Deer */}
          <ellipse cx="0" cy="0" rx="22" ry="12" fill="#b45309" />
          <circle cx="18" cy="-8" r="7" fill="#b45309" />
          {/* White spots */}
          <circle cx="-6" cy="-2" r="1.5" fill="#ffffff" />
          <circle cx="2" cy="-4" r="1.5" fill="#ffffff" />
          <circle cx="10" cy="-2" r="1.5" fill="#ffffff" />
          {/* Slender legs tucked */}
          <path d="M -15 10 Q -10 20 5 18" stroke="#92400e" strokeWidth="3" fill="none" />
          <path d="M 12 10 Q 18 20 22 18" stroke="#92400e" strokeWidth="3" fill="none" />
          {/* Cute deer ears */}
          <polygon points="18,-15 15,-8 21,-8" fill="#b45309" />
        </g>

        {/* Rustic Timber Picnic Study Table on bottom-left */}
        <g transform="translate(260, 480)">
          <polygon points="-50,0 50,0 60,18 -60,18" fill="#784824" stroke="#4a2e16" strokeWidth="2.5" />
          <rect x="-40" y="18" width="10" height="25" fill="#3b2311" />
          <rect x="30" y="18" width="10" height="25" fill="#3b2311" />
        </g>

        {/* Scattered tropical ferns & fallen banyan leaves on lawn */}
        <g transform="translate(80, 520)">
          <ellipse cx="0" cy="0" rx="8" ry="4" fill="#a16207" transform="rotate(25)" />
          <ellipse cx="25" cy="10" rx="9" ry="4" fill="#65a30d" transform="rotate(-35)" />
          <ellipse cx="15" cy="-10" rx="7" ry="3.5" fill="#854d0e" transform="rotate(10)" />
        </g>
        <g transform="translate(900, 500)">
          <ellipse cx="0" cy="0" rx="8" ry="4" fill="#a16207" transform="rotate(-15)" />
          <ellipse cx="-20" cy="15" rx="9" ry="4" fill="#65a30d" transform="rotate(40)" />
        </g>
      </svg>

      {/* Location Badge top-left */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 bg-[#fffdfa]/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-[#c1d9c9] shadow-sm">
        <span className="w-6 h-6 rounded-lg bg-[#365338] text-white flex items-center justify-center text-xs">
          🌳
        </span>
        <div>
          <h2 className="font-serif-title text-xs sm:text-sm font-bold text-[#1f3822] leading-tight">
            {location.name}
          </h2>
          <span className="text-[10px] text-[#4f6e52]">
            {occupants.length} student{occupants.length === 1 ? '' : 's'} under the shady canopy
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

