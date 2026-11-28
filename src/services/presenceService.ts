import { createClient } from '@supabase/supabase-js';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { joinRoom } from 'trystero';
import type { Room, MessageAction } from 'trystero';
import Paho from 'paho-mqtt';
import type { LocationId, StudentPresence } from '../types/studyverse';

export type PresenceMode = 'supabase' | 'webrtc_cloud' | 'mqtt_relay' | 'local_peer';
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

type PresenceListener = (presences: StudentPresence[]) => void;
type ConflictListener = (seatId: string, occupantName: string) => void;
type StatusListener = (status: ConnectionStatus, mode: PresenceMode) => void;

export interface WireMessage {
  type: 'join' | 'update' | 'heartbeat' | 'leave' | 'seat_conflict';
  sessionId: string;
  payload: StudentPresence;
  timestamp: number;
}

// Resilient presence timing constants
// 120 seconds prevents peers from disappearing when browser tabs are in background or reading
const PEER_STALE_THRESHOLD_MS = 120000;
const HEARTBEAT_INTERVAL_MS = 3500;
const MAX_MESSAGE_AGE_MS = 300000; // 5 minutes (prevents false discards from client clock drift)

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

const MQTT_TOPIC_PRESENCE = 'studyverse/global/v2/presence';
const LOCAL_STORAGE_PEER_KEY = 'studyverse_peer_registry';
const CUSTOM_SUPABASE_URL_KEY = 'studyverse_custom_supabase_url';
const CUSTOM_SUPABASE_KEY_KEY = 'studyverse_custom_supabase_anon_key';

class PresenceService {
  private mode: PresenceMode = 'webrtc_cloud';
  private connectionStatus: ConnectionStatus = 'disconnected';

  // 1. Supabase Realtime (When configured via env or custom keys)
  private supabase: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private isSupabaseSubscribed: boolean = false;

  // 2. Global WebRTC Mesh over Port 443 WSS Nostr Relays (Zero-config, firewall-proof)
  private trysteroRoom: Room | null = null;
  private trysteroAction: MessageAction<WireMessage> | null = null;
  private webrtcPeersCount: number = 0;

  // 3. Cloud MQTT Relay (Secondary cross-device fallback)
  private mqttClient: Paho.Client | null = null;
  private mqttBrokerIndex: number = 0;
  private isMqttConnected: boolean = false;

  // 4. Local Peer (BroadcastChannel + LocalStorage for instant multi-tab sync)
  private broadcastChannel: BroadcastChannel | null = null;

  // State
  private currentPresence: StudentPresence | null = null;
  private peerMap: Map<string, StudentPresence> = new Map();
  private listeners: Set<PresenceListener> = new Set();
  private conflictListeners: Set<ConflictListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private heartbeatInterval: number | null = null;
  private isDestroyed: boolean = false;

  constructor() {
    this.detectMode();
  }

  /**
   * Determine whether to use Supabase (if keys present) or WebRTC Cloud Mesh
   */
  private detectMode() {
    const url =
      localStorage.getItem(CUSTOM_SUPABASE_URL_KEY) ||
      import.meta.env.VITE_SUPABASE_URL;
    const key =
      localStorage.getItem(CUSTOM_SUPABASE_KEY_KEY) ||
      import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (
      url &&
      key &&
      url !== 'https://your-project.supabase.co' &&
      !url.includes('example') &&
      key.length > 20
    ) {
      try {
        this.supabase = createClient(url, key, {
          realtime: {
            params: {
              eventsPerSecond: 10,
            },
          },
        });
        this.mode = 'supabase';
        return;
      } catch (err) {
        console.warn('Failed to initialize Supabase client:', err);
      }
    }

    // Default to WebRTC Cloud Mesh over Port 443 WSS
    this.mode = 'webrtc_cloud';
  }

  public getMode(): PresenceMode {
    return this.mode;
  }

  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  public getSupabaseClient(): SupabaseClient | null {
    return this.supabase;
  }

  public getDiagnostics() {
    return {
      mode: this.mode,
      status: this.connectionStatus,
      peerCount: this.peerMap.size,
      webrtcPeersCount: this.webrtcPeersCount,
      isMqttConnected: this.isMqttConnected,
      isSupabaseSubscribed: this.isSupabaseSubscribed,
      totalStudents: this.getAllStudents().length,
    };
  }

  public getSupabaseConfig(): {
    isConfigured: boolean;
    url: string | null;
    isCustom: boolean;
  } {
    const customUrl = localStorage.getItem(CUSTOM_SUPABASE_URL_KEY);
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    const activeUrl = customUrl || envUrl || null;

    return {
      isConfigured: this.mode === 'supabase',
      url: activeUrl && !activeUrl.includes('example') ? activeUrl : null,
      isCustom: !!customUrl,
    };
  }

  /**
   * Allows student or administrator to dynamically connect a Supabase project from the browser
   */
  public configureSupabase(url: string, key: string): boolean {
    const cleanUrl = url.trim();
    const cleanKey = key.trim();

    if (!cleanUrl || !cleanKey) return false;

    try {
      this.supabase = createClient(cleanUrl, cleanKey, {
        realtime: {
          params: { eventsPerSecond: 10 },
        },
      });
      localStorage.setItem(CUSTOM_SUPABASE_URL_KEY, cleanUrl);
      localStorage.setItem(CUSTOM_SUPABASE_KEY_KEY, cleanKey);

      this.teardownTransports();
      this.mode = 'supabase';
      if (this.currentPresence) {
        this.setupSupabasePresence();
      }
      this.notifyStatus();
      return true;
    } catch (err) {
      console.error('Failed to configure custom Supabase:', err);
      return false;
    }
  }

  public clearCustomSupabase(): void {
    localStorage.removeItem(CUSTOM_SUPABASE_URL_KEY);
    localStorage.removeItem(CUSTOM_SUPABASE_KEY_KEY);
    this.teardownTransports();
    this.supabase = null;
    this.detectMode();

    if (this.currentPresence) {
      this.setupCloudTransports();
    }
    this.notifyStatus();
  }

  /**
   * Main entrypoint when a student joins campus
   */
  public init(initialPresence: StudentPresence) {
    this.currentPresence = {
      ...initialPresence,
      lastHeartbeat: Date.now(),
    };
    this.isDestroyed = false;

    // 1. Initialize BroadcastChannel for local instant tab synchronization
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        if (this.broadcastChannel) {
          this.broadcastChannel.close();
        }
        this.broadcastChannel = new BroadcastChannel('studyverse_multiplayer_sync');
        this.broadcastChannel.onmessage = (event) => {
          this.handleWireMessage(event.data, 'local');
        };
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }

    // 2. Storage event fallback for older / cross-context tabs
    window.addEventListener('storage', this.handleStorageEvent);
    window.addEventListener('beforeunload', this.handleBeforeUnload);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('focus', this.handleWindowFocus);

    // 3. Connect to Primary Transports
    if (this.mode === 'supabase' && this.supabase) {
      this.setupSupabasePresence();
    } else {
      this.setupCloudTransports();
    }

    // 4. Broadcast to local tabs and sync storage
    this.broadcastLocalPresence('join', this.currentPresence);
    this.loadPeersFromStorage();

    // 5. Start periodic heartbeat and stale peer cleaner
    this.startHeartbeat();
  }

  // =========================================================================
  // SUPABASE REALTIME PRESENCE
  // =========================================================================

  private setupSupabasePresence() {
    if (!this.supabase || !this.currentPresence) return;

    this.setConnectionStatus('connecting');

    try {
      this.channel = this.supabase.channel('studyverse_global_world', {
        config: {
          presence: {
            key: this.currentPresence.sessionId,
          },
          broadcast: {
            self: false,
          },
        },
      });

      this.channel
        .on('presence', { event: 'sync' }, () => {
          if (!this.channel) return;
          const state = this.channel.presenceState<StudentPresence>();
          const updatedPeers = new Map<string, StudentPresence>();

          Object.entries(state).forEach(([key, presences]) => {
            if (presences && presences.length > 0) {
              const latest = presences[presences.length - 1];
              if (latest.sessionId !== this.currentPresence?.sessionId) {
                updatedPeers.set(key, {
                  ...latest,
                  lastHeartbeat: Date.now(),
                });
              }
            }
          });

          // Retain local peers if any
          this.peerMap.forEach((peer, id) => {
            if (!updatedPeers.has(id) && Date.now() - (peer.lastHeartbeat || 0) < PEER_STALE_THRESHOLD_MS) {
              updatedPeers.set(id, peer);
            }
          });

          this.peerMap = updatedPeers;
          this.notifyListeners();
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          if (key === this.currentPresence?.sessionId) return;
          if (newPresences && newPresences.length > 0) {
            const joined = newPresences[0] as unknown as StudentPresence;
            this.handlePeerArrival(joined);
          }
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          if (this.peerMap.has(key)) {
            this.peerMap.delete(key);
            this.notifyListeners();
          }
        })
        .on('broadcast', { event: 'peer_event' }, ({ payload }) => {
          this.handleWireMessage(payload as WireMessage, 'supabase');
        })
        .subscribe(async (status, err) => {
          if (status === 'SUBSCRIBED') {
            this.isSupabaseSubscribed = true;
            this.setConnectionStatus('connected');
            if (this.currentPresence && this.channel) {
              await this.channel.track(this.currentPresence).catch((e) => {
                console.warn('Supabase presence track error:', e);
              });
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            this.isSupabaseSubscribed = false;
            this.setConnectionStatus('connecting');
            console.warn(`Supabase channel ${status}:`, err);
          }
        });
    } catch (err) {
      console.error('Failed to setup Supabase presence, falling back to WebRTC Cloud Mesh:', err);
      this.mode = 'webrtc_cloud';
      this.setupCloudTransports();
    }
  }

  // =========================================================================
  // GLOBAL WEBRTC MESH & CLOUD RELAY (Port 443 WSS — Guaranteed Firewall-Proof)
  // =========================================================================

  private setupCloudTransports() {
    this.setupTrysteroWebRTC();
    this.setupMqttBackup();
  }

  private setupTrysteroWebRTC() {
    if (!this.currentPresence || this.isDestroyed) return;

    this.setConnectionStatus('connecting');

    try {
      this.trysteroRoom = joinRoom(
        {
          appId: 'studyverse_iitm_presence_v2',
          relayConfig: {
            urls: RELIABLE_NOSTR_RELAYS,
            redundancy: 4,
          },
        },
        'campus_global_world'
      );

      this.trysteroAction = this.trysteroRoom.makeAction<WireMessage>('presence_wire');

      this.trysteroAction.onMessage((msg: WireMessage) => {
        this.handleWireMessage(msg, 'webrtc');
      });

      this.trysteroRoom.onPeerJoin((context) => {
        this.webrtcPeersCount++;
        this.setConnectionStatus('connected');
        if (this.currentPresence) {
          this.sendTrysteroMessage('join', this.currentPresence, context.peerId);
        }
      });

      this.trysteroRoom.onPeerLeave(() => {
        this.webrtcPeersCount = Math.max(0, this.webrtcPeersCount - 1);
        if (this.webrtcPeersCount === 0 && !this.isMqttConnected) {
          // Keep connected status if local or MQTT connected
        }
      });

      this.trysteroRoom.ready
        .then(() => {
          this.setConnectionStatus('connected');
          if (this.currentPresence) {
            this.sendTrysteroMessage('join', this.currentPresence);
          }
        })
        .catch((err) => {
          console.warn('[Studyverse WebRTC] Ready notice:', err);
        });
    } catch (err) {
      console.warn('[Studyverse WebRTC] Init warning:', err);
    }
  }

  private sendTrysteroMessage(
    type: WireMessage['type'],
    payload: StudentPresence,
    targetPeerId?: string
  ) {
    if (!this.trysteroAction || this.isDestroyed) return;

    try {
      const msg: WireMessage = {
        type,
        sessionId: payload.sessionId,
        payload,
        timestamp: Date.now(),
      };
      if (targetPeerId) {
        this.trysteroAction.send(msg, { target: targetPeerId });
      } else {
        this.trysteroAction.send(msg);
      }
    } catch (err) {
      console.warn('[Studyverse WebRTC] Send error:', err);
    }
  }

  // =========================================================================
  // MQTT BACKUP RELAY (Secondary channel)
  // =========================================================================

  private setupMqttBackup() {
    if (!this.currentPresence || this.isDestroyed) return;

    const broker = MQTT_BROKERS[this.mqttBrokerIndex % MQTT_BROKERS.length];
    const clientId = `studyverse_${this.currentPresence.sessionId}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      this.mqttClient = new Paho.Client(broker.host, broker.port, broker.path, clientId);

      const lwt = new Paho.Message(
        JSON.stringify({
          type: 'leave',
          sessionId: this.currentPresence.sessionId,
          payload: this.currentPresence,
          timestamp: Date.now(),
        } as WireMessage)
      );
      lwt.destinationName = MQTT_TOPIC_PRESENCE;
      lwt.retained = false;
      lwt.qos = 0;

      this.mqttClient.onConnectionLost = (responseObject) => {
        this.isMqttConnected = false;
        if (responseObject.errorCode !== 0 && !this.isDestroyed) {
          setTimeout(() => {
            if (!this.isDestroyed) {
              this.mqttBrokerIndex++;
              this.setupMqttBackup();
            }
          }, 4000);
        }
      };

      this.mqttClient.onMessageArrived = (message) => {
        try {
          const wire: WireMessage = JSON.parse(message.payloadString);
          this.handleWireMessage(wire, 'mqtt');
        } catch { }
      };

      this.mqttClient.connect({
        useSSL: true,
        timeout: 8,
        keepAliveInterval: 20,
        cleanSession: true,
        willMessage: lwt,
        onSuccess: () => {
          if (!this.mqttClient || this.isDestroyed) return;
          this.isMqttConnected = true;
          this.setConnectionStatus('connected');
          this.mqttClient.subscribe(MQTT_TOPIC_PRESENCE, { qos: 0 });

          if (this.currentPresence) {
            this.sendMqttMessage('join', this.currentPresence);
          }
        },
        onFailure: () => {
          this.isMqttConnected = false;
          this.mqttBrokerIndex++;
        },
      });
    } catch {
      // Ignore MQTT failure; WebRTC handles primary transport
    }
  }

  private sendMqttMessage(type: WireMessage['type'], payload: StudentPresence) {
    if (!this.mqttClient || !this.isMqttConnected) return;

    try {
      const msg: WireMessage = {
        type,
        sessionId: payload.sessionId,
        payload,
        timestamp: Date.now(),
      };
      const pahoMsg = new Paho.Message(JSON.stringify(msg));
      pahoMsg.destinationName = MQTT_TOPIC_PRESENCE;
      pahoMsg.qos = 0;
      this.mqttClient.send(pahoMsg);
    } catch { }
  }

  // =========================================================================
  // UNIFIED DISPATCHER (Supabase, WebRTC, MQTT, Local)
  // =========================================================================

  private dispatchWireMessage(type: WireMessage['type'], payload: StudentPresence) {
    // 1. Supabase
    if (this.mode === 'supabase' && this.channel && this.isSupabaseSubscribed) {
      const msg: WireMessage = {
        type,
        sessionId: payload.sessionId,
        payload,
        timestamp: Date.now(),
      };
      this.channel.send({
        type: 'broadcast',
        event: 'peer_event',
        payload: msg,
      });
      if (type === 'update' || type === 'join') {
        this.channel.track(payload).catch(() => { });
      }
    }

    // 2. WebRTC Mesh (Port 443 Nostr relays)
    this.sendTrysteroMessage(type, payload);

    // 3. MQTT Relay
    this.sendMqttMessage(type, payload);

    // 4. Local Multi-Tab Sync
    this.broadcastLocalPresence(type, payload);
    this.syncToStorage();
  }

  private handleWireMessage(
    data: WireMessage,
    source: 'supabase' | 'webrtc' | 'mqtt' | 'local'
  ) {
    if (this.isDestroyed || !this.currentPresence) return;
    if (!data || !data.sessionId || data.sessionId === this.currentPresence.sessionId) return;

    // Discard only ancient messages (> 5 minutes old).
    // Never discard due to negative difference (prevents client clock drift from dropping peers).
    const now = Date.now();
    if (data.timestamp && (now - data.timestamp) > MAX_MESSAGE_AGE_MS) {
      return;
    }

    if (data.type === 'join' || data.type === 'update' || data.type === 'heartbeat') {
      const peer = data.payload;
      const isNewPeer = !this.peerMap.has(peer.sessionId);

      // Handle seat conflict: earliest seatEnteredAt wins
      if (
        this.currentPresence.seatId &&
        peer.seatId === this.currentPresence.seatId &&
        this.currentPresence.location === peer.location
      ) {
        if (peer.seatEnteredAt && this.currentPresence.seatEnteredAt) {
          if (peer.seatEnteredAt < this.currentPresence.seatEnteredAt) {
            this.leaveSeat();
            this.notifyConflict(peer.seatId, peer.name);
          }
        }
      }

      this.peerMap.set(peer.sessionId, {
        ...peer,
        lastHeartbeat: now,
      });
      this.notifyListeners();
      this.syncToStorage();

      // Bidirectional presence handshake:
      // If a peer announces 'join' OR if this is the first time we ever see this peer,
      // reply immediately with our own presence so both students see each other simultaneously!
      if (data.type === 'join' || isNewPeer) {
        if (source === 'local') {
          this.broadcastLocalPresence('heartbeat', this.currentPresence);
        } else if (source === 'webrtc') {
          this.sendTrysteroMessage('heartbeat', this.currentPresence);
        } else if (source === 'mqtt') {
          this.sendMqttMessage('heartbeat', this.currentPresence);
        } else if (source === 'supabase' && this.channel && this.isSupabaseSubscribed) {
          this.channel.send({
            type: 'broadcast',
            event: 'peer_event',
            payload: {
              type: 'heartbeat',
              sessionId: this.currentPresence.sessionId,
              payload: this.currentPresence,
              timestamp: Date.now(),
            } as WireMessage,
          });
        }
      }
    } else if (data.type === 'leave') {
      if (this.peerMap.has(data.sessionId)) {
        this.peerMap.delete(data.sessionId);
        this.notifyListeners();
        this.syncToStorage();
      }
    }
  }

  private handlePeerArrival(peer: StudentPresence) {
    if (!this.currentPresence || peer.sessionId === this.currentPresence.sessionId) return;
    this.peerMap.set(peer.sessionId, {
      ...peer,
      lastHeartbeat: Date.now(),
    });
    this.notifyListeners();
    this.syncToStorage();
  }

  // =========================================================================
  // LOCAL MULTI-TAB & STORAGE SYNC
  // =========================================================================

  private handleVisibilityChange = () => {
    if (this.isDestroyed || !this.currentPresence) return;

    if (document.visibilityState === 'visible') {
      // Tab returned to foreground: refresh heartbeat, hydrate peers, announce presence
      this.currentPresence.lastHeartbeat = Date.now();
      this.loadPeersFromStorage();
      this.dispatchWireMessage('join', this.currentPresence);
      this.notifyListeners();
    } else {
      // Tab moved to background: dispatch immediate heartbeat before browser timer throttling
      this.currentPresence.lastHeartbeat = Date.now();
      this.dispatchWireMessage('heartbeat', this.currentPresence);
      this.syncToStorage();
    }
  };

  private handleWindowFocus = () => {
    if (this.isDestroyed || !this.currentPresence) return;
    this.currentPresence.lastHeartbeat = Date.now();
    this.dispatchWireMessage('heartbeat', this.currentPresence);
    this.loadPeersFromStorage();
    this.notifyListeners();
  };

  private handleStorageEvent = (event: StorageEvent) => {
    if (event.key === LOCAL_STORAGE_PEER_KEY && event.newValue) {
      this.loadPeersFromStorage();
    }
  };

  private loadPeersFromStorage() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_PEER_KEY);
      if (!raw || !this.currentPresence) return;
      const parsed: Record<string, StudentPresence> = JSON.parse(raw);
      const now = Date.now();
      let changed = false;

      Object.entries(parsed).forEach(([id, peer]) => {
        if (id !== this.currentPresence?.sessionId) {
          if (now - (peer.lastHeartbeat || 0) < PEER_STALE_THRESHOLD_MS) {
            const existing = this.peerMap.get(id);
            if (!existing || (peer.lastHeartbeat || 0) > (existing.lastHeartbeat || 0)) {
              this.peerMap.set(id, peer);
              changed = true;
            }
          }
        }
      });

      if (changed) {
        this.notifyListeners();
      }
    } catch { }
  }

  private syncToStorage() {
    if (!this.currentPresence) return;
    try {
      const now = Date.now();
      const raw = localStorage.getItem(LOCAL_STORAGE_PEER_KEY);
      const registry: Record<string, StudentPresence> = raw ? JSON.parse(raw) : {};

      // Prune stale entries > PEER_STALE_THRESHOLD_MS (2 minutes)
      Object.keys(registry).forEach((id) => {
        if (now - (registry[id].lastHeartbeat || 0) > PEER_STALE_THRESHOLD_MS) {
          delete registry[id];
        }
      });

      // Update self
      registry[this.currentPresence.sessionId] = {
        ...this.currentPresence,
        lastHeartbeat: now,
      };

      // Also persist active peers so other tabs immediately see everyone
      this.peerMap.forEach((peer, id) => {
        if (now - (peer.lastHeartbeat || 0) <= PEER_STALE_THRESHOLD_MS) {
          registry[id] = peer;
        }
      });

      localStorage.setItem(LOCAL_STORAGE_PEER_KEY, JSON.stringify(registry));
    } catch { }
  }

  private broadcastLocalPresence(type: WireMessage['type'], payload: StudentPresence) {
    if (!this.broadcastChannel || this.isDestroyed) return;
    try {
      const msg: WireMessage = {
        type,
        sessionId: payload.sessionId,
        payload,
        timestamp: Date.now(),
      };
      this.broadcastChannel.postMessage(msg);
    } catch { }
  }

  // =========================================================================
  // USER ACTIONS: CHANGE LOCATION, SEATS, TOPIC
  // =========================================================================

  public changeLocation(newLocation: LocationId) {
    if (!this.currentPresence) return;
    this.updatePresence({
      location: newLocation,
      seatId: null,
      seatEnteredAt: null,
    });
  }

  public occupySeat(seatId: string, location: LocationId): boolean {
    if (!this.currentPresence) return false;

    // Check if another peer currently occupies this seat
    let alreadyOccupiedByOther = false;
    this.peerMap.forEach((peer) => {
      if (peer.location === location && peer.seatId === seatId) {
        alreadyOccupiedByOther = true;
      }
    });

    if (alreadyOccupiedByOther) {
      return false;
    }

    this.updatePresence({
      location,
      seatId,
      seatEnteredAt: Date.now(),
    });

    return true;
  }

  public leaveSeat() {
    if (!this.currentPresence) return;
    this.updatePresence({
      seatId: null,
      seatEnteredAt: null,
    });
  }

  public setStudyTopic(topic: string) {
    if (!this.currentPresence) return;
    this.updatePresence({
      studyTopic: topic,
    });
  }

  public setDnd(isDnd: boolean) {
    if (!this.currentPresence) return;
    this.updatePresence({
      isDnd,
    });
  }

  public updatePresence(partial: Partial<StudentPresence>) {
    if (!this.currentPresence) return;

    this.currentPresence = {
      ...this.currentPresence,
      ...partial,
      lastHeartbeat: Date.now(),
    };

    this.dispatchWireMessage('update', this.currentPresence);
    this.notifyListeners();
  }

  // =========================================================================
  // GETTERS & STATS
  // =========================================================================

  public getAllStudents(): StudentPresence[] {
    const list: StudentPresence[] = [];
    if (this.currentPresence) {
      list.push(this.currentPresence);
    }
    this.peerMap.forEach((peer) => {
      list.push(peer);
    });
    return list;
  }

  public getStudentsInLocation(location: LocationId): StudentPresence[] {
    return this.getAllStudents().filter((s) => s.location === location);
  }

  public getOccupantOfSeat(seatId: string, location: LocationId): StudentPresence | undefined {
    return this.getAllStudents().find((s) => s.location === location && s.seatId === seatId);
  }

  public getStats() {
    const all = this.getAllStudents();
    return {
      totalOnline: all.length,
      libraryCount: all.filter((s) => s.location === 'library').length,
      lhcCount: all.filter((s) => s.location === 'lhc').length,
      banyanCount: all.filter((s) => s.location === 'banyan').length,
      oatCount: all.filter((s) => s.location === 'oat').length,
      cafeCount: all.filter((s) => s.location === 'cafe').length,
      parkCount: all.filter((s) => s.location === 'park').length,
      gcCount: all.filter((s) => s.location === 'gc').length,
    };
  }

  // =========================================================================
  // HEARTBEAT & LIFECYCLE
  // =========================================================================

  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    let tickCount = 0;

    this.heartbeatInterval = window.setInterval(() => {
      if (this.isDestroyed || !this.currentPresence) return;

      const now = Date.now();
      this.currentPresence.lastHeartbeat = now;
      tickCount++;

      // Clean up stale peers only after PEER_STALE_THRESHOLD_MS (120s / 2 minutes)
      // This prevents students from vanishing when they are reading in another tab
      let peerRemoved = false;
      this.peerMap.forEach((peer, id) => {
        if (now - (peer.lastHeartbeat || 0) > PEER_STALE_THRESHOLD_MS) {
          this.peerMap.delete(id);
          peerRemoved = true;
        }
      });

      if (peerRemoved) {
        this.notifyListeners();
        this.syncToStorage();
      }

      // Re-announce full presence periodically (every 5th tick ~18s) to heal any dropped updates
      const dispatchType = tickCount % 5 === 0 ? 'update' : 'heartbeat';
      this.dispatchWireMessage(dispatchType, this.currentPresence);
    }, HEARTBEAT_INTERVAL_MS);
  }

  private handleBeforeUnload = () => {
    this.destroy();
  };

  private setConnectionStatus(status: ConnectionStatus) {
    this.connectionStatus = status;
    this.notifyStatus();
  }

  private notifyStatus() {
    this.statusListeners.forEach((fn) => fn(this.connectionStatus, this.mode));
  }

  public subscribe(listener: PresenceListener): () => void {
    this.listeners.add(listener);
    listener(this.getAllStudents());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onConflict(listener: ConflictListener): () => void {
    this.conflictListeners.add(listener);
    return () => {
      this.conflictListeners.delete(listener);
    };
  }

  public onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.connectionStatus, this.mode);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyListeners() {
    const all = this.getAllStudents();
    this.listeners.forEach((fn) => fn(all));
  }

  private notifyConflict(seatId: string, occupantName: string) {
    this.conflictListeners.forEach((fn) => fn(seatId, occupantName));
  }

  private teardownTransports() {
    if (this.channel) {
      try {
        this.channel.untrack();
        this.supabase?.removeChannel(this.channel);
      } catch { }
      this.channel = null;
      this.isSupabaseSubscribed = false;
    }

    if (this.trysteroRoom) {
      try {
        this.trysteroRoom.leave();
      } catch { }
      this.trysteroRoom = null;
      this.trysteroAction = null;
      this.webrtcPeersCount = 0;
    }

    if (this.mqttClient) {
      try {
        if (this.isMqttConnected && this.currentPresence) {
          this.sendMqttMessage('leave', this.currentPresence);
        }
        this.mqttClient.disconnect();
      } catch { }
      this.mqttClient = null;
      this.isMqttConnected = false;
    }
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.currentPresence) {
      this.dispatchWireMessage('leave', this.currentPresence);

      // Clean local storage
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_PEER_KEY);
        if (raw) {
          const registry: Record<string, StudentPresence> = JSON.parse(raw);
          delete registry[this.currentPresence.sessionId];
          localStorage.setItem(LOCAL_STORAGE_PEER_KEY, JSON.stringify(registry));
        }
      } catch { }
    }

    this.teardownTransports();

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch { }
      this.broadcastChannel = null;
    }

    window.removeEventListener('storage', this.handleStorageEvent);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('focus', this.handleWindowFocus);
  }
}

export const presenceService = new PresenceService();
