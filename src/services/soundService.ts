// Web Audio API ambient soundscape generator for Studyverse — IIT Madras Campus
// Pure procedural generation: zero external audio assets required, guaranteed offline compatibility

export type AmbientTrackType = 'library' | 'lhc' | 'banyan' | 'oat' | 'cafe' | 'park' | 'gc' | 'campus' | 'city';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private notificationGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.35;
  private currentTrack: string | null = null;
  private audioStateListeners: Set<(isActive: boolean) => void> = new Set();

  // Active nodes for ambient loops
  private noiseNode: AudioNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private lfoNode: OscillatorNode | null = null;
  private chordInterval: number | null = null;
  private birdInterval: number | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master gain for ambient soundscape loops (controlled by navbar mute & volume slider)
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Dedicated notification gain (independent of ambient soundscape mute/volume)
      this.notificationGain = this.ctx.createGain();
      this.notificationGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.notificationGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.notifyAudioState();
      }).catch(() => {});
    }
  }

  public onAudioStateChange(listener: (isActive: boolean) => void): () => void {
    this.audioStateListeners.add(listener);
    return () => this.audioStateListeners.delete(listener);
  }

  private notifyAudioState() {
    const active = this.isAudioActive();
    this.audioStateListeners.forEach((fn) => fn(active));
  }

  public ensureAudioActivated(): Promise<boolean> {
    try {
      this.initContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        return this.ctx
          .resume()
          .then(() => {
            const active = this.ctx?.state === 'running';
            this.notifyAudioState();
            return active;
          })
          .catch(() => false);
      }
      const active = this.ctx?.state === 'running';
      this.notifyAudioState();
      return Promise.resolve(active);
    } catch {
      return Promise.resolve(false);
    }
  }

  public isAudioActive(): boolean {
    return !!this.ctx && this.ctx.state === 'running';
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.1);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.1);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public playSitSound() {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain || this.isMuted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay policy catch
    }
  }

  public playLeaveSound() {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain || this.isMuted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(330, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch {
      // Audio catch
    }
  }

  public playFocusChime() {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain || this.isMuted) return;

      // Gentle peaceful 3-tone crystal bell chime: C5 -> E5 -> G5 -> C6
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const start = this.ctx.currentTime + idx * 0.16;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.09, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(start);
        osc.stop(start + 2.4);
      });
    } catch {
      // Audio catch
    }
  }

  /**
   * Soft, warm real-time chat notification chime (150-300ms).
   * Dual-tone acoustic sine droplet (D5 587.33Hz + A5 880Hz) with gentle linear attack
   * and smooth exponential decay. Independent of ambient sound mute/volume.
   */
  public async playChatChime(): Promise<{ success: boolean; state: string; error?: string }> {
    try {
      this.initContext();
      if (!this.ctx || !this.notificationGain) {
        return { success: false, state: 'uninitialized', error: 'AudioContext unavailable' };
      }

      if (this.ctx.state === 'suspended') {
        try {
          await this.ctx.resume();
          this.notifyAudioState();
        } catch (resumeErr: unknown) {
          const msg = resumeErr instanceof Error ? resumeErr.message : String(resumeErr);
          return { success: false, state: this.ctx.state, error: `Audio resume blocked: ${msg}` };
        }
      }

      if (this.ctx.state !== 'running') {
        return {
          success: false,
          state: this.ctx.state,
          error: 'Browser autoplay policy: user interaction required'
        };
      }

      this.triggerChimeSynthesis();
      return { success: true, state: 'running' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, state: this.ctx?.state || 'error', error: msg };
    }
  }

  private triggerChimeSynthesis() {
    if (!this.ctx || !this.notificationGain) return;

    const now = this.ctx.currentTime;
    const notes = [
      { freq: 587.33, offset: 0, gain: 0.08, decay: 0.22 },
      { freq: 880.00, offset: 0.06, gain: 0.065, decay: 0.26 },
    ];

    notes.forEach(({ freq, offset, gain: peakGain, decay }) => {
      if (!this.ctx || !this.notificationGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const start = now + offset;
      osc.frequency.setValueAtTime(freq, start);

      // Soft linear ramp attack to avoid click
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(peakGain, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + decay);

      osc.connect(gain);
      gain.connect(this.notificationGain);

      osc.start(start);
      osc.stop(start + decay + 0.05);
    });
  }

  public startAmbience(track: AmbientTrackType) {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;
      if (this.currentTrack === track) return;

      this.stopAmbience();
      this.currentTrack = track;

      // 1. Create filtered pink/brown noise base (rain / breeze / air / cafe)
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      const noiseGain = this.ctx.createGain();

      if (track === 'library') {
        // Very low, cozy AC hum & distant rain
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, this.ctx.currentTime);
        noiseGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      } else if (track === 'lhc') {
        // Academic quiet room
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280, this.ctx.currentTime);
        noiseGain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      } else if (track === 'cafe') {
        // Warm cafe presence & espresso steam
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(450, this.ctx.currentTime);
        filter.Q.setValueAtTime(1.2, this.ctx.currentTime);
        noiseGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      } else if (track === 'banyan' || track === 'park' || track === 'gc') {
        // Gentle rustling tree breeze & outdoor nature
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(580, this.ctx.currentTime);
        noiseGain.gain.setValueAtTime(0.1, this.ctx.currentTime);

        // Modulate breeze with subtle LFO
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime); // 5 sec swell
        lfoGain.gain.setValueAtTime(160, this.ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
        this.lfoNode = lfo;

        // Subtle procedural bird chirps every 7-12s
        this.startGentleBirds();
      } else if (track === 'oat') {
        // Open-air amphitheatre breeze
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, this.ctx.currentTime);
        noiseGain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      } else {
        // Campus overview: expansive serene greenery hum
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(360, this.ctx.currentTime);
        noiseGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        this.startGentleBirds();
      }

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      whiteNoise.start();
      this.noiseNode = whiteNoise;
      this.filterNode = filter;

      // 2. Schedule gentle pentatonic lofi chords (peaceful piano/chime swells)
      this.startGentleChords(track);
    } catch {
      // Audio autoplay policy catch
    }
  }

  private startGentleBirds() {
    const chirp = () => {
      if (!this.ctx || !this.masterGain || this.isMuted) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';

        // Sweet bird frequencies (2.4kHz -> 3.2kHz)
        const baseFreq = 2200 + Math.random() * 600;
        osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(baseFreq + 800, this.ctx.currentTime + 0.08);
        osc.frequency.linearRampToValueAtTime(baseFreq + 400, this.ctx.currentTime + 0.16);

        gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.02, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
      } catch {}
    };

    this.birdInterval = window.setInterval(chirp, 9000);
  }

  private startGentleChords(track: string) {
    if (!this.ctx || !this.masterGain) return;

    // Pentatonic scale chords for peaceful study focus
    const chordSets: Record<string, number[][]> = {
      library: [
        [220.00, 261.63, 329.63], // Am
        [174.61, 220.00, 261.63], // F
        [196.00, 246.94, 293.66], // G
        [164.81, 196.00, 246.94], // Em
      ],
      lhc: [
        [261.63, 329.63, 392.00], // C
        [196.00, 246.94, 293.66], // G
        [220.00, 261.63, 329.63], // Am
        [174.61, 220.00, 261.63], // F
      ],
      cafe: [
        [261.63, 329.63, 392.00, 493.88], // Cmaj7
        [220.00, 261.63, 329.63, 392.00], // Am7
        [174.61, 220.00, 261.63, 329.63], // Fmaj7
        [196.00, 246.94, 293.66, 349.23], // G7
      ],
      banyan: [
        [261.63, 329.63, 392.00], // C
        [293.66, 369.99, 440.00], // D
        [329.63, 392.00, 493.88], // Em
        [220.00, 277.18, 329.63], // A
      ],
      oat: [
        [220.00, 261.63, 329.63],
        [261.63, 329.63, 392.00],
        [174.61, 220.00, 261.63],
      ],
      park: [
        [261.63, 329.63, 392.00],
        [293.66, 369.99, 440.00],
        [329.63, 392.00, 493.88],
      ],
      campus: [
        [261.63, 329.63, 392.00],
        [220.00, 261.63, 329.63],
      ]
    };

    const chords = chordSets[track] || chordSets.campus;
    let chordIndex = 0;

    const playChord = () => {
      if (!this.ctx || !this.masterGain || this.isMuted) return;
      const notes = chords[chordIndex % chords.length];
      chordIndex++;

      const chordGain = this.ctx.createGain();
      chordGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      chordGain.gain.linearRampToValueAtTime(0.045, this.ctx.currentTime + 1.8);
      chordGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 7.5);
      chordGain.connect(this.masterGain);

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.connect(chordGain);
        osc.start(this.ctx.currentTime + idx * 0.08);
        osc.stop(this.ctx.currentTime + 8.0);
      });
    };

    playChord();
    this.chordInterval = window.setInterval(playChord, 8000);
  }

  public stopAmbience() {
    if (this.chordInterval) {
      clearInterval(this.chordInterval);
      this.chordInterval = null;
    }
    if (this.birdInterval) {
      clearInterval(this.birdInterval);
      this.birdInterval = null;
    }
    if (this.lfoNode) {
      try { this.lfoNode.stop(); } catch {}
      this.lfoNode.disconnect();
      this.lfoNode = null;
    }
    if (this.noiseNode) {
      try { (this.noiseNode as AudioBufferSourceNode).stop(); } catch {}
      this.noiseNode.disconnect();
      this.noiseNode = null;
    }
    if (this.filterNode) {
      this.filterNode.disconnect();
      this.filterNode = null;
    }
    this.currentTrack = null;
  }
}

export const soundService = new SoundEngine();

if (typeof window !== 'undefined') {
  (window as unknown as { soundService?: SoundEngine }).soundService = soundService;
}

// Passive browser interaction hook to unlock AudioContext on the first user gesture
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    soundService.ensureAudioActivated();
  };
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
}
