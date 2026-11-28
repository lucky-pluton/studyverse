import React from 'react';
import type { LocationId, SeatDefinition, StudentPresence } from '../../types/studyverse';
import { AvatarRenderer, type ChibiPose } from '../common/AvatarRenderer';
import { FloatingSeatTimer } from '../common/TimerBadge';
import { DrawnChair } from './DrawnChair';

interface SeatSpotProps {
  seat: SeatDefinition;
  occupant?: StudentPresence;
  isSelf: boolean;
  onSelectSeat: (seatId: string) => void;
  locationId?: LocationId;
}

export const SeatSpot: React.FC<SeatSpotProps> = ({
  seat,
  occupant,
  isSelf,
  onSelectSeat,
  locationId,
}) => {
  const isOccupied = !!occupant;

  const getPoseForSeat = (seatType: string, locId?: LocationId): ChibiPose => {
    if (locId === 'library') return 'library';
    if (locId === 'lhc') return 'lhc';
    if (locId === 'banyan') return 'banyan';
    if (locId === 'oat') return 'oat';
    if (locId === 'cafe') return 'cafe';
    if (locId === 'park') return 'park';
    if (locId === 'gc') return 'gc';

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

  const avatarSize = seat.size || 'md';
  const scale = seat.scale || (avatarSize === 'sm' ? 0.82 : avatarSize === 'lg' ? 1.0 : 0.9);

  return (
    <>
    {/* a chair drawn under seats that have none in the room picture */}
    <DrawnChair seat={seat} />
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center transition-transform z-10 hover:z-20"
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
            status={occupant.status || occupant.avatarConfig?.status}
            isDnd={occupant.isDnd}
          />

          {/* Occupant Chibi Avatar with perspective-aware size & pose */}
          <div
            className="relative flex flex-col items-center"
            style={{ transform: `scale(${scale})`, transformOrigin: 'bottom center' }}
          >
            <AvatarRenderer
              config={occupant.avatarConfig}
              size={avatarSize}
              isSeated={true}
              pose={getPoseForSeat(seat.type, locationId)}
              locationId={locationId}
              showProp={true}
              animate={true}
            />

            {/* Subtle highlight ring under avatar */}
            <div
              className={`w-10 h-2.5 -mt-1.5 rounded-full blur-2xs ${
                isSelf ? 'bg-[#52796f]/40 ring-1 ring-emerald-500/50' : 'bg-[#d8c3b0]/40'
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
          data-seat-id={seat.id}
          onClick={handleClick}
          className="group relative flex flex-col items-center justify-center focus:outline-hidden transition-all duration-300 cursor-pointer"
          style={{ transform: `scale(${scale})` }}
        >
          {/* Pulsing Target Dot */}
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-[#52796f]/25 group-hover:bg-[#52796f]/40 transition-colors" />
            <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#f6efe6]/95 group-hover:bg-[#52796f] border-2 border-[#84a98c] group-hover:border-[#3d5a52] flex items-center justify-center shadow-md transition-all group-hover:scale-110">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#355348] group-hover:text-white transition-colors">
                +
              </span>
            </div>
          </div>

          {/* Seat Tooltip / Label (Appears on Hover/Focus to keep artwork clean & prevent mobile clutter) */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-6 px-2 py-0.5 rounded-full bg-[#fffdf9]/95 border border-[#e0d6c8] shadow-md text-[10px] font-semibold text-[#54483c] whitespace-nowrap pointer-events-none group-hover:bg-[#3d5a52] group-hover:text-white group-hover:border-[#2d443e] z-20">
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
    </>
  );
};
