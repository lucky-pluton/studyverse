import React, { useState } from 'react';
import type { GenderOption, AvatarConfig, StudentPresence } from '../../types/studyverse';
import { AVATAR_CATALOG } from '../../constants/avatars';
import { AvatarPicker } from './AvatarPicker';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import iitmMainGate from '../../assets/iitm_main_gate.jpg';

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

  // =========================================================================
  // STEP 4: FULL-SCREEN "ENTER THE CAMPUS" IMMERSIVE LANDING EXPERIENCE
  // Directly over the full-viewport IIT Madras main gate background.
  // =========================================================================
  if (step === 4) {
    return (
      <div className="relative w-full h-[100dvh] min-h-screen overflow-hidden flex flex-col justify-between select-none">
        {/* Full-Screen IIT Madras Main Gate Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={iitmMainGate}
            alt="IIT Madras Main Gate"
            className="w-full h-full object-cover object-center"
          />
          {/* Subtle Dark Gradient Overlay for Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/65 backdrop-brightness-[0.88]" />
        </div>

        {/* Top Header: Elegant StudyVerse Branding */}
        <header className="relative z-10 px-6 sm:px-12 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 shadow-xl">
            <span className="w-8 h-8 rounded-xl bg-[#2d5a43] text-white flex items-center justify-center text-sm shadow-xs font-serif-title font-bold">
              🏛️
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif-title text-sm sm:text-base font-bold tracking-wider text-white">
                  STUDYVERSE
                </span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  IIT Madras
                </span>
              </div>
              <span className="text-[9.5px] uppercase font-bold tracking-widest text-emerald-100/70 block">
                Virtual Campus Simulation
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep(3)}
            className="px-4 py-2 rounded-xl bg-black/40 hover:bg-black/60 text-white/90 text-xs font-medium backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105 active:scale-95"
            title="Return to companion selector"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-300" />
            <span>Change Companion</span>
          </button>
        </header>

        {/* Center Hero: Prominent "ENTER THE CAMPUS" Heading & Entry Action directly over background */}
        <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto space-y-6 sm:space-y-8 my-auto">
          {/* Welcome Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/40 text-xs sm:text-sm font-medium text-emerald-200 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Welcome, {name.trim() || 'Fellow Learner'} • The gates of IIT Madras are open</span>
          </div>

          {/* Minimal Supporting Text */}
          <p className="text-white/90 text-sm sm:text-base md:text-lg max-w-xl font-serif-body leading-relaxed drop-shadow-md italic animate-in fade-in slide-in-from-bottom-3 duration-500">
            "Your study space is waiting. Step past the iconic main gate, find your favourite corner, and study peacefully alongside fellow learners."
          </p>

          {/* Prominent Enter Campus Button */}
          <div className="pt-2 sm:pt-4 animate-in fade-in zoom-in-90 duration-500">
            <button
              type="button"
              onClick={handleEnterCampus}
              className="group relative px-10 sm:px-16 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-[#244c38] via-[#2d5a43] to-[#244c38] hover:from-[#1b3b2c] hover:to-[#163325] text-white font-serif-title text-lg sm:text-2xl font-bold tracking-widest shadow-[0_12px_32px_rgba(45,90,67,0.5)] border-2 border-emerald-400/80 hover:border-emerald-300 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3.5 cursor-pointer ring-4 ring-emerald-400/25"
            >
              <span>ENTER THE CAMPUS</span>
              <Sparkles className="w-6 h-6 text-amber-300 group-hover:rotate-12 transition-transform" />
            </button>
          </div>

          {/* Translucent Features Strip */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-emerald-100/90 font-medium">
            <span className="bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-md">
              ✦ Silent Ambient Companionship
            </span>
            <span className="bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-md">
              ✦ 7 IIT Madras Study Environments
            </span>
            <span className="bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-md">
              ✦ Real-Time Live Presence
            </span>
          </div>
        </main>

        {/* Bottom Footer Note */}
        <footer className="relative z-10 px-6 py-4 text-center text-[11px] text-white/60 drop-shadow-sm">
          Studyverse — IIT Madras Virtual Campus Simulation • For quiet companions studying together everywhere
        </footer>
      </div>
    );
  }

  // =========================================================================
  // STEPS 1, 2, 3: USER SETUP WITH IMMERSIVE MAIN GATE BACKGROUND
  // =========================================================================
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Full-Screen IIT Madras Main Gate Background with Frosted Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={iitmMainGate}
          alt="IIT Madras Main Gate"
          className="w-full h-full object-cover object-center filter blur-xs scale-105"
        />
        <div className="absolute inset-0 bg-black/55 backdrop-blur-xs" />
      </div>

      {/* Main Glass/Warm Card */}
      <div className="relative w-full max-w-2xl bg-[#fffdfa]/95 rounded-3xl border border-[#ede2d4] shadow-2xl p-6 sm:p-10 backdrop-blur-md z-10 transition-all duration-300">
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
      </div>
    </div>
  );
};
