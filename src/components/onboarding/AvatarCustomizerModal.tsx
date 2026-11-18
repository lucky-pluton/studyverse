import React, { useState } from 'react';
import type { AvatarConfig, LocationId } from '../../types/studyverse';
import {
  AVATAR_CATALOG,
  CLOTHING_PALETTES,
  SKIN_TONES,
  HAIR_COLORS,
  HAIR_STYLES,
  CLOTHING_STYLES,
  ACCESSORIES,
  STUDY_STATUSES,
} from '../../constants/avatars';
import { AvatarRenderer } from '../common/AvatarRenderer';
import {
  X,
  Sparkles,
  Check,
  Shuffle,
  BookOpen,
  Laptop,
  PenTool,
  Coffee,
  Lightbulb,
} from 'lucide-react';

interface AvatarCustomizerModalProps {
  isOpen: boolean;
  initialAvatar: AvatarConfig;
  onSave: (customizedAvatar: AvatarConfig) => void;
  onClose: () => void;
  title?: string;
  userName?: string;
}

type TabKey = 'presets' | 'hair' | 'outfit' | 'accessories' | 'status';

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  isOpen,
  initialAvatar,
  onSave,
  onClose,
  title = 'Customize Your Student Character',
  userName,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('hair');
  const [currentAvatar, setCurrentAvatar] = useState<AvatarConfig>({
    ...initialAvatar,
    status: initialAvatar.status || 'studying',
  });
  const [previewLocation, setPreviewLocation] = useState<LocationId>('library');

  if (!isOpen) return null;

  const handleUpdate = (partial: Partial<AvatarConfig>) => {
    setCurrentAvatar((prev) => ({
      ...prev,
      ...partial,
    }));
  };

  const handleRandomize = () => {
    const randomPreset = AVATAR_CATALOG[Math.floor(Math.random() * AVATAR_CATALOG.length)];
    const randomHairStyle = HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)].id;
    const randomHairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].hex;
    const randomSkinTone = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)].hex;
    const randomClothStyle = CLOTHING_STYLES[Math.floor(Math.random() * CLOTHING_STYLES.length)].id;
    const randomPalette = CLOTHING_PALETTES[Math.floor(Math.random() * CLOTHING_PALETTES.length)];
    const randomAccessory = ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)].id;
    const activities: AvatarConfig['activity'][] = ['reading', 'writing', 'typing', 'coffee', 'thinking'];
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];

    setCurrentAvatar({
      ...randomPreset,
      hairStyle: randomHairStyle,
      hairColor: randomHairColor,
      skinTone: randomSkinTone,
      clothingStyle: randomClothStyle,
      clothingColor: randomPalette.hex,
      accentColor: randomPalette.accentHex || '#efe6fb',
      accessory: randomAccessory,
      activity: randomActivity,
      hasBackpack: Math.random() > 0.4,
    });
  };

  const handleSave = () => {
    onSave(currentAvatar);
    onClose();
  };

  const previewLocations: { id: LocationId; label: string; icon: string }[] = [
    { id: 'library', label: 'Library', icon: '📚' },
    { id: 'lhc', label: 'Lecture Hall', icon: '🏛️' },
    { id: 'banyan', label: 'Banyan Tree', icon: '🌳' },
    { id: 'oat', label: 'Open Theatre', icon: '🎭' },
    { id: 'cafe', label: 'Campus Café', icon: '☕' },
    { id: 'park', label: 'Sangam Gardens', icon: '🌸' },
    { id: 'gc', label: 'Gajendra Circle', icon: '🐘' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#faf6f0] border border-[#e5dcd0] rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-[#e6dcce] flex items-center justify-between bg-[#fffdf9]">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#2d5a43] text-white flex items-center justify-center text-sm shadow-xs font-serif-title font-bold">
              🎨
            </span>
            <div>
              <h3 className="font-serif-title text-base sm:text-lg font-bold text-[#2d2822]">
                {title}
              </h3>
              <p className="text-xs text-[#73685c]">
                Soft 2.5D cartoon student character for all 7 campus destinations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRandomize}
              className="px-3 py-1.5 rounded-xl border border-[#d8cbbe] bg-[#f5ede3] hover:bg-[#ede1d3] text-xs font-semibold text-[#5a4c3e] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Surprise me with a harmonious avatar combination"
            >
              <Shuffle className="w-3.5 h-3.5 text-[#2d5a43]" />
              <span className="hidden sm:inline">Surprise Me</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#827668] hover:text-[#2d2822] hover:bg-[#ede4d8] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Left Preview, Right Tabs */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          {/* LEFT: Live Interactive Preview */}
          <div className="w-full md:w-[320px] p-5 sm:p-6 bg-gradient-to-b from-[#f5ede3] to-[#efe5d7] border-b md:border-b-0 md:border-r border-[#e5dcd0] flex flex-col items-center justify-between gap-4">
            <div className="w-full flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/80 border border-[#e2d5c4] text-[11px] font-semibold text-[#574c40] mb-6 shadow-2xs">
                <span>{userName || currentAvatar.name || 'Student'}</span>
                <span className="text-[#a89b8d]">•</span>
                <span className="text-[#2d5a43]">Live 2.5D Preview</span>
              </div>

              {/* Avatar Canvas with Seated Base */}
              <div className="relative w-44 h-48 rounded-2xl bg-gradient-to-b from-white/95 to-[#faf6f0]/95 border border-[#e8dcd0] shadow-sm flex items-center justify-center overflow-visible p-2">
                <AvatarRenderer
                  config={currentAvatar}
                  size="hero"
                  showProp={true}
                  isSeated={true}
                  locationId={previewLocation}
                  animate={true}
                  showStatusBadge={true}
                />
              </div>

              <span className="text-xs font-serif-title font-semibold text-[#3d362e] mt-2">
                {currentAvatar.name}
              </span>
              <p className="text-[11px] text-[#73685c] line-clamp-2 px-2 mt-0.5">
                {currentAvatar.summary}
              </p>
            </div>

            {/* Test Location Seating Poses */}
            <div className="w-full bg-white/70 backdrop-blur-xs p-3 rounded-2xl border border-[#e5dcd0] shadow-2xs">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#73685c] block mb-1.5 text-center">
                Preview In Campus Environments:
              </span>
              <div className="flex flex-wrap gap-1 justify-center">
                {previewLocations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setPreviewLocation(loc.id)}
                    className={`px-2 py-1 rounded-lg text-[10.5px] font-medium flex items-center gap-1 transition-all cursor-pointer ${
                      previewLocation === loc.id
                        ? 'bg-[#2d5a43] text-white shadow-xs font-semibold'
                        : 'bg-[#faf6f0] border border-[#e4d9cc] text-[#5e5346] hover:bg-[#f0e7dc]'
                    }`}
                  >
                    <span>{loc.icon}</span>
                    <span>{loc.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Customization Controls & Tabs */}
          <div className="flex-1 p-5 sm:p-6 flex flex-col">
            {/* Tab navigation pills */}
            <div className="flex gap-1.5 border-b border-[#e6dcce] pb-3 overflow-x-auto no-scrollbar">
              {[
                { key: 'presets', label: 'Presets' },
                { key: 'hair', label: 'Hair & Face' },
                { key: 'outfit', label: 'Outfit & Colors' },
                { key: 'accessories', label: 'Accessories' },
                { key: 'status', label: 'Status & Prop' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as TabKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.key
                      ? 'bg-[#2d5a43] text-white shadow-xs'
                      : 'bg-[#f4ebe0] hover:bg-[#ebe1d4] text-[#695d50]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: PRESETS */}
            {activeTab === 'presets' && (
              <div className="py-4 space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#7c6f60] block">
                  Quick-Apply Ready-to-Study Characters
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto p-1 pr-2">
                  {AVATAR_CATALOG.map((preset) => {
                    const isSelected = currentAvatar.id === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setCurrentAvatar({ ...preset })}
                        className={`p-2.5 rounded-2xl flex flex-col items-center text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#f4ebe0] border-2 border-[#2d5a43] shadow-md ring-2 ring-[#2d5a43]/20 scale-[1.01]'
                            : 'bg-[#fffdfa] border border-[#e6dcce] hover:border-[#cbbea9] hover:bg-[#faf5ee] shadow-2xs'
                        }`}
                      >
                        <AvatarRenderer config={preset} size="sm" showProp={false} animate={isSelected} />
                        <span className="font-serif-title text-xs font-semibold text-[#2d2822] mt-1.5">
                          {preset.name}
                        </span>
                        <span className="text-[10px] text-[#786c5e] line-clamp-1">
                          {preset.clothingStyle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: HAIR & FACE */}
            {activeTab === 'hair' && (
              <div className="py-4 space-y-5 max-h-[420px] overflow-y-auto pr-2">
                {/* Skin Tones */}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#7c6f60] block mb-2">
                    Skin Tone
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {SKIN_TONES.map((tone) => {
                      const isSelected = currentAvatar.skinTone === tone.hex;
                      return (
                        <button
                          key={tone.id}
                          type="button"
                          onClick={() => handleUpdate({ skinTone: tone.hex })}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#f3ebd0] ring-2 ring-[#2d5a43] shadow-xs'
                              : 'bg-white border border-[#e6dcce] hover:bg-[#faf6ee]'
                          }`}
                        >
                          <span
                            className="w-6 h-6 rounded-full border border-black/15 shadow-2xs"
                            style={{ backgroundColor: tone.hex }}
                          />
                          <span className="text-[9.5px] font-medium text-[#4d4439] line-clamp-1">
                            {tone.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hair Color */}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#7c6f60] block mb-2">
                    Hair Color
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {HAIR_COLORS.map((hc) => {
                      const isSelected = currentAvatar.hairColor === hc.hex;
                      return (
                        <button
                          key={hc.id}
                          type="button"
                          onClick={() => handleUpdate({ hairColor: hc.hex })}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#f3ebd0] ring-2 ring-[#2d5a43] shadow-xs'
                              : 'bg-white border border-[#e6dcce] hover:bg-[#faf6ee]'
                          }`}
                        >
                          <span
                            className="w-6 h-6 rounded-full border border-black/15 shadow-2xs"
                            style={{ backgroundColor: hc.hex }}
                          />
                          <span className="text-[9.5px] font-medium text-[#4d4439] line-clamp-1">
                            {hc.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hairstyles */}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#7c6f60] block mb-2">
                    Hairstyle
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {HAIR_STYLES.map((style) => {
                      const isSelected = currentAvatar.hairStyle === style.id;
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => handleUpdate({ hairStyle: style.id })}
                          className={`p-2.5 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#f4ebe0] border-2 border-[#2d5a43] shadow-xs'
                              : 'bg-white border border-[#e6dcce] hover:bg-[#faf6ee]'
                          }`}
                        >
                          <span className="text-xs font-semibold text-[#2d2822]">
                            {style.name}
                          </span>
                          <span className="text-[10px] text-[#73685c] line-clamp-1 mt-0.5">
                            {style.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: OUTFIT & COLORS */}
            {activeTab === 'outfit' && (
              <div className="py-4 space-y-5 max-h-[420px] overflow-y-auto pr-2">
                {/* Outfit Styles */}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#7c6f60] block mb-2">
                    Student Outfit Style
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CLOTHING_STYLES.map((cloth) => {
                      const isSelected = currentAvatar.clothingStyle === cloth.id;
                      return (
                        <button
                          key={cloth.id}
                          type="button"
                          onClick={() => handleUpdate({ clothingStyle: cloth.id })}
                          className={`p-2.5 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#f4ebe0] border-2 border-[#2d5a43] shadow-xs'
                              : 'bg-white border border-[#e6dcce] hover:bg-[#faf6ee]'
                          }`}
                        >
                          <span className="text-xs font-semibold text-[#2d2822]">
                            {cloth.name}
                          </span>
                          <span className="text-[10px] text-[#73685c] line-clamp-1 mt-0.5">
                            {cloth.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pastel Clothing Palette */}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#7c6f60] block mb-2">
                    Warm Pastel Palette
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {CLOTHING_PALETTES.map((color) => {
                      const isSelected = currentAvatar.clothingColor === color.hex;
                      return (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() =>
                            handleUpdate({
                              clothingColor: color.hex,
                              accentColor: color.accentHex || '#efe6fb',
                            })
                          }
                          className={`flex items-center gap-2 p-2 rounded-xl transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#f3ebd0] ring-2 ring-[#2d5a43] shadow-xs'
                              : 'bg-white border border-[#e6dcce] hover:bg-[#faf6ee]'
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-full border border-black/15 shadow-2xs shrink-0"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="text-[11px] font-medium text-[#4d4439] truncate">
                            {color.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ACCESSORIES */}
            {activeTab === 'accessories' && (
              <div className="py-4 space-y-5 max-h-[420px] overflow-y-auto pr-2">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#7c6f60] block mb-2">
                    Head & Face Accessories
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ACCESSORIES.map((acc) => {
                      const isSelected = currentAvatar.accessory === acc.id;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => handleUpdate({ accessory: acc.id })}
                          className={`p-3 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#f4ebe0] border-2 border-[#2d5a43] shadow-xs'
                              : 'bg-white border border-[#e6dcce] hover:bg-[#faf6ee]'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-semibold text-[#2d2822] block">
                              {acc.name}
                            </span>
                            <span className="text-[10px] text-[#73685c] line-clamp-1">
                              {acc.description}
                            </span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#2d5a43] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Campus Backpack Toggle */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#e6dcce] flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-xs font-bold text-[#2d2822] block">
                      🎒 Campus Student Backpack
                    </span>
                    <span className="text-[11px] text-[#73685c]">
                      Wear canvas backpack with padded shoulder straps
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdate({ hasBackpack: !currentAvatar.hasBackpack })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      currentAvatar.hasBackpack
                        ? 'bg-[#2d5a43] text-white shadow-xs'
                        : 'bg-[#ede4d8] text-[#695d50] hover:bg-[#e0d6c8]'
                    }`}
                  >
                    {currentAvatar.hasBackpack ? 'Equipped' : 'Not Equipped'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: STATUS & PROP */}
            {activeTab === 'status' && (
              <div className="py-4 space-y-5 max-h-[420px] overflow-y-auto pr-2">
                {/* Study Status */}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#7c6f60] block mb-2">
                    Current Study Status
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {STUDY_STATUSES.map((st) => {
                      const isSelected = currentAvatar.status === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleUpdate({ status: st.id })}
                          className={`p-3 rounded-xl text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                            isSelected
                              ? 'bg-[#f4ebe0] border-2 border-[#2d5a43] shadow-xs'
                              : 'bg-white border border-[#e6dcce] hover:bg-[#faf6ee]'
                          }`}
                        >
                          <span className="text-lg">{st.emoji}</span>
                          <div>
                            <span className="text-xs font-semibold text-[#2d2822] block">
                              {st.label}
                            </span>
                            <span className="text-[10px] text-[#73685c]">
                              {st.id === 'deep-focus'
                                ? 'Uninterrupted focus session'
                                : st.id === 'studying'
                                ? 'Actively studying coursework'
                                : st.id === 'break'
                                ? 'Grabbing tea / brief rest'
                                : 'Temporarily stepped away'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Study Prop & Activity */}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#7c6f60] block mb-2">
                    Study Companion Prop
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: 'reading', name: 'Open Hardcover Book', icon: BookOpen, desc: 'Reading textbooks & research' },
                      { id: 'typing', name: 'Coding Laptop', icon: Laptop, desc: 'Interactive coding & typing' },
                      { id: 'writing', name: 'Notebook & Pen', icon: PenTool, desc: 'Handwritten notes & sketches' },
                      { id: 'coffee', name: 'Warm Tea / Ceramic Mug', icon: Coffee, desc: 'Cozy steam & warm beverage' },
                      { id: 'thinking', name: 'Thoughtful Inspiration', icon: Lightbulb, desc: 'Reflecting & solving problems' },
                    ].map((item) => {
                      const isSelected = currentAvatar.activity === item.id;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleUpdate({ activity: item.id as AvatarConfig['activity'] })}
                          className={`p-2.5 rounded-xl text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                            isSelected
                              ? 'bg-[#f4ebe0] border-2 border-[#2d5a43] shadow-xs'
                              : 'bg-white border border-[#e6dcce] hover:bg-[#faf6ee]'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#faf6f0] border border-[#e6dcce] flex items-center justify-center text-[#2d5a43] shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-[#2d2822] block">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-[#73685c]">
                              {item.desc}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Footer Action Bar */}
            <div className="mt-auto pt-4 border-t border-[#e6dcce] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#ded3c2] text-xs font-semibold text-[#665a4c] hover:bg-[#eae1d2] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-[#2d5a43] hover:bg-[#234836] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Save Character</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
