import React from 'react';
import type { SeatDefinition } from '../../types/studyverse';

/** where the cushion's top sits, as a fraction of the chair's height from the top */
const CUSHION_TOP = 0.34;

// colours sampled from the reading-room chairs in env_library.jpg
const BLUE = '#5e7fb2';
const BLUE_SHADE = '#4c6a97';
const BLUE_EDGE = '#596d8f';
const OUTLINE = '#3d5680';
const WOOD = '#dcae7c';
const WOOD_SHADE = '#c08f5e';

/**
 * A blue upholstered library chair seen from the side, drawn under a seat that has no chair in
 * the room picture (for example at the end of a reading table). It sits behind the seat marker
 * and the seated avatar.
 */
export const DrawnChair: React.FC<{ seat: SeatDefinition }> = ({ seat }) => {
  const chair = seat.chair;
  if (!chair) return null;
  const flip = chair.facing === 'right';
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 60 100"
      preserveAspectRatio="none"
      className="absolute pointer-events-none z-[5]"
      style={{
        left: `${seat.x - chair.width / 2}%`,
        top: `${seat.y - chair.height * CUSHION_TOP}%`,
        width: `${chair.width}%`,
        height: `${chair.height}%`,
        overflow: 'visible',
      }}
    >
      {/* drawn facing left (backrest on the right); mirrored when the sitter faces right */}
      <g transform={flip ? 'translate(60 0) scale(-1 1)' : undefined}>
        <ellipse cx="30" cy="98.5" rx="28" ry="2.6" fill="rgba(60, 45, 30, 0.12)" />
        {/* legs and stretcher */}
        <rect x="45" y="44" width="6" height="55" rx="1.5" fill={WOOD_SHADE} />
        <rect x="8" y="46" width="6.5" height="53" rx="1.5" fill={WOOD} stroke={WOOD_SHADE} strokeWidth="0.7" />
        <rect x="12" y="76" width="35" height="3.2" rx="1.2" fill={WOOD_SHADE} />
        {/* seat apron */}
        <rect x="6" y="44" width="46" height="6.5" rx="1.6" fill={WOOD} stroke={WOOD_SHADE} strokeWidth="0.7" />
        {/* backrest, leaning back slightly */}
        <path d="M41 47 L40 9 Q40 2 47 2 L50 2 Q57 2 57 9 L56 47 Z" fill={BLUE} stroke={OUTLINE} strokeWidth="1" />
        <path d="M52.5 8 L52 43" stroke={BLUE_SHADE} strokeWidth="3" strokeLinecap="round" />
        {/* cushion with its darker front edge */}
        <rect x="3" y="31.5" width="52" height="14.5" rx="6.5" fill={BLUE} stroke={OUTLINE} strokeWidth="1" />
        <rect x="4.5" y="39.5" width="49" height="5.5" rx="2.7" fill={BLUE_EDGE} />
      </g>
    </svg>
  );
};
