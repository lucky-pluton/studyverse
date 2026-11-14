import { useEffect, useState } from 'react';
import type { LocationId, StudentPresence, TimeOfDay } from './types/studyverse';
import { presenceService } from './services/presenceService';
import { soundService } from './services/soundService';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { Navbar } from './components/common/Navbar';
import { CampusMap } from './components/campus/CampusMap';
import { LocationView } from './components/locations/LocationView';
import { FocusTimer } from './components/study/FocusTimer';

export function App() {
  const [currentUser, setCurrentUser] = useState<StudentPresence | null>(null);
  const [allStudents, setAllStudents] = useState<StudentPresence[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationId>('campus');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  // Restore session from sessionStorage or demo param
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const isDemo = urlParams.get('demo') === 'true';

      const stored = sessionStorage.getItem('studyverse_session');
      if (stored) {
        const parsed: StudentPresence = JSON.parse(stored);
        const resolvedLocation = parsed.location === 'city' ? 'campus' : parsed.location || 'campus';
        setCurrentUser({ ...parsed, location: resolvedLocation });
        setCurrentLocation(resolvedLocation);
        presenceService.init({ ...parsed, location: resolvedLocation });
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
          lastHeartbeat: Date.now(),
        };
        sessionStorage.setItem('studyverse_session', JSON.stringify(demoUser));
        setCurrentUser(demoUser);
        setCurrentLocation('campus');
        presenceService.init(demoUser);
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

      // Keep currentUser state in sync if seat was updated
      const updatedSelf = students.find((s) => s.sessionId === currentUser.sessionId);
      if (updatedSelf) {
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

  const handleOnboardingComplete = (presence: StudentPresence) => {
    setCurrentUser(presence);
    setCurrentLocation('campus');
    sessionStorage.setItem('studyverse_session', JSON.stringify(presence));
    presenceService.init(presence);
    soundService.startAmbience('campus');
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
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${atmosphereBackground}`}>
      {/* Top Navbar */}
      <Navbar
        currentLocation={currentLocation}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onExitCampus={handleExitCampus}
        timeOfDay={timeOfDay}
        onChangeTimeOfDay={setTimeOfDay}
        stats={stats}
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
      <main className="flex-1 flex flex-col">
        {isAtCampusMap ? (
          <CampusMap
            students={allStudents}
            currentUser={currentUser}
            onEnterLocation={handleNavigate}
            timeOfDay={timeOfDay}
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
          />
        )}
      </main>

      {/* Footer with IIT Madras Disclaimer */}
      <footer className="py-6 border-t border-[#dce7e1]/80 text-center text-xs text-[#637d6e] space-y-1 bg-[#faf7f2]/50">
        <p className="font-serif-title font-semibold tracking-wide text-[#234232]">
          Studyverse — IIT Madras Virtual Campus Simulation
        </p>
        <p className="text-[11px] text-[#6d887a] max-w-lg mx-auto px-4">
          An independent student-oriented virtual study world inspired by the lush campus of IIT Madras.
          Not an official institute website. For quiet companions studying together everywhere.
        </p>
      </footer>

      {/* Global Personal Focus / Pomodoro Timer */}
      <FocusTimer />
    </div>
  );
}

export default App;
