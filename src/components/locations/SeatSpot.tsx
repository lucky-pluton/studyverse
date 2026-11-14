import React from 'react';
import type { SeatDefinition, StudentPresence } from '../../types/studyverse';
import { AvatarRenderer } from '../common/AvatarRenderer';
import { FloatingSeatTimer } from '../common/TimerBadge';

interface SeatSpotProps {
  seat: SeatDefinition;
  occupant?: StudentPresence;
  isSelf: boolean;
  onSelectSeat: (seatId: string) => void;
}

export const SeatSpot: React.FC<SeatSpotProps> = ({
  seat,
  occupant,
  isSelf,
  onSelectSeat,
}) => {
  const isOccupied = !!occupant;

  const getPoseForSeat = (seatType: string): 'desk' | 'bench' | 'cafe' | 'tree' => {
    switch (seatType) {
      case 'desk':
      case 'window':
        return 'desk';
      case 'table':
      case 'booth':
        return 'cafe';
      case 'bench':
      case 'chair':
      case 'tier':
        return 'bench';
      default:
        return 'tree';
    }
  };

  const handleClick = () => {
    if (isSelf) return; // already here
    onSelectSeat(seat.id);
  };

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center transition-transform"
      style={{
        left: `${seat.x}%`,
        top: `${seat.y}%`,
      }}
    >
      {/* If occupied: Floating timer badge + chibi avatar */}
      {isOccupied && occupant && (
        <div className="relative group cursor-pointer" onClick={handleClick}>
          {/* Floating Seat Timer & Name above avatar */}
          <FloatingSeatTimer
            seatEnteredAt={occupant.seatEnteredAt}
            studentName={occupant.name}
            isSelf={isSelf}
            studyTopic={occupant.studyTopic}
            isDnd={occupant.isDnd}
          />

          {/* Occupant Chibi Avatar with study activity & location pose */}
          <div className="relative flex flex-col items-center">
            <AvatarRenderer
              config={occupant.avatarConfig}
              size="lg"
              isSeated={true}
              pose={getPoseForSeat(seat.type)}
              showProp={true}
              animate={true}
            />

            {/* Subtle highlight ring under avatar */}
            <div
              className={`w-12 h-3 -mt-2 rounded-full blur-2xs ${
                isSelf ? 'bg-[#52796f]/30' : 'bg-[#d8c3b0]/40'
              }`}
            />
          </div>

          {/* Seat Name mini label below avatar */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-5 text-[10px] font-medium text-[#4d4237] bg-[#faf6f0]/95 px-2 py-0.5 rounded shadow-xs whitespace-nowrap pointer-events-none border border-[#e5dcd0] z-20">
            {seat.name}
          </div>
        </div>
      )}

      {/* If available: Interactive sit marker */}
      {!isOccupied && (
        <button
          type="button"
          onClick={handleClick}
          className="group relative flex flex-col items-center justify-center focus:outline-hidden transition-all duration-300"
        >
          {/* Pulsing Target Dot */}
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-[#52796f]/20 group-hover:bg-[#52796f]/40 transition-colors" />
            <div className="relative w-8 h-8 rounded-full bg-[#f6efe6]/90 group-hover:bg-[#52796f] border-2 border-[#84a98c] group-hover:border-[#3d5a52] flex items-center justify-center shadow-md transition-all group-hover:scale-110">
              <span className="text-[11px] font-bold text-[#355348] group-hover:text-white transition-colors">
                +
              </span>
            </div>
          </div>

          {/* Seat Tooltip / Label */}
          <div className="mt-1 px-2 py-0.5 rounded-full bg-[#fffdf9]/95 border border-[#e0d6c8] shadow-xs text-[10px] font-semibold text-[#54483c] whitespace-nowrap group-hover:bg-[#3d5a52] group-hover:text-white group-hover:border-[#2d443e] transition-all">
            {seat.name}
          </div>

          {/* Seat Description on hover */}
          {seat.description && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-0.5 rounded bg-[#2b2724] text-white text-[9px] pointer-events-none whitespace-nowrap z-20 shadow-md">
              Sit here to study
            </div>
          )}
        </button>
      )}
    </div>
  );
};
