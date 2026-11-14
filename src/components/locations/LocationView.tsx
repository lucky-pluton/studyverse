import React, { useEffect, useState } from 'react';
import type { LocationId, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { LOCATIONS } from '../../constants/locations';
import { CentralLibrary } from './CentralLibrary';
import { LectureHallComplex } from './LectureHallComplex';
import { BanyanTreeGrove } from './BanyanTreeGrove';
import { OpenAirTheatre } from './OpenAirTheatre';
import { CampusCafe } from './CampusCafe';
import { SangamGardens } from './SangamGardens';
import { GajendraCircle } from './GajendraCircle';
import { StudyDock } from '../study/StudyDock';
import { soundService } from '../../services/soundService';
import { chatService } from '../../services/chatService';
import { LocationChatPanel } from '../chat/LocationChatPanel';
import { ChatTriggerButton } from '../chat/ChatTriggerButton';
import {
  ArrowLeft,
  Users,
  Sparkles,
  Info,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Moon,
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
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-300">
      {/* Top Header / Navigation Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e2d5c3]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToCampus}
            className="px-3.5 py-2 rounded-2xl bg-[#fffdfa] hover:bg-[#f1eae0] border border-[#e2d5c3] text-xs font-semibold text-[#54483c] flex items-center gap-2 shadow-2xs transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Return to Campus Map</span>
          </button>

          <div className="h-4 w-[1px] bg-[#d9cdbe]" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">{location.icon}</span>
              <h1 className="font-serif-title text-xl font-bold text-[#2a2622] leading-tight">
                {location.name}
              </h1>
            </div>
            <p className="text-xs text-[#706456] italic">
              {location.tagline}
            </p>
          </div>
        </div>

        {/* Occupant Counter, Chat Toggle, DND Toggle & Seat Status */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => setIsChatOpen((prev) => !prev)}
            type="button"
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isChatOpen
                ? 'bg-[#2d5a43] text-white border-[#1e402e] shadow-2xs'
                : 'bg-[#fffdfa] hover:bg-[#f1eae0] border-[#d8ccbc] text-[#3f3428]'
            }`}
            title="Toggle Room Chat"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
            <span>Chat</span>
          </button>

          {/* DND Quick Toggle */}
          {onToggleDnd && (
            <button
              onClick={onToggleDnd}
              type="button"
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDnd
                  ? 'bg-[#253f31] text-amber-200 border-[#1a2d23] shadow-xs ring-1 ring-amber-300/40'
                  : 'bg-[#fffdfa] hover:bg-[#f1eae0] border-[#d8ccbc] text-[#3f3428]'
              }`}
              title={
                isDnd
                  ? 'Do Not Disturb is ON (Enjoy studying alongside others without interruptions). Click to turn OFF.'
                  : 'Enable Do Not Disturb (Enjoy studying alongside others without interruptions).'
              }
              aria-label="Toggle Do Not Disturb Mode"
            >
              <Moon className={`w-3.5 h-3.5 ${isDnd ? 'fill-amber-300 text-amber-300' : 'text-slate-500'}`} />
              <span>{isDnd ? 'DND On' : 'DND'}</span>
            </button>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f4ece1] border border-[#e2d5c3] text-xs font-medium text-[#4d4033]">
            <Users className="w-3.5 h-3.5 text-[#5e776a]" />
            <span>
              <strong>{occupants.length}</strong> studying here
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping ml-1" />
          </div>

          <div className="text-xs text-[#7a6f62]">
            {isUserSeatedHere ? (
              <span className="text-[#2d5a43] font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Seated at {currentSeatDef?.name || 'seat'}
              </span>
            ) : (
              <span className="text-[#8c7e6f]">Choose an available seat below</span>
            )}
          </div>
        </div>
      </div>

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

      {/* Main Illustrated Architectural Scene */}
      <div className="relative">
        {locationId === 'library' && (
          <CentralLibrary
            location={location}
            occupants={occupants}
            currentUser={currentUser}
            onSelectSeat={handleSeatClick}
            timeOfDay={timeOfDay}
          />
        )}
        {locationId === 'lhc' && (
          <LectureHallComplex
            location={location}
            occupants={occupants}
            currentUser={currentUser}
            onSelectSeat={handleSeatClick}
            timeOfDay={timeOfDay}
          />
        )}
        {locationId === 'banyan' && (
          <BanyanTreeGrove
            location={location}
            occupants={occupants}
            currentUser={currentUser}
            onSelectSeat={handleSeatClick}
            timeOfDay={timeOfDay}
          />
        )}
        {locationId === 'oat' && (
          <OpenAirTheatre
            location={location}
            occupants={occupants}
            currentUser={currentUser}
            onSelectSeat={handleSeatClick}
            timeOfDay={timeOfDay}
          />
        )}
        {locationId === 'cafe' && (
          <CampusCafe
            location={location}
            occupants={occupants}
            currentUser={currentUser}
            onSelectSeat={handleSeatClick}
            timeOfDay={timeOfDay}
          />
        )}
        {locationId === 'park' && (
          <SangamGardens
            location={location}
            occupants={occupants}
            currentUser={currentUser}
            onSelectSeat={handleSeatClick}
            timeOfDay={timeOfDay}
          />
        )}
        {locationId === 'gc' && (
          <GajendraCircle
            location={location}
            occupants={occupants}
            currentUser={currentUser}
            onSelectSeat={handleSeatClick}
            timeOfDay={timeOfDay}
          />
        )}
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
        <StudyDock
          currentUser={currentUser}
          currentSeatName={currentSeatDef?.name || 'Study Desk'}
          onLeaveSeat={onLeaveSeat}
          onChangeTopic={onChangeStudyTopic}
          onToggleDnd={onToggleDnd}
        />
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
