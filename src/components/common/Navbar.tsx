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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Campus Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('campus')}
              className="group flex items-center gap-2.5 text-left focus:outline-hidden cursor-pointer"
              title="Return to Campus Map Overview"
            >
              <div className="w-9 h-9 rounded-xl bg-[#2d5a43] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <span className="font-serif-title text-base font-bold">🏛️</span>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-serif-title font-bold text-sm sm:text-base tracking-wide text-[#1b3326] group-hover:text-[#2d5a43] transition-colors">
                    STUDYVERSE
                  </span>
                  <span className="text-[10px] bg-[#dbe8e0] text-[#1b432e] font-semibold px-1.5 py-0.2 rounded-md">
                    IIT MADRAS
                  </span>
                </div>
                <span className="block text-[9px] uppercase font-bold tracking-widest text-[#698072]">
                  Virtual Campus Simulation
                </span>
              </div>
            </button>

            {/* Quick Navigation Pills for Top Campus Landmarks */}
            <nav className="hidden xl:flex items-center gap-1 ml-3 pl-3 border-l border-[#dbe7e0]">
              <button
                onClick={() => onNavigate('campus')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  isAtCampus
                    ? 'bg-[#2d5a43] text-white shadow-2xs'
                    : 'text-[#4e6658] hover:bg-[#eaf3ee] hover:text-[#1b3326]'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                Campus Map
              </button>

              <button
                onClick={() => onNavigate('library')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  currentLocation === 'library'
                    ? 'bg-[#2d5a43] text-white shadow-2xs'
                    : 'text-[#4e6658] hover:bg-[#eaf3ee] hover:text-[#1b3326]'
                }`}
              >
                <span>🏛️</span>
                Library ({stats.libraryCount})
              </button>

              <button
                onClick={() => onNavigate('lhc')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  currentLocation === 'lhc'
                    ? 'bg-[#784824] text-white shadow-2xs'
                    : 'text-[#4e6658] hover:bg-[#eaf3ee] hover:text-[#1b3326]'
                }`}
              >
                <span>🎓</span>
                LHC ({stats.lhcCount})
              </button>

              <button
                onClick={() => onNavigate('banyan')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  currentLocation === 'banyan'
                    ? 'bg-[#365338] text-white shadow-2xs'
                    : 'text-[#4e6658] hover:bg-[#eaf3ee] hover:text-[#1b3326]'
                }`}
              >
                <span>🌳</span>
                Banyan ({stats.banyanCount})
              </button>

              <button
                onClick={() => onNavigate('oat')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  currentLocation === 'oat'
                    ? 'bg-[#475569] text-white shadow-2xs'
                    : 'text-[#4e6658] hover:bg-[#eaf3ee] hover:text-[#1b3326]'
                }`}
              >
                <span>🎭</span>
                OAT ({stats.oatCount})
              </button>

              <button
                onClick={() => onNavigate('cafe')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  currentLocation === 'cafe'
                    ? 'bg-[#845328] text-white shadow-2xs'
                    : 'text-[#4e6658] hover:bg-[#eaf3ee] hover:text-[#1b3326]'
                }`}
              >
                <span>☕</span>
                Café ({stats.cafeCount})
              </button>

              <button
                onClick={() => onNavigate('park')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  currentLocation === 'park'
                    ? 'bg-[#2f6044] text-white shadow-2xs'
                    : 'text-[#4e6658] hover:bg-[#eaf3ee] hover:text-[#1b3326]'
                }`}
              >
                <span>🦌</span>
                Sangam ({stats.parkCount})
              </button>

              <button
                onClick={() => onNavigate('gc')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  currentLocation === 'gc'
                    ? 'bg-[#1e40af] text-white shadow-2xs'
                    : 'text-[#4e6658] hover:bg-[#eaf3ee] hover:text-[#1b3326]'
                }`}
              >
                <span>🐘</span>
                GC ({stats.gcCount})
              </button>
            </nav>
          </div>

          {/* Right Controls: Ambient Audio, Day/Night Atmosphere, Presence Pill, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Online Count Badge */}
            <button
              onClick={() => setShowConnectionModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eaf3ee] hover:bg-[#dcefe4] border border-[#c5ddd0] text-xs font-medium text-[#204431] transition-colors"
              title="Click to view Multiplayer Sync Details"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Users className="w-3.5 h-3.5 text-[#2d5a43]" />
              <span className="font-semibold">{stats.totalOnline}</span>
              <span className="hidden lg:inline text-[11px] text-[#486b57]">on campus</span>
              <Wifi className="w-3 h-3 text-[#4f7760] ml-0.5" />
            </button>

            {/* Ambient Soundscape Controller */}
            <div className="relative flex items-center">
              <button
                onClick={handleToggleSound}
                onMouseEnter={() => setShowVolumeSlider(true)}
                className={`p-2 rounded-xl text-xs font-medium border transition-colors ${
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
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
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
              className="px-2.5 py-1.5 rounded-xl border bg-[#fbf8f3] hover:bg-[#ede5d8] border-[#ded3c2] text-[#4d4033] transition-colors cursor-pointer flex items-center gap-1.5"
              title="Open Study Statistics & Focus Breakdown"
              aria-label="Open Study Statistics"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#2d5a43]" />
              <span className="hidden md:inline text-[11px] font-bold text-[#2d5a43]">Stats</span>
            </button>

            {/* Day / Sunset / Night Toggle */}
            <button
              onClick={cycleTimeOfDay}
              className="p-2 rounded-xl bg-[#f4efe8] hover:bg-[#eae3d9] border border-[#e2d6c7] text-[#6d5f50] transition-colors"
              title={`Campus Atmosphere: ${timeOfDay.toUpperCase()} (Click to toggle)`}
            >
              {timeOfDay === 'day' && <Sun className="w-4 h-4 text-amber-600" />}
              {timeOfDay === 'sunset' && <Sunset className="w-4 h-4 text-rose-500" />}
              {timeOfDay === 'night' && <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            {/* Current Student Profile Pill */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#dbe7e0]">
              <div
                className="w-8 h-8 rounded-full overflow-hidden bg-[#e0eee6] border border-[#bcd2c6] flex items-center justify-center shrink-0 shadow-2xs"
                title={`${currentUser.name} (${currentUser.avatarConfig.summary})`}
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
              className="p-2 rounded-xl bg-[#f4efe8] hover:bg-[#fce7e7] hover:text-red-700 border border-[#e2d6c7] text-[#7a6d5f] transition-colors"
              title="Leave Campus & Reset Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Multiplayer info modal */}
      <ConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
      />
    </>
  );
};
