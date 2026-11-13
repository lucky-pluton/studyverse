import { createClient } from '@supabase/supabase-js';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type { LocationId, StudentPresence } from '../types/studyverse';

export type PresenceMode = 'supabase' | 'local_peer';

type PresenceListener = (presences: StudentPresence[]) => void;
type ConflictListener = (seatId: string, occupantName: string) => void;

class PresenceService {
  private mode: PresenceMode = 'local_peer';
  private supabase: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private broadcastChannel: BroadcastChannel | null = null;

  private currentPresence: StudentPresence | null = null;
  private peerMap: Map<string, StudentPresence> = new Map();
  private listeners: Set<PresenceListener> = new Set();
  private conflictListeners: Set<ConflictListener> = new Set();
  private heartbeatInterval: number | null = null;
  private isDestroyed: boolean = false;

  constructor() {
    this.detectMode();
  }

  private detectMode() {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (url && key && url !== 'https://your-project.supabase.co' && !url.includes('example')) {
      try {
        this.supabase = createClient(url, key);
        this.mode = 'supabase';
      } catch (err) {
        console.warn('Failed to initialize Supabase, falling back to local peer network:', err);
        this.mode = 'local_peer';
      }
    } else {
      this.mode = 'local_peer';
    }
  }

  public getMode(): PresenceMode {
    return this.mode;
  }

  public getSupabaseConfig(): { isConfigured: boolean; url: string | null } {
    const url = import.meta.env.VITE_SUPABASE_URL;
    return {
      isConfigured: this.mode === 'supabase',
      url: url || null,
    };
  }

  public init(initialPresence: StudentPresence) {
    this.currentPresence = {
      ...initialPresence,
      lastHeartbeat: Date.now(),
    };
    this.isDestroyed = false;

    // Always init BroadcastChannel as local multi-tab transport and sync
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('studyverse_multiplayer_sync');
        this.broadcastChannel.onmessage = (event) => {
          this.handleBroadcastMessage(event.data);
        };
      } catch (err) {
        console.warn('BroadcastChannel error, using storage fallback:', err);
      }
    }

    // Storage event fallback for older / cross-context tabs
    window.addEventListener('storage', this.handleStorageEvent);
    window.addEventListener('beforeunload', this.handleBeforeUnload);

    if (this.mode === 'supabase' && this.supabase) {
      this.setupSupabasePresence();
    } else {
      // Local peer network
      this.broadcastLocalPresence('join', this.currentPresence);
      this.loadPeersFromStorage();
    }

    // Start heartbeat
    this.startHeartbeat();
  }

  private setupSupabasePresence() {
    if (!this.supabase || !this.currentPresence) return;

    this.channel = this.supabase.channel('studyverse_global_world', {
      config: {
        presence: {
          key: this.currentPresence.sessionId,
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
              updatedPeers.set(key, latest);
            }
          }
        });

        this.peerMap = updatedPeers;
        this.notifyListeners();
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key === this.currentPresence?.sessionId) return;
        if (newPresences && newPresences.length > 0) {
          const joined = newPresences[0] as unknown as StudentPresence;
          this.peerMap.set(key, joined);
          this.notifyListeners();
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (this.peerMap.has(key)) {
          this.peerMap.delete(key);
          this.notifyListeners();
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && this.currentPresence && this.channel) {
          await this.channel.track(this.currentPresence);
        }
      });
  }

  private handleBroadcastMessage(data: { type: string; payload: StudentPresence; sessionId: string }) {
    if (this.isDestroyed || !this.currentPresence) return;
    if (data.sessionId === this.currentPresence.sessionId) return;

    if (data.type === 'join' || data.type === 'update' || data.type === 'heartbeat') {
      const peer = data.payload;
      // Check seat conflict
      if (
        this.currentPresence.seatId &&
        peer.seatId === this.currentPresence.seatId &&
        this.currentPresence.location === peer.location
      ) {
        // If two students sit at the exact same seat, earlier seatEnteredAt wins
        if (peer.seatEnteredAt && this.currentPresence.seatEnteredAt) {
          if (peer.seatEnteredAt < this.currentPresence.seatEnteredAt) {
            // We lose the seat conflict
            this.leaveSeat();
            this.notifyConflict(peer.seatId, peer.name);
          }
        }
      }

      this.peerMap.set(peer.sessionId, { ...peer, lastHeartbeat: Date.now() });
      this.notifyListeners();

      // If they just joined, respond with our presence so they know we are here
      if (data.type === 'join') {
        this.broadcastLocalPresence('heartbeat', this.currentPresence);
      }
    } else if (data.type === 'leave') {
      if (this.peerMap.has(data.sessionId)) {
        this.peerMap.delete(data.sessionId);
        this.notifyListeners();
      }
    }
  }

  private handleStorageEvent = (event: StorageEvent) => {
    if (event.key === 'studyverse_peer_registry' && event.newValue) {
      this.loadPeersFromStorage();
    }
  };

  private loadPeersFromStorage() {
    try {
      const raw = localStorage.getItem('studyverse_peer_registry');
      if (!raw || !this.currentPresence) return;
      const parsed: Record<string, StudentPresence> = JSON.parse(raw);
      const now = Date.now();
      let changed = false;

      Object.entries(parsed).forEach(([id, peer]) => {
        if (id !== this.currentPresence?.sessionId) {
          // If fresh heartbeat within 12s
          if (now - peer.lastHeartbeat < 12000) {
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
      const raw = localStorage.getItem('studyverse_peer_registry');
      const registry: Record<string, StudentPresence> = raw ? JSON.parse(raw) : {};

      // Clean up stale entries > 12s
      Object.keys(registry).forEach((id) => {
        if (now - (registry[id].lastHeartbeat || 0) > 12000) {
          delete registry[id];
        }
      });

      // Insert/update self
      registry[this.currentPresence.sessionId] = {
        ...this.currentPresence,
        lastHeartbeat: now,
      };

      localStorage.setItem('studyverse_peer_registry', JSON.stringify(registry));
    } catch {
      // Storage quota or privacy mode catch
    }
  }

  private removeFromStorage() {
    if (!this.currentPresence) return;
    try {
      const raw = localStorage.getItem('studyverse_peer_registry');
      if (raw) {
        const registry: Record<string, StudentPresence> = JSON.parse(raw);
        delete registry[this.currentPresence.sessionId];
        localStorage.setItem('studyverse_peer_registry', JSON.stringify(registry));
      }
    } catch {
      // Catch
    }
  }

  private broadcastLocalPresence(type: 'join' | 'update' | 'heartbeat' | 'leave', payload: StudentPresence) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type,
          payload,
          sessionId: payload.sessionId,
        });
      } catch {
        // Broadcast error catch
      }
    }
    this.syncToStorage();
  }

  public updatePresence(partial: Partial<StudentPresence>) {
    if (!this.currentPresence) return;

    this.currentPresence = {
      ...this.currentPresence,
      ...partial,
      lastHeartbeat: Date.now(),
    };

    if (this.mode === 'supabase' && this.channel) {
      this.channel.track(this.currentPresence);
    } else {
      this.broadcastLocalPresence('update', this.currentPresence);
    }

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
      cafeCount: all.filter((s) => s.location === 'cafe').length,
      parkCount: all.filter((s) => s.location === 'park').length,
    };
  }

  private startHeartbeat() {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.isDestroyed || !this.currentPresence) return;

      const now = Date.now();
      this.currentPresence.lastHeartbeat = now;

      // Clean up stale peers (> 10s without heartbeat)
      let peerRemoved = false;
      this.peerMap.forEach((peer, id) => {
        if (now - (peer.lastHeartbeat || 0) > 10000) {
          this.peerMap.delete(id);
          peerRemoved = true;
        }
      });

      if (peerRemoved) {
        this.notifyListeners();
      }

      if (this.mode === 'supabase' && this.channel) {
        // Supabase presence automatically tracks
      } else {
        this.broadcastLocalPresence('heartbeat', this.currentPresence);
      }
    }, 3500);
  }

  private handleBeforeUnload = () => {
    this.destroy();
  };

  public subscribe(listener: PresenceListener): () => void {
    this.listeners.add(listener);
    // Initial call
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

  private notifyListeners() {
    const all = this.getAllStudents();
    this.listeners.forEach((fn) => fn(all));
  }

  private notifyConflict(seatId: string, occupantName: string) {
    this.conflictListeners.forEach((fn) => fn(seatId, occupantName));
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.currentPresence) {
      if (this.mode === 'supabase' && this.channel) {
        this.channel.untrack();
        this.supabase?.removeChannel(this.channel);
      } else {
        this.broadcastLocalPresence('leave', this.currentPresence);
        this.removeFromStorage();
      }
    }

    if (this.broadcastChannel) {
      try { this.broadcastChannel.close(); } catch {}
      this.broadcastChannel = null;
    }

    window.removeEventListener('storage', this.handleStorageEvent);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    this.listeners.clear();
    this.conflictListeners.clear();
  }
}

export const presenceService = new PresenceService();
