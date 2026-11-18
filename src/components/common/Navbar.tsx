import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Users,
  Sun,
  Sunset,
  Moon,
  LogOut,
  MapPin,
  Wifi,
  TrendingUp,
} from 'lucide-react';
import type { LocationId, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { ALL_CAMPUS_NAV_ITEMS } from '../../constants/locations';
import { soundService } from '../../services/soundService';
import { AvatarRenderer } from './AvatarRenderer';
import { SessionTimeDisplay } from './TimerBadge';
import { ConnectionModal } from './ConnectionModal';

interface NavbarProps {
  currentLocation: LocationId;
  onNavigate: (loc: LocationId) => void;
  currentUser: StudentPresence;
  onExitCampus: () => void;
  timeOfDay: TimeOfDay;
  onChangeTimeOfDay: (time: TimeOfDay) => void;
  stats: {
    totalOnline: number;
    libraryCount: number;
    lhcCount: number;
    banyanCount: number;
    oatCount: number;
    cafeCount: number;
    parkCount: number;
    gcCount: number;
  };
  isDnd?: boolean;
  onToggleDnd?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLocation,
  onNavigate,
  currentUser,
  onExitCampus,
  timeOfDay,
  onChangeTimeOfDay,
  stats,
  isDnd = false,
  onToggleDnd,
}) => {
  const [isMuted, setIsMuted] = useState(soundService.getIsMuted());
  const [volume, setVolume] = useState(soundService.getVolume());
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);

  const handleToggleSound = () => {
    const muted = soundService.toggleMute();
    setIsMuted(muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundService.setVolume(val);
    if (isMuted && val > 0) {
      soundService.toggleMute();
      setIsMuted(false);
    }
  };

  const cycleTimeOfDay = () => {
    if (timeOfDay === 'day') onChangeTimeOfDay('sunset');
    else if (timeOfDay === 'sunset') onChangeTimeOfDay('night');
    else onChangeTimeOfDay('day');
  };

  const isAtCampus = currentLocation === 'campus' || currentLocation === 'city';

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#faf7f2]/95 border-b border-[#dce7e1] shadow-2xs transition-colors">
        {/* ROW 1: BRAND LOGO + GLOBAL AUDIO / DND / STATS / TIME / USER PROFILE */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Campus Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('campus')}
              className="group flex items-center gap-2.5 text-left focus:outline-hidden cursor-pointer"
              title="Return to Campus Map Overview"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#2d5a43] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <span className="font-serif-title text-sm sm:text-base font-bold">🏛️</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif-title font-bold text-sm sm:text-base tracking-wide text-[#1b3326] group-hover:text-[#2d5a43] transition-colors">
                    STUDYVERSE
                  </span>
                  <span className="text-[10px] bg-[#dbe8e0] text-[#1b432e] font-semibold px-1.5 py-0.2 rounded-md">
                    IIT MADRAS
                  </span>
                </div>
                <span className="hidden sm:block text-[9px] uppercase font-bold tracking-widest text-[#698072]">
                  Virtual Campus Simulation
                </span>
              </div>
            </button>
          </div>

          {/* Right Controls: Ambient Audio, Day/Night Atmosphere, Presence Pill, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Live Online Count Badge */}
            <button
              onClick={() => setShowConnectionModal(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-[#eaf3ee] hover:bg-[#dcefe4] border border-[#c5ddd0] text-xs font-medium text-[#204431] transition-colors cursor-pointer"
              title="Click to view Multiplayer Sync Details"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Users className="w-3.5 h-3.5 text-[#2d5a43]" />
              <span className="font-semibold">{stats.totalOnline}</span>
              <span className="hidden lg:inline text-[11px] text-[#486b57]">on campus</span>
              <Wifi className="w-3 h-3 text-[#4f7760] ml-0.5 hidden sm:inline" />
            </button>

            {/* Ambient Soundscape Controller */}
            <div className="relative hidden sm:flex items-center">
              <button
                onClick={handleToggleSound}
                onMouseEnter={() => setShowVolumeSlider(true)}
                className={`p-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                  isMuted
                    ? 'bg-[#f4efe8] border-[#e2d6c7] text-[#938576]'
                    : 'bg-[#e7ece7] border-[#cbded0] text-[#2d5a43]'
                }`}
                title={isMuted ? 'Play ambient campus soundscape' : 'Mute ambient soundscape'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Volume Popover */}
              {showVolumeSlider && (
                <div
                  onMouseLeave={() => setShowVolumeSlider(false)}
                  className="absolute top-12 right-0 p-3 bg-[#fffdf9] rounded-xl border border-[#d5e2d9] shadow-lg flex flex-col gap-2 z-50 w-36 animate-in fade-in"
                >
                  <div className="flex justify-between items-center text-[10px] text-[#4d6657] font-medium">
                    <span>Campus Audio</span>
                    <span>{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full accent-[#2d5a43] cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Do Not Disturb (DND) Toggle */}
            <button
              onClick={onToggleDnd}
              type="button"
              className={`px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                isDnd
                  ? 'bg-[#253f31] text-amber-200 border-[#1a2d23] shadow-xs ring-1 ring-amber-300/40'
                  : 'bg-[#f4efe8] hover:bg-[#eae3d9] border-[#e2d6c7] text-[#635546]'
              }`}
              title={
                isDnd
                  ? 'Do Not Disturb is ON — Enjoy studying alongside others without interruptions. Click to turn OFF.'
                  : 'Do Not Disturb — Enjoy studying alongside others without interruptions. Click to turn ON.'
              }
              aria-label="Toggle Do Not Disturb Mode"
            >
              <Moon className={`w-3.5 h-3.5 ${isDnd ? 'fill-amber-300 text-amber-300' : 'text-[#7a6a57]'}`} />
              <span className="text-[11px] font-bold">
                {isDnd ? 'DND On' : 'DND'}
              </span>
            </button>

            {/* Study Statistics Shortcut Button */}
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('studyverse:open-timer-stats'));
              }}
              type="button"
              className="hidden sm:flex px-2 sm:px-2.5 py-1.5 rounded-xl border bg-[#fbf8f3] hover:bg-[#ede5d8] border-[#ded3c2] text-[#4d4033] transition-colors cursor-pointer items-center gap-1.5"
              title="Open Study Statistics & Focus Breakdown"
              aria-label="Open Study Statistics"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#2d5a43]" />
              <span className="hidden md:inline text-[11px] font-bold text-[#2d5a43]">Stats</span>
            </button>

            {/* Day / Sunset / Night Toggle */}
            <button
              onClick={cycleTimeOfDay}
              className="hidden sm:block p-2 rounded-xl bg-[#f4efe8] hover:bg-[#eae3d9] border border-[#e2d6c7] text-[#6d5f50] transition-colors cursor-pointer"
              title={`Campus Atmosphere: ${timeOfDay.toUpperCase()} (Click to toggle)`}
            >
              {timeOfDay === 'day' && <Sun className="w-4 h-4 text-amber-600" />}
              {timeOfDay === 'sunset' && <Sunset className="w-4 h-4 text-rose-500" />}
              {timeOfDay === 'night' && <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            {/* Current Student Profile Pill */}
            <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-3 border-l border-[#dbe7e0]">
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-[#e0eee6] border border-[#bcd2c6] flex items-center justify-center shrink-0 shadow-2xs"
                title={`${currentUser.name} (${currentUser.avatarConfig?.summary || currentUser.avatarConfig?.name || 'Student'})`}
              >
                <AvatarRenderer config={currentUser.avatarConfig} size="xs" showProp={false} />
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-[#1f3529] leading-tight truncate max-w-[110px] flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  {isDnd && <span title="Do Not Disturb Active" className="text-[11px]">🌙</span>}
                </span>
                <SessionTimeDisplay sessionEnteredAt={currentUser.sessionEnteredAt} className="text-[10px] px-1.5 py-0 border-none bg-transparent shadow-none" />
              </div>
            </div>

            {/* Exit Campus button */}
            <button
              onClick={onExitCampus}
              className="p-1.5 sm:p-2 rounded-xl bg-[#f4efe8] hover:bg-[#fce7e7] hover:text-red-700 border border-[#e2d6c7] text-[#7a6d5f] transition-colors cursor-pointer"
              title="Leave Campus & Reset Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ROW 2: STUDY ENVIRONMENT NAVIGATION STRIP (Active inside study rooms for quick-hopping) */}
        {!isAtCampus && (
          <div className="border-t border-[#e2ece5] bg-[#faf7f2]/90 backdrop-blur-md px-3 sm:px-6 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs animate-in fade-in duration-200">
            {/* Campus Map Button */}
            <button
              onClick={() => onNavigate('campus')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                isAtCampus
                  ? 'bg-[#2d5a43] text-white shadow-xs'
                  : 'bg-white/80 hover:bg-white text-[#4e6658] hover:text-[#1b3326] border border-[#dce7e1]'
              }`}
              title="Return to the full Campus Map overview"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Campus Map</span>
            </button>

            <div className="h-4 w-[1px] bg-[#dbe7e0] shrink-0 mx-0.5" />

            {/* All 11 Campus Locations */}
            {ALL_CAMPUS_NAV_ITEMS.map((item) => {
              if (item.isAvailable && item.locationId) {
                const count = item.statKey ? (stats as any)[item.statKey] || 0 : 0;
                const isActive = currentLocation === item.locationId;

                return (
                  <button
                    key={`nav-${item.id}`}
                    data-nav-id={item.locationId}
                    onClick={() => onNavigate(item.locationId!)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                      isActive
                        ? 'text-white shadow-xs font-semibold'
                        : 'bg-white/80 hover:bg-white text-[#3f5247] hover:text-[#1b3326] border border-[#dce7e1]'
                    }`}
                    style={isActive ? { backgroundColor: item.themeColor } : undefined}
                    title={`Enter ${item.name} (${count} studying)`}
                  >
                    <span className="text-xs">{item.icon}</span>
                    <span className="font-serif-title">{item.shortName}</span>
                    <span
                      className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : count > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-[#edf3ee] text-[#718579]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              } else {
                // Unavailable / Upcoming Campus Locations
                return (
                  <div
                    key={`nav-upcoming-${item.id}`}
                    className="px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5 shrink-0 bg-[#f5ede4]/70 border border-[#e5dcce] text-[#8c7d6e] cursor-default opacity-85 select-none transition-colors hover:bg-[#f5ede4]"
                    title={`${item.name} — ${item.statusBadge}: ${item.statusDetail}`}
                  >
                    <span className="text-xs grayscale-[30%]">{item.icon}</span>
                    <span className="font-serif-title font-medium text-[#6e5f50]">{item.shortName}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full font-semibold uppercase tracking-wider bg-[#eae0d2] text-[#6b5c4d]">
                      {item.statusBadge}
                    </span>
                  </div>
                );
              }
            })}
          </div>
        )}
      </header>

      {/* Multiplayer info modal */}
      <ConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
      />
    </>
  );
};
