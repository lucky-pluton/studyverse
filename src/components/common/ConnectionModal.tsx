import React, { useState } from 'react';
import { X, Check, Copy, ExternalLink, Globe, Wifi, Users, Sparkles, ShieldCheck } from 'lucide-react';
import { presenceService } from '../../services/presenceService';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const mode = presenceService.getMode();
  const isSupabase = mode === 'supabase';

  if (!isOpen) return null;

  const envSnippet = `# Studyverse - Global Realtime Presence (Supabase)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key...`;

  const handleCopy = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenCompanionTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#fffdfa] rounded-2xl border border-[#e5dcd0] shadow-2xl overflow-hidden text-[#38332e]">
        {/* Header */}
        <div className="px-6 py-5 bg-[#f6efe6] border-b border-[#e8ded1] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isSupabase ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
              {isSupabase ? <Globe className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-serif-title text-base font-semibold text-[#2f2b27]">
                Multiplayer Network Status
              </h3>
              <p className="text-xs text-[#786c5f]">
                {isSupabase ? 'Connected to Global Supabase Realtime' : 'Local Multi-Tab Peer Network Active'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7c6f62] hover:bg-[#ebdcd0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm">
          {/* Current Mode Status Card */}
          <div className="p-4 rounded-xl bg-[#faf5ee] border border-[#ebdccb] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#735e4d]">Active Engine</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isSupabase
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                {isSupabase ? 'Global Cloud Mode' : 'Local Peer Mode'}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#595045]">
              {isSupabase
                ? 'Your Studyverse instance is connected to Supabase Realtime Presence. Students from anywhere in the world on different machines share seats and timers simultaneously.'
                : 'Local Peer Mode is active using BroadcastChannel and WebStorage events. Any browser tab or window you open on this device acts as an independent student who joins, occupies seats, and synchronizes timers in real-time!'}
            </p>
          </div>

          {/* Quick test multiplayer button */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#edf2ee] to-[#f4eee6] border border-[#d2ded4] flex items-center justify-between gap-3">
            <div>
              <div className="font-medium text-xs text-[#2a4537] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#476e5b]" />
                Test Multiplayer Right Now
              </div>
              <p className="text-[11px] text-[#597566] mt-0.5">
                Open a 2nd tab side-by-side to watch avatars & timers sync instantly.
              </p>
            </div>
            <button
              onClick={handleOpenCompanionTab}
              className="px-3 py-1.5 bg-[#3a5849] hover:bg-[#2d463a] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
            >
              Open Tab
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Supabase Global Setup Instructions */}
          {!isSupabase && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#483f36] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#a8824f]" />
                  Enable Global Cross-Device Multiplayer
                </span>
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#4f6e5e] hover:underline flex items-center gap-1"
                >
                  supabase.com
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <p className="text-xs text-[#6e6356] leading-relaxed">
                To connect students across phones, laptops, and different networks, add your free Supabase URL and Anon Key to a <code className="px-1 py-0.5 bg-[#ede4d7] rounded text-[11px]">.env</code> file in the project root:
              </p>

              <div className="relative">
                <pre className="p-3 bg-[#2d2926] text-[#e8dfd5] rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed">
                  {envSnippet}
                </pre>
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs flex items-center gap-1 transition-all"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Privacy note */}
          <div className="flex items-center gap-2 text-[11px] text-[#7c7165] pt-2 border-t border-[#eee5d8]">
            <ShieldCheck className="w-4 h-4 text-[#8a9988]" />
            <span>Ephemeral session identity. No accounts, emails, or personal tracking.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#f6efe6] border-t border-[#e8ded1] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-[#443c34] hover:bg-[#342e28] text-white rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

