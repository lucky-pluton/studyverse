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
    <div className="sv-location-page w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-5 animate-in fade-in duration-300">
      {/* Top Header / Navigation Breadcrumb Bar */}
      <div className="sv-location-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-[26px]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToCampus}
            className="sv-back-button px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Return to Campus Map</span>
          </button>

          <div className="hidden sm:block h-7 w-px bg-[#d9e8e3]" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">{location.icon}</span>
              <h1 className="font-serif-title text-xl sm:text-2xl font-bold text-[#214537] leading-tight">
                {location.name}
              </h1>
            </div>
            <p className="text-xs text-[#70877e]">
              {location.tagline}
            </p>
          </div>
        </div>

        {/* Occupant Counter, Chat Toggle, DND Toggle & Seat Status */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => {
              setIsChatOpen((prev) => {
                const next = !prev;
                if (next && typeof window !== 'undefined' && window.innerWidth < 1100) {
                  window.dispatchEvent(new CustomEvent('studyverse:panel-opened', { detail: { panel: 'chat' } }));
                }
                return next;
              });
            }}
            type="button"
            className={`sv-toolbar-pill px-3.5 py-2 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
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
              className={`sv-toolbar-pill px-3.5 py-2 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
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

          <div className="sv-occupancy-pill flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium">
            <Users className="w-3.5 h-3.5 text-[#5e776a]" />
            <span>
              <strong>{occupants.length}</strong> studying here
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping ml-1" />
          </div>

          <div className="text-xs text-[#70877e]">
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
      <div className="sv-location-scene relative">
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
        <div className="sv-note-card p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
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
      <div className="sv-seat-summary p-4 sm:p-5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
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
