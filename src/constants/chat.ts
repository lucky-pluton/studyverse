import type { QuickStudyReaction } from '../types/studyverse';

export const QUICK_STUDY_REACTIONS: QuickStudyReaction[] = [
  { id: 'hello', emoji: '👋', label: 'Hello!', text: '👋 Hello fellow learners!' },
  { id: 'study', emoji: '📚', label: "Let's study!", text: "📚 Settle in, let's study together!" },
  { id: 'focus', emoji: '⏱️', label: 'Starting focus', text: '⏱️ Starting a deep focus session now.' },
  { id: 'break', emoji: '☕', label: 'Taking a break', text: '☕ Stepping away for a quick peaceful break.' },
  { id: 'keepgoing', emoji: '💪', label: 'Keep going!', text: '💪 You got this! Keep going strong!' },
  { id: 'goodluck', emoji: '🙌', label: 'Good luck!', text: '🙌 Good luck with your studies and exams!' },
];

export const MAX_CHAT_MESSAGE_LENGTH = 300;
export const CHAT_RATE_LIMIT_MS = 1000;
export const MAX_STORED_CHAT_MESSAGES = 60;
/** a message reported by this many different students is hidden for everyone in the room */
export const COMMUNITY_HIDE_REPORT_COUNT = 2;
