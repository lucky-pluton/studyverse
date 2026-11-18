import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import type { LocationId, StudentPresence, TimeOfDay } from '../../types/studyverse';
import { CAMPUS_3D_BUILDINGS } from '../../constants/threeDCoordinates';
import { createCampusTerrain } from './CampusTerrain';
import { createCampusRoads } from './CampusRoads';
import { createCampusBuildings } from './CampusBuildings';
import { createCampusGreenery } from './CampusGreenery';
import { CampusCameraController } from './CampusCamera';
import { BuildingInteractionManager } from './BuildingInteraction';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface Campus3DCanvasProps {
  allStudents: StudentPresence[];
  currentUser: StudentPresence | null;
  onSelectBuilding: (locationId: LocationId | null) => void;
  onEnterBuilding: (locationId: LocationId) => void;
  selectedBuilding: LocationId | null;
  timeOfDay: TimeOfDay;
  cameraTriggerReset?: number;
  cameraTriggerFocus?: LocationId | null;
}

export const Campus3DCanvas: React.FC<Campus3DCanvasProps> = ({
  allStudents: _allStudents,
  currentUser: _currentUser,
  onSelectBuilding,
  onEnterBuilding,
  selectedBuilding,
  timeOfDay,
  cameraTriggerReset,
  cameraTriggerFocus,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hoveredBuilding, setHoveredBuilding] = useState<LocationId | null>(null);
  const selectedBuildingRef = useRef<LocationId | null>(selectedBuilding);

  useEffect(() => {
    selectedBuildingRef.current = selectedBuilding;
  }, [selectedBuilding]);

  // Controller and Three.js references
  const cameraControllerRef = useRef<CampusCameraController | null>(null);
  const interactionManagerRef = useRef<BuildingInteractionManager | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const nightLightsGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Time of Day Dynamic Lighting & Atmosphere
  const applyTimeOfDay = useCallback((tod: TimeOfDay, scene: THREE.Scene, dirLight: THREE.DirectionalLight, hemiLight: THREE.HemisphereLight) => {
    if (nightLightsGroupRef.current) {
      nightLightsGroupRef.current.visible = (tod === 'night');
    }
    if (tod === 'night') {
      const nightSky = new THREE.Color('#0f172a');
      scene.background = nightSky;
      scene.fog = new THREE.FogExp2('#0f172a', 0.009);
      dirLight.color.set('#64748b');
      dirLight.intensity = 0.55;
      dirLight.position.set(-20, 35, -20);
      hemiLight.color.set('#334155');
      hemiLight.groundColor.set('#0f172a');
      hemiLight.intensity = 0.6;
    } else if (tod === 'sunset') {
      const sunsetSky = new THREE.Color('#fed7aa');
      scene.background = sunsetSky;
      scene.fog = new THREE.FogExp2('#fed7aa', 0.008);
      dirLight.color.set('#f97316');
      dirLight.intensity = 1.25;
      dirLight.position.set(50, 25, 40);
      hemiLight.color.set('#ffedd5');
      hemiLight.groundColor.set('#7c2d12');
      hemiLight.intensity = 0.75;
    } else {
      // Day (Fresh clear campus atmosphere)
      const daySky = new THREE.Color('#dceef5');
      scene.background = daySky;
      scene.fog = new THREE.FogExp2('#dceef5', 0.007);
      dirLight.color.set('#fffdf5');
      dirLight.intensity = 1.15;
      dirLight.position.set(45, 55, 35);
      hemiLight.color.set('#ffffff');
      hemiLight.groundColor.set('#9fc3a8');
      hemiLight.intensity = 0.85;
    }
  }, []);

  // Update lighting when timeOfDay prop changes
  useEffect(() => {
    if (sceneRef.current && dirLightRef.current && hemiLightRef.current) {
      applyTimeOfDay(timeOfDay, sceneRef.current, dirLightRef.current, hemiLightRef.current);
    }
  }, [timeOfDay, applyTimeOfDay]);

  // Handle external camera triggers (e.g. from Navigation HUD)
  useEffect(() => {
    if (cameraTriggerReset && cameraControllerRef.current) {
      cameraControllerRef.current.resetToOverview();
    }
  }, [cameraTriggerReset]);

  useEffect(() => {
    if (cameraTriggerFocus && cameraControllerRef.current) {
      const target = CAMPUS_3D_BUILDINGS.find((b) => b.id === cameraTriggerFocus);
      if (target) {
        cameraControllerRef.current.focusBuilding(target.position as [number, number, number]);
      }
    }
  }, [cameraTriggerFocus]);

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera & Camera Controller
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 800);
    const cameraController = new CampusCameraController(camera, canvas);
    cameraControllerRef.current = cameraController;

    // 3. Renderer with high performance: light, responsive 60 FPS rendering
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    // 4. Lighting Setup (Soft, balanced ambient & directional sunlight without heavy shadow passes)
    const hemiLight = new THREE.HemisphereLight('#ffffff', '#9fc3a8', 0.9);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const dirLight = new THREE.DirectionalLight('#fffdf5', 1.2);
    dirLight.position.set(45, 55, 35);
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    applyTimeOfDay(timeOfDay, scene, dirLight, hemiLight);

    // Warm Campus Night Streetlights / Illumination
    const nightLights = new THREE.Group();
    nightLights.name = 'night-lights';
    const lightPositions: [number, number, number][] = [
      [0, 4.5, 0],       // Gajendra Circle
      [28, 4.0, -28],    // Central Library
      [-34, 4.0, -26],   // LHC
      [-28, 3.5, 30],    // Cafe
      [32, 3.5, 30],     // Sangam Gardens
      [-28, 3.5, 8],     // Banyan Grove
      [32, 3.5, -10],    // OAT
    ];
    lightPositions.forEach(([lx, ly, lz]) => {
      const pl = new THREE.PointLight('#fed7aa', 1.8, 25, 1.2);
      pl.position.set(lx, ly, lz);
      nightLights.add(pl);
    });
    nightLights.visible = (timeOfDay === 'night');
    scene.add(nightLights);
    nightLightsGroupRef.current = nightLights;

    // 5. Modular Campus Elements
    // A. Spacious Terrain
    const terrain = createCampusTerrain();
    scene.add(terrain);

    // B. Roads, Roundabout & Pathways
    const roads = createCampusRoads();
    scene.add(roads);

    // C. 7 Distinct Architectural Buildings & Landmarks
    const { buildingsGroup, clickableMap } = createCampusBuildings();
    scene.add(buildingsGroup);

    // D. Well-Spaced Campus Greenery
    const greenery = createCampusGreenery();
    scene.add(greenery);

    // 6. Interaction Manager for raycasting
    const interactionManager = new BuildingInteractionManager(camera, clickableMap);
    interactionManagerRef.current = interactionManager;

    // Pointer move listener with ~30ms throttle for silky smooth 60 FPS
    let lastMoveTime = 0;
    const handlePointerMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastMoveTime < 32) return;
      lastMoveTime = now;

      const rect = canvas.getBoundingClientRect();
      const { locationId, mesh } = interactionManager.checkIntersection(e.clientX, e.clientY, rect);
      setHoveredBuilding(locationId);
      interactionManager.applyHoverHighlight(mesh);
      canvas.style.cursor = locationId ? 'pointer' : 'default';
    };

    // Instant double-click to directly enter the study room
    const handleDblClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const { locationId } = interactionManager.checkIntersection(e.clientX, e.clientY, rect);
      if (locationId) {
        onEnterBuilding(locationId);
      }
    };

    // Pointer click listener with double-click / re-click to enter
    let lastClickTime = 0;
    let lastClickedId: LocationId | null = null;

    const handlePointerDown = (e: PointerEvent) => {
      const startX = e.clientX;
      const startY = e.clientY;

      const handlePointerUp = (upEvent: PointerEvent) => {
        const dist = Math.hypot(upEvent.clientX - startX, upEvent.clientY - startY);
        if (dist < 6) {
          const rect = canvas.getBoundingClientRect();
          const { locationId } = interactionManager.checkIntersection(upEvent.clientX, upEvent.clientY, rect);
          const now = performance.now();
          const isQuickDoubleTap = (now - lastClickTime < 400) && (lastClickedId === locationId);
          lastClickTime = now;
          lastClickedId = locationId;

          if (locationId) {
            // If already focused or clicked again, immediately enter!
            if (locationId === selectedBuildingRef.current || isQuickDoubleTap) {
              onEnterBuilding(locationId);
            } else {
              onSelectBuilding(locationId);
              const target = CAMPUS_3D_BUILDINGS.find((b) => b.id === locationId);
              if (target) {
                cameraController.focusBuilding(target.position as [number, number, number]);
              }
            }
          } else {
            onSelectBuilding(null);
          }
        }
        window.removeEventListener('pointerup', handlePointerUp);
      };

      window.addEventListener('pointerup', handlePointerUp);
    };

    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('dblclick', handleDblClick);

    // 7. Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 8. Animation Render Loop
    const animate = () => {
      cameraController.update();
      renderer.render(scene, camera);
      animationFrameId.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      canvas.removeEventListener('mousemove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('dblclick', handleDblClick);
      window.removeEventListener('resize', handleResize);
      cameraController.dispose();
      interactionManager.clearHover();
      renderer.dispose();
    };
  }, [onSelectBuilding, onEnterBuilding, applyTimeOfDay]);

  // Zoom HUD button handlers
  const handleZoomIn = () => {
    if (cameraControllerRef.current) {
      const controls = cameraControllerRef.current.getControls();
      controls.dollyIn(1.2);
      controls.update();
    }
  };

  const handleZoomOut = () => {
    if (cameraControllerRef.current) {
      const controls = cameraControllerRef.current.getControls();
      controls.dollyOut(1.2);
      controls.update();
    }
  };

  const handleReset = () => {
    if (cameraControllerRef.current) {
      cameraControllerRef.current.resetToOverview();
      onSelectBuilding(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden bg-[#dceef5]"
    >
      <canvas ref={canvasRef} className="w-full h-full block touch-none" />

      {/* Floating Hover Label (Subtle, desktop-only, no visual clutter) */}
      {hoveredBuilding && (
        <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#cbe1d5] shadow-lg text-xs font-semibold text-[#1d3527] animate-in fade-in zoom-in-95 duration-150 flex items-center gap-2">
          <span>{CAMPUS_3D_BUILDINGS.find((b) => b.id === hoveredBuilding)?.name}</span>
          <span className="text-[10px] text-emerald-800 font-bold px-2 py-0.5 rounded-full bg-emerald-100 flex items-center gap-1">
            {hoveredBuilding === selectedBuilding ? '↵ Click or double-click to enter' : 'Click to focus · Double-click to enter'}
          </span>
        </div>
      )}

      {/* Top-Right HUD Controls: Zoom In / Zoom Out / Reset */}
      <div className="absolute top-4 right-4 z-40 bg-white/92 backdrop-blur-md rounded-full px-2 py-1 flex items-center gap-1 border border-[#cbe1d5] shadow-md">
        <button
          onClick={handleZoomIn}
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#2c4235] hover:bg-black/5 transition-colors cursor-pointer"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-[#2c4235]" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#2c4235] hover:bg-black/5 transition-colors cursor-pointer"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-[#2c4235]" />
        </button>
        <button
          onClick={handleReset}
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#2c4235] hover:bg-black/5 transition-colors cursor-pointer"
          title="Reset Camera"
          aria-label="Reset Camera"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#2c4235]" />
        </button>
      </div>
    </div>
  );
};
