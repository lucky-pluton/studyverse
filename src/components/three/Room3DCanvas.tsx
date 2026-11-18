import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { LocationId, StudentPresence } from '../../types/studyverse';
import { ROOM_3D_CONFIGS } from '../../constants/threeDCoordinates';
import { createRoomFurniture3D } from './models/RoomFurniture3D';
import { createAvatar3D } from './models/Avatar3D';
import { soundService } from '../../services/soundService';
import { ArrowLeft, ZoomIn, ZoomOut, RotateCcw, AlertCircle } from 'lucide-react';

interface Room3DCanvasProps {
  locationId: LocationId;
  currentUser: StudentPresence | null;
  occupants: StudentPresence[];
  onSelectSeat: (seatId: string) => void;
  onBackToCampus: () => void;
}

export const Room3DCanvas: React.FC<Room3DCanvasProps> = ({
  locationId,
  currentUser,
  occupants,
  onSelectSeat,
  onBackToCampus,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const config = ROOM_3D_CONFIGS[locationId] || ROOM_3D_CONFIGS.library;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(config.ambientColor);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(config.cameraPosition[0], config.cameraPosition[1], config.cameraPosition[2]);
    camera.lookAt(config.cameraTarget[0], config.cameraTarget[1], config.cameraTarget[2]);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 6;
    controls.maxDistance = 28;
    controls.minPolarAngle = Math.PI / 8;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.target.set(config.cameraTarget[0], config.cameraTarget[1], config.cameraTarget[2]);
    controlsRef.current = controls;

    // 5. Lighting
    const hemiLight = new THREE.HemisphereLight('#ffffff', '#c8decb', 0.85);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(config.sunColor, 1.1);
    dirLight.position.set(15, 25, 18);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // 6. Build Room Architecture & Furniture
    const furnitureGroup = createRoomFurniture3D(locationId);
    scene.add(furnitureGroup);

    // 7. Interactive Seat Markers & Raycasting Targets
    const seatClickTargets = new Map<THREE.Object3D, string>();

    config.seats.forEach((seat) => {
      // Find if this seat is occupied
      const occupant = occupants.find((o) => o.seatId === seat.id);

      if (occupant) {
        // Place 3D Avatar seated
        const isCurrent = occupant.sessionId === currentUser?.sessionId;
        const avatar = createAvatar3D(occupant, isCurrent);
        avatar.position.set(seat.position[0], seat.position[1], seat.position[2]);
        avatar.rotation.y = seat.rotationY;
        scene.add(avatar);
      } else {
        // Empty Seat: Interactive Click Marker
        const markerGroup = new THREE.Group();
        markerGroup.position.set(seat.position[0], seat.position[1] + 0.2, seat.position[2]);

        const discGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
        const discMat = new THREE.MeshLambertMaterial({
          color: '#2d5a43',
          emissive: '#10b981',
          emissiveIntensity: 0.3,
        });
        const disc = new THREE.Mesh(discGeo, discMat);
        markerGroup.add(disc);

        // Floating '+' Label Billboard
        const canvas2d = document.createElement('canvas');
        canvas2d.width = 64;
        canvas2d.height = 64;
        const ctx2d = canvas2d.getContext('2d');
        if (ctx2d) {
          ctx2d.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx2d.beginPath();
          ctx2d.arc(32, 32, 28, 0, Math.PI * 2);
          ctx2d.fill();

          ctx2d.font = 'bold 36px sans-serif';
          ctx2d.fillStyle = '#2d5a43';
          ctx2d.textAlign = 'center';
          ctx2d.textBaseline = 'middle';
          ctx2d.fillText('+', 32, 34);
        }

        const tex = new THREE.CanvasTexture(canvas2d);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
        sprite.position.y = 0.5;
        sprite.scale.set(0.65, 0.65, 1);
        markerGroup.add(sprite);

        scene.add(markerGroup);
        seatClickTargets.set(disc, seat.id);
      }
    });

    // 8. Raycaster on Canvas Click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const targets = Array.from(seatClickTargets.keys());
      const intersects = raycaster.intersectObjects(targets, false);

      if (intersects.length > 0) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'default';
      }
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const targets = Array.from(seatClickTargets.keys());
      const intersects = raycaster.intersectObjects(targets, false);

      if (intersects.length > 0) {
        const seatId = seatClickTargets.get(intersects[0].object);
        if (seatId) {
          // Check if taken
          const taken = occupants.find((o) => o.seatId === seatId && o.sessionId !== currentUser?.sessionId);
          if (taken) {
            setConflictMessage(`This seat is occupied by ${taken.name}.`);
            setTimeout(() => setConflictMessage(null), 3000);
            return;
          }
          soundService.playSitSound();
          onSelectSeat(seatId);
        }
      }
    };

    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('click', handleClick);

    // 9. Resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation Loop
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrameId.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      canvas.removeEventListener('mousemove', handlePointerMove);
      canvas.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
    };
  }, [locationId, occupants, currentUser, onSelectSeat, config]);

  const handleZoomIn = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.multiplyScalar(0.85);
    controlsRef.current.update();
  };

  const handleZoomOut = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.multiplyScalar(1.15);
    controlsRef.current.update();
  };

  const handleReset = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(config.cameraPosition[0], config.cameraPosition[1], config.cameraPosition[2]);
    controlsRef.current.target.set(config.cameraTarget[0], config.cameraTarget[1], config.cameraTarget[2]);
    controlsRef.current.update();
  };

  const isUserSeated = occupants.some((o) => o.sessionId === currentUser?.sessionId && o.seatId !== null);
  const currentSeat = config.seats.find((s) => s.id === currentUser?.seatId);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[680px] sm:h-[720px] rounded-3xl overflow-hidden shadow-2xl border-2 border-[#cde0d5] bg-[#f7f2ea]"
    >
      <canvas ref={canvasRef} className="w-full h-full block focus:outline-hidden" />

      {/* Top Header Bar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <button
          onClick={onBackToCampus}
          type="button"
          className="px-3.5 py-2 rounded-2xl bg-white/95 hover:bg-white text-[#2d5a43] text-xs font-semibold flex items-center gap-1.5 shadow-md border border-[#cde0d5] transition-all cursor-pointer hover:scale-105 active:scale-95"
          title="Return to 3D Campus Explorer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Campus Map</span>
        </button>

        <div className="px-3.5 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-[#cde0d5] shadow-md flex items-center gap-2 text-xs text-[#1e382b]">
          <span className="font-serif-title font-bold text-sm">{config.name}</span>
          <span className="text-[#648473]">•</span>
          <span className="text-[#2d5a43] font-semibold">{occupants.length} studying</span>
        </div>
      </div>

      {/* Seated Status Bar */}
      {isUserSeated && (
        <div className="absolute bottom-6 left-6 z-10">
          <div className="px-4 py-2.5 rounded-2xl bg-[#2d5a43] text-white shadow-xl flex items-center gap-2 text-xs font-semibold">
            <span>✨</span>
            <span>You are seated at {currentSeat?.name || 'Study Desk'}</span>
          </div>
        </div>
      )}

      {/* Conflict Alert */}
      {conflictMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-2xl bg-amber-100 border border-amber-300 text-amber-900 text-xs shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 text-amber-700" />
          <span>{conflictMessage}</span>
        </div>
      )}

      {/* Camera Controls HUD */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 backdrop-blur-md border border-[#cde0d5] shadow-md">
        <button
          onClick={handleZoomIn}
          type="button"
          className="p-1.5 rounded-xl hover:bg-[#edf5f0] text-[#2d5a43] transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          type="button"
          className="p-1.5 rounded-xl hover:bg-[#edf5f0] text-[#2d5a43] transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          type="button"
          className="p-1.5 rounded-xl hover:bg-[#edf5f0] text-[#2d5a43] transition-colors cursor-pointer"
          title="Reset Camera View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-4 right-4 z-10 px-3 py-1.5 rounded-xl bg-white/80 backdrop-blur-xs text-[11px] text-[#5e776a] font-medium shadow-xs">
        Click any green <span className="font-bold text-[#2d5a43]">+</span> marker to occupy a 3D seat
      </div>
    </div>
  );
};

