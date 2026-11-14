import React, { useState, useEffect } from 'react';
import { MessageSquare, Moon } from 'lucide-react';
import { chatService } from '../../services/chatService';

interface ChatTriggerButtonProps {
  locationName: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const ChatTriggerButton: React.FC<ChatTriggerButtonProps> = ({
  locationName,
  isOpen,
  onToggle,
}) => {
  const [unreadCount, setUnreadCount] = useState(chatService.getUnreadCount());
  const [isQuiet, setIsQuiet] = useState(chatService.isQuiet());

  useEffect(() => {
    const unsubUnread = chatService.onUnreadChange((cnt) => {
      setUnreadCount(cnt);
    });

    const unsubQuiet = chatService.onQuietChange((quiet) => {
      setIsQuiet(quiet);
    });

    return () => {
      unsubUnread();
      unsubQuiet();
    };
  }, []);

  const handleClick = () => {
    if (!isOpen && typeof window !== 'undefined' && window.innerWidth < 1100) {
      window.dispatchEvent(new CustomEvent('studyverse:panel-opened', { detail: { panel: 'chat' } }));
    }
    onToggle();
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 px-3.5 py-2.5 rounded-full bg-[#2d5a43] hover:bg-[#1e402e] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border-2 border-[#fffdfa]/30 cursor-pointer group select-none"
      title={`${locationName} Room Chat${isQuiet ? ' (Do Not Disturb ON)' : ''}`}
      aria-label={`Open ${locationName} Chat`}
    >
      <div className="relative">
        <MessageSquare className="w-4 h-4 text-emerald-100 group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && !isQuiet && (
          <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-bounce shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>

      <span className="font-serif-title font-semibold text-xs tracking-wide">
        {isOpen ? 'Close Chat' : 'Room Chat'}
      </span>

      {isQuiet && (
        <span
          className="text-[10px] text-amber-200/90 flex items-center"
          title="Do Not Disturb Active"
        >
          <Moon className="w-3 h-3 fill-amber-200" />
        </span>
      )}
    </button>
  );
};
