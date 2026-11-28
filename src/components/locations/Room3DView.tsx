import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { LocationDefinition, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { SeatSpot } from './SeatSpot';
import { RoomStage, type Projected } from '../../campus3d/rooms/RoomStage';
import { ZoomIn, ZoomOut, RotateCcw, Maximize, Minimize, MessageSquare, X, Image as ImageIcon } from 'lucide-react';

interface Room3DViewProps {
  location: LocationDefinition;
  occupants: StudentPresence[];
  currentUser: StudentPresence;
  onSelectSeat: (seatId: string) => void;
  timeOfDay: TimeOfDay;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
  onSwitchView?: () => void;
}

/**
 * The study room as a 3D scene that matches the 3D campus. Seats are the same seat ids as the
 * illustrated 2D room; the familiar seat markers, avatars and timers float over their 3D spots.
 */
const Room3DView: React.FC<Room3DViewProps> = ({ location, occupants, currentUser, onSelectSeat, timeOfDay, onToggleChat, isChatOpen, onSwitchView }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<RoomStage | null>(null);
  const seatEls = useRef<Record<string, HTMLDivElement | null>>({});
  const [failed, setFailed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(typeof document !== 'undefined' ? !!document.fullscreenElement : false);
  const [hintVisible, setHintVisible] = useState(true);
  const [lhcView, setLhcView] = useState<'front' | 'board'>('front');

  useEffect(() => {
    if (location.id === 'lhc') {
      setLhcView('front');
    }
  }, [location.id]);

  const openSeatsCount = Math.max(0, location.seats.length - occupants.length);
  const unseatedOccupants = occupants.filter((o) => !o.seatId);
  // in 3D the distance sets the size, so every seat uses the same base avatar size
  const seats3d = useMemo(() => location.seats.map((s) => ({ ...s, x: 0, y: 0, scale: 1, size: 'md' as const })), [location.seats]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let stage: RoomStage;
    try {
      stage = new RoomStage(host, location.id);
    } catch {
      setFailed(true);
      return;
    }
    stageRef.current = stage;
    const p: Projected = { x: 0, y: 0, dist: 0, visible: false };
    // outdoor rooms are seen from further away, so their markers keep more of their size
    const ref = stage.room.indoor ? 6.2 : 10;
    stage.onFrame = () => {
      for (const s of location.seats) {
        const el = seatEls.current[s.id];
        if (!el) continue;
        if (!stage.project(s.id, p) || !p.visible) {
          el.style.display = 'none';
          continue;
        }
        const scale = Math.min(1.25, Math.max(0.42, ref / p.dist));
        el.style.display = '';
        el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) scale(${scale.toFixed(3)})`;
        el.style.zIndex = String(Math.round(2000 - p.dist * 20));
      }
    };
    const hideHint = (): void => setHintVisible(false);
    host.addEventListener('pointerdown', hideHint, { once: true });
    const t = window.setTimeout(hideHint, 7000);
    return () => {
      window.clearTimeout(t);
      host.removeEventListener('pointerdown', hideHint);
      stage.dispose();
      stageRef.current = null;
    };
  }, [location.id, location.seats]);

  useEffect(() => {
    stageRef.current?.setTime(timeOfDay);
  }, [timeOfDay, location.id]);

  useEffect(() => {
    const onFs = (): void => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFullscreen = (): void => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  if (failed) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#f4efe6] text-sm text-[#4d4237] p-6 text-center">
        <div>
          <p className="font-semibold">This browser could not start 3D graphics.</p>
          {onSwitchView && (
            <button type="button" onClick={onSwitchView} className="mt-3 px-3 py-1.5 rounded-full bg-[#2d5a43] text-white text-xs font-semibold cursor-pointer">
              Show the 2D room
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate w-full h-full flex-1 overflow-hidden select-none bg-[#cfdde3]" data-testid="room-3d-view">
      <div ref={hostRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" aria-label={`${location.name} in 3D. Drag to look around, scroll to zoom, and choose a seat marker to sit.`} role="application" />

      {/* seat markers, avatars and timers pinned to their 3D spots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {seats3d.map((seat) => {
          const occupant = occupants.find((o) => o.seatId === seat.id);
          return (
            <div
              key={seat.id}
              ref={(el) => { seatEls.current[seat.id] = el; }}
              className="absolute left-0 top-0 pointer-events-auto"
              style={{ transformOrigin: '0 0', display: 'none' }}
            >
              <SeatSpot seat={seat} occupant={occupant} isSelf={!!(currentUser && currentUser.seatId === seat.id)} onSelectSeat={onSelectSeat} locationId={location.id} />
            </div>
          );
        })}
      </div>

      {/* Room Presence Badge (Top-Left) */}
      <div className="absolute top-3 left-3 z-[2100] flex items-center gap-2 bg-[#fffdfa]/92 hover:bg-[#fffdfa] backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#dce7e1] shadow-md text-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-serif-title font-bold text-[#1f3529]">{location.name} (3D)</span>
        <span className="text-[#627a6c]">·</span>
        <span className="text-[#2d5a43] font-semibold">{occupants.length} learner{occupants.length === 1 ? '' : 's'} here</span>
        {unseatedOccupants.length > 0 && (
          <span className="text-[10px] text-[#557762] hidden sm:inline">
            ({unseatedOccupants.length} browsing)
          </span>
        )}
      </div>

      {/* Unseated Learners in 3D room */}
      {unseatedOccupants.length > 0 && (
        <div className="absolute left-3 bottom-20 z-[2100] flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-[#dce7e1] shadow-lg text-xs pointer-events-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#355844]">Exploring:</span>
          <div className="flex items-center gap-1.5 flex-wrap max-w-md">
            {unseatedOccupants.map((student, idx) => (
              <span
                key={student.sessionId || idx}
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#eaf3ee] text-[#1f382b] border border-[#bcd2c5]"
              >
                {student.name}{student.sessionId === currentUser.sessionId ? ' (You)' : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* control pill, matching the 2D room */}
      <div className="absolute top-3 right-3 z-[2100] flex items-center gap-1.5 bg-[#fffdfa]/92 hover:bg-[#fffdfa] backdrop-blur-md px-3 py-1.5 rounded-full border border-[#dce7e1] shadow-md transition-all text-xs">
        <div className="flex items-center gap-1.5 px-1 py-0.5 text-[#244633] font-medium text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{openSeatsCount} seats open</span>
        </div>
        <div className="h-3.5 w-[1px] bg-slate-200 mx-0.5" />
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => stageRef.current?.zoom(0.8)} className="p-1 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer" title="Zoom in" aria-label="Zoom in">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => stageRef.current?.zoom(1.25)} className="p-1 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer" title="Zoom out" aria-label="Zoom out">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (location.id === 'lhc') setLhcView('front');
              stageRef.current?.resetView();
            }}
            className="p-1 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Reset view"
            aria-label="Reset view"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
        {location.id === 'lhc' && (
          <>
            <div className="h-3.5 w-[1px] bg-slate-200 mx-0.5" />
            <div className="flex items-center bg-slate-100/90 rounded-full p-0.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => {
                  setLhcView('front');
                  stageRef.current?.setView([0, 3.3, -7.4], [0, 1.7, 2.2]);
                }}
                className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                  lhcView === 'front'
                    ? 'bg-white text-[#1f3529] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View from the front stage looking at student tiers"
              >
                🎓 Front View
              </button>
              <button
                type="button"
                onClick={() => {
                  setLhcView('board');
                  stageRef.current?.setView([0, 3.8, 9.6], [0, 1.4, -4.2]);
                }}
                className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                  lhcView === 'board'
                    ? 'bg-white text-[#1f3529] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View from the back looking at the chalkboard"
              >
                📋 Board View
              </button>
            </div>
          </>
        )}
        <div className="h-3.5 w-[1px] bg-slate-200 mx-0.5" />
        {onSwitchView && (
          <>
            <button
              type="button"
              onClick={onSwitchView}
              data-testid="room-view-2d"
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-[#2d5a43] hover:bg-emerald-50 transition-colors cursor-pointer"
              title="Show the illustrated 2D room"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>2D</span>
            </button>
            <div className="h-3.5 w-[1px] bg-slate-200 mx-0.5" />
          </>
        )}
        <button type="button" onClick={toggleFullscreen} className="p-1 rounded-full text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer" title={isFullscreen ? 'Exit full screen (Esc)' : 'Enter full screen'} aria-label="Toggle full screen">
          {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
        </button>
        {onToggleChat && (
          <>
            <div className="h-3.5 w-[1px] bg-slate-200 mx-0.5" />
            <button
              type="button"
              onClick={onToggleChat}
              className={`p-1 rounded-full transition-colors cursor-pointer flex items-center justify-center ${isChatOpen ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'}`}
              title={isChatOpen ? 'Close room chat' : 'Open room chat'}
              aria-label={isChatOpen ? 'Close room chat' : 'Open room chat'}
            >
              {isChatOpen ? <X className="w-3.5 h-3.5 text-rose-700" /> : <MessageSquare className="w-3.5 h-3.5 text-[#2d5a43]" />}
            </button>
          </>
        )}
      </div>

      <div className={`absolute left-1/2 bottom-20 -translate-x-1/2 z-[2100] px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#dce7e1] shadow-md text-[11px] font-medium text-[#36503f] pointer-events-none transition-opacity duration-500 ${hintVisible ? 'opacity-100' : 'opacity-0'}`}>
        Drag to look around · scroll to zoom · choose a <b>+</b> to sit
      </div>
    </div>
  );
};

export default Room3DView;
