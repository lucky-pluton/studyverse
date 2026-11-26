import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Users,
  Sun,
  Sunset,
  Moon,
  LogOut,
  Wifi,
  TrendingUp,
  X,
  Clock,
  Compass,
  Maximize,
  Minimize,
  ChevronDown,
  Check,
} from 'lucide-react';
import type { LocationId, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { ALL_CAMPUS_NAV_ITEMS, type CampusNavigationItem } from '../../constants/locations';
import { soundService } from '../../services/soundService';
import { AvatarRenderer } from './AvatarRenderer';
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
  onEditAvatar?: () => void;
}

interface LocationOption {
  id: LocationId;
  name: string;
  icon: string;
  category: string;
  tagline: string;
  statKey: keyof NavbarProps['stats'];
}

const SEVEN_CAMPUS_LOCATIONS: LocationOption[] = [
  {
    id: 'library',
    name: 'Central Library',
    icon: '🏛️',
    category: 'Academic',
    tagline: 'Quiet reference stacks & desks',
    statKey: 'libraryCount',
  },
  {
    id: 'lhc',
    name: 'Lecture Hall Complex',
    icon: '🎓',
    category: 'Academic',
    tagline: 'Tiered amphitheatre desks',
    statKey: 'lhcCount',
  },
  {
    id: 'banyan',
    name: 'Banyan Tree',
    icon: '🌳',
    category: 'Outdoor',
    tagline: 'Ancient shady canopy grove',
    statKey: 'banyanCount',
  },
  {
    id: 'oat',
    name: 'Open Air Theatre',
    icon: '🎭',
    category: 'Iconic Landmark',
    tagline: 'Open amphitheatre tiers',
    statKey: 'oatCount',
  },
  {
    id: 'cafe',
    name: 'Campus Café',
    icon: '☕',
    category: 'Cafeteria',
    tagline: 'Coffee tables & casual focus',
    statKey: 'cafeCount',
  },
  {
    id: 'park',
    name: 'Sangam Gardens',
    icon: '🌿',
    category: 'Outdoor',
    tagline: 'Garden pavilion & flower benches',
    statKey: 'parkCount',
  },
  {
    id: 'gc',
    name: 'Gajendra Circle',
    icon: '🐘',
    category: 'Iconic Landmark',
    tagline: 'Elephant statue plaza benches',
    statKey: 'gcCount',
  },
];

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
  onEditAvatar,
}) => {
  const [isMuted, setIsMuted] = useState(soundService.getIsMuted());
  const [volume, setVolume] = useState(soundService.getVolume());
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [selectedUpcomingItem, setSelectedUpcomingItem] = useState<CampusNavigationItem | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(typeof document !== 'undefined' ? !!document.fullscreenElement : false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    if (!isLocationDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLocationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLocationDropdownOpen]);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

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
  const activeStudyLoc = SEVEN_CAMPUS_LOCATIONS.find((loc) => loc.id === currentLocation);

  const currentDisplay = isAtCampus
    ? {
        name: 'Campus Map',
        icon: '🗺️',
        count: stats.totalOnline,
      }
    : {
        name: activeStudyLoc?.name || 'Central Library',
        icon: activeStudyLoc?.icon || '🏛️',
        count: activeStudyLoc ? stats[activeStudyLoc.statKey] : 0,
      };

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#faf7f2]/95 border-b border-[#dce7e1] shadow-2xs transition-colors">
        {/* ROW 1: BRAND LOGO + COMPACT LOCATION SELECTOR + ACTIONS */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Brand Logo & Compact Location Dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-3.5 min-w-0">
            {/* Logo & Campus Title Button */}
            <button
              onClick={() => onNavigate('campus')}
              className="group flex items-center gap-2 sm:gap-2.5 text-left focus:outline-hidden cursor-pointer shrink-0"
              title="Return to Campus Map Overview"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#2d5a43] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <span className="font-serif-title text-sm sm:text-base font-bold">🏛️</span>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-serif-title font-bold text-sm sm:text-base tracking-wide text-[#1b3326] group-hover:text-[#2d5a43] transition-colors">
                    SAHEJ-SHALA
                  </span>
                  <span className="hidden md:inline-block text-[10px] bg-[#dbe8e0] text-[#1b432e] font-semibold px-1.5 py-0.2 rounded-md">
                    IIT MADRAS
                  </span>
                </div>
                <span className="hidden md:block text-[9px] uppercase font-bold tracking-widest text-[#698072]">
                  Virtual Campus Simulation
                </span>
              </div>
            </button>

            {/* Subtle vertical separator */}
            <div className="hidden sm:block h-6 w-[1px] bg-[#dbe7e0] shrink-0" />

            {/* Compact Location Dropdown Selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                data-testid="location-dropdown-trigger"
                onClick={() => setIsLocationDropdownOpen((prev) => !prev)}
                aria-expanded={isLocationDropdownOpen}
                aria-haspopup="listbox"
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-medium transition-all cursor-pointer select-none shrink-0 ${
                  isLocationDropdownOpen
                    ? 'bg-[#e5eee8] border-[#2d5a43] text-[#1b3e2b] shadow-xs ring-1 ring-[#2d5a43]/30'
                    : 'bg-white/90 hover:bg-white border-[#d8e3dc] text-[#2c4033] hover:border-[#b8cfc2] shadow-2xs'
                }`}
                title="Click to switch campus location"
              >
                <span className="text-sm sm:text-base shrink-0 leading-none">{currentDisplay.icon}</span>
                <span className="font-serif-title font-semibold text-[#1c3627] truncate max-w-[95px] xs:max-w-[130px] sm:max-w-[200px]">
                  {currentDisplay.name}
                </span>
                {currentDisplay.count > 0 && (
                  <span className="hidden xs:inline-flex items-center justify-center text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-800 leading-none shrink-0">
                    {currentDisplay.count}
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#5f7568] transition-transform duration-200 shrink-0 ${
                    isLocationDropdownOpen ? 'rotate-180 text-[#2d5a43]' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isLocationDropdownOpen && (
                <div
                  role="listbox"
                  aria-label="Campus Destinations"
                  className="absolute left-0 top-full mt-2 w-[calc(100vw-24px)] xs:w-72 sm:w-80 max-w-xs sm:max-w-none bg-[#fffdfa] border border-[#d6e3db] rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-150"
                >
                  {/* Menu Header */}
                  <div className="px-3.5 py-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#637b6d] border-b border-[#edf3ef]">
                    <span>Campus Destinations</span>
                    <span className="text-[9.5px] font-medium normal-case text-[#7b9184]">7 locations</span>
                  </div>

                  {/* Campus Map Option */}
                  <div className="p-1.5 pb-1">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isAtCampus}
                      onClick={() => {
                        onNavigate('campus');
                        setIsLocationDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs rounded-xl transition-colors cursor-pointer ${
                        isAtCampus
                          ? 'bg-[#e5eee8] font-semibold text-[#1b3e2b]'
                          : 'text-[#2e4236] hover:bg-[#edf4f0]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base shrink-0">🗺️</span>
                        <div className="truncate">
                          <div className="font-serif-title text-xs font-semibold text-[#1b3627]">Campus Map</div>
                          <div className="text-[10px] text-[#6b8275] truncate">Interactive aerial overview of IIT Madras</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {isAtCampus && <Check className="w-4 h-4 text-[#2d5a43] shrink-0" />}
                      </div>
                    </button>
                  </div>

                  <div className="border-t border-[#edf3ef]" />

                  {/* Scrollable list of 7 Study Locations */}
                  <div className="p-1.5 max-h-[290px] overflow-y-auto space-y-0.5">
                    {SEVEN_CAMPUS_LOCATIONS.map((loc) => {
                      const isActive = currentLocation === loc.id;
                      const count = stats[loc.statKey] || 0;
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          data-nav-id={loc.id}
                          onClick={() => {
                            onNavigate(loc.id);
                            setIsLocationDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs rounded-xl transition-colors cursor-pointer group ${
                            isActive
                              ? 'bg-[#e5eee8] font-semibold text-[#1b3e2b]'
                              : 'text-[#2c4034] hover:bg-[#edf4f0]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-base shrink-0 group-hover:scale-110 transition-transform">
                              {loc.icon}
                            </span>
                            <div className="truncate">
                              <div className="font-serif-title text-xs text-[#1b3627]">
                                <span className={isActive ? 'font-bold' : 'font-medium'}>{loc.name}</span>
                              </div>
                              <div className="text-[10px] text-[#6b8275] truncate">
                                {loc.category} • {loc.tagline}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span
                              className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-bold ${
                                isActive
                                  ? 'bg-white text-[#2d5a43] shadow-2xs'
                                  : count > 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-[#edf3ee] text-[#718579]'
                              }`}
                            >
                              {count} {count === 1 ? 'student' : 'students'}
                            </span>
                            {isActive && <Check className="w-4 h-4 text-[#2d5a43] shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Upcoming Zones Section in Dropdown */}
                  <div className="border-t border-[#edf3ef] px-3.5 py-2 bg-[#fbf9f5] flex items-center justify-between text-[10.5px] text-[#708477]">
                    <span className="font-semibold text-[9.5px] uppercase tracking-wider text-[#869b8f]">
                      Upcoming Zones
                    </span>
                    <div className="flex items-center gap-1.5">
                      {ALL_CAMPUS_NAV_ITEMS.filter((i) => !i.isAvailable).map((upcoming) => (
                        <button
                          key={upcoming.id}
                          type="button"
                          onClick={() => {
                            setSelectedUpcomingItem(upcoming);
                            setIsLocationDropdownOpen(false);
                          }}
                          className="hover:bg-[#eae3d8] px-1.5 py-0.5 rounded-md transition-colors text-xs cursor-pointer flex items-center gap-1"
                          title={`${upcoming.name} (${upcoming.statusBadge})`}
                        >
                          <span>{upcoming.icon}</span>
                          <span className="text-[10px] text-[#6b5847] hidden sm:inline">{upcoming.shortName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Controls: Ambient Audio, Day/Night Atmosphere, Presence Pill, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Live Online Count Badge */}
            <button
              onClick={() => setShowConnectionModal(true)}
              className="hidden xs:flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-[#eaf3ee] hover:bg-[#dcefe4] border border-[#c5ddd0] text-xs font-medium text-[#204431] transition-colors cursor-pointer shrink-0"
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

            {/* Native Fullscreen Mode Toggle */}
            <button
              onClick={handleToggleFullscreen}
              className="hidden sm:block p-2 rounded-xl bg-[#f4efe8] hover:bg-[#eae3d9] border border-[#e2d6c7] text-[#55695d] transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Full Screen Mode (Esc)' : 'Enter Full Screen Mode'}
              aria-label="Toggle Full Screen"
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4 text-[#2d5a43]" />
              ) : (
                <Maximize className="w-4 h-4 text-[#2d5a43]" />
              )}
            </button>

            {/* Current Student Profile Pill (Click to Customize Avatar) */}
            <button
              type="button"
              onClick={() => {
                if (onEditAvatar) onEditAvatar();
                else window.dispatchEvent(new CustomEvent('studyverse:open-avatar-customizer'));
              }}
              className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-3 border-l border-[#dbe7e0] hover:bg-[#eaf3ee] py-1 px-1.5 rounded-xl transition-all cursor-pointer group text-left"
              title="Click to customize your student avatar & status"
            >
              <div
                className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-[#e0eee6] border border-[#bcd2c6] group-hover:border-[#2d5a43] flex items-center justify-center shrink-0 shadow-2xs transition-all"
              >
                <AvatarRenderer config={currentUser.avatarConfig} size="xs" showProp={false} />
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-[#1f3529] group-hover:text-[#2d5a43] leading-tight truncate max-w-[110px] flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  {isDnd && <span title="Do Not Disturb Active" className="text-[11px]">🌙</span>}
                </span>
                <span className="text-[9.5px] text-[#55695d] flex items-center gap-1">
                  <span>Edit Avatar</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
                </span>
              </div>
            </button>

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
      </header>

      {/* Multiplayer info modal */}
      <ConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
      />

      {/* Upcoming Campus Destination Status Modal */}
      {selectedUpcomingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#fffdfa] border-2 border-[#d5e2d9] rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2.5 rounded-2xl bg-[#f0f6f2] border border-[#d2e3d7] flex items-center justify-center shadow-inner">
                  {selectedUpcomingItem.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#355b46] bg-[#e3efe7] px-2 py-0.5 rounded-full">
                      {selectedUpcomingItem.category}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {selectedUpcomingItem.statusBadge}
                    </span>
                  </div>
                  <h3 className="font-serif-title text-base sm:text-lg font-bold text-[#1b3326]">
                    {selectedUpcomingItem.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedUpcomingItem(null)}
                className="p-1 rounded-full text-[#5e7769] hover:text-[#193224] hover:bg-black/5 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f6faf7] border border-[#d6e5dc] text-xs text-[#2b4d3a] leading-relaxed">
              <p className="font-medium text-[#193424] mb-1">Status Details:</p>
              <p>{selectedUpcomingItem.statusDetail}</p>
            </div>

            <p className="text-xs text-[#526a5c] leading-relaxed">
              Sahej-Shala currently features 7 fully active, interactive study environments across IIT Madras. While this destination prepares for term, you can join your peers right now at:
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  onNavigate('library');
                  setSelectedUpcomingItem(null);
                }}
                className="p-2.5 rounded-xl bg-[#eef5f1] hover:bg-[#dcefe4] border border-[#cbe1d5] text-left transition-colors cursor-pointer group"
              >
                <div className="text-xs font-bold text-[#1b3a29] flex items-center gap-1.5">
                  <span>🏛️</span>
                  <span>Central Library</span>
                </div>
                <div className="text-[10px] text-[#4d705c]">
                  {stats.libraryCount} studying now →
                </div>
              </button>

              <button
                onClick={() => {
                  onNavigate('cafe');
                  setSelectedUpcomingItem(null);
                }}
                className="p-2.5 rounded-xl bg-[#fbf6f0] hover:bg-[#f6ede1] border border-[#ead8c4] text-left transition-colors cursor-pointer group"
              >
                <div className="text-xs font-bold text-[#442c19] flex items-center gap-1.5">
                  <span>☕</span>
                  <span>Campus Café</span>
                </div>
                <div className="text-[10px] text-[#7a583d]">
                  {stats.cafeCount} studying now →
                </div>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedUpcomingItem(null)}
                className="px-4 py-2 rounded-xl bg-[#2d5a43] hover:bg-[#204432] text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Return to Campus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
