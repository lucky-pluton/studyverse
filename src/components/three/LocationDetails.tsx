import React from 'react';
import type { LocationDefinition } from '../../types/studyverse';
import { Users, ArrowRight, X, Sparkles } from 'lucide-react';

interface LocationDetailsProps {
  location: LocationDefinition;
  occupantCount: number;
  onEnter: () => void;
  onClose: () => void;
}

export const LocationDetails: React.FC<LocationDetailsProps> = ({
  location,
  occupantCount,
  onEnter,
  onClose,
}) => {
  const availableSeats = Math.max(0, location.seats.length - occupantCount);

  return (
    <div
      data-test-id="3d-location-details-card"
      className="absolute bottom-16 sm:bottom-18 left-4 sm:left-6 z-40 bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#cbe1d5] shadow-2xl max-w-sm sm:max-w-md w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl p-2 rounded-xl bg-[#eef6f1] border border-[#d2e5da] flex items-center justify-center shadow-inner">
            {location.icon}
          </span>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#356149] bg-[#e2ede6] px-2 py-0.5 rounded-full inline-block mb-1">
              {location.category}
            </span>
            <h3 className="font-serif-title text-base sm:text-lg font-bold text-[#1a3326] leading-tight">
              {location.name}
            </h3>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-[#5c7366] hover:text-[#1a3326] p-1 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
          aria-label="Close building details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-[#415a4c] leading-relaxed mb-3 line-clamp-2">
        {location.description}
      </p>

      {/* Status & Occupancy Badges */}
      <div className="flex items-center justify-between py-2 border-t border-[#e2ece5] text-xs mb-3.5">
        <div className="flex items-center gap-1.5 font-medium text-[#234735]">
          <Users className="w-3.5 h-3.5 text-emerald-700" />
          <span>
            <strong className="text-[#132c1e]">{occupantCount}</strong> studying now
          </span>
        </div>

        <div className="text-[11px] font-semibold text-[#3b664f]">
          {availableSeats > 0 ? (
            <span className="text-emerald-700">● {availableSeats} seats open</span>
          ) : (
            <span className="text-amber-700">● Full</span>
          )}
        </div>
      </div>

      {/* Enter Action Button */}
      <button
        onClick={onEnter}
        data-test-id="enter-study-room-btn"
        className="w-full py-2.5 px-4 rounded-xl bg-[#234b35] hover:bg-[#1a3827] text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer group active:scale-[0.98]"
      >
        <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
        <span>Enter Study Environment</span>
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
};
