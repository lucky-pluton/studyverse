import React, { Suspense, lazy, useEffect, useState } from 'react';
import type { LocationId, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { LOCATIONS } from '../../constants/locations';
import { UnifiedLocationEnvironment } from './UnifiedLocationEnvironment';
import { StudyDock } from '../study/StudyDock';
import { soundService } from '../../services/soundService';
import { chatService } from '../../services/chatService';
import { LocationChatPanel } from '../chat/LocationChatPanel';
import { ChatTriggerButton } from '../chat/ChatTriggerButton';
import { AlertCircle, ExternalLink } from 'lucide-react';

// three.js only loads when a room is opened in 3D
const Room3DView = lazy(() => import('./Room3DView'));

interface LocationViewProps {
  locationId: LocationId;
  onBackToCampus: () => void;
  currentUser: StudentPresence;
  allStudents: StudentPresence[];
  onSelectSeat: (seatId: string) => void;
  onLeaveSeat: () => void;
  onChangeStudyTopic: (topic: string) => void;
  timeOfDay: TimeOfDay;
  isDnd?: boolean;
  onToggleDnd?: () => void;
  /** '3d' shows the room as a 3D scene, '2d' as the illustration */
  viewMode?: '2d' | '3d';
  onViewModeChange?: (mode: '2d' | '3d') => void;
}

export const LocationView: React.FC<LocationViewProps> = ({
  locationId,
  onBackToCampus,
  currentUser,
  allStudents,
  onSelectSeat,
  onLeaveSeat,
  onChangeStudyTopic,
  timeOfDay,
  isDnd = false,
  onToggleDnd,
  viewMode = '2d',
  onViewModeChange,
}) => {
  const [conflictAlert, setConflictAlert] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Normalize legacy 'city' alias to campus or fallback
  const resolvedId = locationId === 'city' ? 'campus' : locationId;
  const location = LOCATIONS[resolvedId] || LOCATIONS.library;

  // Join location chat on entry and clean up when leaving or switching location
  useEffect(() => {
    chatService.joinLocation(resolvedId, currentUser);
    return () => {
      chatService.leaveCurrentLocation();
    };
  }, [resolvedId, currentUser.sessionId]);

  // Keep chatService updated when currentUser attributes change (e.g. DND)
  useEffect(() => {
    chatService.setCurrentUser(currentUser);
  }, [currentUser]);

  // Start the appropriate ambient soundscape when location loads
  useEffect(() => {
    if (location?.ambientTrack) {
      soundService.startAmbience(location.ambientTrack);
    }
  }, [locationId, location?.ambientTrack]);

  // Filter students who are currently in this location
  const occupants = allStudents.filter((s) => s.location === locationId || (locationId === 'library' && s.location === 'library'));
  const otherOccupants = occupants.filter((s) => s.sessionId !== currentUser.sessionId);

  // Is current user seated in this location?
  const isUserSeatedHere = currentUser.location === locationId && currentUser.seatId !== null;
  const currentSeatDef = location.seats.find((s) => s.id === currentUser.seatId);

  const handleSeatClick = (seatId: string) => {
    // Check if taken by another student
    const existing = otherOccupants.find((o) => o.seatId === seatId);
    if (existing) {
      setConflictAlert(
        `This seat is currently occupied by ${existing.name}. Please choose another peaceful spot.`
      );
      setTimeout(() => setConflictAlert(null), 4000);
      return;
    }

    soundService.playSitSound();
    onSelectSeat(seatId);
  };

  const toggleChat = () => {
    setIsChatOpen((prev) => {
      const next = !prev;
      if (next && typeof window !== 'undefined' && window.innerWidth < 1100) {
        window.dispatchEvent(new CustomEvent('studyverse:panel-opened', { detail: { panel: 'chat' } }));
      }
      return next;
    });
  };

  const handleOpenCompanionTab = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('new_student', 'true');
    window.open(url.toString(), '_blank');
  };

  return (
    <div className="relative w-full h-full flex-1 overflow-hidden flex flex-col select-none">
      {/* Seat Conflict Floating Toast Alert */}
      {conflictAlert && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl text-xs flex items-center justify-between shadow-xl animate-in slide-in-from-top-2 max-w-md w-[90%]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{conflictAlert}</span>
          </div>
          <button
            onClick={() => setConflictAlert(null)}
            className="text-xs font-bold text-amber-800 hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Illustrated Architectural Scene (Full-Screen Edge-to-Edge) */}
      <div className="w-full h-full flex-1 relative overflow-hidden flex flex-col">
        {viewMode === '3d' ? (
          <Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-[#cfdde3] text-xs font-medium text-[#36503f]">Building {location.name} in 3D…</div>}>
            <Room3DView
              location={location}
              occupants={occupants}
              currentUser={currentUser}
              onSelectSeat={handleSeatClick}
              timeOfDay={timeOfDay}
              onToggleChat={toggleChat}
              isChatOpen={isChatOpen}
              onSwitchView={onViewModeChange ? () => onViewModeChange('2d') : undefined}
            />
          </Suspense>
        ) : (
        <UnifiedLocationEnvironment
          location={location}
          occupants={occupants}
          currentUser={currentUser}
          onSelectSeat={handleSeatClick}
          timeOfDay={timeOfDay}
          onBackToCampus={onBackToCampus}
          onToggleChat={toggleChat}
          isChatOpen={isChatOpen}
          onToggleDnd={onToggleDnd}
          isDnd={isDnd}
          onSwitchView={onViewModeChange ? () => onViewModeChange('3d') : undefined}
        />
        )}
      </div>

      {/* Subtle First-Arriver Pill (Non-intrusive floating element) */}
      {otherOccupants.length === 0 && (
        <div className="fixed bottom-4 left-4 z-30 hidden sm:flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#dce7e1] shadow-md text-xs text-[#524436]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-medium">First learner here</span>
          <button
            onClick={handleOpenCompanionTab}
            className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 ml-1 hover:underline cursor-pointer"
            title="Open Companion Window to test multiplayer sync"
          >
            <span>Test Sync</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Seated Bottom Dock */}
      {isUserSeatedHere && (
        <div className={isChatOpen ? 'hidden xl:block' : 'block'}>
          <StudyDock
            currentUser={currentUser}
            currentSeatName={currentSeatDef?.name || 'Study Desk'}
            locationName={location.name}
            locationIcon={location.icon}
            onLeaveSeat={onLeaveSeat}
            onChangeTopic={onChangeStudyTopic}
            onToggleDnd={onToggleDnd}
          />
        </div>
      )}

      {/* Floating Chat Trigger Button */}
      <ChatTriggerButton
        locationName={location.name}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen((prev) => !prev)}
      />

      {/* Location Real-Time Chat Panel */}
      <LocationChatPanel
        locationId={resolvedId}
        currentUser={currentUser}
        occupantsCount={occupants.length}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onToggleDnd={onToggleDnd}
      />
    </div>
  );
};
