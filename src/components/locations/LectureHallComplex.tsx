import React from 'react';
import type { LocationDefinition, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { SeatSpot } from './SeatSpot';

interface LectureHallComplexProps {
  location: LocationDefinition;
  occupants: StudentPresence[];
  currentUser: StudentPresence;
  onSelectSeat: (seatId: string) => void;
  timeOfDay: TimeOfDay;
}

export const LectureHallComplex: React.FC<LectureHallComplexProps> = ({
  location,
  occupants,
  currentUser,
  onSelectSeat,
  timeOfDay,
}) => {
  const getOccupant = (seatId: string) => occupants.find((o) => o.seatId === seatId);

  return (
    <div className="relative w-full aspect-[16/10] max-h-[750px] min-h-[520px] rounded-3xl overflow-hidden border-2 border-[#d9cdbe] shadow-2xl bg-gradient-to-b select-none">
      {/* Background Architectural Vector Scenery */}
      <svg
        viewBox="0 0 1000 625"
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="lhcWallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={timeOfDay === 'night' ? '#211e1c' : '#f0e6dc'} />
            <stop offset="100%" stopColor={timeOfDay === 'night' ? '#141210' : '#decbbe'} />
          </linearGradient>

          <linearGradient id="lhcFloorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={timeOfDay === 'night' ? '#292522' : '#9c7353'} />
            <stop offset="100%" stopColor={timeOfDay === 'night' ? '#181513' : '#69482d'} />
          </linearGradient>

          <pattern id="brickWallPattern" width="30" height="15" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="30" y2="0" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
            <line x1="0" y1="7.5" x2="30" y2="7.5" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
            <line x1="15" y1="0" x2="15" y2="7.5" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
            <line x1="0" y1="7.5" x2="0" y2="15" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
            <line x1="30" y1="7.5" x2="30" y2="15" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Back Wall */}
        <rect x="0" y="0" width="1000" height="340" fill="url(#lhcWallGrad)" />
        <rect x="0" y="0" width="1000" height="340" fill="url(#brickWallPattern)" />

        {/* Sloped Tiered Amphitheatre Floor */}
        <polygon points="0,340 1000,340 1000,625 0,625" fill="url(#lhcFloorGrad)" />
        <line x1="120" y1="340" x2="0" y2="625" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
        <line x1="320" y1="340" x2="180" y2="625" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
        <line x1="680" y1="340" x2="820" y2="625" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
        <line x1="880" y1="340" x2="1000" y2="625" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />

        {/* Tier Steps */}
        <polygon points="0,440 1000,440 1000,455 0,455" fill="rgba(0,0,0,0.15)" />
        <polygon points="0,540 1000,540 1000,555 0,555" fill="rgba(0,0,0,0.15)" />

        {/* Large Lecture Chalkboard with Math / Physics Formulas */}
        <g transform="translate(250, 40)">
          <rect x="0" y="0" width="500" height="150" rx="8" fill="#1e3a2f" stroke="#784824" strokeWidth="6" />
          {/* Wooden Chalkboard Tray */}
          <rect x="-10" y="150" width="520" height="10" rx="2" fill="#58351b" />
          {/* Chalk pieces */}
          <rect x="180" y="148" width="16" height="4" rx="1" fill="#ffffff" />
          <rect x="210" y="148" width="14" height="4" rx="1" fill="#fef08a" />
          {/* Mathematical equations written on blackboard */}
          <text x="30" y="38" fill="#e2e8f0" fontSize="14" fontFamily="serif" fontWeight="bold">
            IITM LHC • LECTURE THEATRE 1
          </text>
          <text x="30" y="65" fill="#a7f3d0" fontSize="12" fontFamily="monospace">
            ∫ e^(-x²) dx = √π/2   |   ∇ × B = μ₀J + μ₀ε₀(∂E/∂t)
          </text>
          <text x="30" y="90" fill="#fef08a" fontSize="11" fontFamily="monospace">
            Eigenvalues: det(A - λI) = 0   ⟹   Deep Study Revision
          </text>
          <text x="30" y="115" fill="#cbd5e1" fontSize="11" fontFamily="monospace">
            HΨ = EΨ   |   Semester Exam Prep • Quiet Class in Session
          </text>
          <text x="30" y="135" fill="#6ee7b7" fontSize="9" fontFamily="sans-serif">
            ✦ Welcome all students • Keep personal study momentum
          </text>
        </g>

        {/* Left Windows to CRC Courtyard */}
        <g transform="translate(35, 60)">
          <rect x="0" y="0" width="160" height="220" rx="6" fill={timeOfDay === 'night' ? '#141e24' : '#d2e9f8'} stroke="#58351b" strokeWidth="5" />
          <line x1="80" y1="0" x2="80" y2="220" stroke="#58351b" strokeWidth="3" />
          <line x1="0" y1="110" x2="160" y2="110" stroke="#58351b" strokeWidth="3" />
          {/* Campus Gulmohar & rain tree outside */}
          <circle cx="50" cy="90" r="40" fill="#ef4444" opacity="0.6" />
          <circle cx="110" cy="80" r="45" fill="#22c55e" opacity="0.6" />
        </g>

        {/* Right Classroom Glass Partition (CRC-101) */}
        <g transform="translate(805, 60)">
          <rect x="0" y="0" width="160" height="220" rx="6" fill={timeOfDay === 'night' ? '#141e24' : '#d2e9f8'} stroke="#58351b" strokeWidth="5" />
          <line x1="80" y1="0" x2="80" y2="220" stroke="#58351b" strokeWidth="3" />
          <line x1="0" y1="110" x2="160" y2="110" stroke="#58351b" strokeWidth="3" />
          <circle cx="70" cy="90" r="45" fill="#16a34a" opacity="0.6" />
        </g>

        {/* Front Lecture Row Desks (Tier 1) */}
        {[
          { x: 200, y: 250 }, { x: 380, y: 250 }, { x: 560, y: 250 },
        ].map((desk, idx) => (
          <g key={idx} transform={`translate(${desk.x}, ${desk.y})`}>
            <rect x="0" y="30" width="140" height="34" rx="4" fill="#784824" stroke="#4a2e16" strokeWidth="2.5" />
            <rect x="10" y="64" width="8" height="25" fill="#2c1e14" />
            <rect x="122" y="64" width="8" height="25" fill="#2c1e14" />
            {/* Textbook & pen on desk */}
            <rect x="25" y="34" width="30" height="8" rx="1" fill="#3b82f6" />
            <rect x="80" y="34" width="32" height="7" rx="1" fill="#f8fafc" />
          </g>
        ))}

        {/* Mid Lecture Row Desks (Tier 2) */}
        {[
          { x: 140, y: 400 }, { x: 380, y: 400 }, { x: 620, y: 400 },
        ].map((desk, idx) => (
          <g key={idx} transform={`translate(${desk.x}, ${desk.y})`}>
            <rect x="0" y="30" width="160" height="38" rx="4" fill="#693e1e" stroke="#3b2311" strokeWidth="2.5" />
            <rect x="12" y="68" width="10" height="30" fill="#26170d" />
            <rect x="138" y="68" width="10" height="30" fill="#26170d" />
            <rect x="35" y="35" width="35" height="10" rx="1" fill="#e2e8f0" />
            <rect x="90" y="35" width="35" height="9" rx="1" fill="#f59e0b" />
          </g>
        ))}

        {/* Wall Clock above chalkboard */}
        <g transform="translate(500, 25)">
          <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#334155" strokeWidth="2" />
          <line x1="0" y1="0" x2="0" y2="-8" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="0" y1="0" x2="5" y2="2" stroke="#0f172a" strokeWidth="1.5" />
        </g>
      </svg>

      {/* Location Badge top-left */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 bg-[#fffdfa]/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-[#decbb7] shadow-sm">
        <span className="w-6 h-6 rounded-lg bg-[#784824] text-white flex items-center justify-center text-xs">
          🎓
        </span>
        <div>
          <h2 className="font-serif-title text-xs sm:text-sm font-bold text-[#352012] leading-tight">
            {location.name}
          </h2>
          <span className="text-[10px] text-[#715440]">
            {occupants.length} student{occupants.length === 1 ? '' : 's'} preparing lectures
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

