import { useEffect, useState } from 'react';
import type { AvatarConfig, LocationId, StudentPresence, TimeOfDay } from './types/studyverse';
import { presenceService } from './services/presenceService';
import { soundService } from './services/soundService';
import { chatService } from './services/chatService';
// starts counting study time into the history kept in this browser
import './services/studyLogService';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { Navbar } from './components/common/Navbar';
import { CampusMap } from './components/campus/CampusMap';
import { LocationView } from './components/locations/LocationView';
import { FocusTimer } from './components/study/FocusTimer';
import { AvatarCustomizerModal } from './components/onboarding/AvatarCustomizerModal';

export function App() {
  const [currentUser, setCurrentUser] = useState<StudentPresence | null>(null);
  const [allStudents, setAllStudents] = useState<StudentPresence[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationId>('campus');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  // One 2D/3D choice for the campus and the rooms: entering a room from the 3D campus opens it in 3D,
  // and going back keeps 3D. The campus opens in 2D when the app starts.
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [isAvatarCustomizerOpen, setIsAvatarCustomizerOpen] = useState(false);

  // Restore session from sessionStorage or demo param
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const isDemo = urlParams.get('demo') === 'true';
      const isNewStudent =
        urlParams.get('new_student') === 'true' || urlParams.get('companion') === 'true';
      const isDndStored = localStorage.getItem('studyverse_dnd_enabled') === 'true';
      localStorage.removeItem('studyverse_view_mode');
      localStorage.removeItem('sahej_view_mode');
      localStorage.removeItem('sahej_view_mode');

      if (isNewStudent) {
        sessionStorage.removeItem('studyverse_session');
        sessionStorage.removeItem('studyverse_tab_window_id');
      }

      // Check whether this tab is a duplicated/cloned tab window
      let isClonedTab = false;
      const navTiming =
        typeof performance !== 'undefined' && performance.getEntriesByType
          ? (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)
          : undefined;
      const isReload = navTiming ? navTiming.type === 'reload' : false;

      const previousOwner = sessionStorage.getItem('studyverse_tab_window_id');

      if (!isReload) {
        if (!window.name || !window.name.startsWith('studyverse_win_')) {
          window.name = 'studyverse_win_' + Math.random().toString(36).substring(2, 9);
          sessionStorage.setItem('studyverse_tab_window_id', window.name);
          if (previousOwner !== null) {
            isClonedTab = true;
          }
        }
      } else {
        // Page reload: ensure window.name is preserved so session is continuous
        if (!window.name && previousOwner) {
          window.name = previousOwner;
        }
      }

      const stored = sessionStorage.getItem('studyverse_session');
      if (stored) {
        const parsed: StudentPresence = JSON.parse(stored);

        // Only allocate a fresh sessionId if this is a duplicated tab (and not a reload)
        if (isClonedTab) {
          parsed.sessionId =
            'student_' +
            Math.random().toString(36).substring(2, 9) +
            Date.now().toString(36).substring(4);
          parsed.seatId = null;
          parsed.seatEnteredAt = null;
          sessionStorage.setItem('studyverse_session', JSON.stringify(parsed));
        }

        const resolvedLocation = parsed.location === 'city' ? 'campus' : parsed.location || 'campus';
        const userWithDnd: StudentPresence = {
          ...parsed,
          location: resolvedLocation,
          isDnd: isDndStored || parsed.isDnd || false,
        };
        setCurrentUser(userWithDnd);
        setCurrentLocation(resolvedLocation);
        presenceService.init(userWithDnd);
        chatService.setCurrentUser(userWithDnd);
      } else if (isDemo) {
        const demoUser: StudentPresence = {
          sessionId: `demo-${Date.now()}`,
          name: 'Disha',
          gender: 'female',
          avatarId: 'f-maya',
          avatarConfig: {
            id: 'f-maya',
            name: 'Maya',
            gender: 'female',
            hairStyle: 'messy-bun',
            hairColor: '#4a2e1b',
            skinTone: '#f3c9aa',
            clothingStyle: 'sweater',
            clothingColor: '#7c9a84',
            accentColor: '#e07a5f',
            accessory: 'glasses',
            activity: 'reading',
            summary: 'Warm sage knit sweater, cozy hair bun, wireframe reading glasses',
          },
          location: 'campus',
          seatId: null,
          seatEnteredAt: null,
          sessionEnteredAt: Date.now() - 42 * 60 * 1000,
          isDnd: isDndStored,
          lastHeartbeat: Date.now(),
        };
        sessionStorage.setItem('studyverse_session', JSON.stringify(demoUser));
        setCurrentUser(demoUser);
        setCurrentLocation('campus');
        presenceService.init(demoUser);
        chatService.setCurrentUser(demoUser);
      }
    } catch {
      // Session storage error catch
    }
  }, []);

  // Subscribe to real-time multiplayer presence updates
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribePresence = presenceService.subscribe((students) => {
      setAllStudents(students);

      // Keep currentUser state in sync if seat or DND was updated
      const updatedSelf = students.find((s) => s.sessionId === currentUser.sessionId);
      if (
        updatedSelf &&
        (updatedSelf.seatId !== currentUser.seatId ||
          updatedSelf.location !== currentUser.location ||
          updatedSelf.studyTopic !== currentUser.studyTopic ||
          updatedSelf.isDnd !== currentUser.isDnd)
      ) {
        setCurrentUser((prev) => (prev ? { ...prev, ...updatedSelf } : updatedSelf));
        sessionStorage.setItem('studyverse_session', JSON.stringify(updatedSelf));
      }
    });

    const unsubscribeConflict = presenceService.onConflict((seatId, occupantName) => {
      setConflictMessage(`Seat ${seatId} was taken by ${occupantName}. You have been gently unseated.`);
      setTimeout(() => setConflictMessage(null), 5000);
    });

    return () => {
      unsubscribePresence();
      unsubscribeConflict();
    };
  }, [currentUser?.sessionId]);

  // Handle ambient track changes
  useEffect(() => {
    if (!currentUser) return;
    if (currentLocation === 'campus' || currentLocation === 'city') {
      soundService.startAmbience('campus');
    }
  }, [currentUser, currentLocation]);

  // Global event listener to open avatar customizer
  useEffect(() => {
    const handleOpenCustomizer = () => {
      setIsAvatarCustomizerOpen(true);
    };
    window.addEventListener('studyverse:open-avatar-customizer', handleOpenCustomizer);
    return () => {
      window.removeEventListener('studyverse:open-avatar-customizer', handleOpenCustomizer);
    };
  }, []);

  const handleSaveCustomizedAvatar = (customizedAvatar: AvatarConfig) => {
    if (!currentUser) return;
    const updated: StudentPresence = {
      ...currentUser,
      avatarId: customizedAvatar.id,
      avatarConfig: customizedAvatar,
      status: customizedAvatar.status,
    };
    setCurrentUser(updated);
    try {
      sessionStorage.setItem('studyverse_session', JSON.stringify(updated));
    } catch {}
    presenceService.updatePresence({
      avatarId: customizedAvatar.id,
      avatarConfig: customizedAvatar,
      status: customizedAvatar.status,
    });
    chatService.setCurrentUser(updated);
  };

  const handleOnboardingComplete = (presence: StudentPresence) => {
    const isDndStored = localStorage.getItem('studyverse_dnd_enabled') === 'true';
    const userWithDnd: StudentPresence = {
      ...presence,
      isDnd: isDndStored,
    };
    setCurrentUser(userWithDnd);
    setCurrentLocation('campus');
    sessionStorage.setItem('studyverse_session', JSON.stringify(userWithDnd));
    presenceService.init(userWithDnd);
    chatService.setCurrentUser(userWithDnd);
    soundService.startAmbience('campus');
  };

  const handleToggleDnd = () => {
    if (!currentUser) return;
    const nextDnd = !currentUser.isDnd;
    const updated: StudentPresence = {
      ...currentUser,
      isDnd: nextDnd,
    };
    setCurrentUser(updated);
    try {
      sessionStorage.setItem('studyverse_session', JSON.stringify(updated));
      localStorage.setItem('studyverse_dnd_enabled', nextDnd ? 'true' : 'false');
    } catch {}
    presenceService.setDnd(nextDnd);
    chatService.setQuietStudy(nextDnd);
    chatService.setCurrentUser(updated);
  };

  const handleNavigate = (newLocation: LocationId) => {
    if (!currentUser) return;
    const target = newLocation === 'city' ? 'campus' : newLocation;
    setCurrentLocation(target);
    presenceService.changeLocation(target);

    const updated = {
      ...currentUser,
      location: target,
      seatId: null,
      seatEnteredAt: null,
    };
    setCurrentUser(updated);
    sessionStorage.setItem('studyverse_session', JSON.stringify(updated));
  };

  const handleSelectSeat = (seatId: string) => {
    if (!currentUser) return;
    const success = presenceService.occupySeat(seatId, currentLocation);
    if (success) {
      const updated = {
        ...currentUser,
        location: currentLocation,
        seatId,
        seatEnteredAt: Date.now(),
      };
      setCurrentUser(updated);
      sessionStorage.setItem('studyverse_session', JSON.stringify(updated));
    }
  };

  const handleLeaveSeat = () => {
    if (!currentUser) return;
    presenceService.leaveSeat();
    const updated = {
      ...currentUser,
      seatId: null,
      seatEnteredAt: null,
    };
    setCurrentUser(updated);
    sessionStorage.setItem('studyverse_session', JSON.stringify(updated));
  };

  const handleChangeStudyTopic = (topic: string) => {
    if (!currentUser) return;
    presenceService.setStudyTopic(topic);
    const updated = {
      ...currentUser,
      studyTopic: topic,
    };
    setCurrentUser(updated);
    sessionStorage.setItem('studyverse_session', JSON.stringify(updated));
  };

  const handleExitCampus = () => {
    soundService.stopAmbience();
    presenceService.destroy();
    sessionStorage.removeItem('studyverse_session');
    setCurrentUser(null);
    setCurrentLocation('campus');
    setAllStudents([]);
  };

  // If visitor is not yet onboarded, show welcoming flow
  if (!currentUser) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Calculate live presence statistics across campus locations
  const stats = {
    totalOnline: allStudents.length,
    libraryCount: allStudents.filter((s) => s.location === 'library').length,
    lhcCount: allStudents.filter((s) => s.location === 'lhc').length,
    banyanCount: allStudents.filter((s) => s.location === 'banyan').length,
    oatCount: allStudents.filter((s) => s.location === 'oat').length,
    cafeCount: allStudents.filter((s) => s.location === 'cafe').length,
    parkCount: allStudents.filter((s) => s.location === 'park').length,
    gcCount: allStudents.filter((s) => s.location === 'gc').length,
  };

  // Atmosphere background tints based on time of day
  const atmosphereBackground =
    timeOfDay === 'sunset'
      ? 'bg-[#fcf5ed]'
      : timeOfDay === 'night'
      ? 'bg-[#151c20] text-white/90'
      : 'bg-[#faf6f0] text-[#332e2b]';

  const isAtCampusMap = currentLocation === 'campus' || currentLocation === 'city';

  return (
    <div
      className={`w-full h-[100dvh] overflow-hidden flex flex-col transition-colors duration-500 ${atmosphereBackground}`}
    >
      {/* Top Navbar */}
      <Navbar
        currentLocation={currentLocation}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onExitCampus={handleExitCampus}
        timeOfDay={timeOfDay}
        onChangeTimeOfDay={setTimeOfDay}
        stats={stats}
        isDnd={currentUser.isDnd}
        onToggleDnd={handleToggleDnd}
        onEditAvatar={() => setIsAvatarCustomizerOpen(true)}
      />

      {/* Global Toast for seat conflict or alerts */}
      {conflictMessage && (
        <div className="max-w-md mx-auto mt-4 px-4 py-3 bg-amber-100 border border-amber-300 text-amber-900 rounded-2xl text-xs flex items-center justify-between shadow-lg z-50">
          <span>{conflictMessage}</span>
          <button
            onClick={() => setConflictMessage(null)}
            className="font-bold underline ml-3 text-amber-950"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
        {isAtCampusMap ? (
          <CampusMap
            students={allStudents}
            currentUser={currentUser}
            onEnterLocation={handleNavigate}
            timeOfDay={timeOfDay}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        ) : (
          <LocationView
            locationId={currentLocation}
            onBackToCampus={() => handleNavigate('campus')}
            currentUser={currentUser}
            allStudents={allStudents}
            onSelectSeat={handleSelectSeat}
            onLeaveSeat={handleLeaveSeat}
            onChangeStudyTopic={handleChangeStudyTopic}
            timeOfDay={timeOfDay}
            isDnd={currentUser.isDnd}
            onToggleDnd={handleToggleDnd}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        )}
      </main>

      {/* Global Unified Study Timer Utility (Pomodoro, Stopwatch, Study Duration).
          On the campus map it opens from the timer icon at the top left; in rooms from the pill at the bottom left. */}
      <FocusTimer currentUser={currentUser} launcher={isAtCampusMap ? 'toolbar' : 'pill'} />

      {/* Global Interactive 2.5D Student Avatar Customizer Modal */}
      {currentUser && (
        <AvatarCustomizerModal
          isOpen={isAvatarCustomizerOpen}
          initialAvatar={currentUser.avatarConfig}
          userName={currentUser.name}
          onSave={handleSaveCustomizedAvatar}
          onClose={() => setIsAvatarCustomizerOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
