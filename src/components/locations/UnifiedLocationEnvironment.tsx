import React, { useState, useRef, useEffect } from 'react';
import type { LocationDefinition, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { SeatSpot } from './SeatSpot';
import { ZoomIn, ZoomOut, RotateCcw, Maximize, Minimize, MessageSquare, X, Box } from 'lucide-react';

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

const LOCATION_RATIOS: Record<string, number> = {
  library: 16 / 9,
  lhc: 16 / 9,
  banyan: 16 / 9,
  oat: 16 / 9,
  cafe: 16 / 9,
  park: 16 / 9,
  gc: 16 / 9,
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
  /** switches this room to its 3D scene */
  onSwitchView?: () => void;
}

export const UnifiedLocationEnvironment: React.FC<UnifiedLocationEnvironmentProps> = ({
  location,
  occupants,
  currentUser,
  onSelectSeat,
  timeOfDay,
  onToggleChat,
  isChatOpen,
  onSwitchView,
}) => {
  const [roomZoom, setRoomZoom] = useState<number>(1);
  const [roomPan, setRoomPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [stageDimensions, setStageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(
    typeof document !== 'undefined' ? !!document.fullscreenElement : false
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const openSeatsCount = Math.max(0, location.seats.length - occupants.length);
  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';
  const bgImage = ENV_IMAGES[location.id] || envLibrary;

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Responsive COVER stage sizing: fills 100% width and 100% height with ZERO side borders / ZERO empty space
  useEffect(() => {
    if (!containerRef.current) return;
    const targetRatio = LOCATION_RATIOS[location.id] || (16 / 9);

    const updateDimensions = () => {
      if (!containerRef.current) return;
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      if (cw === 0 || ch === 0) return;

      const containerRatio = cw / ch;
      let w: number;
      let h: number;

      if (containerRatio > targetRatio) {
        // Viewport is wider than artwork: match width 100%, expand height so there are NO empty sides
        w = cw;
        h = cw / targetRatio;
      } else {
        // Viewport is taller than artwork: match height 100%, expand width so there are NO empty top/bottom
        h = ch;
        w = ch * targetRatio;
      }

      setStageDimensions({ width: Math.round(w), height: Math.round(h) });
    };

    updateDimensions();
    const ro = new ResizeObserver(updateDimensions);
    ro.observe(containerRef.current);
    window.addEventListener('resize', updateDimensions);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [location.id]);

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
      className={`relative w-full h-full flex-1 overflow-hidden select-none bg-slate-950 ${
        roomZoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
      }`}
    >
      {/* 1. PRIMARY FULL-SCREEN INTERACTIVE STAGE (100% Edge-to-Edge Cover) */}
      <div
        className="absolute left-1/2 top-1/2 select-none overflow-hidden transition-transform duration-150 ease-out origin-center"
        style={{
          width: stageDimensions.width > 0 ? `${stageDimensions.width}px` : '100%',
          height: stageDimensions.height > 0 ? `${stageDimensions.height}px` : '100%',
          transform: `translate(calc(-50% + ${roomPan.x}px), calc(-50% + ${roomPan.y}px)) scale(${roomZoom})`,
        }}
      >
        {/* Environment Illustration Artwork (covers 100% of stage without stretching) */}
        <img
          src={bgImage}
          alt={location.name}
          className="w-full h-full object-cover object-center pointer-events-none select-none block"
          style={{ imageRendering: '-webkit-optimize-contrast' }}
        />

        {/* Atmospheric Time-of-Day Overlays */}
        {isSunset && (
          <div className="absolute inset-0 pointer-events-none bg-amber-500/10 mix-blend-color-burn" />
        )}
        {isNight && (
          <div className="absolute inset-0 pointer-events-none bg-slate-950/30 mix-blend-multiply" />
        )}

        {/* Calibrated Interactive Seats Overlay */}
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
              locationId={location.id}
            />
          );
        })}
      </div>

      {/* 2. FLOATING CONTROL PILL (Top-Right, Clean & Unobtrusive) */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-[#fffdfa]/92 hover:bg-[#fffdfa] backdrop-blur-md px-3 py-1.5 rounded-full border border-[#dce7e1] shadow-md transition-all text-xs">
        {/* Available seats count */}
        <div className="flex items-center gap-1.5 px-1 py-0.5 text-[#244633] font-medium text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{openSeatsCount} seats open</span>
        </div>

        <div className="h-3.5 w-[1px] bg-slate-200 mx-0.5" />

        {/* Room Zoom Controls */}
        <div className="flex items-center gap-0.5">
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

        <div className="h-3.5 w-[1px] bg-slate-200 mx-0.5" />

        {/* Switch to the 3D room */}
        {onSwitchView && (
          <>
            <button
              onClick={onSwitchView}
              data-testid="room-view-3d"
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-[#2d5a43] hover:bg-emerald-50 transition-colors cursor-pointer"
              title="Show this room in 3D"
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D</span>
            </button>
            <div className="h-3.5 w-[1px] bg-slate-200 mx-0.5" />
          </>
        )}

        {/* Fullscreen Toggle Button */}
        <button
          onClick={toggleFullscreen}
          className="p-1 rounded-full text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
          title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Enter Full Screen'}
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? (
            <Minimize className="w-3.5 h-3.5" />
          ) : (
            <Maximize className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Room Chat Toggle Button */}
        {onToggleChat && (
          <>
            <div className="h-3.5 w-[1px] bg-slate-200 mx-0.5" />
            <button
              onClick={onToggleChat}
              className={`p-1 rounded-full transition-colors cursor-pointer flex items-center justify-center ${
                isChatOpen
                  ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
              }`}
              title={isChatOpen ? 'Close Room Chat' : 'Open Room Chat'}
              aria-label={isChatOpen ? 'Close Room Chat' : 'Open Room Chat'}
            >
              {isChatOpen ? (
                <X className="w-3.5 h-3.5 text-rose-700" />
              ) : (
                <MessageSquare className="w-3.5 h-3.5 text-[#2d5a43]" />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
