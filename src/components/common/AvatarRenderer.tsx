import React, { useId } from 'react';
import type { AvatarConfig, LocationId, StudyStatus } from '../../types/studyverse';
import { AVATAR_CATALOG, STUDY_STATUSES } from '../../constants/avatars';

export type ChibiPose =
  | 'library'
  | 'lhc'
  | 'banyan'
  | 'oat'
  | 'cafe'
  | 'park'
  | 'gc'
  | 'desk'
  | 'bench'
  | 'tree'
  | 'default';

interface AvatarRendererProps {
  config?: AvatarConfig;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero' | 'map';
  showProp?: boolean;
  isSeated?: boolean;
  pose?: ChibiPose;
  locationId?: LocationId;
  className?: string;
  animate?: boolean;
  showStatusBadge?: boolean;
  status?: StudyStatus;
}

export const AvatarRenderer: React.FC<AvatarRendererProps> = ({
  config: rawConfig,
  size = 'md',
  showProp = true,
  isSeated = false,
  pose: rawPose,
  locationId,
  className = '',
  animate = true,
  showStatusBadge = false,
  status: propStatus,
}) => {
  const uniqueId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
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
    activity: rawConfig?.activity || fallback.activity,
    accessory: rawConfig?.accessory !== undefined ? rawConfig.accessory : fallback.accessory,
    hasBackpack: rawConfig?.hasBackpack ?? (rawConfig?.accessory === 'backpack' || fallback.hasBackpack),
  };

  const activeStatus: StudyStatus = propStatus || config.status || 'studying';
  const statusDef = STUDY_STATUSES.find((s) => s.id === activeStatus) || STUDY_STATUSES[1];

  // Resolve pose: prefer explicit locationId, then rawPose, then default
  let resolvedPose: ChibiPose = rawPose || 'default';
  if (locationId) {
    if (locationId === 'library') resolvedPose = 'library';
    else if (locationId === 'lhc') resolvedPose = 'lhc';
    else if (locationId === 'banyan') resolvedPose = 'banyan';
    else if (locationId === 'oat') resolvedPose = 'oat';
    else if (locationId === 'cafe') resolvedPose = 'cafe';
    else if (locationId === 'park') resolvedPose = 'park';
    else if (locationId === 'gc') resolvedPose = 'gc';
  }

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

  // Helper colors for 2.5D soft volumetric shading
  const skinTone = config.skinTone;
  const hairColor = config.hairColor;
  const clothingColor = config.clothingColor;
  const accentColor = config.accentColor;

  const skinGradId = `skin-grad-${uniqueId}`;
  const hairGradId = `hair-grad-${uniqueId}`;
  const clothGradId = `cloth-grad-${uniqueId}`;
  const shadowFilterId = `shadow-${uniqueId}`;

  // =========================================================================
  // 1. Destination / Sitting Base Foundation
  // =========================================================================
  const renderPoseBase = () => {
    switch (resolvedPose) {
      // 1. Central Library: Rich mahogany study desk with brass banker lamp
      case 'library':
      case 'desk':
        return (
          <g>
            {/* Wooden study table slab */}
            <rect x="12" y="74" width="76" height="7.5" rx="2.5" fill="#8d5f38" stroke="#684223" strokeWidth="0.8" />
            <line x1="14" y1="76" x2="86" y2="76" stroke="rgba(255,255,255,0.35)" strokeWidth="0.9" />
            <rect x="18" y="81.5" width="4.5" height="13" rx="1" fill="#58381c" />
            <rect x="77.5" y="81.5" width="4.5" height="13" rx="1" fill="#58381c" />
            {/* Mini classic green banker lamp on side */}
            <g transform="translate(18, 59)">
              <ellipse cx="6" cy="14" rx="4" ry="1.5" fill="#d4af37" />
              <path d="M 6 14 L 6 6" stroke="#c59b27" strokeWidth="1.2" strokeLinecap="round" />
              <rect x="0" y="3" width="12" height="4.5" rx="2" fill="#2d6a4f" stroke="#1b4332" strokeWidth="0.6" />
              <ellipse cx="6" cy="8.5" rx="7" ry="3.5" fill="#fff3b0" opacity="0.32" />
            </g>
          </g>
        );

      // 2. Lecture Hall Complex: Tiered auditorium desk facing forward
      case 'lhc':
        return (
          <g>
            {/* Curved lecture tier wood ledge */}
            <path d="M 10 74 Q 50 71 90 74 L 88 81 Q 50 78 12 81 Z" fill="#b07d58" stroke="#8a5b36" strokeWidth="0.8" />
            <line x1="12" y1="75.5" x2="88" y2="75.5" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
            {/* Sturdy steel riser support posts */}
            <rect x="20" y="81" width="4" height="13" rx="1" fill="#4a5568" />
            <rect x="76" y="81" width="4" height="13" rx="1" fill="#4a5568" />
            {/* Front lecture tier edge */}
            <rect x="8" y="93" width="84" height="2" rx="1" fill="#718096" opacity="0.4" />
          </g>
        );

      // 3. Banyan Tree Grove: Timber stool & grassy clover lawn
      case 'banyan':
      case 'tree':
        return (
          <g>
            {/* Soft grassy patch beneath avatar */}
            <ellipse cx="50" cy="92" rx="29" ry="5.5" fill="#4f7755" opacity="0.3" />
            <path d="M 24 92 Q 28 86 31 92 M 69 92 Q 72 86 76 92" stroke="#2d5a38" strokeWidth="1.5" strokeLinecap="round" />
            {/* Rustic tree stump / log stool */}
            <ellipse cx="50" cy="84" rx="22" ry="5.5" fill="#a06d44" stroke="#754823" strokeWidth="0.8" />
            <path d="M 28 84 C 28 89, 72 89, 72 84 L 72 90 C 72 95, 28 95, 28 90 Z" fill="#835229" stroke="#683d1c" strokeWidth="0.8" />
            {/* Cute crossed/folded legs */}
            <ellipse cx="38" cy="84" rx="9" ry="5.5" fill={clothingColor} />
            <ellipse cx="62" cy="84" rx="9" ry="5.5" fill={clothingColor} />
            {/* Little rounded sneakers */}
            <ellipse cx="33" cy="86" rx="4.5" ry="3.2" fill="#faf6f0" stroke="#c4b8a7" strokeWidth="0.8" />
            <ellipse cx="67" cy="86" rx="4.5" ry="3.2" fill="#faf6f0" stroke="#c4b8a7" strokeWidth="0.8" />
          </g>
        );

      // 4. Open Air Theatre: Polished granite amphitheatre step
      case 'oat':
        return (
          <g>
            {/* Carved stone amphitheatre steps */}
            <path d="M 8 78 Q 50 73 92 78 L 94 86 Q 50 81 6 86 Z" fill="#d9cfc1" stroke="#b5a794" strokeWidth="0.8" />
            <line x1="9" y1="79.5" x2="91" y2="79.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
            {/* Step riser */}
            <path d="M 6 86 Q 50 81 94 86 L 95 94 Q 50 89 5 94 Z" fill="#c4b7a2" stroke="#9e8f7a" strokeWidth="0.8" />
            {/* Seated crossed legs on stone step */}
            <ellipse cx="38" cy="81" rx="8.5" ry="5" fill={clothingColor} />
            <ellipse cx="62" cy="81" rx="8.5" ry="5" fill={clothingColor} />
            <ellipse cx="33" cy="83.5" rx="4.5" ry="3" fill="#faf6f0" stroke="#c4b8a7" strokeWidth="0.8" />
            <ellipse cx="67" cy="83.5" rx="4.5" ry="3" fill="#faf6f0" stroke="#c4b8a7" strokeWidth="0.8" />
          </g>
        );

      // 5. Campus Café: Round bistro cafe tabletop with saucer
      case 'cafe':
        return (
          <g>
            {/* Bistro round tabletop */}
            <ellipse cx="50" cy="84" rx="35" ry="8" fill="#fffdfa" stroke="#d5c7b3" strokeWidth="1.2" />
            <ellipse cx="50" cy="83" rx="31" ry="6.5" fill="#f4ece1" />
            <line x1="20" y1="83" x2="80" y2="83" stroke="rgba(255,255,255,0.8)" strokeWidth="0.8" />
            {/* Center pedestal iron column */}
            <rect x="48.5" y="88" width="3" height="8" rx="1" fill="#4a5568" />
          </g>
        );

      // 6. Sangam Gardens: Wooden garden bench with ornate black cast-iron sides
      case 'park':
      case 'bench':
        return (
          <g>
            {/* Wooden park bench slats */}
            <rect x="16" y="73" width="68" height="4" rx="1.5" fill="#a06a42" stroke="#7a4a25" strokeWidth="0.6" />
            <rect x="13" y="79" width="74" height="5" rx="2" fill="#b87f54" stroke="#7a4a25" strokeWidth="0.6" />
            {/* Cast iron ornamental bench legs */}
            <line x1="20" y1="84" x2="20" y2="94" stroke="#2d3748" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="80" y1="84" x2="80" y2="94" stroke="#2d3748" strokeWidth="2.8" strokeLinecap="round" />
            {/* Dangling legs */}
            <rect x="39" y="80" width="7.5" height="9.5" rx="3" fill={clothingColor} />
            <rect x="53.5" y="80" width="7.5" height="9.5" rx="3" fill={clothingColor} />
            <ellipse cx="42.5" cy="90" rx="4.8" ry="3.2" fill="#faf7f2" stroke="#c2b6a5" strokeWidth="0.8" />
            <ellipse cx="57" cy="90" rx="4.8" ry="3.2" fill="#faf7f2" stroke="#c2b6a5" strokeWidth="0.8" />
          </g>
        );

      // 7. Gajendra Circle: Circular paved stone promenade seating curb
      case 'gc':
        return (
          <g>
            {/* Circular stone plaza curb */}
            <path d="M 12 79 Q 50 74 88 79 L 89 87 Q 50 82 11 87 Z" fill="#e8dfd5" stroke="#c4b6a5" strokeWidth="0.8" />
            <line x1="13" y1="80.5" x2="87" y2="80.5" stroke="rgba(255,255,255,0.6)" strokeWidth="0.9" />
            {/* Cobblestone paving details */}
            <line x1="32" y1="81" x2="31" y2="86" stroke="#b8a896" strokeWidth="0.8" />
            <line x1="50" y1="80" x2="50" y2="85" stroke="#b8a896" strokeWidth="0.8" />
            <line x1="68" y1="81" x2="69" y2="86" stroke="#b8a896" strokeWidth="0.8" />
            {/* Seated posture */}
            <ellipse cx="40" cy="83" rx="8" ry="5" fill={clothingColor} />
            <ellipse cx="60" cy="83" rx="8" ry="5" fill={clothingColor} />
            <ellipse cx="36" cy="86" rx="4.5" ry="3" fill="#faf6f0" stroke="#c4b8a7" strokeWidth="0.8" />
            <ellipse cx="64" cy="86" rx="4.5" ry="3" fill="#faf6f0" stroke="#c4b8a7" strokeWidth="0.8" />
          </g>
        );

      default:
        return (
          <g>
            {/* Seated posture legs */}
            <ellipse cx="41" cy="85" rx="7.5" ry="4.5" fill={clothingColor} />
            <ellipse cx="59" cy="85" rx="7.5" ry="4.5" fill={clothingColor} />
            <ellipse cx="38" cy="88" rx="4.5" ry="3.2" fill="#faf6ee" stroke="#c7bcab" strokeWidth="0.8" />
            <ellipse cx="62" cy="88" rx="4.5" ry="3.2" fill="#faf6ee" stroke="#c7bcab" strokeWidth="0.8" />
          </g>
        );
    }
  };

  // =========================================================================
  // 2. Backpack Layer (Behind Torso & Shoulders)
  // =========================================================================
  const renderBackpackBehind = () => {
    if (!config.hasBackpack && config.accessory !== 'backpack') return null;
    const backpackColor = '#4a5b68'; // Muted charcoal-slate canvas

    return (
      <g>
        {/* Main backpack body peeking out behind torso */}
        <rect x="23" y="55" width="54" height="26" rx="10" fill={backpackColor} stroke="#32404b" strokeWidth="1" />
        {/* Top zipper pocket */}
        <path d="M 33 55 Q 50 51 67 55" stroke="#d5c8b5" strokeWidth="1.2" fill="none" strokeDasharray="2,2" />
        {/* Top carry loop */}
        <path d="M 44 55 Q 50 48 56 55" stroke="#32404b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
    );
  };

  const renderBackpackStrapsInFront = () => {
    if (!config.hasBackpack && config.accessory !== 'backpack') return null;

    return (
      <g>
        {/* Padded shoulder straps draped over chest */}
        <path d="M 33 57 Q 30 68 33 80" stroke="#32404b" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 67 57 Q 70 68 67 80" stroke="#32404b" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Metallic strap buckles */}
        <rect x="31" y="69" width="4" height="3" rx="1" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.6" />
        <rect x="65" y="69" width="4" height="3" rx="1" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.6" />
      </g>
    );
  };

  // =========================================================================
  // 3. Clothing Styles (Volumetric 2.5D Shading)
  // =========================================================================
  const renderClothing = () => {
    const { clothingStyle } = config;

    switch (clothingStyle) {
      case 'sweater':
        return (
          <g>
            {/* Sweater body with soft cylindrical shading */}
            <path d="M 29 57 Q 50 53 71 57 L 75 81 L 25 81 Z" fill={`url(#${clothGradId})`} />
            {/* Ribbed crew collar */}
            <ellipse cx="50" cy="55" rx="13" ry="3.8" fill={clothingColor} filter="brightness(0.9)" />
            <line x1="42" y1="55" x2="58" y2="55" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="2,2" />
            {/* Cable knit vertical ribs */}
            <line x1="42" y1="59" x2="42" y2="80" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeDasharray="3,3" />
            <line x1="58" y1="59" x2="58" y2="80" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeDasharray="3,3" />
            {/* Shoulders */}
            <path d="M 29 57 Q 21 66 20 78 L 28 80 Z" fill={clothingColor} filter="brightness(0.96)" />
            <path d="M 71 57 Q 79 66 80 78 L 72 80 Z" fill={clothingColor} filter="brightness(0.92)" />
          </g>
        );

      case 'cardigan':
        return (
          <g>
            {/* Inner collared shirt */}
            <path d="M 42 53 L 50 62 L 58 53 Z" fill="#ffffff" />
            {/* Cardigan body */}
            <path d="M 29 57 Q 50 53 71 57 L 75 81 L 25 81 Z" fill={`url(#${clothGradId})`} />
            {/* Deep V-Neck Cutout */}
            <path d="M 39 56 L 50 72 L 61 56 Z" fill="#f8fafc" />
            {/* Collared tips */}
            <polygon points="44,53 48,59 44,60" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
            <polygon points="56,53 52,59 56,60" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
            {/* Cardigan wooden buttons */}
            <circle cx="50" cy="74.5" r="1.3" fill="#3a2f26" />
            <circle cx="50" cy="78.5" r="1.3" fill="#3a2f26" />
          </g>
        );

      case 'hoodie-denim':
        return (
          <g>
            {/* Oversized hoodie torso */}
            <path d="M 28 57 Q 50 53 72 57 L 75 81 L 25 81 Z" fill={`url(#${clothGradId})`} />
            {/* Padded plush hood cowl */}
            <path d="M 34 54 Q 50 63 66 54 Q 63 64 50 64 Q 37 64 34 54 Z" fill={accentColor} />
            {/* Kangaroo pocket */}
            <path d="M 36 72 Q 50 70 64 72 L 62 81 L 38 81 Z" fill={clothingColor} filter="brightness(0.92)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.8" />
            {/* Drawstrings */}
            <path d="M 45 64 L 44 75" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="44" cy="75.5" r="1" fill="#cbd5e1" />
            <path d="M 55 64 L 56 75" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="56" cy="75.5" r="1" fill="#cbd5e1" />
          </g>
        );

      case 'varsity':
        return (
          <g>
            {/* Contrast cream/white sleeves */}
            <path d="M 29 57 Q 20 66 19 78 L 27 80 Z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.6" />
            <path d="M 71 57 Q 80 66 81 78 L 73 80 Z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.6" />
            {/* Wool torso body */}
            <path d="M 29 57 Q 50 53 71 57 L 73 81 L 27 81 Z" fill={`url(#${clothGradId})`} />
            {/* Striped varsity collar */}
            <ellipse cx="50" cy="55" rx="13" ry="3.5" fill={accentColor} />
            <ellipse cx="50" cy="55" rx="11" ry="2.5" fill={clothingColor} />
            {/* Initial campus letter patch "S" */}
            <text x="36" y="69" fontSize="7.5" fontWeight="bold" fill={accentColor} fontFamily="serif">S</text>
            {/* Snaps buttons */}
            <circle cx="50" cy="62" r="1" fill="#f1f5f9" />
            <circle cx="50" cy="68" r="1" fill="#f1f5f9" />
            <circle cx="50" cy="74" r="1" fill="#f1f5f9" />
          </g>
        );

      case 'flannel':
        return (
          <g>
            {/* White/cream undershirt */}
            <path d="M 43 53 L 50 61 L 57 53 Z" fill="#f8fafc" />
            {/* Plaid overshirt body */}
            <path d="M 29 57 Q 50 53 71 57 L 75 81 L 25 81 Z" fill={`url(#${clothGradId})`} />
            {/* Soft plaid crosshatch grid */}
            <line x1="38" y1="56" x2="38" y2="81" stroke={accentColor} strokeWidth="1.3" opacity="0.6" />
            <line x1="62" y1="56" x2="62" y2="81" stroke={accentColor} strokeWidth="1.3" opacity="0.6" />
            <line x1="26" y1="68" x2="74" y2="68" stroke={accentColor} strokeWidth="1.3" opacity="0.6" />
          </g>
        );

      case 'casual-tee':
        return (
          <g>
            {/* Relaxed casual crewneck tee */}
            <path d="M 29 57 Q 50 54 71 57 L 74 81 L 26 81 Z" fill={`url(#${clothGradId})`} />
            <ellipse cx="50" cy="55" rx="11" ry="3.2" fill={clothingColor} filter="brightness(0.9)" />
            {/* Layered white undershirt sleeve cuff */}
            <path d="M 21 76 L 27 77 L 26 80 L 20 79 Z" fill="#ffffff" />
            <path d="M 79 76 L 73 77 L 74 80 L 80 79 Z" fill="#ffffff" />
          </g>
        );

      default: // turtleneck
        return (
          <g>
            {/* Folded turtleneck rollneck */}
            <rect x="42.5" y="48.5" width="15" height="8.5" rx="3" fill={clothingColor} filter="brightness(0.92)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.6" />
            <line x1="46" y1="50" x2="46" y2="56" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
            <line x1="50" y1="50" x2="50" y2="56" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
            <line x1="54" y1="50" x2="54" y2="56" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
            {/* Torso */}
            <path d="M 29 57 Q 50 53 71 57 L 75 81 L 25 81 Z" fill={`url(#${clothGradId})`} />
          </g>
        );
    }
  };

  // =========================================================================
  // 4. Hairstyles (Volumetric 2.5D with Natural Form & Shading)
  // =========================================================================
  const renderHair = () => {
    const { hairStyle } = config;

    switch (hairStyle) {
      case 'messy-bun':
        return (
          <g>
            {/* Voluminous top bun with puffy lobes */}
            <circle cx="50" cy="13" r="13.5" fill={`url(#${hairGradId})`} />
            <circle cx="43" cy="9.5" r="6.5" fill={hairColor} opacity="0.9" />
            <circle cx="57" cy="10.5" r="6.5" fill={hairColor} opacity="0.85" />
            {/* Cute Hair Tie / Scrunchie */}
            <path d="M 40 21 Q 50 17 60 21" stroke={accentColor} strokeWidth="3.4" fill="none" strokeLinecap="round" />
            {/* Front Chibi Bangs with soft curves */}
            <path
              d="M 26 34 C 23 19, 39 14, 50 16 C 61 14, 77 19, 74 34 C 72 42, 65 48, 61 49 C 57 46, 59 34, 55 31 C 45 31, 43 46, 39 49 C 35 48, 28 42, 26 34 Z"
              fill={`url(#${hairGradId})`}
            />
            {/* Cute wispy side locks */}
            <path d="M 27 36 Q 25 48 30 52" stroke={hairColor} strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <path d="M 73 36 Q 75 48 70 52" stroke={hairColor} strokeWidth="2.4" fill="none" strokeLinecap="round" />
            {/* Hair gloss sheen highlight */}
            <path d="M 37 19 Q 50 16 63 19" stroke="rgba(255,255,255,0.28)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </g>
        );

      case 'short-fade':
        return (
          <g>
            {/* Clean, tapered modern fade */}
            <path
              d="M 26 33 C 24 20, 39 14, 50 14 C 61 14, 76 20, 74 33 C 74 37, 72 39, 69 37 C 63 29, 57 25, 50 25 C 43 25, 37 29, 31 37 C 28 39, 26 37, 26 33 Z"
              fill={`url(#${hairGradId})`}
            />
            {/* Taper fade transition */}
            <path d="M 26 33 C 26 40, 27 43, 29 43" stroke={hairColor} strokeWidth="2.2" fill="none" />
            <path d="M 74 33 C 74 40, 73 43, 71 43" stroke={hairColor} strokeWidth="2.2" fill="none" />
            {/* Sheen arc */}
            <path d="M 38 18 Q 50 16 62 18" stroke="rgba(255,255,255,0.26)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </g>
        );

      case 'wavy-curls':
        return (
          <g>
            {/* Voluminous wavy top */}
            <ellipse cx="50" cy="19" rx="25" ry="13" fill={`url(#${hairGradId})`} />
            {/* Bouncy framing waves */}
            <path
              d="M 26 28 Q 16 38 24 46 Q 17 54 25 62 Q 20 68 27 73"
              stroke={hairColor}
              strokeWidth="5.8"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 74 28 Q 84 38 76 46 Q 83 54 75 62 Q 80 68 73 73"
              stroke={hairColor}
              strokeWidth="5.8"
              fill="none"
              strokeLinecap="round"
            />
            {/* Curly bangs */}
            <path d="M 32 23 Q 44 19 50 26 Q 56 19 68 23" fill={hairColor} />
            <path d="M 36 17 Q 50 14 64 17" stroke="rgba(255,255,255,0.3)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </g>
        );

      case 'straight-bob':
        return (
          <g>
            {/* Sleek rounded chin bob */}
            <path
              d="M 25 33 C 25 15, 75 15, 75 33 C 77 47, 76 58, 73 64 C 70 60, 71 42, 70 35 C 60 32, 40 32, 30 35 C 29 42, 30 60, 27 64 C 24 58, 23 47, 25 33 Z"
              fill={`url(#${hairGradId})`}
            />
            {/* Clean fringe */}
            <rect x="31" y="23" width="38" height="7.5" rx="2.5" fill={hairColor} />
            <path d="M 35 19 Q 50 16 65 19" stroke="rgba(255,255,255,0.32)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </g>
        );

      case 'textured-afro':
        return (
          <g>
            {/* Fluffy rounded afro cloud with soft lobes */}
            <circle cx="50" cy="21" r="24" fill={`url(#${hairGradId})`} />
            <circle cx="31" cy="23" r="15" fill={hairColor} />
            <circle cx="69" cy="23" r="15" fill={hairColor} />
            <circle cx="39" cy="11" r="14" fill={hairColor} />
            <circle cx="61" cy="11" r="14" fill={hairColor} />
            {/* Soft coil texture */}
            <circle cx="50" cy="17" r="18" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" strokeDasharray="3,3" />
          </g>
        );

      case 'ponytail':
        return (
          <g>
            {/* High perky ponytail flowing to side */}
            <path d="M 64 21 Q 84 19 86 36 Q 87 53 80 62" stroke={hairColor} strokeWidth="7" fill="none" strokeLinecap="round" />
            <circle cx="64" cy="22" r="5" fill={accentColor} />
            {/* Sleek crown */}
            <path
              d="M 26 34 C 26 18, 41 15, 50 17 C 59 15, 74 18, 74 34 C 70 30, 59 26, 50 26 C 41 26, 30 30, 26 34 Z"
              fill={`url(#${hairGradId})`}
            />
            <path d="M 35 19 Q 50 16 65 19" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </g>
        );

      case 'beanie-hair':
        return (
          <g>
            {/* Hair strands poking out */}
            <path d="M 29 34 Q 28 44 32 49" stroke={hairColor} strokeWidth="3.2" fill="none" strokeLinecap="round" />
            <path d="M 71 34 Q 72 44 68 49" stroke={hairColor} strokeWidth="3.2" fill="none" strokeLinecap="round" />
            {/* Knitted Beanie Body */}
            <path d="M 26 32 C 26 13, 74 13, 74 32 Z" fill={accentColor} />
            {/* Beanie Fold Brim */}
            <rect x="23" y="27" width="54" height="8" rx="4" fill={accentColor} filter="brightness(0.9)" />
            {/* Ribbed knit texture */}
            <line x1="30" y1="28" x2="30" y2="34" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
            <line x1="40" y1="28" x2="40" y2="34" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
            <line x1="50" y1="28" x2="50" y2="34" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
            <line x1="60" y1="28" x2="60" y2="34" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
            <line x1="70" y1="28" x2="70" y2="34" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
          </g>
        );

      case 'locs-braids':
        return (
          <g>
            {/* Crown volume */}
            <ellipse cx="50" cy="19" rx="24" ry="12" fill={`url(#${hairGradId})`} />
            {/* Braided Locs hanging on sides with golden ring beads */}
            <path d="M 27 28 L 25 65" stroke={hairColor} strokeWidth="4" strokeLinecap="round" />
            <path d="M 31 31 L 29 69" stroke={hairColor} strokeWidth="3.8" strokeLinecap="round" />
            <path d="M 73 28 L 75 65" stroke={hairColor} strokeWidth="4" strokeLinecap="round" />
            <path d="M 69 31 L 71 69" stroke={hairColor} strokeWidth="3.8" strokeLinecap="round" />
            {/* Golden accessory beads */}
            <rect x="23" y="48" width="4" height="3" rx="1" fill="#d4af37" />
            <rect x="73" y="52" width="4" height="3" rx="1" fill="#d4af37" />
            {/* Forehead fringe locs */}
            <path d="M 36 22 L 40 32 M 50 21 L 50 31 M 64 22 L 60 32" stroke={hairColor} strokeWidth="3" strokeLinecap="round" />
          </g>
        );

      case 'curly-shag':
        return (
          <g>
            <ellipse cx="50" cy="18" rx="24" ry="12" fill={`url(#${hairGradId})`} />
            {/* Layered soft curls */}
            <circle cx="28" cy="35" r="7" fill={hairColor} />
            <circle cx="72" cy="35" r="7" fill={hairColor} />
            <circle cx="27" cy="48" r="6" fill={hairColor} />
            <circle cx="73" cy="48" r="6" fill={hairColor} />
            <circle cx="31" cy="58" r="5" fill={hairColor} />
            <circle cx="69" cy="58" r="5" fill={hairColor} />
            {/* Layered bangs */}
            <path d="M 30 25 Q 40 32 50 25 Q 60 32 70 25" fill={hairColor} />
            <path d="M 36 17 Q 50 14 64 17" stroke="rgba(255,255,255,0.26)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </g>
        );

      default: // side-part
        return (
          <g>
            <path
              d="M 26 33 C 26 17, 50 15, 50 15 C 50 15, 74 17, 74 33 C 74 39, 73 42, 70 39 C 64 30, 55 25, 49 24 C 38 24, 31 30, 30 39 C 28 42, 26 39, 26 33 Z"
              fill={`url(#${hairGradId})`}
            />
            {/* Parting line */}
            <path d="M 44 23 L 47 32" stroke={hairColor} strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 34 18 Q 44 16 54 18" stroke="rgba(255,255,255,0.26)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </g>
        );
    }
  };

  // =========================================================================
  // 5. Accessories (Glasses, Headphones, Earbuds, Scarf)
  // =========================================================================
  const renderAccessory = () => {
    const { accessory } = config;

    switch (accessory) {
      case 'glasses':
        return (
          <g>
            {/* Round tortoiseshell / metallic study glasses */}
            <circle cx="39.5" cy="37" r="5.8" fill="rgba(255,255,255,0.35)" stroke="#4a3322" strokeWidth="1.5" />
            <circle cx="60.5" cy="37" r="5.8" fill="rgba(255,255,255,0.35)" stroke="#4a3322" strokeWidth="1.5" />
            <line x1="45.3" y1="37" x2="54.7" y2="37" stroke="#4a3322" strokeWidth="1.5" />
            <line x1="33.7" y1="37" x2="27.5" y2="35" stroke="#4a3322" strokeWidth="1.2" />
            <line x1="66.3" y1="37" x2="72.5" y2="35" stroke="#4a3322" strokeWidth="1.2" />
            {/* Gentle lens glint */}
            <path d="M 37 34 L 41 34" stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" strokeLinecap="round" />
            <path d="M 58 34 L 62 34" stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" strokeLinecap="round" />
          </g>
        );

      case 'headphones':
        return (
          <g>
            {/* Padded overhead headband arc */}
            <path d="M 24 38 C 24 14, 76 14, 76 38" stroke="#2c2a29" strokeWidth="4.2" fill="none" strokeLinecap="round" />
            <path d="M 27 30 C 27 17, 73 17, 73 30" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" fill="none" />
            {/* Cushioned over-ear earcups */}
            <rect x="22" y="31" width="6.5" height="13" rx="3.2" fill={accentColor} stroke="#2c2a29" strokeWidth="1" />
            <rect x="71.5" y="31" width="6.5" height="13" rx="3.2" fill={accentColor} stroke="#2c2a29" strokeWidth="1" />
          </g>
        );

      case 'earbuds':
        return (
          <g>
            <circle cx="27.5" cy="37.5" r="2.2" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
            <path d="M 27.5 39.5 L 28 43" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="72.5" cy="37.5" r="2.2" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
            <path d="M 72.5 39.5 L 72 43" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        );

      case 'scarf':
        return (
          <g>
            {/* Wrapped woolen scarf around neck */}
            <ellipse cx="50" cy="54" rx="16.5" ry="5.8" fill={accentColor} />
            <path d="M 52 57 L 57 75 L 64 74 L 60 56 Z" fill={accentColor} filter="brightness(0.88)" />
            {/* Tassels */}
            <line x1="57" y1="75" x2="64" y2="74" stroke="#ffffff" strokeWidth="1.3" strokeDasharray="1,1" />
          </g>
        );

      default:
        return null;
    }
  };

  // =========================================================================
  // 6. Study Activity Props (Reading, Typing, Writing, Coffee, Thinking)
  // =========================================================================
  const renderStudyProp = () => {
    if (!showProp) return null;
    const { activity } = config;

    switch (activity) {
      case 'typing':
        return (
          <g transform="translate(0, 0)">
            {/* Sleek metallic laptop base */}
            <polygon points="31,74 69,74 66,81 34,81" fill="#94a3b8" stroke="#64748b" strokeWidth="0.6" />
            {/* Laptop screen upright */}
            <polygon points="35,63 65,63 67,74 33,74" fill="#334155" />
            {/* Glowing code screen */}
            <rect x="36" y="64" width="28" height="9" rx="1" fill="#f0f9ff" opacity="0.95" />
            <line x1="38" y1="66.5" x2="52" y2="66.5" stroke="#3b82f6" strokeWidth="1" />
            <line x1="38" y1="68.8" x2="59" y2="68.8" stroke="#10b981" strokeWidth="1" />
            <line x1="38" y1="71" x2="48" y2="71" stroke="#6366f1" strokeWidth="1" />
            {/* Animated chibi typing hands */}
            <g className={animate ? 'animate-avatar-type' : ''}>
              <circle cx="39" cy="77" r="3" fill={skinTone} />
              <circle cx="61" cy="77" r="3" fill={skinTone} />
            </g>
          </g>
        );

      case 'writing':
        return (
          <g transform="translate(0, 0)">
            {/* Open notebook */}
            <polygon points="35,66 49,69 49,81 35,78" fill="#fffdfa" stroke="#d5cebf" strokeWidth="0.8" />
            <polygon points="49,69 63,66 63,78 49,81" fill="#fffdfa" stroke="#d5cebf" strokeWidth="0.8" />
            <line x1="49" y1="69" x2="49" y2="81" stroke="#b0a898" strokeWidth="1" />
            {/* Lined notebook paper */}
            <line x1="37" y1="71" x2="46" y2="73" stroke="#cbd5e1" strokeWidth="0.8" />
            <line x1="37" y1="74" x2="46" y2="76" stroke="#cbd5e1" strokeWidth="0.8" />
            {/* Animated hand holding fountain pen */}
            <g className={animate ? 'animate-avatar-write' : ''}>
              <circle cx="55" cy="74" r="3" fill={skinTone} />
              <line x1="53" y1="76" x2="59" y2="69" stroke="#334155" strokeWidth="1.6" strokeLinecap="round" />
            </g>
          </g>
        );

      case 'coffee':
        return (
          <g transform="translate(0, 0)">
            {/* Pastel ceramic mug */}
            <rect x="44.5" y="69" width="11" height="12" rx="2.5" fill={accentColor} stroke="#ffffff" strokeWidth="0.8" />
            <path d="M 55.5 72 Q 59 75 55.5 78" stroke="#ffffff" strokeWidth="1.3" fill="none" />
            {/* Rising warm steam wisps */}
            <path d="M 48 66 Q 46 62 48 59" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" fill="none" className="animate-steam" />
            <path d="M 52 65 Q 54 61 52 58" stroke="rgba(255,255,255,0.6)" strokeWidth="1" fill="none" className="animate-steam" />
            {/* Hands clasping warm mug */}
            <circle cx="42.5" cy="75" r="3" fill={skinTone} />
            <circle cx="57.5" cy="75" r="3" fill={skinTone} />
          </g>
        );

      case 'thinking':
        return (
          <g transform="translate(0, 0)">
            {/* Cute gentle thought inspiration spark over head */}
            <g className={animate ? 'animate-avatar-sparkle' : ''}>
              <circle cx="66" cy="20" r="3" fill="#fbbf24" opacity="0.9" />
              <line x1="66" y1="14" x2="66" y2="17" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="72" y1="20" x2="69" y2="20" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="66" y1="26" x2="66" y2="23" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="60" y1="20" x2="63" y2="20" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" />
            </g>
            {/* Hand resting thoughtfully under chin */}
            <circle cx="48" cy="54" r="3.2" fill={skinTone} />
          </g>
        );

      default: // reading
        return (
          <g transform="translate(0, 0)">
            {/* Open Hardcover Book with book spine */}
            <polygon points="34,66 49,69 49,81 34,78" fill="#fffdfa" stroke="#d5c8b5" strokeWidth="0.8" />
            <polygon points="49,69 64,66 64,78 49,81" fill="#fffdfa" stroke="#d5c8b5" strokeWidth="0.8" />
            <path d="M 33 78 Q 49 82 65 78 L 66 79 Q 49 83 32 79 Z" fill={clothingColor} />
            <line x1="49" y1="69" x2="49" y2="81" stroke="#a09480" strokeWidth="1" />
            {/* Bookmark ribbon */}
            <path d="M 49 69 Q 52 75 50 82" stroke={accentColor} strokeWidth="1.3" fill="none" />
            {/* Hands holding book */}
            <circle cx="37" cy="77" r="2.8" fill={skinTone} />
            <circle cx="61" cy="77" r="2.8" fill={skinTone} />
          </g>
        );
    }
  };

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Optional Status Pill above avatar */}
      {showStatusBadge && (
        <div
          className={`absolute -top-6 px-2 py-0.5 rounded-full border text-[9.5px] font-semibold whitespace-nowrap flex items-center gap-1 shadow-xs z-30 ${statusDef.badgeBg} ${statusDef.badgeBorder} ${statusDef.textColor}`}
        >
          <span>{statusDef.emoji}</span>
          <span>{statusDef.label}</span>
        </div>
      )}

      <div className={`w-full h-full relative ${animate ? 'animate-avatar-breathe' : ''}`}>
        <svg
          viewBox="0 0 100 100"
          width={width}
          height={height}
          className="w-full h-full overflow-visible drop-shadow-xs"
        >
          {/* SVG Definitions for 2.5D Volumetric Soft Shading */}
          <defs>
            {/* Soft contact shadow filter */}
            <radialGradient id={shadowFilterId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2c221a" stopOpacity="0.16" />
              <stop offset="60%" stopColor="#2c221a" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#2c221a" stopOpacity="0" />
            </radialGradient>

            {/* Skin Volume Radial Gradient (Soft Highlight on Top-Left, Warm Shadow underneath) */}
            <radialGradient id={skinGradId} cx="42%" cy="32%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="45%" stopColor={skinTone} stopOpacity="1" />
              <stop offset="100%" stopColor={skinTone} filter="brightness(0.88)" />
            </radialGradient>

            {/* Hair Volume Gradient (Gentle Sheen) */}
            <linearGradient id={hairGradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={hairColor} filter="brightness(1.18)" />
              <stop offset="50%" stopColor={hairColor} />
              <stop offset="100%" stopColor={hairColor} filter="brightness(0.85)" />
            </linearGradient>

            {/* Clothing Cylindrical Volume Gradient */}
            <linearGradient id={clothGradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={clothingColor} filter="brightness(1.12)" />
              <stop offset="40%" stopColor={clothingColor} />
              <stop offset="100%" stopColor={clothingColor} filter="brightness(0.88)" />
            </linearGradient>
          </defs>

          {/* Soft Ground Contact Shadow (2.5D Ambience) */}
          <ellipse
            cx="50"
            cy="95"
            rx={isSeated ? 26 : 22}
            ry="4.5"
            fill={`url(#${shadowFilterId})`}
          />

          {/* Seated Location Base Furniture */}
          {renderPoseBase()}

          {/* Backpack layer behind torso */}
          {renderBackpackBehind()}

          {/* Torso & Clothing Layer */}
          {renderClothing()}

          {/* Backpack straps over shoulders */}
          {renderBackpackStrapsInFront()}

          {/* Short Cute Neck */}
          <rect x="46" y="48" width="8" height="6.5" rx="2" fill={skinTone} filter="brightness(0.92)" />

          {/* Soft 2.5D Head & Cheeks */}
          <path
            d="M 28 34 C 28 19, 72 19, 72 34 C 73 44, 69 53, 59 55.5 C 55 56.5, 45 56.5, 41 55.5 C 31 53, 27 44, 28 34 Z"
            fill={`url(#${skinGradId})`}
          />

          {/* Soft Cheeks Blush (Rosy, Radial Warmth) */}
          <ellipse cx="35" cy="43.5" rx="4.8" ry="2.4" fill="#ff8080" opacity="0.45" />
          <ellipse cx="65" cy="43.5" rx="4.8" ry="2.4" fill="#ff8080" opacity="0.45" />

          {/* Petite Ears */}
          <circle cx="26" cy="36" r="3.5" fill={skinTone} />
          <circle cx="74" cy="36" r="3.5" fill={skinTone} />
          <circle cx="26" cy="36" r="1.8" fill="#ffb4a2" opacity="0.4" />
          <circle cx="74" cy="36" r="1.8" fill="#ffb4a2" opacity="0.4" />

          {/* Expressive Eyes with Natural CSS Blinking Animation */}
          <g className={animate ? 'animate-avatar-blink' : ''}>
            {/* Left Eye */}
            <path d="M 33.5 33.5 Q 39 30 44.5 33.5" stroke="#221811" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <ellipse cx="39" cy="37" rx="3.8" ry="4.8" fill="#241810" />
            <circle cx="38" cy="35.5" r="1.6" fill="#ffffff" />
            <circle cx="41" cy="39" r="0.9" fill="#ffffff" />
            <path d="M 36 41 Q 39 42 42 41" stroke="#443226" strokeWidth="0.8" opacity="0.5" fill="none" />

            {/* Right Eye */}
            <path d="M 55.5 33.5 Q 61 30 66.5 33.5" stroke="#221811" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <ellipse cx="61" cy="37" rx="3.8" ry="4.8" fill="#241810" />
            <circle cx="60" cy="35.5" r="1.6" fill="#ffffff" />
            <circle cx="63" cy="39" r="0.9" fill="#ffffff" />
            <path d="M 58 41 Q 61 42 64 41" stroke="#443226" strokeWidth="0.8" opacity="0.5" fill="none" />
          </g>

          {/* Friendly Arched Eyebrows */}
          <path d="M 34 28.5 Q 39 26.5 44 28.5" stroke="#362215" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.85" />
          <path d="M 56 28.5 Q 61 26.5 66 28.5" stroke="#362215" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.85" />

          {/* Sweet Gentle Smile */}
          <path d="M 47.5 46.5 Q 50 49.5 52.5 46.5" stroke="#4a2e1b" strokeWidth="1.4" strokeLinecap="round" fill="none" />

          {/* Hair Layer with 2.5D Highlights */}
          {renderHair()}

          {/* Accessories Layer */}
          {renderAccessory()}

          {/* Study Prop Layer */}
          {renderStudyProp()}
        </svg>
      </div>
    </div>
  );
};
