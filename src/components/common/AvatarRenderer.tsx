import React from 'react';
import type { AvatarConfig } from '../../types/studyverse';
import { AVATAR_CATALOG } from '../../constants/avatars';

export type ChibiPose = 'desk' | 'bench' | 'cafe' | 'tree' | 'default';

interface AvatarRendererProps {
  config?: AvatarConfig;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero' | 'map';
  showProp?: boolean;
  isSeated?: boolean;
  pose?: ChibiPose;
  className?: string;
  animate?: boolean;
}

export const AvatarRenderer: React.FC<AvatarRendererProps> = ({
  config: rawConfig,
  size = 'md',
  showProp = true,
  isSeated = false,
  pose = 'default',
  className = '',
  animate = true,
}) => {
  const fallback = AVATAR_CATALOG[0];
  const config: AvatarConfig = {
    ...fallback,
    ...(rawConfig || {}),
    clothingColor:
      rawConfig?.clothingColor ||
      (rawConfig as unknown as { shirtColor?: string })?.shirtColor ||
      fallback.clothingColor,
    accentColor: rawConfig?.accentColor || fallback.accentColor,
    clothingStyle: rawConfig?.clothingStyle || fallback.clothingStyle,
    skinTone: rawConfig?.skinTone || fallback.skinTone,
    hairColor: rawConfig?.hairColor || fallback.hairColor,
    hairStyle: rawConfig?.hairStyle || fallback.hairStyle,
  };
  const sizeMap = {
    xs: { width: 34, height: 40 },
    map: { width: 44, height: 50 },
    sm: { width: 48, height: 56 },
    md: { width: 68, height: 78 },
    lg: { width: 96, height: 110 },
    xl: { width: 130, height: 148 },
    hero: { width: 170, height: 194 },
  };

  const { width, height } = sizeMap[size];

  // 1. Sitting Environment / Posture Elements
  const renderPoseBase = () => {
    switch (pose) {
      case 'tree':
        return (
          <g>
            {/* Soft grassy patch beneath avatar */}
            <ellipse cx="50" cy="91" rx="27" ry="5.5" fill="#4f7755" opacity="0.28" />
            <path d="M 26 91 Q 29 85 32 91 M 68 91 Q 71 85 74 91" stroke="#335639" strokeWidth="1.5" strokeLinecap="round" />
            {/* Cute crossed/folded legs */}
            <ellipse cx="38" cy="84" rx="9" ry="5.5" fill={config.clothingColor} />
            <ellipse cx="62" cy="84" rx="9" ry="5.5" fill={config.clothingColor} />
            {/* Little rounded sneakers */}
            <ellipse cx="33" cy="85.5" rx="4.5" ry="3.5" fill="#faf6f0" stroke="#c4b8a7" strokeWidth="0.8" />
            <ellipse cx="67" cy="85.5" rx="4.5" ry="3.5" fill="#faf6f0" stroke="#c4b8a7" strokeWidth="0.8" />
          </g>
        );

      case 'bench':
        return (
          <g>
            {/* Wooden bench slats */}
            <rect x="18" y="73" width="64" height="4" rx="1.5" fill="#9c6644" stroke="#7f4f24" strokeWidth="0.6" />
            <rect x="15" y="79" width="70" height="5" rx="2" fill="#b07d58" stroke="#7f4f24" strokeWidth="0.6" />
            <line x1="22" y1="84" x2="22" y2="93" stroke="#582f0e" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="78" y1="84" x2="78" y2="93" stroke="#582f0e" strokeWidth="2.5" strokeLinecap="round" />
            {/* Dangling legs */}
            <rect x="40" y="80" width="7" height="9" rx="3" fill={config.clothingColor} />
            <rect x="53" y="80" width="7" height="9" rx="3" fill={config.clothingColor} />
            {/* Little rounded shoes */}
            <ellipse cx="43.5" cy="89" rx="4.8" ry="3.2" fill="#faf7f2" stroke="#c2b6a5" strokeWidth="0.8" />
            <ellipse cx="56.5" cy="89" rx="4.8" ry="3.2" fill="#faf7f2" stroke="#c2b6a5" strokeWidth="0.8" />
          </g>
        );

      case 'cafe':
        return (
          <g>
            {/* Round bistro cafe table in front */}
            <ellipse cx="50" cy="83" rx="34" ry="7.5" fill="#fffdfa" stroke="#d5c7b3" strokeWidth="1.2" />
            <ellipse cx="50" cy="82" rx="30" ry="6" fill="#f4ece1" />
            <rect x="48.5" y="87" width="3" height="8" fill="#8c7a68" rx="1" />
          </g>
        );

      case 'desk':
        return (
          <g>
            {/* Sturdy study desk */}
            <rect x="15" y="76" width="70" height="6.5" rx="2" fill="#c49a6c" stroke="#9c7344" strokeWidth="0.8" />
            <line x1="17" y1="78" x2="83" y2="78" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
            <rect x="19" y="82" width="4" height="12" fill="#8a633a" />
            <rect x="77" y="82" width="4" height="12" fill="#8a633a" />
          </g>
        );

      default:
        return (
          <g>
            {/* Default cozy seated posture */}
            <ellipse cx="42" cy="85" rx="7" ry="4.5" fill={config.clothingColor} />
            <ellipse cx="58" cy="85" rx="7" ry="4.5" fill={config.clothingColor} />
            <ellipse cx="40" cy="87.5" rx="4.5" ry="3.2" fill="#faf6ee" stroke="#c7bcab" strokeWidth="0.8" />
            <ellipse cx="60" cy="87.5" rx="4.5" ry="3.2" fill="#faf6ee" stroke="#c7bcab" strokeWidth="0.8" />
          </g>
        );
    }
  };

  // 2. Chibi Hair Styles
  const renderHair = () => {
    const { hairStyle, hairColor } = config;

    switch (hairStyle) {
      case 'messy-bun':
        return (
          <g>
            {/* Top Bun with puffy chibi lobes */}
            <circle cx="50" cy="13" r="13" fill={hairColor} />
            <circle cx="44" cy="10" r="6" fill={hairColor} opacity="0.9" />
            <circle cx="56" cy="11" r="6" fill={hairColor} opacity="0.8" />
            {/* Cute Hair Tie / Scrunchie */}
            <path d="M 41 21 Q 50 18 59 21" stroke={config.accentColor} strokeWidth="3.2" fill="none" strokeLinecap="round" />
            {/* Front Chibi Bangs */}
            <path
              d="M 27 34 C 23 20, 39 15, 50 17 C 61 15, 77 20, 73 34 C 71 42, 65 48, 61 49 C 57 46, 59 34, 55 31 C 45 31, 43 46, 39 49 C 35 48, 29 42, 27 34 Z"
              fill={hairColor}
            />
            {/* Cute side wisps */}
            <path d="M 28 36 Q 26 48 31 52" stroke={hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 72 36 Q 74 48 69 52" stroke={hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </g>
        );

      case 'short-fade':
        return (
          <g>
            {/* Cropped textured chibi hair */}
            <path
              d="M 27 33 C 25 21, 39 15, 50 15 C 61 15, 75 21, 73 33 C 73 37, 72 39, 69 37 C 63 30, 57 26, 50 26 C 43 26, 37 30, 31 37 C 28 39, 27 37, 27 33 Z"
              fill={hairColor}
            />
            {/* Fade lines */}
            <path d="M 27 33 C 27 40, 28 43, 30 43" stroke={hairColor} strokeWidth="2" fill="none" />
            <path d="M 73 33 C 73 40, 72 43, 70 43" stroke={hairColor} strokeWidth="2" fill="none" />
          </g>
        );

      case 'wavy-curls':
        return (
          <g>
            {/* Bouncy volumetric top */}
            <ellipse cx="50" cy="20" rx="24" ry="12" fill={hairColor} />
            {/* Side bouncy curls */}
            <path
              d="M 27 28 Q 18 38 25 46 Q 19 54 26 62 Q 21 68 28 73"
              stroke={hairColor}
              strokeWidth="5.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 73 28 Q 82 38 75 46 Q 81 54 74 62 Q 79 68 72 73"
              stroke={hairColor}
              strokeWidth="5.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Curly bangs */}
            <path d="M 33 24 Q 44 20 50 27 Q 56 20 67 24" fill={hairColor} />
          </g>
        );

      case 'straight-bob':
        return (
          <g>
            {/* Sleek rounded chibi bob */}
            <path
              d="M 26 33 C 26 16, 74 16, 74 33 C 76 46, 75 57, 72 63 C 69 59, 70 42, 69 35 C 59 32, 41 32, 31 35 C 30 42, 31 59, 28 63 C 25 57, 24 46, 26 33 Z"
              fill={hairColor}
            />
            {/* Blunt fringe */}
            <rect x="32" y="24" width="36" height="6.5" rx="2" fill={hairColor} />
          </g>
        );

      case 'textured-afro':
        return (
          <g>
            {/* Fluffy rounded afro cloud */}
            <circle cx="50" cy="22" r="23" fill={hairColor} />
            <circle cx="32" cy="24" r="14" fill={hairColor} />
            <circle cx="68" cy="24" r="14" fill={hairColor} />
            <circle cx="40" cy="12" r="13" fill={hairColor} />
            <circle cx="60" cy="12" r="13" fill={hairColor} />
            <circle cx="50" cy="18" r="16" fill="none" stroke="#2a1f18" strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />
          </g>
        );

      case 'ponytail':
        return (
          <g>
            {/* High perky ponytail */}
            <path d="M 64 22 Q 83 20 84 36 Q 85 52 79 60" stroke={hairColor} strokeWidth="6.5" fill="none" strokeLinecap="round" />
            <circle cx="63" cy="23" r="4.5" fill={config.accentColor} />
            {/* Sleek bangs */}
            <path
              d="M 27 34 C 27 19, 42 16, 50 18 C 58 16, 73 19, 73 34 C 69 31, 58 27, 50 27 C 42 27, 31 31, 27 34 Z"
              fill={hairColor}
            />
          </g>
        );

      case 'beanie-hair':
        return (
          <g>
            {/* Hair strands poking out */}
            <path d="M 30 34 Q 29 44 33 48" stroke={hairColor} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 70 34 Q 71 44 67 48" stroke={hairColor} strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Knitted Beanie */}
            <path d="M 27 32 C 27 14, 73 14, 73 32 Z" fill={config.accentColor} />
            <rect x="24" y="28" width="52" height="7.5" rx="3.5" fill={config.accentColor} filter="brightness(0.9)" />
            {/* Beanie fold texture */}
            <line x1="30" y1="29" x2="30" y2="34" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
            <line x1="40" y1="29" x2="40" y2="34" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
            <line x1="50" y1="29" x2="50" y2="34" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
            <line x1="60" y1="29" x2="60" y2="34" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
            <line x1="70" y1="29" x2="70" y2="34" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
          </g>
        );

      default: // side-part
        return (
          <g>
            <path
              d="M 27 33 C 27 18, 50 16, 50 16 C 50 16, 73 18, 73 33 C 73 39, 72 42, 69 39 C 63 31, 54 26, 48 25 C 38 25, 32 31, 31 39 C 29 42, 27 39, 27 33 Z"
              fill={hairColor}
            />
            <path d="M 44 24 L 47 32" stroke={hairColor} strokeWidth="2" strokeLinecap="round" />
          </g>
        );
    }
  };

  // 3. Compact Chibi Clothing & Torso
  const renderClothing = () => {
    const { clothingStyle, clothingColor, accentColor } = config;

    switch (clothingStyle) {
      case 'sweater':
        return (
          <g>
            {/* Compact Sweater Torso */}
            <path d="M 30 57 Q 50 54 70 57 L 74 81 L 26 81 Z" fill={clothingColor} />
            {/* Ribbed Neck Collar */}
            <ellipse cx="50" cy="55" rx="13" ry="3.5" fill={clothingColor} filter="brightness(0.88)" />
            {/* Cable knit pattern lines */}
            <line x1="43" y1="59" x2="43" y2="80" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeDasharray="2.5,2.5" />
            <line x1="57" y1="59" x2="57" y2="80" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeDasharray="2.5,2.5" />
            {/* Rounded chibi shoulders */}
            <path d="M 30 57 Q 22 66 21 78 L 29 80 Z" fill={clothingColor} filter="brightness(0.95)" />
            <path d="M 70 57 Q 78 66 79 78 L 71 80 Z" fill={clothingColor} filter="brightness(0.95)" />
          </g>
        );

      case 'cardigan':
        return (
          <g>
            {/* Inner collared shirt */}
            <path d="M 42 53 L 50 61 L 58 53 Z" fill="#ffffff" />
            {/* Cardigan body */}
            <path d="M 30 57 Q 50 54 70 57 L 74 81 L 26 81 Z" fill={clothingColor} />
            {/* Deep V-Neck */}
            <path d="M 40 56 L 50 71 L 60 56 Z" fill="#f8f9fa" />
            {/* Buttons */}
            <circle cx="50" cy="74" r="1.3" fill="#3a2f26" />
            <circle cx="50" cy="78" r="1.3" fill="#3a2f26" />
          </g>
        );

      case 'hoodie-denim':
        return (
          <g>
            {/* Hoodie body */}
            <path d="M 30 57 Q 50 54 70 57 L 74 81 L 26 81 Z" fill={clothingColor} />
            {/* Hood collar */}
            <path d="M 35 54 Q 50 62 65 54 Q 62 63 50 63 Q 38 63 35 54 Z" fill={accentColor} />
            {/* Drawstrings */}
            <path d="M 46 63 L 45 74" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M 54 63 L 55 74" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" />
          </g>
        );

      case 'varsity':
        return (
          <g>
            {/* White/cream sleeves */}
            <path d="M 30 57 Q 21 66 20 78 L 28 80 Z" fill="#f5f3ec" />
            <path d="M 70 57 Q 79 66 80 78 L 72 80 Z" fill="#f5f3ec" />
            {/* Wool torso */}
            <path d="M 30 57 Q 50 54 70 57 L 72 81 L 28 81 Z" fill={clothingColor} />
            {/* Striped collar */}
            <ellipse cx="50" cy="55" rx="13" ry="3.5" fill={accentColor} />
            <ellipse cx="50" cy="55" rx="11" ry="2.5" fill={clothingColor} />
            {/* Initial */}
            <text x="37" y="68" fontSize="7" fontWeight="bold" fill={accentColor} fontFamily="serif">S</text>
          </g>
        );

      case 'flannel':
        return (
          <g>
            {/* Undershirt */}
            <path d="M 44 53 L 50 60 L 56 53 Z" fill="#f2eee7" />
            {/* Plaid overshirt */}
            <path d="M 30 57 Q 50 54 70 57 L 74 81 L 26 81 Z" fill={clothingColor} />
            {/* Plaid grid */}
            <line x1="38" y1="56" x2="38" y2="81" stroke={accentColor} strokeWidth="1.2" opacity="0.5" />
            <line x1="62" y1="56" x2="62" y2="81" stroke={accentColor} strokeWidth="1.2" opacity="0.5" />
            <line x1="26" y1="68" x2="74" y2="68" stroke={accentColor} strokeWidth="1.2" opacity="0.5" />
          </g>
        );

      default: // turtleneck
        return (
          <g>
            {/* Rollneck */}
            <rect x="43" y="49" width="14" height="8" rx="2.5" fill={clothingColor} filter="brightness(0.9)" />
            <line x1="47" y1="50" x2="47" y2="56" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            <line x1="50" y1="50" x2="50" y2="56" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            <line x1="53" y1="50" x2="53" y2="56" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            {/* Body */}
            <path d="M 30 57 Q 50 54 70 57 L 74 81 L 26 81 Z" fill={clothingColor} />
          </g>
        );
    }
  };

  // 4. Accessories
  const renderAccessory = () => {
    const { accessory } = config;

    switch (accessory) {
      case 'glasses':
        return (
          <g>
            {/* Round wireframe chibi glasses */}
            <circle cx="39.5" cy="37" r="5.5" fill="rgba(255,255,255,0.3)" stroke="#4a3322" strokeWidth="1.4" />
            <circle cx="60.5" cy="37" r="5.5" fill="rgba(255,255,255,0.3)" stroke="#4a3322" strokeWidth="1.4" />
            <line x1="45" y1="37" x2="55" y2="37" stroke="#4a3322" strokeWidth="1.4" />
            <line x1="34" y1="37" x2="28" y2="35" stroke="#4a3322" strokeWidth="1.2" />
            <line x1="66" y1="37" x2="72" y2="35" stroke="#4a3322" strokeWidth="1.2" />
            {/* Cute glint */}
            <path d="M 37 34 L 41 34" stroke="rgba(255,255,255,0.7)" strokeWidth="1" strokeLinecap="round" />
          </g>
        );

      case 'headphones':
        return (
          <g>
            <path d="M 25 38 C 25 15, 75 15, 75 38" stroke="#2c2a29" strokeWidth="3.8" fill="none" strokeLinecap="round" />
            <rect x="23" y="32" width="6" height="12" rx="3" fill={config.accentColor} stroke="#2c2a29" strokeWidth="1" />
            <rect x="71" y="32" width="6" height="12" rx="3" fill={config.accentColor} stroke="#2c2a29" strokeWidth="1" />
          </g>
        );

      case 'earbuds':
        return (
          <g>
            <circle cx="28" cy="38" r="2" fill="#ffffff" stroke="#c0c0c0" strokeWidth="0.8" />
            <circle cx="72" cy="38" r="2" fill="#ffffff" stroke="#c0c0c0" strokeWidth="0.8" />
          </g>
        );

      case 'scarf':
        return (
          <g>
            <ellipse cx="50" cy="54" rx="16" ry="5.5" fill={config.accentColor} />
            <path d="M 52 57 L 56 74 L 63 73 L 59 56 Z" fill={config.accentColor} filter="brightness(0.85)" />
            <line x1="56" y1="74" x2="63" y2="73" stroke="#fff" strokeWidth="1.2" strokeDasharray="1,1" />
          </g>
        );

      default:
        return null;
    }
  };

  // 5. Study Activity Props (Laptop, Book, Notebook, Coffee)
  const renderStudyProp = () => {
    if (!showProp) return null;
    const { activity } = config;

    switch (activity) {
      case 'typing':
        return (
          <g transform="translate(0, 0)">
            {/* Compact laptop base */}
            <polygon points="32,74 68,74 65,80 35,80" fill="#9ca3af" />
            {/* Laptop screen */}
            <polygon points="36,64 64,64 66,74 34,74" fill="#374151" />
            {/* Glowing screen content */}
            <rect x="37" y="65" width="26" height="8.5" rx="1" fill="#e0f2fe" opacity="0.95" />
            <line x1="39" y1="67.5" x2="52" y2="67.5" stroke="#3b82f6" strokeWidth="0.9" />
            <line x1="39" y1="69.5" x2="58" y2="69.5" stroke="#10b981" strokeWidth="0.9" />
            <line x1="39" y1="71.5" x2="48" y2="71.5" stroke="#6366f1" strokeWidth="0.9" />
            {/* Chibi typing hands */}
            <circle cx="39" cy="77" r="3" fill={config.skinTone} />
            <circle cx="61" cy="77" r="3" fill={config.skinTone} />
          </g>
        );

      case 'writing':
        return (
          <g transform="translate(0, 0)">
            {/* Open notebook */}
            <polygon points="36,66 49,69 49,81 36,78" fill="#fffdfa" stroke="#d5cebf" strokeWidth="0.8" />
            <polygon points="49,69 62,66 62,78 49,81" fill="#fffdfa" stroke="#d5cebf" strokeWidth="0.8" />
            <line x1="49" y1="69" x2="49" y2="81" stroke="#b0a898" strokeWidth="1" />
            <line x1="38" y1="71" x2="46" y2="73" stroke="#c4bead" strokeWidth="0.8" />
            <line x1="38" y1="74" x2="46" y2="76" stroke="#c4bead" strokeWidth="0.8" />
            {/* Chibi hand with pen */}
            <circle cx="55" cy="74" r="2.8" fill={config.skinTone} />
            <line x1="53" y1="76" x2="58" y2="70" stroke="#475569" strokeWidth="1.4" strokeLinecap="round" />
          </g>
        );

      case 'coffee':
        return (
          <g transform="translate(0, 0)">
            {/* Ceramic Mug */}
            <rect x="45" y="70" width="10" height="11" rx="2" fill={config.accentColor} stroke="#fff" strokeWidth="0.8" />
            <path d="M 55 72 Q 58 74 55 77" stroke="#fff" strokeWidth="1.2" fill="none" />
            {/* Steam wisps */}
            <path d="M 48 67 Q 46 64 48 62" stroke="rgba(255,255,255,0.75)" strokeWidth="1" fill="none" className="animate-steam" />
            {/* Chibi hands holding mug */}
            <circle cx="43" cy="75" r="3" fill={config.skinTone} />
            <circle cx="57" cy="75" r="3" fill={config.skinTone} />
          </g>
        );

      default: // reading
        return (
          <g transform="translate(0, 0)">
            {/* Open Hardcover Book */}
            <polygon points="35,66 49,69 49,81 35,78" fill="#fffdfa" stroke="#d5c8b5" strokeWidth="0.8" />
            <polygon points="49,69 63,66 63,78 49,81" fill="#fffdfa" stroke="#d5c8b5" strokeWidth="0.8" />
            <path d="M 34 78 Q 49 82 64 78 L 65 79 Q 49 83 33 79 Z" fill={config.clothingColor} />
            <line x1="49" y1="69" x2="49" y2="81" stroke="#a09480" strokeWidth="1" />
            {/* Bookmark ribbon */}
            <path d="M 49 69 Q 52 75 50 82" stroke={config.accentColor} strokeWidth="1.2" fill="none" />
            {/* Chibi hands holding book */}
            <circle cx="38" cy="77" r="2.8" fill={config.skinTone} />
            <circle cx="60" cy="77" r="2.8" fill={config.skinTone} />
          </g>
        );
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${
        animate ? 'animate-idle' : ''
      } ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <svg
        viewBox="0 0 100 100"
        width={width}
        height={height}
        className="w-full h-full overflow-visible drop-shadow-xs"
      >
        {/* Soft Drop shadow under character */}
        <ellipse cx="50" cy="95" rx={isSeated ? 26 : 22} ry="4.5" fill="rgba(35, 25, 20, 0.12)" />

        {/* Sitting Posture / Location Foundation Base */}
        {renderPoseBase()}

        {/* Torso & Clothing */}
        {renderClothing()}

        {/* Short Cute Neck */}
        <rect x="46" y="48" width="8" height="6" rx="2" fill={config.skinTone} filter="brightness(0.94)" />

        {/* Adorable Chibi Head & Cheeks */}
        <path
          d="M 29 34 C 29 20, 71 20, 71 34 C 72 44, 68 53, 59 55 C 55 56, 45 56, 41 55 C 32 53, 28 44, 29 34 Z"
          fill={config.skinTone}
        />

        {/* Chubby Rosy Blushing Cheeks */}
        <ellipse cx="36" cy="43" rx="4.5" ry="2.2" fill="#ff9999" opacity="0.45" />
        <ellipse cx="64" cy="43" rx="4.5" ry="2.2" fill="#ff9999" opacity="0.45" />

        {/* Petite Chibi Ears */}
        <circle cx="27" cy="36" r="3.5" fill={config.skinTone} />
        <circle cx="73" cy="36" r="3.5" fill={config.skinTone} />
        <circle cx="27" cy="36" r="1.8" fill="#ffb4a2" opacity="0.4" />
        <circle cx="73" cy="36" r="1.8" fill="#ffb4a2" opacity="0.4" />

        {/* Big Sparkling Expressive Chibi Eyes */}
        <g>
          {/* Left Eye */}
          <path d="M 34.5 33.5 Q 39.5 30.5 44.5 33.5" stroke="#221811" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <ellipse cx="39.5" cy="37" rx="3.8" ry="4.8" fill="#241810" />
          <circle cx="38.5" cy="35.5" r="1.6" fill="#ffffff" />
          <circle cx="41.5" cy="39" r="0.9" fill="#ffffff" />
          <path d="M 36.5 41 Q 39.5 42 42.5 41" stroke="#443226" strokeWidth="0.8" opacity="0.5" fill="none" />

          {/* Right Eye */}
          <path d="M 55.5 33.5 Q 60.5 30.5 65.5 33.5" stroke="#221811" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <ellipse cx="60.5" cy="37" rx="3.8" ry="4.8" fill="#241810" />
          <circle cx="59.5" cy="35.5" r="1.6" fill="#ffffff" />
          <circle cx="62.5" cy="39" r="0.9" fill="#ffffff" />
          <path d="M 57.5 41 Q 60.5 42 63.5 41" stroke="#443226" strokeWidth="0.8" opacity="0.5" fill="none" />
        </g>

        {/* Friendly Eyebrows */}
        <path d="M 35 29 Q 39.5 27 44 29" stroke="#362215" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.8" />
        <path d="M 56 29 Q 60.5 27 65 29" stroke="#362215" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.8" />

        {/* Sweet Gentle Smile */}
        <path d="M 47.5 46.5 Q 50 49 52.5 46.5" stroke="#4a2e1b" strokeWidth="1.4" strokeLinecap="round" fill="none" />

        {/* Hair Layer */}
        {renderHair()}

        {/* Accessories Layer */}
        {renderAccessory()}

        {/* Study Prop Layer */}
        {renderStudyProp()}
      </svg>
    </div>
  );
};
