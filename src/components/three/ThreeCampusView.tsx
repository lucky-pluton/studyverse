import React, { useEffect, useRef } from 'react';
import type { LocationId, StudentPresence, TimeOfDay } from '../../types/studyverse';

interface ThreeCampusViewProps {
  students: StudentPresence[];
  currentUser: StudentPresence | null;
  onEnterLocation: (locationId: LocationId) => void;
  timeOfDay: TimeOfDay;
  onSwitchViewMode?: (mode: '2d' | '3d') => void;
}

export const ThreeCampusView: React.FC<ThreeCampusViewProps> = ({
  students,
  onEnterLocation,
  timeOfDay,
  onSwitchViewMode,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync state to the 3D model iframe
  const syncStateToIframe = () => {
    if (!iframeRef.current?.contentWindow) return;
    const counts: Record<string, number> = {
      library: students.filter((s) => s.location === 'library').length,
      lhc: students.filter((s) => s.location === 'lhc').length,
      banyan: students.filter((s) => s.location === 'banyan').length,
      oat: students.filter((s) => s.location === 'oat').length,
      cafe: students.filter((s) => s.location === 'cafe').length,
      park: students.filter((s) => s.location === 'park').length,
      gc: students.filter((s) => s.location === 'gc').length,
    };
    iframeRef.current.contentWindow.postMessage(
      { type: 'SET_TIME_OF_DAY', timeOfDay },
      '*'
    );
    iframeRef.current.contentWindow.postMessage(
      { type: 'SET_STUDENT_COUNTS', counts },
      '*'
    );
  };

  // Listen to postMessage events from the 3D campus model iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'SAHEJ_3D_READY') {
        syncStateToIframe();
      } else if (event.data.type === 'SAHEJ_ENTER_LOCATION' && event.data.locationId) {
        onEnterLocation(event.data.locationId as LocationId);
      } else if (event.data.type === 'SAHEJ_SWITCH_VIEW' && event.data.view) {
        onSwitchViewMode?.(event.data.view);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onEnterLocation, onSwitchViewMode, students, timeOfDay]);

  // Synchronize time of day changes with 3D model
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'SET_TIME_OF_DAY', timeOfDay },
        '*'
      );
    }
  }, [timeOfDay]);

  // Synchronize live student counts with 3D model
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      const counts: Record<string, number> = {
        library: students.filter((s) => s.location === 'library').length,
        lhc: students.filter((s) => s.location === 'lhc').length,
        banyan: students.filter((s) => s.location === 'banyan').length,
        oat: students.filter((s) => s.location === 'oat').length,
        cafe: students.filter((s) => s.location === 'cafe').length,
        park: students.filter((s) => s.location === 'park').length,
        gc: students.filter((s) => s.location === 'gc').length,
      };
      iframeRef.current.contentWindow.postMessage(
        { type: 'SET_STUDENT_COUNTS', counts },
        '*'
      );
    }
  }, [students]);

  return (
    <div
      data-testid="three-campus-view-container"
      className="w-full h-full relative overflow-hidden bg-[#e9ece3]"
    >
      <iframe
        ref={iframeRef}
        src="/campus3d.html"
        title="IIT Madras Interactive 3D Campus"
        className="w-full h-full border-0 select-none block"
        allow="accelerometer; autoplay; encrypted-media; gyroscope"
      />
    </div>
  );
};
