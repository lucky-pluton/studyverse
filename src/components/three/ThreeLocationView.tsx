import React, { useEffect, useState } from 'react';
import type { LocationId, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { LOCATIONS } from '../../constants/locations';
import { Room3DCanvas } from './Room3DCanvas';
import { UnifiedLocationEnvironment } from '../locations/UnifiedLocationEnvironment';
import { StudyDock } from '../study/StudyDock';
import { soundService } from '../../services/soundService';
import { chatService } from '../../services/chatService';
import { LocationChatPanel } from '../chat/LocationChatPanel';
import { ChatTriggerButton } from '../chat/ChatTriggerButton';

interface ThreeLocationViewProps {
  locationId: LocationId;
  onBackToCampus: () => void;
  currentUser: StudentPresence;
  allStudents: StudentPresence[];
  onSelectSeat: (seatId: string) => void;
  onLeaveSeat: () => void;
  onChangeStudyTopic: (topic: string) => void;
  timeOfDay?: TimeOfDay;
  isDnd?: boolean;
  onToggleDnd?: () => void;
}

export const ThreeLocationView: React.FC<ThreeLocationViewProps> = ({
  locationId,
  onBackToCampus,
  currentUser,
  allStudents,
  onSelectSeat,
  onLeaveSeat,
  onChangeStudyTopic,
  timeOfDay = 'day',
  isDnd = false,
  onToggleDnd,
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [roomDisplayMode, setRoomDisplayMode] = useState<'approved' | '3d'>('approved');

  const resolvedId = locationId === 'city' ? 'campus' : locationId;
  const location = LOCATIONS[resolvedId] || LOCATIONS.library;

  // Join location chat on entry
  useEffect(() => {
    chatService.joinLocation(resolvedId, currentUser);
    return () => {
      chatService.leaveCurrentLocation();
    };
  }, [resolvedId, currentUser.sessionId]);

  // Start ambient audio
  useEffect(() => {
    if (location?.ambientTrack) {
      soundService.startAmbience(location.ambientTrack);
    }
  }, [locationId, location?.ambientTrack]);

  // Filter students who are currently in this location
  const occupants = allStudents.filter((s) => s.location === locationId);
  const isUserSeatedHere = currentUser.location === locationId && currentUser.seatId !== null;
  const currentSeatDef = location.seats.find((s) => s.id === currentUser.seatId);

  return (
    <div className="w-full h-full relative flex flex-col justify-start items-center p-2 sm:p-4 overflow-y-auto">
      {/* Room Environment Mode Switcher (Approved Artwork vs 3D Room Prototype) */}
      <div className="absolute top-3 right-4 sm:right-6 z-40 flex items-center gap-1 bg-white/92 backdrop-blur-md px-2 py-1 rounded-full border border-[#cbe1d5] shadow-md text-xs">
        <button
          onClick={() => setRoomDisplayMode('approved')}
          className={`px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer ${
            roomDisplayMode === 'approved' ? 'bg-[#2d5a43] text-white' : 'text-[#355744] hover:bg-black/5'
          }`}
          title="Approved Environment Artwork"
        >
          🖼️ Approved Interior
        </button>
        <button
          onClick={() => setRoomDisplayMode('3d')}
          className={`px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer ${
            roomDisplayMode === '3d' ? 'bg-[#2d5a43] text-white' : 'text-[#355744] hover:bg-black/5'
          }`}
          title="3D Room Prototype"
        >
          🧊 3D Room
        </button>
      </div>

      {roomDisplayMode === 'approved' ? (
        <UnifiedLocationEnvironment
          location={location}
          occupants={occupants}
          currentUser={currentUser}
          onSelectSeat={onSelectSeat}
          timeOfDay={timeOfDay}
          onBackToCampus={onBackToCampus}
          onToggleChat={() => setIsChatOpen((prev) => !prev)}
          isChatOpen={isChatOpen}
          onToggleDnd={onToggleDnd}
          isDnd={isDnd}
        />
      ) : (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-2 space-y-4 animate-in fade-in duration-300">
          <Room3DCanvas
            locationId={locationId}
            currentUser={currentUser}
            occupants={occupants}
            onSelectSeat={onSelectSeat}
            onBackToCampus={onBackToCampus}
          />
        </div>
      )}

      {/* Seated Study Dock (Bottom Control Bar) */}
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

      {/* Location Chat Panel */}
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
