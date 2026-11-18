import React, { useEffect, useState } from 'react';
import type { LocationId, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { LOCATIONS } from '../../constants/locations';
import { UnifiedLocationEnvironment } from './UnifiedLocationEnvironment';
import { StudyDock } from '../study/StudyDock';
import { soundService } from '../../services/soundService';
import { chatService } from '../../services/chatService';
import { LocationChatPanel } from '../chat/LocationChatPanel';
import { ChatTriggerButton } from '../chat/ChatTriggerButton';
import {
  Info,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

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

  const handleOpenCompanionTab = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('new_student', 'true');
    window.open(url.toString(), '_blank');
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-4 space-y-4 animate-in fade-in duration-300">
      {/* Seat Conflict Toast Alert */}
      {conflictAlert && (
        <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl text-xs flex items-center justify-between shadow-md animate-in slide-in-from-top-2">
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

      {/* Main Illustrated Architectural Scene (Unified Cohesive Virtual Campus Environment) */}
      <div className="relative">
        <UnifiedLocationEnvironment
          location={location}
          occupants={occupants}
          currentUser={currentUser}
          onSelectSeat={handleSeatClick}
          timeOfDay={timeOfDay}
          onBackToCampus={onBackToCampus}
          onToggleChat={() => {
            setIsChatOpen((prev) => {
              const next = !prev;
              if (next && typeof window !== 'undefined' && window.innerWidth < 1100) {
                window.dispatchEvent(new CustomEvent('studyverse:panel-opened', { detail: { panel: 'chat' } }));
              }
              return next;
            });
          }}
          isChatOpen={isChatOpen}
          onToggleDnd={onToggleDnd}
          isDnd={isDnd}
        />
      </div>

      {/* Solitary / First-Arriver Encouragement Note */}
      {otherOccupants.length === 0 && (
        <div className="p-4 rounded-2xl bg-[#faf5ed] border border-[#e5d8c7] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#635546]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#eee3d4] text-[#80674d]">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-[#3b3229]">
                You're the first learner here right now.
              </span>{' '}
              Find your favorite spot. Fellow students exploring the campus will see your presence!
            </div>
          </div>

          <button
            onClick={handleOpenCompanionTab}
            className="px-3 py-1.5 bg-[#2d5a43] hover:bg-[#234735] text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs"
          >
            <span>Open Companion Window (Test Sync)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Available Seats Summary Bar */}
      <div className="p-4 rounded-2xl bg-[#fffdfa] border border-[#e6dcce] shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs text-[#695d4f]">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-[#332e29]">
            Seats in {location.name}:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#84a98c]" />
            <span>Available ({location.seats.length - occupants.length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2d5a43]" />
            <span>Occupied ({occupants.length})</span>
          </div>
        </div>

        <div className="text-[11px] text-[#8a7c6e]">
          Click any pulsing <span className="font-semibold">+</span> marker to occupy a seat and begin your session.
        </div>
      </div>

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
