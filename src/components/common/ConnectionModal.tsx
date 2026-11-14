import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Copy,
  ExternalLink,
  Globe,
  Wifi,
  Users,
  Sparkles,
  ShieldCheck,
  Radio,
  Server,
  RefreshCw,
} from 'lucide-react';
import { presenceService } from '../../services/presenceService';
import type { PresenceMode, ConnectionStatus } from '../../services/presenceService';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<PresenceMode>(presenceService.getMode());
  const [status, setStatus] = useState<ConnectionStatus>(presenceService.getConnectionStatus());
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setMode(presenceService.getMode());
    setStatus(presenceService.getConnectionStatus());

    const unsubscribe = presenceService.onStatusChange((newStatus, newMode) => {
      setStatus(newStatus);
      setMode(newMode);
    });

    const cfg = presenceService.getSupabaseConfig();
    if (cfg.url) {
      setCustomUrl(cfg.url);
    }

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isSupabase = mode === 'supabase';
  const isWebRtc = mode === 'webrtc_cloud';
  const isCloudRelay = mode === 'webrtc_cloud' || mode === 'mqtt_relay';

  const envSnippet = `# GitHub Actions Secrets / .env Configuration:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key...`;

  const handleCopy = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenCompanionTab = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('new_student', 'true');
    window.open(url.toString(), '_blank');
  };

  const handleConnectCustomSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() || !customKey.trim()) return;

    const ok = presenceService.configureSupabase(customUrl, customKey);
    if (ok) {
      setSaveSuccess('Connected to custom Supabase project!');
      setTimeout(() => setSaveSuccess(null), 3000);
    }
  };

  const handleResetToCloudRelay = () => {
    presenceService.clearCustomSupabase();
    setCustomUrl('');
    setCustomKey('');
    setSaveSuccess('Switched back to Global Cloud Relay');
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#fffdfa] rounded-3xl border border-[#e5dcd0] shadow-2xl overflow-hidden text-[#38332e] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-[#f6efe6] border-b border-[#e8ded1] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isSupabase
                  ? 'bg-emerald-100 text-emerald-800'
                  : isCloudRelay
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {isSupabase ? (
                <Globe className="w-5 h-5" />
              ) : isCloudRelay ? (
                <Radio className="w-5 h-5 animate-pulse" />
              ) : (
                <Wifi className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-serif-title text-base font-semibold text-[#2f2b27]">
                Multiplayer Network Status
              </h3>
              <p className="text-xs text-[#786c5f]">
                {isSupabase
                  ? 'Connected to Global Supabase Realtime'
                  : isWebRtc
                  ? 'Connected to WebRTC Mesh (Port 443 WSS — Cross-Device Active)'
                  : isCloudRelay
                  ? 'Connected to Global Cloud Relay (Cross-Device Active)'
                  : 'Local Peer Mode (Single Machine)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7c6f62] hover:bg-[#ebdcd0] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="p-6 space-y-4 text-sm overflow-y-auto">
          {/* Current Engine Status Card */}
          <div className="p-4 rounded-2xl bg-[#faf5ee] border border-[#ebdccb] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#735e4d]">
                Active Engine
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  status === 'connected'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    status === 'connected' ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
                  }`}
                />
                <span>
                  {isSupabase
                    ? 'Supabase Realtime Cloud'
                    : isWebRtc
                    ? 'WebRTC Mesh (Port 443 WSS)'
                    : isCloudRelay
                    ? 'Global Cloud Relay'
                    : 'Local Peer Mode'}
                  {' • '}
                  {status === 'connected' ? 'Connected' : 'Connecting...'}
                </span>
              </span>
            </div>

            <p className="text-xs leading-relaxed text-[#595045]">
              {isSupabase
                ? 'Your Studyverse instance is connected to Supabase Realtime. Students on different devices anywhere in the world share seats, avatars, and timers simultaneously.'
                : isWebRtc
                ? 'Cross-device multiplayer is active via WebRTC peer-to-peer data channels coordinated over standard Port 443 WSS relays. Works across mobile phones, laptops, campus Wi-Fi, and incognito windows.'
                : isCloudRelay
                ? 'Cross-device multiplayer is active via the built-in Global Cloud Relay over secure TLS WebSockets.'
                : 'Local Peer Mode is active using BroadcastChannel. Tabs on this device synchronize in real-time.'}
            </p>
          </div>

          {/* Quick test multiplayer button */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#edf2ee] to-[#f4eee6] border border-[#d2ded4] flex items-center justify-between gap-3">
            <div>
              <div className="font-medium text-xs text-[#2a4537] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#476e5b]" />
                Test Multiplayer Now
              </div>
              <p className="text-[11px] text-[#597566] mt-0.5">
                Open a 2nd tab or incognito window to watch avatars & timers sync instantly.
              </p>
            </div>
            <button
              onClick={handleOpenCompanionTab}
              className="px-3 py-1.5 bg-[#3a5849] hover:bg-[#2d463a] text-white text-xs font-medium rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              Open Tab
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Custom Supabase Connection Form */}
          <div className="p-4 rounded-2xl bg-[#fffdfa] border border-[#e2d5c5] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#3b322a] flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-[#52796f]" />
                Connect Your Own Supabase Project
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
              You can connect a dedicated Supabase Realtime project directly in the browser, or provide credentials in GitHub repository secrets for production builds:
            </p>

            <form onSubmit={handleConnectCustomSupabase} className="space-y-2">
              <input
                type="url"
                placeholder="https://your-project.supabase.co"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#faf5ee] border border-[#d8cab9] rounded-xl focus:outline-hidden focus:border-[#2d5a43]"
              />
              <input
                type="text"
                placeholder="eyJhbGciOi... anon public key"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#faf5ee] border border-[#d8cab9] rounded-xl focus:outline-hidden focus:border-[#2d5a43] font-mono text-[11px]"
              />

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#2d5a43] hover:bg-[#204432] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Connect Supabase
                </button>
                {presenceService.getSupabaseConfig().isCustom && (
                  <button
                    type="button"
                    onClick={handleResetToCloudRelay}
                    className="px-3 py-1.5 bg-[#f1eae0] hover:bg-[#e4d8c8] text-[#54473a] text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset to Global Relay
                  </button>
                )}
              </div>
            </form>

            {saveSuccess && (
              <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 p-2 rounded-xl flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{saveSuccess}</span>
              </div>
            )}
          </div>

          {/* GitHub Actions Secrets Snippet */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-[#483f36] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#a8824f]" />
              GitHub Repository Secrets for Production
            </span>

            <p className="text-xs text-[#6e6356] leading-relaxed">
              In your GitHub repo go to <strong>Settings → Secrets and variables → Actions</strong> and add these repository secrets:
            </p>

            <div className="relative">
              <pre className="p-3 bg-[#2d2926] text-[#e8dfd5] rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed">
                {envSnippet}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs flex items-center gap-1 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Privacy note */}
          <div className="flex items-center gap-2 text-[11px] text-[#7c7165] pt-2 border-t border-[#eee5d8]">
            <ShieldCheck className="w-4 h-4 text-[#8a9988]" />
            <span>Ephemeral session identity. No accounts, passwords, or personal data stored.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#f6efe6] border-t border-[#e8ded1] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-[#443c34] hover:bg-[#342e28] text-white rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
