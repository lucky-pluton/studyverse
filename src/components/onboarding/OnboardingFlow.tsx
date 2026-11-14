import React, { useState } from 'react';
import type { GenderOption, AvatarConfig, StudentPresence } from '../../types/studyverse';
import { AVATAR_CATALOG } from '../../constants/avatars';
import { AvatarPicker } from './AvatarPicker';
import { ArrowRight, ArrowLeft, Sparkles, Heart, Compass } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OnboardingFlowProps {
  onComplete: (presence: StudentPresence) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<GenderOption>('neutral');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarConfig>(AVATAR_CATALOG[0]);
  const [error, setError] = useState('');

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please choose a name or nickname so fellow learners can see you.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleGenderSelect = (chosen: GenderOption) => {
    setGender(chosen);
    // Find a matching default avatar to suggest nicely
    const suggested = AVATAR_CATALOG.find((a) => a.gender === chosen) || AVATAR_CATALOG[0];
    setSelectedAvatar(suggested);
  };

  const handleStep2Next = () => {
    setStep(3);
  };

  const handleStep3Next = () => {
    setStep(4);
  };

  const handleEnterCampus = () => {
    // Joyful soft confetti burst
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#52796f', '#e07a5f', '#f4a261', '#84a98c', '#d4a373'],
    });

    const sessionId = 'student_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
    const now = Date.now();

    const newPresence: StudentPresence = {
      sessionId,
      name: name.trim() || 'Fellow Learner',
      gender,
      avatarId: selectedAvatar.id,
      avatarConfig: selectedAvatar,
      location: 'campus',
      seatId: null,
      seatEnteredAt: null,
      sessionEnteredAt: now,
      lastHeartbeat: now,
      studyTopic: 'Deep Focus',
    };

    onComplete(newPresence);
  };

  return (
    <div className="min-h-screen bg-[#faf6f0] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Ambient Illustrative Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-12 left-10 w-72 h-72 rounded-full bg-[#f0e3d2] blur-3xl" />
        <div className="absolute bottom-12 right-12 w-96 h-96 rounded-full bg-[#e3ede6] blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#faebd7]/30 blur-3xl" />
      </div>

      {/* Main Glass/Warm Card */}
      <div className="relative w-full max-w-2xl bg-[#fffdfa] rounded-3xl border border-[#ede2d4] shadow-xl p-6 sm:p-10 backdrop-blur-sm z-10 transition-all duration-300">
        {/* Progress Dots */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#f0e7db]">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#52796f] text-white flex items-center justify-center text-xs font-serif-title font-bold">
              🏛️
            </span>
            <span className="font-serif-title text-sm font-semibold tracking-wider text-[#35302b]">
              STUDYVERSE
            </span>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-7 bg-[#52796f]'
                    : s < step
                    ? 'w-2 bg-[#84a98c]'
                    : 'w-2 bg-[#e6ddce]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: Enter your name */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center space-y-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#786b5e] inline-flex items-center gap-1.5 bg-[#f4ebe0] px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-[#b2895b]" />
                Welcome to Studyverse • IIT Madras Campus
              </span>
              <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#2a2622]">
                What should we call you?
              </h2>
              <p className="text-sm text-[#6f6457] max-w-md mx-auto">
                Enter any nickname or first name. Step into the lush virtual campus grounds — no passwords, emails, or accounts required.
              </p>
            </div>

            <form onSubmit={handleStep1Next} className="max-w-md mx-auto space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={25}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="e.g. Maya, Julian, Bookworm..."
                  autoFocus
                  className="w-full px-5 py-3.5 rounded-2xl bg-[#faf6f0] border-2 border-[#e2d5c3] focus:border-[#52796f] focus:bg-white text-base font-medium text-[#2d2925] placeholder-[#9f9485] focus:outline-hidden transition-all shadow-inner"
                />
                {error && <p className="text-xs text-rose-600 mt-2 text-center">{error}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#39574a] hover:bg-[#2b443a] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all group"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="pt-4 text-center text-xs text-[#8c8072] flex items-center justify-center gap-4">
              <span>✦ Instant Anonymous Access</span>
              <span>✦ Real-Time Presence</span>
              <span>✦ Zero Surveillance</span>
            </div>
          </div>
        )}

        {/* STEP 2: Choose gender */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center space-y-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#786b5e] inline-flex items-center gap-1.5 bg-[#f4ebe0] px-3 py-1 rounded-full">
                Step 2 of 4
              </span>
              <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#2a2622]">
                Choose your avatar style
              </h2>
              <p className="text-sm text-[#6f6457] max-w-md mx-auto">
                This helps us organize avatar recommendations. You can pick any character you like in the next step!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-lg mx-auto">
              {[
                { id: 'female', label: 'Female', icon: '🌸', desc: 'Curated female-presenting characters' },
                { id: 'male', label: 'Male', icon: '🌿', desc: 'Curated male-presenting characters' },
                { id: 'neutral', label: 'Prefer not to say', icon: '✨', desc: 'Open & gender-neutral archetypes' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleGenderSelect(opt.id as GenderOption)}
                  className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                    gender === opt.id
                      ? 'border-[#52796f] bg-[#f2ebe0] shadow-sm ring-2 ring-[#84a98c]/30'
                      : 'border-[#e8ded0] bg-[#fffdfa] hover:bg-[#faf5ee]'
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="font-serif-title font-bold text-sm text-[#302a24]">
                    {opt.label}
                  </span>
                  <span className="text-[11px] text-[#7d7162] leading-tight">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between max-w-lg mx-auto pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-medium text-[#736657] hover:bg-[#f1eae0] rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                type="button"
                onClick={handleStep2Next}
                className="px-6 py-3 bg-[#39574a] hover:bg-[#2b443a] text-white font-medium text-sm rounded-2xl flex items-center gap-2 shadow-md transition-all group"
              >
                <span>Next: Choose Character</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Choose your avatar */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center space-y-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#786b5e] inline-flex items-center gap-1.5 bg-[#f4ebe0] px-3 py-1 rounded-full">
                Step 3 of 4
              </span>
              <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#2a2622]">
                Choose your companion
              </h2>
              <p className="text-xs sm:text-sm text-[#6f6457]">
                Select an illustrated companion who will sit quietly beside other learners in the city.
              </p>
            </div>

            <AvatarPicker
              selectedAvatar={selectedAvatar}
              onSelectAvatar={setSelectedAvatar}
              userGenderPreference={gender}
              userName={name}
            />

            <div className="flex items-center justify-between pt-2 border-t border-[#f0e7db]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-medium text-[#736657] hover:bg-[#f1eae0] rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                type="button"
                onClick={handleStep3Next}
                className="px-6 py-3 bg-[#39574a] hover:bg-[#2b443a] text-white font-medium text-sm rounded-2xl flex items-center gap-2 shadow-md transition-all group"
              >
                <span>Continue to Welcome</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Welcome transition */}
        {step === 4 && (
          <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in-95 duration-400">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-[#e3ece5] to-[#f6ede4] border-2 border-[#d9ccbd] p-2 flex items-center justify-center shadow-md animate-float">
              <span className="text-4xl">🏛️</span>
            </div>

            <div className="space-y-3 max-w-md mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8ded2] text-xs font-semibold text-[#54483c]">
                <Heart className="w-3.5 h-3.5 text-[#bd5d44]" />
                <span>You're ready, {name}</span>
              </div>
              <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#292521] leading-tight">
                Enter Your Campus
              </h2>
              <p className="text-sm sm:text-base text-[#615648] leading-relaxed italic">
                "Your study space is waiting. Find your favourite corner, settle in, and study alongside others."
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#faf5ed] border border-[#e8dbcc] max-w-sm mx-auto text-left text-xs space-y-2 text-[#635749]">
              <div className="flex items-center gap-2 text-[#3c594b] font-semibold">
                <Compass className="w-4 h-4" />
                <span>What to expect inside:</span>
              </div>
              <ul className="space-y-1 pl-6 list-disc text-[11px] text-[#716454]">
                <li>Silent, ambient campus companionship — no meetings or pressure.</li>
                <li>Explore the library, lecture halls, banyan grove, café, and gardens.</li>
                <li>Your seat timer will start automatically when you sit down.</li>
                <li>Real-time synchronization with fellow students.</li>
              </ul>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleEnterCampus}
                className="w-full sm:w-auto px-10 py-4 bg-[#324f42] hover:bg-[#253d33] text-white font-serif-title text-base font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all inline-flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>ENTER CAMPUS</span>
                <Sparkles className="w-5 h-5 text-amber-300" />
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs text-[#8c7f71] hover:underline cursor-pointer"
              >
                Change character or name
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
