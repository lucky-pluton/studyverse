import React, { useState, useRef } from 'react';
import type { LocationDefinition, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { SeatSpot } from './SeatSpot';
import { ArrowLeft, MessageSquare, Moon, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

import envLibrary from '../../assets/environments/env_library.jpg';
import envLhc from '../../assets/environments/env_lhc.jpg';
import envCafe from '../../assets/environments/env_cafe.jpg';
import envBanyan from '../../assets/environments/env_banyan.jpg';
import envOat from '../../assets/environments/env_oat.jpg';
import envSangam from '../../assets/environments/env_sangam.jpg';
import envGc from '../../assets/environments/env_gc.jpg';

const ENV_IMAGES: Record<string, string> = {
  library: envLibrary,
  lhc: envLhc,
  cafe: envCafe,
  banyan: envBanyan,
  oat: envOat,
  park: envSangam,
  gc: envGc,
};

const ASPECT_CLASSES: Record<string, string> = {
  library: 'aspect-[244/275] max-w-xl sm:max-w-2xl',
  lhc: 'aspect-[244/275] max-w-xl sm:max-w-2xl',
  banyan: 'aspect-[244/275] max-w-xl sm:max-w-2xl',
  oat: 'aspect-[244/275] max-w-xl sm:max-w-2xl',
  cafe: 'aspect-[323/265] max-w-2xl sm:max-w-3xl',
  park: 'aspect-[325/265] max-w-2xl sm:max-w-3xl',
  gc: 'aspect-[325/265] max-w-2xl sm:max-w-3xl',
};

interface UnifiedLocationEnvironmentProps {
  location: LocationDefinition;
  occupants: StudentPresence[];
  currentUser: StudentPresence;
  onSelectSeat: (seatId: string) => void;
  timeOfDay: TimeOfDay;
  onBackToCampus?: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
  onToggleDnd?: () => void;
  isDnd?: boolean;
}

export const UnifiedLocationEnvironment: React.FC<UnifiedLocationEnvironmentProps> = ({
  location,
  occupants,
  currentUser,
  onSelectSeat,
  timeOfDay,
  onBackToCampus,
  onToggleChat,
  isChatOpen = false,
  onToggleDnd,
  isDnd = false,
}) => {
  const [roomZoom, setRoomZoom] = useState<number>(1);
  const [roomPan, setRoomPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const openSeatsCount = Math.max(0, location.seats.length - occupants.length);
  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';
  const bgImage = ENV_IMAGES[location.id] || envLibrary;
  const aspectClass = ASPECT_CLASSES[location.id] || 'aspect-[4/3] max-w-4xl';

  // Room zoom handlers
  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRoomZoom((z) => Math.min(1.8, Number((z + 0.2).toFixed(2))));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRoomZoom((z) => {
      const next = Math.max(1.0, Number((z - 0.2).toFixed(2)));
      if (next <= 1.05) {
        setRoomPan({ x: 0, y: 0 });
        return 1.0;
      }
      return next;
    });
  };

  const handleResetZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRoomZoom(1);
    setRoomPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setRoomZoom((z) => {
      const next = Math.min(1.8, Math.max(1.0, Number((z + delta).toFixed(2))));
      if (next <= 1.05) {
        setRoomPan({ x: 0, y: 0 });
        return 1.0;
      }
      return next;
    });
  };

  // Mouse pan handlers when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (roomZoom <= 1) return;
    if ((e.target as HTMLElement).closest('button, [data-seat-id]')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - roomPan.x, y: e.clientY - roomPan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const maxPan = (roomZoom - 1) * 250;
    const newX = Math.min(maxPan, Math.max(-maxPan, e.clientX - dragStart.x));
    const newY = Math.min(maxPan, Math.max(-maxPan, e.clientY - dragStart.y));
    setRoomPan({ x: newX, y: newY });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full mx-auto ${aspectClass} rounded-3xl overflow-hidden border-2 border-[#d5e2d9] shadow-2xl bg-white select-none ${
        roomZoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
      }`}
    >
      {/* Transformable Inner Room Viewport for Pan & Zoom */}
      <div
        className="w-full h-full relative origin-center transition-transform duration-200 ease-out"
        style={{
          transform: `translate(${roomPan.x}px, ${roomPan.y}px) scale(${roomZoom})`,
        }}
      >
        {/* 1. Environment Illustration Artwork */}
        <img
          src={bgImage}
          alt={location.name}
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
          style={{ imageRendering: '-webkit-optimize-contrast' }}
        />

        {/* 2. Atmospheric Time-of-Day Overlays */}
        {isSunset && (
          <div className="absolute inset-0 pointer-events-none bg-amber-500/10 mix-blend-color-burn" />
        )}
        {isNight && (
          <div className="absolute inset-0 pointer-events-none bg-slate-950/30 mix-blend-multiply" />
        )}

        {/* 3. Interactive Seats Overlay */}
        {location.seats.map((seat) => {
          const occupant = occupants.find((o) => o.seatId === seat.id);
          const isSelf = !!(currentUser && currentUser.seatId === seat.id);

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

      {/* 4. Floating Location Header Pill (Top-Left) */}
      <div className="absolute top-2.5 sm:top-3.5 left-2.5 sm:left-3.5 z-40 flex items-center gap-1.5 sm:gap-2.5 bg-white/95 backdrop-blur-md px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-white/90 shadow-md max-w-[62%] sm:max-w-none">
        {onBackToCampus && (
          <button
            onClick={onBackToCampus}
            className="p-1 -ml-1 rounded-full hover:bg-emerald-50 text-slate-700 transition-colors flex items-center gap-1 group cursor-pointer shrink-0"
            title="Return to Campus Explorer"
            aria-label="Return to Campus Explorer"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-800 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}
        <span className="text-sm sm:text-base select-none shrink-0">{location.icon}</span>
        <span className="font-serif-title font-bold text-slate-800 text-[11px] sm:text-sm tracking-tight truncate">
          {location.name}
        </span>
        <span className="text-slate-300 font-light hidden sm:inline">•</span>
        <span className="text-[10px] sm:text-xs font-semibold text-emerald-700 hidden sm:flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
          {occupants.length} studying
        </span>
      </div>

      {/* 5. Floating Action & Zoom Controls (Top-Right) */}
      <div className="absolute top-2.5 sm:top-3.5 right-2.5 sm:right-3.5 z-40 flex items-center gap-1 sm:gap-1.5 bg-white/95 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/90 shadow-md text-xs">
        {/* Room Zoom Controls */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200">
          <button
            onClick={handleZoomIn}
            className="p-1 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Zoom into Room"
            aria-label="Zoom into Room"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          {roomZoom > 1 && (
            <button
              onClick={handleResetZoom}
              className="p-1 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Reset Zoom"
              aria-label="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Room Chat Toggle */}
        {onToggleChat && (
          <button
            onClick={onToggleChat}
            className={`px-2 py-1 rounded-full font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isChatOpen
                ? 'bg-emerald-700 text-white'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Toggle Room Chat"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chat</span>
          </button>
        )}

        {/* DND Toggle */}
        {onToggleDnd && (
          <button
            onClick={onToggleDnd}
            className={`px-2 py-1 rounded-full font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDnd
                ? 'bg-amber-100 text-amber-800'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Toggle DND"
          >
            <Moon className={`w-3.5 h-3.5 ${isDnd ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span className="hidden sm:inline">{isDnd ? 'DND On' : 'DND'}</span>
          </button>
        )}

        <div className="text-[11px] font-medium text-slate-500 pl-1 border-l border-slate-200 hidden sm:block">
          {openSeatsCount} seats available
        </div>
      </div>
    </div>
  );
};
