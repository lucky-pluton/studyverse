import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Moon,
  Bell,
  MoreVertical,
  Flag,
  UserX,
  Sparkles,
  AlertCircle,
  Minimize2,
} from 'lucide-react';
import type { LocationId, StudentPresence, ChatMessage, AvatarConfig } from '../../types/studyverse';
import { chatService } from '../../services/chatService';
import { QUICK_STUDY_REACTIONS, MAX_CHAT_MESSAGE_LENGTH } from '../../constants/chat';
import { AVATAR_CATALOG } from '../../constants/avatars';
import { AvatarRenderer } from '../common/AvatarRenderer';
import { LOCATIONS } from '../../constants/locations';

interface LocationChatPanelProps {
  locationId: LocationId;
  currentUser: StudentPresence;
  occupantsCount: number;
  isOpen: boolean;
  onClose: () => void;
  onToggleDnd?: () => void;
}

export const LocationChatPanel: React.FC<LocationChatPanelProps> = ({
  locationId,
  currentUser,
  occupantsCount,
  isOpen,
  onClose,
  onToggleDnd,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isQuiet, setIsQuiet] = useState(chatService.isQuiet() || !!currentUser.isDnd);
  const [cooldownSec, setCooldownSec] = useState<number>(0);
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const locationDef = LOCATIONS[locationId] || LOCATIONS.library;
  const isDndActive = isQuiet || !!currentUser.isDnd;

  // Initialize and subscribe to chat for this location
  useEffect(() => {
    chatService.joinLocation(locationId, currentUser);
    chatService.setChatOpen(isOpen);

    const unsubscribeMessages = chatService.subscribe((msgs) => {
      setMessages([...msgs]);
    });

    const unsubscribeQuiet = chatService.onQuietChange((quiet) => {
      setIsQuiet(quiet);
    });

    return () => {
      unsubscribeMessages();
      unsubscribeQuiet();
    };
  }, [locationId, currentUser.sessionId, currentUser.isDnd]);

  // Mutual collision avoidance with Timer utility on constrained viewports (< 1100px)
  useEffect(() => {
    const handlePanelOpened = (e: Event) => {
      const custom = e as CustomEvent<{ panel: string }>;
      if (typeof window !== 'undefined' && window.innerWidth < 1100 && custom.detail?.panel === 'timer') {
        onClose();
        window.dispatchEvent(new CustomEvent('studyverse:panel-closed', { detail: { panel: 'chat' } }));
      }
    };
    window.addEventListener('studyverse:panel-opened', handlePanelOpened);
    return () => window.removeEventListener('studyverse:panel-opened', handlePanelOpened);
  }, [onClose]);

  // Keep internal quiet state in sync with currentUser.isDnd
  useEffect(() => {
    if (currentUser.isDnd !== undefined && currentUser.isDnd !== isQuiet) {
      setIsQuiet(currentUser.isDnd);
    }
  }, [currentUser.isDnd]);

  // Keep chat open status in sync
  useEffect(() => {
    chatService.setChatOpen(isOpen);
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isOpen]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSec <= 0) return;
    const timer = setTimeout(() => {
      setCooldownSec((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldownSec]);

  if (!isOpen) return null;

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isDndActive) {
      setFeedbackNotice("You're in Do Not Disturb mode. Enjoy your quiet study time.");
      setTimeout(() => setFeedbackNotice(null), 3500);
      return;
    }
    if (!inputText.trim()) return;

    if (cooldownSec > 0) {
      setFeedbackNotice('Please wait a moment before sending another message.');
      setTimeout(() => setFeedbackNotice(null), 3000);
      return;
    }

    const res = chatService.sendMessage(inputText, 'chat');
    if (res.success) {
      setInputText('');
      setCooldownSec(1);
    } else if (res.error) {
      setFeedbackNotice(res.error);
      setTimeout(() => setFeedbackNotice(null), 3500);
    }
  };

  const handleSendReaction = (text: string) => {
    if (isDndActive || cooldownSec > 0) return;
    const res = chatService.sendMessage(text, 'reaction');
    if (res.success) {
      setCooldownSec(1);
    }
  };

  const handleToggleQuietStudy = () => {
    if (onToggleDnd) {
      onToggleDnd();
    } else {
      const next = !isDndActive;
      chatService.setQuietStudy(next);
      setIsQuiet(next);
    }
    const nextState = !isDndActive;
    setFeedbackNotice(
      nextState
        ? "You're in Do Not Disturb mode. Enjoy your quiet study time."
        : 'Do Not Disturb disabled. Normal chat restored.'
    );
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  const handleReportMessage = (msgId: string) => {
    chatService.reportMessage(msgId);
    setActiveMenuMsgId(null);
    setFeedbackNotice('Message reported and hidden from your view.');
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  const handleMuteUser = (sessionId: string, senderName: string) => {
    chatService.muteUser(sessionId);
    setActiveMenuMsgId(null);
    setFeedbackNotice(`${senderName} muted for this session.`);
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  const getAvatarConfig = (msg: ChatMessage): AvatarConfig => {
    if (msg.avatarConfig) return msg.avatarConfig;
    const found = AVATAR_CATALOG.find((a) => a.id === msg.avatarId);
    return found || AVATAR_CATALOG[0];
  };

  const formatTimestamp = (ts: number): string => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studyverse:panel-closed', { detail: { panel: 'chat' } }));
    }
    onClose();
  };

  return (
    <div
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-sm h-[560px] max-h-[85vh] bg-[#fffdfa] rounded-3xl border-2 border-[#ded4c5] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-3 duration-200 text-[#302a24]"
      role="dialog"
      aria-label={`${locationDef.name} Chat`}
    >
      {/* Top Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-[#edf4ef] via-[#f7f2eb] to-[#edf3ee] border-b border-[#e2d7c8] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{locationDef.icon}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-serif-title font-bold text-xs sm:text-sm text-[#223d2e] truncate max-w-[170px]">
                {locationDef.name}
              </h2>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#dcebe1] text-[#244b36] font-semibold">
                Chat
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#63796d]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{occupantsCount} studying here</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Do Not Disturb / Quiet Toggle */}
          <button
            onClick={handleToggleQuietStudy}
            type="button"
            className={`p-1.5 rounded-xl text-xs flex items-center gap-1 border transition-colors cursor-pointer ${
              isDndActive
                ? 'bg-[#253f31] text-amber-200 border-[#1a2d23] shadow-2xs ring-1 ring-amber-300/40'
                : 'bg-[#faf6f0] hover:bg-[#ede5d8] text-[#55483a] border-[#e0d4c4]'
            }`}
            title={
              isDndActive
                ? 'Do Not Disturb is ON (Notifications silenced). Click to turn OFF.'
                : 'Enable Do Not Disturb (Silence notifications).'
            }
          >
            {isDndActive ? <Moon className="w-3.5 h-3.5 fill-amber-300 text-amber-300" /> : <Bell className="w-3.5 h-3.5" />}
            <span className="text-[10px] font-semibold hidden sm:inline">
              {isDndActive ? 'DND On' : 'Alerts'}
            </span>
          </button>

          {/* Minimise / Close Button */}
          <button
            onClick={handleClose}
            type="button"
            className="p-1.5 rounded-xl hover:bg-[#ebdcd0] text-[#6f6153] transition-colors cursor-pointer"
            title="Minimise Chat"
            aria-label="Minimise Chat"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notice Banner (Reports, Mutes, or Rate-limits) */}
      {feedbackNotice && (
        <div className="px-3 py-1.5 bg-[#fef3c7] border-b border-[#fde68a] text-amber-900 text-[11px] flex items-center gap-1.5 shrink-0 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span className="flex-1 truncate">{feedbackNotice}</span>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="text-[10px] font-bold text-amber-800 hover:underline"
          >
            ✕
          </button>
        </div>
      )}

      {/* Message List Area */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#faf7f2]/50 text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[#8a7e70] space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#eee7dc] flex items-center justify-center text-xl text-[#635546]">
              {locationDef.icon}
            </div>
            <p className="font-serif-title font-semibold text-xs text-[#40372f]">
              Quiet Study in {locationDef.name}
            </p>
            <p className="text-[11px] text-[#7d7061] max-w-[240px] leading-relaxed">
              Say hello or encourage fellow learners studying here. Messages are lightweight, temporary, and never stored.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-1.5">
              {QUICK_STUDY_REACTIONS.slice(0, 3).map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSendReaction(r.text)}
                  className="px-2.5 py-1 rounded-full bg-[#f2ebe0] hover:bg-[#e6ddcf] text-[11px] font-medium text-[#403529] border border-[#ded3c3] transition-all cursor-pointer"
                >
                  {r.emoji} {r.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.sessionId === currentUser.sessionId;
            const isReaction = msg.type === 'reaction';
            const avatarCfg = getAvatarConfig(msg);

            return (
              <div
                key={msg.id}
                className={`relative group flex gap-2 items-start ${
                  isSelf ? 'flex-row-reverse text-right' : 'flex-row text-left'
                }`}
              >
                {/* Chibi Avatar Thumbnail */}
                <div className="shrink-0 mt-0.5">
                  <div className="w-7 h-7 rounded-full bg-[#f4ebe0] border border-[#ded2c2] overflow-hidden flex items-center justify-center shadow-2xs">
                    <AvatarRenderer
                      config={avatarCfg}
                      size="xs"
                      showProp={false}
                      animate={false}
                      className="scale-90"
                    />
                  </div>
                </div>

                {/* Message Bubble Container */}
                <div className={`max-w-[78%] space-y-0.5 ${isSelf ? 'items-end' : 'items-start'}`}>
                  {/* Sender Header */}
                  <div className="flex items-center gap-1.5 text-[10px] text-[#827668]">
                    <span className="font-semibold text-[#423930]">
                      {msg.senderName} {isSelf && '(you)'}
                    </span>
                    <span>•</span>
                    <span>{formatTimestamp(msg.timestamp)}</span>

                    {/* Safety Options (for other students' messages) */}
                    {!isSelf && (
                      <div className="relative inline-block opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() =>
                            setActiveMenuMsgId(activeMenuMsgId === msg.id ? null : msg.id)
                          }
                          className="p-0.5 text-[#918373] hover:text-[#383027] rounded-sm"
                          title="Message options"
                        >
                          <MoreVertical className="w-3 h-3" />
                        </button>

                        {activeMenuMsgId === msg.id && (
                          <div className="absolute left-0 bottom-full mb-1 z-30 w-32 bg-[#fffdfa] rounded-xl border border-[#ded1be] shadow-lg py-1 text-[11px]">
                            <button
                              onClick={() => handleReportMessage(msg.id)}
                              className="w-full px-2.5 py-1 text-left hover:bg-[#fbf4eb] flex items-center gap-1.5 text-rose-700 cursor-pointer"
                            >
                              <Flag className="w-3 h-3" />
                              Report
                            </button>
                            <button
                              onClick={() => handleMuteUser(msg.sessionId, msg.senderName)}
                              className="w-full px-2.5 py-1 text-left hover:bg-[#fbf4eb] flex items-center gap-1.5 text-neutral-700 cursor-pointer"
                            >
                              <UserX className="w-3 h-3" />
                              Mute student
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`px-3 py-2 rounded-2xl text-[12px] leading-relaxed break-words shadow-2xs ${
                      isReaction
                        ? 'bg-amber-50/90 border border-amber-200 text-[#4d381c] font-medium'
                        : isSelf
                        ? 'bg-[#eaf3ee] border border-[#c6dfd2] text-[#1c3c2b] rounded-tr-xs'
                        : 'bg-[#fffdfa] border border-[#e8ded1] text-[#2d2822] rounded-tl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Reaction Bar */}
      <div className="px-3 py-1.5 bg-[#f6efe6] border-t border-[#e8ded0] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[10px] font-semibold text-[#7c6f60] uppercase shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-600" />
          Quick:
        </span>
        {QUICK_STUDY_REACTIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            disabled={isDndActive || cooldownSec > 0}
            onClick={() => handleSendReaction(r.text)}
            className="px-2 py-0.5 rounded-full bg-[#fffdfa] hover:bg-[#ede5d8] border border-[#e0d5c5] text-[11px] text-[#4d4032] shrink-0 font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {r.emoji} {r.label}
          </button>
        ))}
      </div>

      {/* Do Not Disturb Banner */}
      {isDndActive && (
        <div className="px-3.5 py-2.5 bg-gradient-to-r from-[#edf4ef] via-[#f7f3ec] to-[#edf4ef] border-t border-[#ded4c5] flex items-center justify-between text-xs text-[#2d4d3c] shrink-0 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-sm">🌙</span>
            <span className="font-medium text-[11px] leading-tight text-[#233d2f]">
              You're in Do Not Disturb mode. Enjoy your quiet study time.
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggleQuietStudy}
            className="px-2 py-0.5 rounded-lg bg-white hover:bg-[#eae3d5] text-[#2d5a43] border border-[#c8dacf] font-semibold text-[10px] shadow-2xs shrink-0 cursor-pointer transition-colors"
          >
            Turn Off
          </button>
        </div>
      )}

      {/* Input Form Footer */}
      <form
        onSubmit={handleSendMessage}
        className="p-2.5 bg-[#fffdfa] border-t border-[#e6dcce] flex items-center gap-2 shrink-0"
      >
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            disabled={isDndActive}
            value={inputText}
            maxLength={MAX_CHAT_MESSAGE_LENGTH}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isDndActive
                ? "You're in Do Not Disturb mode. Enjoy your quiet study time."
                : `Message ${locationDef.name}...`
            }
            className={`w-full pl-3 pr-12 py-2 rounded-2xl text-xs transition-all shadow-inner ${
              isDndActive
                ? 'bg-[#f0ebe3] border border-[#ded5c6] text-[#8c7f70] cursor-not-allowed placeholder-[#8c7f70]'
                : 'bg-[#faf6f0] border border-[#ded2c1] text-[#2b251e] placeholder-[#9c8e7e] focus:outline-hidden focus:border-[#2d5a43] focus:bg-white'
            }`}
          />
          {!isDndActive && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-[#9c8f80] font-mono pointer-events-none">
              {inputText.length}/{MAX_CHAT_MESSAGE_LENGTH}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isDndActive || !inputText.trim() || cooldownSec > 0}
          className="w-9 h-9 rounded-2xl bg-[#2d5a43] hover:bg-[#1e402e] disabled:bg-[#d6cbbe] disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-xs cursor-pointer shrink-0"
          title={isDndActive ? "In Do Not Disturb mode" : "Send message"}
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
