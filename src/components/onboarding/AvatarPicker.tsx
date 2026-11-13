import React, { useState } from 'react';
import type { AvatarConfig, GenderOption } from '../../types/studyverse';
import { AVATAR_CATALOG } from '../../constants/avatars';
import { AvatarRenderer } from '../common/AvatarRenderer';
import { Check, BookOpen, PenTool, Laptop, Coffee } from 'lucide-react';

interface AvatarPickerProps {
  selectedAvatar: AvatarConfig;
  onSelectAvatar: (avatar: AvatarConfig) => void;
  userGenderPreference?: GenderOption;
  userName: string;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  selectedAvatar,
  onSelectAvatar,
  userGenderPreference,
  userName,
}) => {
  // Initial filter category based on user preference, with 'all' available
  const [filter, setFilter] = useState<'all' | 'female' | 'male' | 'neutral'>(
    userGenderPreference === 'female'
      ? 'female'
      : userGenderPreference === 'male'
      ? 'male'
      : 'all'
  );

  const [activeActivity, setActiveActivity] = useState<AvatarConfig['activity']>(selectedAvatar.activity);

  const filteredAvatars = AVATAR_CATALOG.filter((av) => {
    if (filter === 'all') return true;
    return av.gender === filter;
  });

  const handleChoose = (baseAvatar: AvatarConfig) => {
    // Preserve custom selected activity
    onSelectAvatar({
      ...baseAvatar,
      activity: activeActivity,
    });
  };

  const handleChangeActivity = (activity: AvatarConfig['activity']) => {
    setActiveActivity(activity);
    onSelectAvatar({
      ...selectedAvatar,
      activity,
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Preview Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-b from-[#f9f5ee] to-[#f2ece1] border border-[#e5d9c8] shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="relative flex items-center justify-center p-3 rounded-2xl bg-[#fffdf9] border border-[#ebdccb] shadow-inner">
          <AvatarRenderer config={selectedAvatar} size="xl" showProp={true} animate={true} />
        </div>

        <div className="text-center sm:text-left space-y-2 flex-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#e8ded2] text-xs font-semibold text-[#54483c]">
            <span>Selected Companion: {selectedAvatar.name}</span>
          </div>
          <h4 className="font-serif-title text-xl font-bold text-[#2e2a25]">
            {userName || 'Quiet Learner'}
          </h4>
          <p className="text-xs text-[#6e6356] leading-relaxed">
            {selectedAvatar.summary}
          </p>

          {/* Activity Selector (How do you study?) */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-[#7c6f60] uppercase tracking-wider block mb-1.5">
              Study Posture / Companion Prop:
            </span>
            <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
              <button
                type="button"
                onClick={() => handleChangeActivity('reading')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  activeActivity === 'reading'
                    ? 'bg-[#3b584a] text-white shadow-xs'
                    : 'bg-[#fffdf9] border border-[#e2d5c4] text-[#5e5346] hover:bg-[#eae1d2]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Reading Book
              </button>
              <button
                type="button"
                onClick={() => handleChangeActivity('writing')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  activeActivity === 'writing'
                    ? 'bg-[#3b584a] text-white shadow-xs'
                    : 'bg-[#fffdf9] border border-[#e2d5c4] text-[#5e5346] hover:bg-[#eae1d2]'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                Pen & Notebook
              </button>
              <button
                type="button"
                onClick={() => handleChangeActivity('typing')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  activeActivity === 'typing'
                    ? 'bg-[#3b584a] text-white shadow-xs'
                    : 'bg-[#fffdf9] border border-[#e2d5c4] text-[#5e5346] hover:bg-[#eae1d2]'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                Laptop Coding
              </button>
              <button
                type="button"
                onClick={() => handleChangeActivity('coffee')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  activeActivity === 'coffee'
                    ? 'bg-[#3b584a] text-white shadow-xs'
                    : 'bg-[#fffdf9] border border-[#e2d5c4] text-[#5e5346] hover:bg-[#eae1d2]'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                Warm Tea / Mug
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-[#e5dcd0] pb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#7c6f60]">
          Choose Your Character
        </span>
        <div className="flex gap-1 bg-[#ede4d8] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filter === 'all'
                ? 'bg-white text-[#2f2b27] shadow-2xs font-semibold'
                : 'text-[#6e6356] hover:text-[#2f2b27]'
            }`}
          >
            All Avatars
          </button>
          <button
            type="button"
            onClick={() => setFilter('female')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filter === 'female'
                ? 'bg-white text-[#2f2b27] shadow-2xs font-semibold'
                : 'text-[#6e6356] hover:text-[#2f2b27]'
            }`}
          >
            Female-presenting
          </button>
          <button
            type="button"
            onClick={() => setFilter('male')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filter === 'male'
                ? 'bg-white text-[#2f2b27] shadow-2xs font-semibold'
                : 'text-[#6e6356] hover:text-[#2f2b27]'
            }`}
          >
            Male-presenting
          </button>
          <button
            type="button"
            onClick={() => setFilter('neutral')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filter === 'neutral'
                ? 'bg-white text-[#2f2b27] shadow-2xs font-semibold'
                : 'text-[#6e6356] hover:text-[#2f2b27]'
            }`}
          >
            Gender-neutral
          </button>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto p-1 pr-2">
        {filteredAvatars.map((avatar) => {
          const isSelected = selectedAvatar.id === avatar.id;
          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => handleChoose(avatar)}
              className={`relative group p-3 rounded-2xl flex flex-col items-center text-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#f4ebe0] border-2 border-[#52796f] shadow-md ring-2 ring-[#84a98c]/25 scale-[1.02]'
                  : 'bg-[#fffdfa] border border-[#e6dcce] hover:border-[#cbbea9] hover:bg-[#faf5ee] shadow-2xs'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#52796f] text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3 h-3" />
                </div>
              )}
              <AvatarRenderer
                config={{ ...avatar, activity: activeActivity }}
                size="md"
                showProp={false}
                animate={isSelected}
              />
              <span className="font-serif-title text-xs font-semibold text-[#302a24] mt-2">
                {avatar.name}
              </span>
              <span className="text-[10px] text-[#7d7164] line-clamp-1 mt-0.5">
                {avatar.clothingStyle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
