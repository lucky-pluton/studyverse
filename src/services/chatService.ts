import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { joinRoom } from 'trystero';
import type { Room, MessageAction } from 'trystero';
import type { LocationId, StudentPresence, ChatMessage } from '../types/studyverse';
import { presenceService } from './presenceService';
import {
  MAX_CHAT_MESSAGE_LENGTH,
  CHAT_RATE_LIMIT_MS,
  MAX_STORED_CHAT_MESSAGES,
} from '../constants/chat';

type ChatMessageListener = (messages: ChatMessage[]) => void;
type UnreadListener = (count: number) => void;
type QuietModeListener = (isQuiet: boolean) => void;

const QUIET_STUDY_STORAGE_KEY = 'studyverse_quiet_study_mode';

class ChatService {
  private currentLocationId: LocationId | null = null;
  private currentUser: StudentPresence | null = null;

  // In-memory messages for current location
  private messages: ChatMessage[] = [];
  private receivedMessageIds: Set<string> = new Set();
  private reportedMessageIds: Set<string> = new Set();
  private mutedSessionIds: Set<string> = new Set();

  // Listeners
  private messageListeners: Set<ChatMessageListener> = new Set();
  private unreadListeners: Set<UnreadListener> = new Set();
  private quietListeners: Set<QuietModeListener> = new Set();

  // State
  private unreadCount: number = 0;
  private isChatOpen: boolean = false;
  private isQuietStudy: boolean = false;
  private lastSentTimestamp: number = 0;

  // Transports
  private supabaseChannel: RealtimeChannel | null = null;
  private trysteroRoom: Room | null = null;
  private trysteroAction: MessageAction<ChatMessage> | null = null;
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    try {
      this.isQuietStudy = localStorage.getItem(QUIET_STUDY_STORAGE_KEY) === 'true';
    } catch {
      this.isQuietStudy = false;
    }
  }

  public getCurrentLocationId(): LocationId | null {
    return this.currentLocationId;
  }

  public getMessages(): ChatMessage[] {
    return this.messages.filter(
      (m) => !this.reportedMessageIds.has(m.id) && !this.mutedSessionIds.has(m.sessionId)
    );
  }

  public getUnreadCount(): number {
    return this.unreadCount;
  }

  public isQuiet(): boolean {
    return this.isQuietStudy;
  }

  public setQuietStudy(enabled: boolean) {
    this.isQuietStudy = enabled;
    try {
      localStorage.setItem(QUIET_STUDY_STORAGE_KEY, enabled ? 'true' : 'false');
    } catch {}
    if (enabled) {
      this.unreadCount = 0;
      this.notifyUnread();
    }
    this.quietListeners.forEach((fn) => fn(enabled));
  }

  public setChatOpen(open: boolean) {
    this.isChatOpen = open;
    if (open) {
      this.unreadCount = 0;
      this.notifyUnread();
    }
  }

  /**
   * Join a location's chat channel.
   * If previously in another location, leaves old channel first.
   */
  public joinLocation(locationId: LocationId, currentUser: StudentPresence) {
    // If already in this location channel, just update current user
    if (this.currentLocationId === locationId && this.currentUser?.sessionId === currentUser.sessionId) {
      this.currentUser = currentUser;
      return;
    }

    // Leave any previous room
    this.leaveCurrentLocation();

    this.currentLocationId = locationId;
    this.currentUser = currentUser;
    this.messages = [];
    this.receivedMessageIds.clear();
    this.unreadCount = 0;
    this.notifyUnread();
    this.notifyMessages();

    const roomChannelId = `studyverse_chat_${locationId}`;

    // 1. Setup Local Multi-Tab BroadcastChannel
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(roomChannelId);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data) {
            this.handleIncomingMessage(event.data as ChatMessage);
          }
        };
      } catch (err) {
        console.warn('[Chat] BroadcastChannel init notice:', err);
      }
    }

    // 2. Setup WebRTC P2P Mesh (Trystero over Port 443 WSS Nostr relays)
    try {
      this.trysteroRoom = joinRoom(
        { appId: 'studyverse_campus_chat_v1' },
        `room_${locationId}`
      );
      this.trysteroAction = this.trysteroRoom.makeAction<ChatMessage>('chat_message');
      this.trysteroAction.onMessage((msg: ChatMessage) => {
        this.handleIncomingMessage(msg);
      });
    } catch (err) {
      console.warn('[Chat] WebRTC init notice:', err);
    }

    // 3. Setup Supabase Realtime Broadcast (if Supabase client configured)
    const supabase = presenceService.getSupabaseClient();
    if (supabase) {
      this.setupSupabaseChat(supabase, roomChannelId);
    }
  }

  private setupSupabaseChat(supabase: SupabaseClient, roomChannelId: string) {
    try {
      this.supabaseChannel = supabase.channel(roomChannelId, {
        config: {
          broadcast: {
            self: false,
          },
        },
      });

      this.supabaseChannel
        .on('broadcast', { event: 'chat_msg' }, ({ payload }) => {
          if (payload) {
            this.handleIncomingMessage(payload as ChatMessage);
          }
        })
        .subscribe((status, err) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn(`[Chat] Supabase channel ${status}:`, err);
          }
        });
    } catch (err) {
      console.warn('[Chat] Failed to subscribe to Supabase chat channel:', err);
    }
  }

  /**
   * Cleanly leave the current location's chat channel.
   */
  public leaveCurrentLocation() {
    if (this.supabaseChannel) {
      try {
        const supabase = presenceService.getSupabaseClient();
        supabase?.removeChannel(this.supabaseChannel);
      } catch {}
      this.supabaseChannel = null;
    }

    if (this.trysteroRoom) {
      try {
        this.trysteroRoom.leave();
      } catch {}
      this.trysteroRoom = null;
      this.trysteroAction = null;
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch {}
      this.broadcastChannel = null;
    }

    this.currentLocationId = null;
    this.messages = [];
    this.receivedMessageIds.clear();
    this.unreadCount = 0;
    this.notifyUnread();
    this.notifyMessages();
  }

  /**
   * Send a chat message or quick reaction
   */
  public sendMessage(
    rawText: string,
    type: 'chat' | 'reaction' = 'chat'
  ): { success: boolean; error?: string } {
    if (!this.currentLocationId || !this.currentUser) {
      return { success: false, error: 'You are not in a study location.' };
    }

    const now = Date.now();

    // 1. Rate Limiting (1 message per 1000ms)
    if (now - this.lastSentTimestamp < CHAT_RATE_LIMIT_MS) {
      return {
        success: false,
        error: 'Please wait a moment before sending another message.',
      };
    }

    // 2. Text validation & sanitization
    const trimmed = rawText.trim();
    if (!trimmed) {
      return { success: false, error: 'Cannot send an empty message.' };
    }

    if (trimmed.length > MAX_CHAT_MESSAGE_LENGTH) {
      return {
        success: false,
        error: `Message exceeds limit of ${MAX_CHAT_MESSAGE_LENGTH} characters.`,
      };
    }

    // Strip any HTML tags or script injection attempts
    const sanitizedText = trimmed.replace(/<[^>]*>?/gm, '').trim();
    if (!sanitizedText) {
      return { success: false, error: 'Invalid message text.' };
    }

    // 3. Construct Message
    const messageId = `msg_${this.currentUser.sessionId}_${now}_${Math.random()
      .toString(36)
      .substring(2, 7)}`;

    const message: ChatMessage = {
      id: messageId,
      sessionId: this.currentUser.sessionId,
      senderName: this.currentUser.name,
      avatarId: this.currentUser.avatarId,
      avatarConfig: this.currentUser.avatarConfig,
      text: sanitizedText,
      timestamp: now,
      locationId: this.currentLocationId,
      type,
    };

    this.lastSentTimestamp = now;

    // 4. Save to local in-memory store
    this.messages.push(message);
    this.receivedMessageIds.add(message.id);
    if (this.messages.length > MAX_STORED_CHAT_MESSAGES) {
      this.messages.shift();
    }
    this.notifyMessages();

    // 5. Dispatch via Supabase Realtime Broadcast
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'chat_msg',
          payload: message,
        });
      } catch (err) {
        console.warn('[Chat] Supabase send error:', err);
      }
    }

    // 6. Dispatch via WebRTC P2P mesh
    if (this.trysteroAction) {
      try {
        this.trysteroAction.send(message);
      } catch (err) {
        console.warn('[Chat] WebRTC send error:', err);
      }
    }

    // 7. Dispatch via local BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch {}
    }

    return { success: true };
  }

  /**
   * Handle incoming message from any transport
   */
  private handleIncomingMessage(msg: ChatMessage) {
    if (!msg || !msg.id || !msg.sessionId || !msg.text) return;
    if (msg.locationId !== this.currentLocationId) return; // Ignore messages from other locations

    // Deduplication check
    if (this.receivedMessageIds.has(msg.id)) return;
    this.receivedMessageIds.add(msg.id);

    // Filter out if muted or reported
    if (this.mutedSessionIds.has(msg.sessionId) || this.reportedMessageIds.has(msg.id)) {
      return;
    }

    // Add to message list
    this.messages.push(msg);
    if (this.messages.length > MAX_STORED_CHAT_MESSAGES) {
      this.messages.shift();
    }

    // Increment unread count if chat is closed and Quiet Study is OFF
    const isFromSelf = msg.sessionId === this.currentUser?.sessionId;
    if (!this.isChatOpen && !isFromSelf && !this.isQuietStudy) {
      this.unreadCount += 1;
      this.notifyUnread();
    }

    this.notifyMessages();
  }

  /**
   * Report a message: immediately hides it from the student
   */
  public reportMessage(messageId: string): boolean {
    this.reportedMessageIds.add(messageId);
    this.messages = this.messages.filter((m) => m.id !== messageId);
    this.notifyMessages();
    return true;
  }

  /**
   * Mute a user: hides all past and future messages from them
   */
  public muteUser(sessionId: string): boolean {
    this.mutedSessionIds.add(sessionId);
    this.messages = this.messages.filter((m) => m.sessionId !== sessionId);
    this.notifyMessages();
    return true;
  }

  /**
   * Subscriptions
   */
  public subscribe(listener: ChatMessageListener): () => void {
    this.messageListeners.add(listener);
    listener(this.getMessages());
    return () => {
      this.messageListeners.delete(listener);
    };
  }

  public onUnreadChange(listener: UnreadListener): () => void {
    this.unreadListeners.add(listener);
    listener(this.unreadCount);
    return () => {
      this.unreadListeners.delete(listener);
    };
  }

  public onQuietChange(listener: QuietModeListener): () => void {
    this.quietListeners.add(listener);
    listener(this.isQuietStudy);
    return () => {
      this.quietListeners.delete(listener);
    };
  }

  private notifyMessages() {
    const list = this.getMessages();
    this.messageListeners.forEach((fn) => fn(list));
  }

  private notifyUnread() {
    this.unreadListeners.forEach((fn) => fn(this.unreadCount));
  }

  public destroy() {
    this.leaveCurrentLocation();
    this.messageListeners.clear();
    this.unreadListeners.clear();
    this.quietListeners.clear();
  }
}

export const chatService = new ChatService();
