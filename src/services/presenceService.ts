import { createClient } from '@supabase/supabase-js';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import Paho from 'paho-mqtt';
import type { LocationId, StudentPresence } from '../types/studyverse';

export type PresenceMode = 'supabase' | 'cloud_relay' | 'local_peer';
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

type PresenceListener = (presences: StudentPresence[]) => void;
type ConflictListener = (seatId: string, occupantName: string) => void;
type StatusListener = (status: ConnectionStatus, mode: PresenceMode) => void;

interface WireMessage {
  type: 'join' | 'update' | 'heartbeat' | 'leave' | 'seat_conflict';
  sessionId: string;
  payload: StudentPresence;
  timestamp: number;
}

const MQTT_BROKERS = [
  { host: 'broker.emqx.io', port: 8084, path: '/mqtt' },
  { host: 'broker.hivemq.com', port: 8884, path: '/mqtt' },
];

const MQTT_TOPIC_PRESENCE = 'studyverse/global/v2/presence';
const LOCAL_STORAGE_PEER_KEY = 'studyverse_peer_registry';
const CUSTOM_SUPABASE_URL_KEY = 'studyverse_custom_supabase_url';
const CUSTOM_SUPABASE_KEY_KEY = 'studyverse_custom_supabase_anon_key';

class PresenceService {
  private mode: PresenceMode = 'local_peer';
  private connectionStatus: ConnectionStatus = 'disconnected';

  // Supabase Realtime
  private supabase: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private isSupabaseSubscribed: boolean = false;

  // Cloud Relay (MQTT over secure WSS)
  private mqttClient: Paho.Client | null = null;
  private mqttBrokerIndex: number = 0;
  private isMqttConnected: boolean = false;

  // Local Peer (BroadcastChannel + LocalStorage)
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
   * Determine whether to use Supabase (if keys present) or Cloud Relay fallback
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

    // Default to Cloud Relay over secure WebSockets so cross-device sync works out-of-the-box
    this.mode = 'cloud_relay';
  }

  public getMode(): PresenceMode {
    return this.mode;
  }

  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
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

      // Teardown previous transport
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
      if (this.mode === 'supabase') {
        this.setupSupabasePresence();
      } else {
        this.setupCloudRelay();
      }
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

    // 1. Always init BroadcastChannel as local multi-tab transport and sync
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
        console.warn('BroadcastChannel error, using storage fallback:', err);
      }
    }

    // 2. Storage event fallback for older / cross-context tabs
    window.addEventListener('storage', this.handleStorageEvent);
    window.addEventListener('beforeunload', this.handleBeforeUnload);

    // 3. Connect to primary cloud transport
    if (this.mode === 'supabase' && this.supabase) {
      this.setupSupabasePresence();
    } else {
      this.setupCloudRelay();
    }

    // 4. Also broadcast to local tabs and sync storage
    this.broadcastLocalPresence('join', this.currentPresence);
    this.loadPeersFromStorage();

    // 5. Start periodic heartbeat and stale peer cleaner
    this.startHeartbeat();
  }

  // =========================================================================
  // SUPABASE REALTIME PRESENCE IMPLEMENTATION
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
        // Presence state synchronization across all connected clients
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
            if (!updatedPeers.has(id) && Date.now() - (peer.lastHeartbeat || 0) < 15000) {
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
        // Broadcast events for instant seat claiming / navigation updates
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
      console.error('Failed to setup Supabase presence, falling back to cloud relay:', err);
      this.mode = 'cloud_relay';
      this.setupCloudRelay();
    }
  }

  // =========================================================================
  // CLOUD WEBSOCKET RELAY (Zero-Config Global Multi-Device Fallback)
  // =========================================================================

  private setupCloudRelay() {
    if (!this.currentPresence || this.isDestroyed) return;

    this.setConnectionStatus('connecting');
    const broker = MQTT_BROKERS[this.mqttBrokerIndex % MQTT_BROKERS.length];
    const clientId = `studyverse_${this.currentPresence.sessionId}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      this.mqttClient = new Paho.Client(broker.host, broker.port, broker.path, clientId);

      // Last Will and Testament: automatically clean up if device suddenly disconnects
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
          console.warn('Cloud relay connection lost:', responseObject.errorMessage);
          this.setConnectionStatus('connecting');
          // Retry next broker after brief backoff
          setTimeout(() => {
            if (!this.isDestroyed) {
              this.mqttBrokerIndex++;
              this.setupCloudRelay();
            }
          }, 3000);
        } else {
          this.setConnectionStatus('disconnected');
        }
      };

      this.mqttClient.onMessageArrived = (message) => {
        try {
          const wire: WireMessage = JSON.parse(message.payloadString);
          this.handleWireMessage(wire, 'cloud');
        } catch {
          // Ignore invalid frames
        }
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

          // Publish our presence immediately upon joining
          if (this.currentPresence) {
            this.sendCloudRelayMessage('join', this.currentPresence);
          }
        },
        onFailure: (err) => {
          console.warn(`Failed to connect to cloud relay ${broker.host}:`, err.errorMessage);
          this.isMqttConnected = false;
          // Switch to alternate broker or fall back to local peer
          this.mqttBrokerIndex++;
          if (this.mqttBrokerIndex < MQTT_BROKERS.length * 2) {
            setTimeout(() => this.setupCloudRelay(), 2000);
          } else {
            console.warn('All cloud relays unreachable, running in local peer mode');
            this.mode = 'local_peer';
            this.setConnectionStatus('disconnected');
          }
        },
      });
    } catch (err) {
      console.warn('Error creating cloud relay client:', err);
      this.mode = 'local_peer';
      this.setConnectionStatus('disconnected');
    }
  }

  private sendCloudRelayMessage(type: WireMessage['type'], payload: StudentPresence) {
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
    } catch (err) {
      console.warn('Failed to publish cloud relay message:', err);
    }
  }

  // =========================================================================
  // UNIFIED WIRE MESSAGE DISPATCHER (Handles events from Supabase, Cloud & Local)
  // =========================================================================

  private handleWireMessage(data: WireMessage, source: 'supabase' | 'cloud' | 'local') {
    if (this.isDestroyed || !this.currentPresence) return;
    if (data.sessionId === this.currentPresence.sessionId) return;

    if (data.type === 'join' || data.type === 'update' || data.type === 'heartbeat') {
      const peer = data.payload;

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
        lastHeartbeat: Date.now(),
      });
      this.notifyListeners();

      // If they just joined, respond with our presence so they know we are already here
      if (data.type === 'join') {
        if (source === 'local') {
          this.broadcastLocalPresence('heartbeat', this.currentPresence);
        } else if (source === 'cloud') {
          this.sendCloudRelayMessage('heartbeat', this.currentPresence);
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
  }

  // =========================================================================
  // LOCAL MULTI-TAB PRESENCE & STORAGE SYNC
  // =========================================================================

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
          if (now - (peer.lastHeartbeat || 0) < 15000) {
            this.peerMap.set(id, peer);
            changed = true;
          }
        }
      });

      if (changed) {
        this.notifyListeners();
      }
    } catch {
      // Ignore parse errors
    }
  }

  private syncToStorage() {
    if (!this.currentPresence) return;
    try {
      const now = Date.now();
      const raw = localStorage.getItem(LOCAL_STORAGE_PEER_KEY);
      const registry: Record<string, StudentPresence> = raw ? JSON.parse(raw) : {};

      // Clean up stale entries > 15s
      Object.keys(registry).forEach((id) => {
        if (now - (registry[id].lastHeartbeat || 0) > 15000) {
          delete registry[id];
        }
      });

      // Update self
      registry[this.currentPresence.sessionId] = {
        ...this.currentPresence,
        lastHeartbeat: now,
      };

      localStorage.setItem(LOCAL_STORAGE_PEER_KEY, JSON.stringify(registry));
    } catch {
      // Storage quota catch
    }
  }

  private removeFromStorage() {
    if (!this.currentPresence) return;
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_PEER_KEY);
      if (raw) {
        const registry: Record<string, StudentPresence> = JSON.parse(raw);
        delete registry[this.currentPresence.sessionId];
        localStorage.setItem(LOCAL_STORAGE_PEER_KEY, JSON.stringify(registry));
      }
    } catch {
      // Catch
    }
  }

  private broadcastLocalPresence(
    type: WireMessage['type'],
    payload: StudentPresence
  ) {
    if (this.broadcastChannel) {
      try {
        const msg: WireMessage = {
          type,
          sessionId: payload.sessionId,
          payload,
          timestamp: Date.now(),
        };
        this.broadcastChannel.postMessage(msg);
      } catch {
        // Broadcast error catch
      }
    }
    this.syncToStorage();
  }

  // =========================================================================
  // PUBLIC PRESENCE MUTATIONS (Seat changes, movements, topics)
  // =========================================================================

  public updatePresence(partial: Partial<StudentPresence>) {
    if (!this.currentPresence) return;

    this.currentPresence = {
      ...this.currentPresence,
      ...partial,
      lastHeartbeat: Date.now(),
    };

    // 1. Supabase dispatch
    if (this.mode === 'supabase' && this.channel && this.isSupabaseSubscribed) {
      this.channel.track(this.currentPresence).catch((e) => {
        console.warn('Track update error:', e);
      });
      this.channel.send({
        type: 'broadcast',
        event: 'peer_event',
        payload: {
          type: 'update',
          sessionId: this.currentPresence.sessionId,
          payload: this.currentPresence,
          timestamp: Date.now(),
        } as WireMessage,
      });
    }

    // 2. Cloud Relay dispatch
    if (this.mode === 'cloud_relay') {
      this.sendCloudRelayMessage('update', this.currentPresence);
    }

    // 3. Local tab dispatch
    this.broadcastLocalPresence('update', this.currentPresence);

    this.notifyListeners();
  }

  public occupySeat(seatId: string, location: LocationId): boolean {
    if (!this.currentPresence) return false;

    // Check if seat is currently occupied by someone else
    const isOccupiedByPeer = Array.from(this.peerMap.values()).some(
      (p) => p.location === location && p.seatId === seatId
    );

    if (isOccupiedByPeer) {
      const occupant = Array.from(this.peerMap.values()).find(
        (p) => p.location === location && p.seatId === seatId
      );
      this.notifyConflict(seatId, occupant?.name || 'Another student');
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

  public changeLocation(newLocation: LocationId) {
    if (!this.currentPresence) return;
    this.updatePresence({
      location: newLocation,
      seatId: null,
      seatEnteredAt: null,
    });
  }

  public setStudyTopic(topic: string) {
    this.updatePresence({
      studyTopic: topic,
    });
  }

  // =========================================================================
  // GETTERS & READERS
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

    this.heartbeatInterval = window.setInterval(() => {
      if (this.isDestroyed || !this.currentPresence) return;

      const now = Date.now();
      this.currentPresence.lastHeartbeat = now;

      // Clean up stale peers (> 20s without heartbeat or update)
      let peerRemoved = false;
      this.peerMap.forEach((peer, id) => {
        if (now - (peer.lastHeartbeat || 0) > 20000) {
          this.peerMap.delete(id);
          peerRemoved = true;
        }
      });

      if (peerRemoved) {
        this.notifyListeners();
      }

      // Heartbeat transport dispatch
      if (this.mode === 'supabase' && this.channel && this.isSupabaseSubscribed) {
        this.channel.send({
          type: 'broadcast',
          event: 'peer_event',
          payload: {
            type: 'heartbeat',
            sessionId: this.currentPresence.sessionId,
            payload: this.currentPresence,
            timestamp: now,
          } as WireMessage,
        });
      } else if (this.mode === 'cloud_relay') {
        this.sendCloudRelayMessage('heartbeat', this.currentPresence);
      }

      // Always sync local heartbeat
      this.broadcastLocalPresence('heartbeat', this.currentPresence);
    }, 4000);
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
      } catch {}
      this.channel = null;
      this.isSupabaseSubscribed = false;
    }

    if (this.mqttClient) {
      try {
        if (this.isMqttConnected && this.currentPresence) {
          this.sendCloudRelayMessage('leave', this.currentPresence);
        }
        this.mqttClient.disconnect();
      } catch {}
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
      if (this.mode === 'supabase' && this.channel && this.isSupabaseSubscribed) {
        this.channel.send({
          type: 'broadcast',
          event: 'peer_event',
          payload: {
            type: 'leave',
            sessionId: this.currentPresence.sessionId,
            payload: this.currentPresence,
            timestamp: Date.now(),
          } as WireMessage,
        });
      }
      this.broadcastLocalPresence('leave', this.currentPresence);
      this.removeFromStorage();
    }

    this.teardownTransports();

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch {}
      this.broadcastChannel = null;
    }

    window.removeEventListener('storage', this.handleStorageEvent);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    this.listeners.clear();
    this.conflictListeners.clear();
    this.statusListeners.clear();
    this.connectionStatus = 'disconnected';
  }
}

export const presenceService = new PresenceService();
