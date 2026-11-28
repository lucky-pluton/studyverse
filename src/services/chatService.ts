import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { joinRoom } from 'trystero';
import type { Room, MessageAction } from 'trystero';
import Paho from 'paho-mqtt';
import type { LocationId, StudentPresence, ChatMessage } from '../types/studyverse';
import { presenceService } from './presenceService';
import { soundService } from './soundService';
import {
  MAX_CHAT_MESSAGE_LENGTH,
  CHAT_RATE_LIMIT_MS,
  MAX_STORED_CHAT_MESSAGES,
  COMMUNITY_HIDE_REPORT_COUNT,
} from '../constants/chat';

type ChatMessageListener = (messages: ChatMessage[]) => void;
type UnreadListener = (count: number) => void;
type QuietModeListener = (isQuiet: boolean) => void;
type ConnectionStatusListener = (status: 'connected' | 'connecting' | 'disconnected') => void;
type ChatSoundListener = (enabled: boolean) => void;

const QUIET_STUDY_STORAGE_KEY = 'studyverse_quiet_study_mode';
const DND_STORAGE_KEY = 'studyverse_dnd_enabled';
const CHAT_SOUND_STORAGE_KEY = 'studyverse_chat_sound_enabled';

const isDev = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  localStorage.getItem('studyverse_debug_audio') === 'true'
);

function logChatAudioDiagnostic(step: number, action: string, details?: Record<string, unknown>) {
  if (isDev) {
    console.log(`[ChatAudio:Step${step}] ${action}`, details || '');
  }
}

const RELIABLE_NOSTR_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.current.fyi',
  'wss://nostr.mom',
  'wss://purplerelay.com',
  'wss://relay.primal.net',
];

const MQTT_BROKERS = [
  { host: 'broker.emqx.io', port: 8084, path: '/mqtt' },
  { host: 'broker.hivemq.com', port: 8884, path: '/mqtt' },
];

const MQTT_TOPIC_CHAT_PREFIX = 'studyverse/global/v2/chat/';

class ChatService {
  private currentLocationId: LocationId | null = null;
  private currentUser: StudentPresence | null = null;

  // In-memory messages for current location
  private messages: ChatMessage[] = [];
  private receivedMessageIds: Set<string> = new Set();
  private reportedMessageIds: Set<string> = new Set();
  private mutedSessionIds: Set<string> = new Set();
  /** shared moderation: who has reported each message in this room */
  private reportsByMessage: Map<string, Set<string>> = new Map();
  /** messages hidden for everyone after enough different students reported them */
  private communityHiddenIds: Set<string> = new Set();

  // Listeners
  private messageListeners: Set<ChatMessageListener> = new Set();
  private unreadListeners: Set<UnreadListener> = new Set();
  private quietListeners: Set<QuietModeListener> = new Set();
  private statusListeners: Set<ConnectionStatusListener> = new Set();
  private soundListeners: Set<ChatSoundListener> = new Set();

  // State
  private unreadCount: number = 0;
  private isChatOpen: boolean = false;
  private isQuietStudy: boolean = false;
  private isSoundEnabled: boolean = true;
  private lastSentTimestamp: number = 0;
  private lastNotificationSoundTimestamp: number = 0;
  private roomJoinedTimestamp: number = 0;
  private isDestroyed: boolean = false;

  // Transport 1: Supabase Realtime Broadcast
  private supabaseChannel: RealtimeChannel | null = null;
  private isSupabaseSubscribed: boolean = false;
  private pendingSupabaseMessages: ChatMessage[] = [];

  // Transport 2: Global Cloud MQTT WebSocket Relay
  private mqttClient: Paho.Client | null = null;
  private mqttBrokerIndex: number = 0;
  private isMqttConnected: boolean = false;
  private isMqttConnecting: boolean = false;
  private subscribedMqttTopic: string | null = null;
  private pendingMqttMessages: ChatMessage[] = [];

  // Transport 3: WebRTC P2P Mesh (Trystero over Port 443 WSS Nostr relays)
  private trysteroRoom: Room | null = null;
  private trysteroAction: MessageAction<ChatMessage> | null = null;

  // Transport 4: Local Multi-Tab BroadcastChannel
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    try {
      this.isQuietStudy =
        localStorage.getItem(DND_STORAGE_KEY) === 'true' ||
        localStorage.getItem(QUIET_STUDY_STORAGE_KEY) === 'true';
    } catch {
      this.isQuietStudy = false;
    }

    try {
      const storedSound = localStorage.getItem(CHAT_SOUND_STORAGE_KEY);
      this.isSoundEnabled = storedSound !== null ? storedSound === 'true' : true;
    } catch {
      this.isSoundEnabled = true;
    }
  }

  public getCurrentLocationId(): LocationId | null {
    return this.currentLocationId;
  }

  public getMessages(): ChatMessage[] {
    return this.messages.filter(
      (m) =>
        !this.reportedMessageIds.has(m.id) &&
        !this.communityHiddenIds.has(m.id) &&
        !this.mutedSessionIds.has(m.sessionId)
    );
  }

  public getUnreadCount(): number {
    return this.unreadCount;
  }

  public isQuiet(): boolean {
    return this.isQuietStudy;
  }

  public isDnd(): boolean {
    return this.isQuietStudy || !!this.currentUser?.isDnd;
  }

  public setQuietStudy(enabled: boolean) {
    this.isQuietStudy = enabled;
    if (this.currentUser) {
      this.currentUser.isDnd = enabled;
    }
    try {
      localStorage.setItem(DND_STORAGE_KEY, enabled ? 'true' : 'false');
      localStorage.setItem(QUIET_STUDY_STORAGE_KEY, enabled ? 'true' : 'false');
    } catch {}
    if (enabled) {
      this.unreadCount = 0;
      this.notifyUnread();
    }
    this.quietListeners.forEach((fn) => fn(enabled));
  }

  public setDnd(enabled: boolean) {
    this.setQuietStudy(enabled);
  }

  public setCurrentUser(user: StudentPresence) {
    this.currentUser = user;
    if (user.isDnd !== undefined && user.isDnd !== this.isQuietStudy) {
      this.setQuietStudy(user.isDnd);
    }
  }

  public setChatOpen(open: boolean) {
    this.isChatOpen = open;
    if (open) {
      this.unreadCount = 0;
      this.notifyUnread();
    }
  }

  // =========================================================================
  // CHAT SOUND PREFERENCE & NOTIFICATION CONTROLS
  // =========================================================================

  public isChatSoundEnabled(): boolean {
    return this.isSoundEnabled;
  }

  public setChatSoundEnabled(enabled: boolean) {
    this.isSoundEnabled = enabled;
    try {
      localStorage.setItem(CHAT_SOUND_STORAGE_KEY, enabled ? 'true' : 'false');
    } catch {}
    this.soundListeners.forEach((fn) => fn(enabled));
  }

  public toggleChatSound(): boolean {
    const next = !this.isSoundEnabled;
    this.setChatSoundEnabled(next);
    return next;
  }

  public onSoundChange(listener: ChatSoundListener): () => void {
    this.soundListeners.add(listener);
    return () => this.soundListeners.delete(listener);
  }

  public async previewNotificationSound(): Promise<{ success: boolean; state: string; error?: string }> {
    return soundService.playChatChime();
  }

  // =========================================================================
  // MQTT WEBSOCKET RELAY (Guaranteed Cross-Device Cloud Delivery)
  // =========================================================================

  private initMqttRelay() {
    if (this.isDestroyed || this.isMqttConnected || this.isMqttConnecting || this.mqttClient) {
      return;
    }

    this.isMqttConnecting = true;
    const broker = MQTT_BROKERS[this.mqttBrokerIndex % MQTT_BROKERS.length];
    const sessionPart = this.currentUser?.sessionId || Math.random().toString(36).substring(2, 9);
    const clientId = `studyverse_chat_${sessionPart}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      const client = new Paho.Client(broker.host, broker.port, broker.path, clientId);
      this.mqttClient = client;

      client.onConnectionLost = (responseObject) => {
        if (this.mqttClient === client) {
          this.isMqttConnected = false;
          this.isMqttConnecting = false;
          this.mqttClient = null;
        }
        this.notifyStatus('disconnected');
        if (responseObject.errorCode !== 0 && !this.isDestroyed) {
          console.warn('[Chat MQTT] Connection lost, failover in 3s:', responseObject.errorMessage);
          setTimeout(() => {
            if (!this.isDestroyed && !this.isMqttConnected && !this.isMqttConnecting && !this.mqttClient) {
              this.mqttBrokerIndex++;
              this.initMqttRelay();
            }
          }, 3000);
        }
      };

      client.onMessageArrived = (message) => {
        try {
          const payload = JSON.parse(message.payloadString);
          this.handleIncomingMessage(payload as ChatMessage);
        } catch (err) {
          console.warn('[Chat MQTT] Failed to parse message JSON:', err);
        }
      };

      this.notifyStatus('connecting');

      client.connect({
        useSSL: true,
        timeout: 8,
        keepAliveInterval: 20,
        cleanSession: true,
        onSuccess: () => {
          if (this.mqttClient !== client || this.isDestroyed) return;
          this.isMqttConnected = true;
          this.isMqttConnecting = false;
          this.notifyStatus('connected');
          console.log('[Chat MQTT] Connected to broker successfully:', broker.host);

          // If currently inside a location, subscribe immediately to that location's topic
          if (this.currentLocationId) {
            const topic = `${MQTT_TOPIC_CHAT_PREFIX}${this.currentLocationId}`;
            try {
              client.subscribe(topic, { qos: 0 });
              this.subscribedMqttTopic = topic;
              console.log('[Chat MQTT] Subscribed to topic:', topic);
            } catch (e) {
              console.warn('[Chat MQTT] Subscribe error:', e);
            }
          }

          // Flush any pending messages that were queued while connecting
          if (this.pendingMqttMessages.length > 0) {
            const queued = [...this.pendingMqttMessages];
            this.pendingMqttMessages = [];
            queued.forEach((msg) => this.dispatchMqttMessage(msg));
          }
        },
        onFailure: (err) => {
          if (this.mqttClient === client) {
            this.isMqttConnected = false;
            this.isMqttConnecting = false;
            this.mqttClient = null;
          }
          this.notifyStatus('disconnected');
          console.warn('[Chat MQTT] Connect failure, trying fallback broker in 3s:', err);
          if (!this.isDestroyed) {
            this.mqttBrokerIndex++;
            setTimeout(() => {
              if (!this.isDestroyed && !this.isMqttConnected && !this.isMqttConnecting && !this.mqttClient) {
                this.initMqttRelay();
              }
            }, 3000);
          }
        },
      });
    } catch (err) {
      this.isMqttConnecting = false;
      this.mqttClient = null;
      console.warn('[Chat MQTT] Setup exception:', err);
    }
  }

  private dispatchMqttMessage(msg: ChatMessage) {
    if (!this.mqttClient || !this.isMqttConnected || !this.currentLocationId) {
      this.pendingMqttMessages.push(msg);
      return;
    }

    try {
      const topic = `${MQTT_TOPIC_CHAT_PREFIX}${this.currentLocationId}`;
      const pahoMsg = new Paho.Message(JSON.stringify(msg));
      pahoMsg.destinationName = topic;
      pahoMsg.qos = 0;
      this.mqttClient.send(pahoMsg);
    } catch (err) {
      console.warn('[Chat MQTT] Send error:', err);
    }
  }

  // =========================================================================
  // SUPABASE REALTIME BROADCAST (When Configured)
  // =========================================================================

  private setupSupabaseChat(supabase: SupabaseClient, roomChannelId: string) {
    try {
      this.isSupabaseSubscribed = false;
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
          if (status === 'SUBSCRIBED') {
            this.isSupabaseSubscribed = true;
            if (this.pendingSupabaseMessages.length > 0) {
              const queued = [...this.pendingSupabaseMessages];
              this.pendingSupabaseMessages = [];
              queued.forEach((msg) => this.dispatchSupabaseMessage(msg));
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn(`[Chat] Supabase channel ${status}:`, err);
            this.isSupabaseSubscribed = false;
          }
        });
    } catch (err) {
      console.warn('[Chat] Failed to subscribe to Supabase chat channel:', err);
    }
  }

  private dispatchSupabaseMessage(msg: ChatMessage) {
    if (!this.supabaseChannel) return;

    if (!this.isSupabaseSubscribed) {
      this.pendingSupabaseMessages.push(msg);
      return;
    }

    try {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'chat_msg',
        payload: msg,
      });
    } catch (err) {
      console.warn('[Chat] Supabase send error:', err);
    }
  }

  // =========================================================================
  // LOCATION JOIN & LEAVE LIFECYCLE
  // =========================================================================

  /**
   * Join a location's chat channel across all transports.
   * If previously in another location, cleanly leaves the old channel first.
   */
  public joinLocation(locationId: LocationId, currentUser: StudentPresence) {
    // If already in this location channel, just update current user
    if (this.currentLocationId === locationId && this.currentUser?.sessionId === currentUser.sessionId) {
      this.currentUser = currentUser;
      if (currentUser.isDnd !== undefined) {
        this.isQuietStudy = currentUser.isDnd;
      }
      return;
    }

    // Leave any previous room cleanly
    this.leaveCurrentLocation();

    this.currentLocationId = locationId;
    this.currentUser = currentUser;
    this.roomJoinedTimestamp = Date.now();
    if (currentUser.isDnd !== undefined) {
      this.isQuietStudy = currentUser.isDnd;
    } else if (this.isQuietStudy) {
      currentUser.isDnd = true;
    }
    this.messages = [];
    this.receivedMessageIds.clear();
    this.reportsByMessage.clear();
    this.communityHiddenIds.clear();
    this.pendingMqttMessages = [];
    this.pendingSupabaseMessages = [];
    this.unreadCount = 0;
    this.notifyUnread();
    this.notifyMessages();

    const roomChannelId = `studyverse_chat_${locationId}`;
    const mqttTopic = `${MQTT_TOPIC_CHAT_PREFIX}${locationId}`;

    // 1. Setup Global MQTT WebSocket Relay Subscription
    if (this.mqttClient && this.isMqttConnected) {
      try {
        if (this.subscribedMqttTopic && this.subscribedMqttTopic !== mqttTopic) {
          this.mqttClient.unsubscribe(this.subscribedMqttTopic);
        }
        this.mqttClient.subscribe(mqttTopic, { qos: 0 });
        this.subscribedMqttTopic = mqttTopic;
        console.log('[Chat MQTT] Subscribed to topic:', mqttTopic);
      } catch (err) {
        console.warn('[Chat] MQTT subscribe error:', err);
      }
    } else {
      this.initMqttRelay();
    }

    // 2. Setup Local Multi-Tab BroadcastChannel
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

    // 3. Setup WebRTC P2P Mesh (Trystero over Port 443 WSS Nostr relays)
    try {
      this.trysteroRoom = joinRoom(
        {
          appId: 'studyverse_campus_chat_v1',
          relayConfig: {
            urls: RELIABLE_NOSTR_RELAYS,
            redundancy: 4,
          },
        },
        `room_${locationId}`
      );
      this.trysteroAction = this.trysteroRoom.makeAction<ChatMessage>('chat_message');
      this.trysteroAction.onMessage((msg: ChatMessage) => {
        this.handleIncomingMessage(msg);
      });
    } catch (err) {
      console.warn('[Chat] WebRTC init notice:', err);
    }

    // 4. Setup Supabase Realtime Broadcast (if Supabase client configured)
    const supabase = presenceService.getSupabaseClient();
    if (supabase) {
      this.setupSupabaseChat(supabase, roomChannelId);
    }
  }

  /**
   * Cleanly leave the current location's chat channel across all transports.
   */
  public leaveCurrentLocation() {
    // Unsubscribe MQTT topic
    if (this.mqttClient && this.isMqttConnected && this.subscribedMqttTopic) {
      try {
        this.mqttClient.unsubscribe(this.subscribedMqttTopic);
      } catch {}
      this.subscribedMqttTopic = null;
    }

    // Remove Supabase channel
    if (this.supabaseChannel) {
      try {
        const supabase = presenceService.getSupabaseClient();
        supabase?.removeChannel(this.supabaseChannel);
      } catch {}
      this.supabaseChannel = null;
      this.isSupabaseSubscribed = false;
    }

    // Leave WebRTC room
    if (this.trysteroRoom) {
      try {
        this.trysteroRoom.leave();
      } catch {}
      this.trysteroRoom = null;
      this.trysteroAction = null;
    }

    // Close BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch {}
      this.broadcastChannel = null;
    }

    this.currentLocationId = null;
    this.roomJoinedTimestamp = 0;
    this.messages = [];
    this.receivedMessageIds.clear();
    this.pendingMqttMessages = [];
    this.pendingSupabaseMessages = [];
    this.unreadCount = 0;
    this.notifyUnread();
    this.notifyMessages();
  }

  // =========================================================================
  // MESSAGE SENDING & HANDLING
  // =========================================================================

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

    // Do Not Disturb Mode enforcement: disable sending
    if (this.isDnd()) {
      return {
        success: false,
        error: "You're in Do Not Disturb mode. Enjoy your quiet study time.",
      };
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

    // 4. Save to local in-memory store immediately
    this.messages.push(message);
    this.receivedMessageIds.add(message.id);
    if (this.messages.length > MAX_STORED_CHAT_MESSAGES) {
      this.messages.shift();
    }
    this.notifyMessages();

    this.broadcast(message);

    return { success: true };
  }

  /** Sends a message or moderation signal over every transport. */
  private broadcast(message: ChatMessage) {
    // 5. Dispatch via Global Cloud MQTT Relay (Guaranteed Delivery)
    this.dispatchMqttMessage(message);

    // 6. Dispatch via Supabase Realtime Broadcast (if configured)
    this.dispatchSupabaseMessage(message);

    // 7. Dispatch via WebRTC P2P mesh
    if (this.trysteroAction) {
      try {
        this.trysteroAction.send(message);
      } catch (err) {
        console.warn('[Chat] WebRTC send error:', err);
      }
    }

    // 8. Dispatch via local BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch {}
    }
  }

  /**
   * Counts a report from one student. Once COMMUNITY_HIDE_REPORT_COUNT different students
   * (not the author) have reported a message, it is hidden for everyone in the room.
   */
  private recordReport(targetId: string | undefined, reporterId: string) {
    if (!targetId) return;
    const author = this.messages.find((m) => m.id === targetId)?.sessionId;
    if (author && author === reporterId) return;
    let reporters = this.reportsByMessage.get(targetId);
    if (!reporters) {
      reporters = new Set();
      this.reportsByMessage.set(targetId, reporters);
    }
    reporters.add(reporterId);
    if (reporters.size >= COMMUNITY_HIDE_REPORT_COUNT && !this.communityHiddenIds.has(targetId)) {
      this.communityHiddenIds.add(targetId);
      this.messages = this.messages.filter((m) => m.id !== targetId);
      this.notifyMessages();
    }
  }

  /**
   * Handle incoming message from any transport with strict deduplication,
   * location isolation, and gentle real-time audio chime triggers.
   */
  private handleIncomingMessage(msg: ChatMessage) {
    // Step 1: Realtime message event received
    logChatAudioDiagnostic(1, 'Message event received', {
      msgId: msg?.id,
      msgLocation: msg?.locationId,
      currentLocation: this.currentLocationId,
    });

    if (!msg || !msg.id || !msg.sessionId || (!msg.text && msg.type !== 'report')) {
      logChatAudioDiagnostic(2, 'Message validation failed (empty or invalid payload)');
      return;
    }

    // Step 2: Location isolation check
    if (msg.locationId !== this.currentLocationId) {
      logChatAudioDiagnostic(2, 'Message ignored (location mismatch)', {
        msgLocation: msg.locationId,
        currentLocation: this.currentLocationId,
      });
      return;
    }

    // Deduplication check: if already processed or self-sent, ignore
    if (this.receivedMessageIds.has(msg.id)) {
      logChatAudioDiagnostic(2, 'Message already processed (duplicate event)', { msgId: msg.id });
      return;
    }
    this.receivedMessageIds.add(msg.id);

    // Moderation signals are counted, never shown
    if (msg.type === 'report') {
      this.recordReport(msg.targetId, msg.sessionId);
      return;
    }

    // Filter out if muted, reported by you, or hidden for everyone
    if (
      this.mutedSessionIds.has(msg.sessionId) ||
      this.reportedMessageIds.has(msg.id) ||
      this.communityHiddenIds.has(msg.id)
    ) {
      logChatAudioDiagnostic(2, 'Message filtered (sender muted or message reported)');
      return;
    }

    logChatAudioDiagnostic(2, 'Message payload validated successfully', { msgId: msg.id });

    // Add to message list
    this.messages.push(msg);
    if (this.messages.length > MAX_STORED_CHAT_MESSAGES) {
      this.messages.shift();
    }

    // Step 3 & 4: Sender identification & Classification
    const isFromSelf = msg.sessionId === this.currentUser?.sessionId;
    logChatAudioDiagnostic(3, 'Sender identified', {
      senderSessionId: msg.sessionId,
      currentSessionId: this.currentUser?.sessionId,
    });
    logChatAudioDiagnostic(4, isFromSelf ? 'Classified as OUTGOING (from current user)' : 'Classified as INCOMING (from peer)');

    // Increment unread count if chat is closed, from peer, and DND is OFF
    if (!this.isChatOpen && !isFromSelf && !this.isDnd()) {
      this.unreadCount += 1;
      this.notifyUnread();
    }

    // Step 5: DND and sound preferences checked
    const isDndActive = this.isDnd();
    logChatAudioDiagnostic(5, 'Checking preferences', {
      isFromSelf,
      isDndActive,
      isSoundEnabled: this.isSoundEnabled,
    });

    // Step 6: Audio system availability checked
    const isAudioActive = soundService.isAudioActive();
    logChatAudioDiagnostic(6, 'Audio system availability checked', { isAudioActive });

    // Step 7: Evaluate freshness and throttling
    const localArrival = Date.now();
    // Freshness: received live after joining the room, message was not created more than 60 seconds ago
    const isAfterRoomJoin = localArrival >= (this.roomJoinedTimestamp || 0);
    const isFresh = isAfterRoomJoin && Math.abs(localArrival - msg.timestamp) < 60000;
    const isThrottled = localArrival - this.lastNotificationSoundTimestamp < 1200;

    if (!isFromSelf && !isDndActive && this.isSoundEnabled) {
      if (!isFresh) {
        logChatAudioDiagnostic(7, 'Sound skipped: stale/old message', {
          msgTimestamp: msg.timestamp,
          localArrival,
        });
      } else if (isThrottled) {
        logChatAudioDiagnostic(7, 'Sound throttled: rapid message grouping', {
          elapsedMs: localArrival - this.lastNotificationSoundTimestamp,
        });
      } else {
        this.lastNotificationSoundTimestamp = localArrival;
        logChatAudioDiagnostic(7, 'Attempting audio playback...');
        soundService.playChatChime().then((res) => {
          logChatAudioDiagnostic(8, 'Audio playback result', {
            success: res.success,
            state: res.state,
            error: res.error || null,
          });
        }).catch((err) => {
          logChatAudioDiagnostic(8, 'Audio playback exception', { error: String(err) });
        });
      }
    } else {
      logChatAudioDiagnostic(7, 'Sound skipped based on condition', {
        isFromSelf,
        isDndActive,
        isSoundEnabled: this.isSoundEnabled,
      });
    }

    this.notifyMessages();
  }

  // =========================================================================
  // MODERATION & SAFETY
  // =========================================================================

  /**
   * Report a message: hides it for you at once, and tells the room. Once enough different
   * students report it (COMMUNITY_HIDE_REPORT_COUNT), it is hidden for everyone there.
   */
  public reportMessage(messageId: string): boolean {
    this.reportedMessageIds.add(messageId);
    if (this.currentUser && this.currentLocationId) {
      this.recordReport(messageId, this.currentUser.sessionId);
      const signal: ChatMessage = {
        id: `report_${this.currentUser.sessionId}_${messageId}`,
        sessionId: this.currentUser.sessionId,
        senderName: this.currentUser.name,
        avatarId: this.currentUser.avatarId,
        // empty text: older versions of the app drop it instead of showing it as a message
        text: '',
        timestamp: Date.now(),
        locationId: this.currentLocationId,
        type: 'report',
        targetId: messageId,
      };
      this.receivedMessageIds.add(signal.id);
      this.broadcast(signal);
    }
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

  // =========================================================================
  // SUBSCRIPTIONS & EVENT NOTIFICATIONS
  // =========================================================================

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

  public onStatusChange(listener: ConnectionStatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.isMqttConnected ? 'connected' : 'connecting');
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyMessages() {
    const list = this.getMessages();
    this.messageListeners.forEach((fn) => fn(list));
  }

  private notifyUnread() {
    this.unreadListeners.forEach((fn) => fn(this.unreadCount));
  }

  private notifyStatus(status: 'connected' | 'connecting' | 'disconnected') {
    this.statusListeners.forEach((fn) => fn(status));
  }

  public destroy() {
    this.isDestroyed = true;
    this.leaveCurrentLocation();

    if (this.mqttClient) {
      try {
        if (this.mqttClient.isConnected()) {
          this.mqttClient.disconnect();
        }
      } catch {}
      this.mqttClient = null;
    }

    this.messageListeners.clear();
    this.unreadListeners.clear();
    this.quietListeners.clear();
    this.statusListeners.clear();
  }
}

export const chatService = new ChatService();

if (typeof window !== 'undefined') {
  (window as unknown as { chatService?: ChatService }).chatService = chatService;
}
