/**
 * Seamless, lush multi-layered Web Audio API synthesizer for Torch.
 * Uses a single continuous 16th-note musical clock with smooth BPM & harmonic transitions,
 * a dedicated compressor bus (zero clipping), reusable noise buffers (zero GC glitches),
 * and click-free envelopes across all dungeon tiers:
 * - Floors 1–4: Haunting D-minor harp, warm evolving pad & sparse heartbeat pulse
 * - Floors 5–9: Head-nodding mid-tempo groove (punchy kick, crisp 2 & 4 snare, rolling bass & hats)
 * - Floors 10–14 (Blood Sanctum): Phrygian harmonic shifts, 16th-note ticking suspense & tom fills
 * - Floors 15–19 (Abyssal Rift): High eerie tension strings, driving ostinato & urgent arpeggios
 * - Floors 20+ (Dragon's Inferno): Relentless war groove & spine-tingling climax
 */

export type BiomeAmbianceId =
  | 'crypt'
  | 'catacombs'
  | 'blood_sanctum'
  | 'abyssal_rift'
  | 'inferno';

interface BarChord {
  bassRoot: number;
  bassOctave: number;
  bassFifth: number;
  padRoot: number;
  padFifth: number;
  padThird: number;
  arpNotes: number[];
  tensionBell: number;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicCompressor: DynamicsCompressorNode | null = null;
  private musicBusGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private masterVolume = 0.75;
  private sfxMuted = false;
  private musicEnabled = false;
  private musicTimerId: number | null = null;
  private heartbeatTimer: number | null = null;

  private padOsc1: OscillatorNode | null = null;
  private padOsc2: OscillatorNode | null = null;
  private padOsc3: OscillatorNode | null = null;
  private padFilter: BiquadFilterNode | null = null;
  private padGain: GainNode | null = null;

  private ambianceSource: AudioBufferSourceNode | null = null;
  private ambianceFilter: BiquadFilterNode | null = null;
  private ambianceGain: GainNode | null = null;
  private ambianceLfo: OscillatorNode | null = null;
  private ambianceLfoGain: GainNode | null = null;
  private ambianceEventTimer: number | null = null;
  private ambianceActive = false;
  private biomeId: BiomeAmbianceId = 'crypt';

  private nextStepTime = 0;
  private stepIndex = 0;
  private currentFloor = 1;
  private currentBpm = 92;
  private heartbeatActive = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(
          this.sfxMuted ? 0 : this.masterVolume,
          this.ctx.currentTime
        );
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private getOutputNode(ctx: AudioContext): AudioNode {
    return this.masterGain ?? ctx.destination;
  }

  private ensureMusicBus(ctx: AudioContext): AudioNode {
    if (!this.musicBusGain || !this.musicCompressor) {
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-16, ctx.currentTime);
      compressor.knee.setValueAtTime(14, ctx.currentTime);
      compressor.ratio.setValueAtTime(4, ctx.currentTime);
      compressor.attack.setValueAtTime(0.006, ctx.currentTime);
      compressor.release.setValueAtTime(0.18, ctx.currentTime);

      const bus = ctx.createGain();
      bus.gain.setValueAtTime(0.95, ctx.currentTime);

      bus.connect(compressor);
      compressor.connect(this.getOutputNode(ctx));

      this.musicCompressor = compressor;
      this.musicBusGain = bus;
    }
    return this.musicBusGain;
  }

  private getReusableNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.noiseBuffer || this.noiseBuffer.sampleRate !== ctx.sampleRate) {
      const len = Math.floor(ctx.sampleRate * 2);
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  }

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this.sfxMuted ? 0 : this.masterVolume,
        this.ctx.currentTime,
        0.04
      );
    }
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  public setMuted(muted: boolean) {
    this.sfxMuted = muted;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        muted ? 0 : this.masterVolume,
        this.ctx.currentTime,
        0.04
      );
    }
    if (muted) {
      this.stopMusic();
      this.stopHeartbeat();
    }
  }

  public isMuted(): boolean {
    return this.sfxMuted;
  }

  public isMusicPlaying(): boolean {
    return this.musicEnabled;
  }

  public isContextRunning(): boolean {
    return this.ctx?.state === 'running';
  }

  private getMusicTier(floor: number): number {
    if (floor >= 20) return 5;
    if (floor >= 15) return 4;
    if (floor >= 10) return 3;
    if (floor >= 5) return 2;
    return 1;
  }

  private getTargetBpm(floor: number): number {
    if (floor >= 20) return 124;
    if (floor >= 15) return 118;
    if (floor >= 10) return 112;
    if (floor >= 7) return 106;
    if (floor >= 5) return 102;
    if (floor >= 3) return 96;
    return 92;
  }

  private getBiomeForFloorTier(floor: number): BiomeAmbianceId {
    if (floor >= 20) return 'inferno';
    if (floor >= 15) return 'abyssal_rift';
    if (floor >= 10) return 'blood_sanctum';
    if (floor >= 5) return 'catacombs';
    return 'crypt';
  }

  public setBiomeAmbiance(biome: BiomeAmbianceId) {
    this.biomeId = biome;
    if (!this.ctx || !this.ambianceActive || this.sfxMuted) return;

    const now = this.ctx.currentTime;
    const profiles: Record<
      BiomeAmbianceId,
      { freq: number; q: number; lfoRate: number; lfoDepth: number; gain: number }
    > = {
      crypt: { freq: 185, q: 1.4, lfoRate: 0.12, lfoDepth: 55, gain: 0.018 },
      catacombs: { freq: 230, q: 1.6, lfoRate: 0.16, lfoDepth: 75, gain: 0.02 },
      blood_sanctum: { freq: 210, q: 2.0, lfoRate: 0.2, lfoDepth: 95, gain: 0.022 },
      abyssal_rift: { freq: 330, q: 2.6, lfoRate: 0.24, lfoDepth: 150, gain: 0.024 },
      inferno: { freq: 285, q: 1.5, lfoRate: 0.28, lfoDepth: 130, gain: 0.025 },
    };

    const p = profiles[biome];
    this.ambianceFilter?.frequency.setTargetAtTime(p.freq, now, 1.1);
    this.ambianceFilter?.Q.setTargetAtTime(p.q, now, 1.1);
    this.ambianceLfo?.frequency.setTargetAtTime(p.lfoRate, now, 1.1);
    this.ambianceLfoGain?.gain.setTargetAtTime(p.lfoDepth, now, 1.1);
    this.ambianceGain?.gain.setTargetAtTime(p.gain, now, 1.2);
  }

  public setFloorTension(floor: number) {
    this.currentFloor = Math.max(1, floor);
    this.setBiomeAmbiance(this.getBiomeForFloorTier(this.currentFloor));
    if (!this.ctx || !this.musicEnabled || this.sfxMuted) return;

    const tier = this.getMusicTier(this.currentFloor);
    // Smoothly open pad filter as danger escalates without touching pitch mid-bar
    if (this.padFilter) {
      const cutoff = 280 + tier * 95 + Math.min(180, this.currentFloor * 8);
      this.padFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 1.0);
    }
  }

  public setLowHpHeartbeat(active: boolean) {
    if (this.sfxMuted || !active) {
      this.stopHeartbeat();
      return;
    }
    if (this.heartbeatActive) return;

    const ctx = this.ensureContext();
    if (!ctx) return;
    this.heartbeatActive = true;

    const pulse = () => {
      if (!this.heartbeatActive || this.sfxMuted) return;
      this.tone(66, 38, 0.12, 'sine', 0.13, 0);
      this.tone(54, 32, 0.14, 'sine', 0.09, 0.19);
    };

    pulse();
    this.heartbeatTimer = window.setInterval(pulse, 940);
  }

  public stopHeartbeat() {
    this.heartbeatActive = false;
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  public toggleMusic(): boolean {
    if (this.musicEnabled) {
      this.stopMusic();
      return false;
    } else {
      if (this.sfxMuted) this.setMuted(false);
      this.startMusic();
      return true;
    }
  }

  public startMusic() {
    if (this.sfxMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    if (this.musicEnabled) {
      if (!this.ambianceActive) this.startAmbiance();
      return;
    }

    try {
      const bus = this.ensureMusicBus(ctx);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(340, ctx.currentTime);
      filter.Q.setValueAtTime(0.9, ctx.currentTime);

      const pGain = ctx.createGain();
      pGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      pGain.gain.linearRampToValueAtTime(0.036, ctx.currentTime + 1.6);

      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(73.42, ctx.currentTime); // D2

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(110.0, ctx.currentTime); // A2

      const osc3 = ctx.createOscillator();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(174.61, ctx.currentTime); // F3

      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(filter);
      filter.connect(pGain);
      pGain.connect(bus);

      osc1.start();
      osc2.start();
      osc3.start();

      this.padOsc1 = osc1;
      this.padOsc2 = osc2;
      this.padOsc3 = osc3;
      this.padFilter = filter;
      this.padGain = pGain;
      this.musicEnabled = true;
      this.currentBpm = this.getTargetBpm(this.currentFloor);
      this.startAmbiance();

      this.nextStepTime = ctx.currentTime + 0.08;

      // Tight, glitch-free lookahead 16th-note scheduler
      const scheduleLoop = () => {
        if (!this.musicEnabled || this.sfxMuted || !this.ctx) return;
        if (this.ctx.state !== 'running') {
          this.nextStepTime = this.ctx.currentTime + 0.08;
          this.musicTimerId = window.setTimeout(scheduleLoop, 90);
          return;
        }
        // Recover cleanly if tab was backgrounded
        if (this.nextStepTime < this.ctx.currentTime - 0.35) {
          this.nextStepTime = this.ctx.currentTime + 0.05;
        }
        while (this.nextStepTime < this.ctx.currentTime + 0.18) {
          const targetBpm = this.getTargetBpm(this.currentFloor);
          // Smoothly glide tempo across floors with zero sudden skips
          this.currentBpm += (targetBpm - this.currentBpm) * 0.04;
          const sixteenthSec = 60 / this.currentBpm / 4;

          this.scheduleMusicalStep(
            this.ctx,
            this.stepIndex,
            this.nextStepTime,
            sixteenthSec
          );
          this.nextStepTime += sixteenthSec;
          this.stepIndex = (this.stepIndex + 1) % 64;
        }
        this.musicTimerId = window.setTimeout(scheduleLoop, 45);
      };

      scheduleLoop();
    } catch {
      this.musicEnabled = false;
    }
  }

  public startAmbiance() {
    if (this.sfxMuted || this.ambianceActive) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const length = Math.floor(ctx.sampleRate * 3);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.032;
        b2 = 0.95 * b2 + white * 0.048;
        data[i] = (b0 + b1 + b2 + white * 0.08) * 0.45;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(190, ctx.currentTime);
      filter.Q.setValueAtTime(1.5, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.14, ctx.currentTime);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(60, ctx.currentTime);

      const aGain = ctx.createGain();
      aGain.gain.setValueAtTime(0.0001, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      source.connect(filter);
      filter.connect(aGain);
      aGain.connect(this.getOutputNode(ctx));

      source.start();
      lfo.start();

      this.ambianceSource = source;
      this.ambianceFilter = filter;
      this.ambianceGain = aGain;
      this.ambianceLfo = lfo;
      this.ambianceLfoGain = lfoGain;
      this.ambianceActive = true;

      this.setBiomeAmbiance(this.biomeId);

      const scheduleNextAccent = () => {
        if (!this.ambianceActive || this.sfxMuted || !this.ctx) return;
        this.triggerBiomeEnvironmentalCue(this.ctx, this.biomeId);
        const delayMs = 2600 + Math.random() * 2800;
        this.ambianceEventTimer = window.setTimeout(scheduleNextAccent, delayMs);
      };

      this.ambianceEventTimer = window.setTimeout(scheduleNextAccent, 1600);
    } catch {
      this.ambianceActive = false;
    }
  }

  public stopAmbiance() {
    this.ambianceActive = false;
    if (this.ambianceEventTimer !== null) {
      clearTimeout(this.ambianceEventTimer);
      this.ambianceEventTimer = null;
    }
    try {
      if (this.ambianceGain && this.ctx) {
        this.ambianceGain.gain.linearRampToValueAtTime(
          0.0001,
          this.ctx.currentTime + 0.25
        );
      }
      const src = this.ambianceSource;
      const lfo = this.ambianceLfo;
      setTimeout(() => {
        try {
          src?.stop();
          lfo?.stop();
        } catch {
          // ignore
        }
      }, 280);
    } catch {
      // ignore
    }
    this.ambianceSource = null;
    this.ambianceFilter = null;
    this.ambianceGain = null;
    this.ambianceLfo = null;
    this.ambianceLfoGain = null;
  }

  private triggerBiomeEnvironmentalCue(ctx: AudioContext, biome: BiomeAmbianceId) {
    const roll = Math.random();
    if (biome === 'crypt' || biome === 'catacombs') {
      if (roll < 0.6) {
        this.scheduleTorchEmberCrackle(ctx, false);
      } else {
        this.scheduleDistantChain(ctx);
      }
    } else if (biome === 'blood_sanctum') {
      if (roll < 0.55) {
        this.scheduleDistantChain(ctx);
      } else {
        this.scheduleHowlingWindGust(ctx, 210, 420);
      }
    } else if (biome === 'abyssal_rift') {
      if (roll < 0.68) {
        this.scheduleHowlingWindGust(ctx, 280, 620);
      } else {
        this.scheduleDistantChain(ctx);
      }
    } else {
      if (roll < 0.6) {
        this.scheduleTorchEmberCrackle(ctx, true);
      } else {
        this.scheduleHowlingWindGust(ctx, 190, 460);
      }
    }
  }

  private scheduleDistantChain(ctx: AudioContext) {
    try {
      const now = ctx.currentTime;
      const clinks = 3;
      for (let i = 0; i < clinks; i++) {
        const start = now + i * (0.095 + Math.random() * 0.05);
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        const f1 = 420 + Math.random() * 130;
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(f1, start);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(f1 * 1.63, start);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1050, start);
        filter.Q.setValueAtTime(2.6, start);

        const vol = 0.016 * (1 - i * 0.22);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(vol, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0004, start + 0.15);
        gain.gain.linearRampToValueAtTime(0, start + 0.17);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.getOutputNode(ctx));

        osc1.start(start);
        osc2.start(start);
        osc1.stop(start + 0.18);
        osc2.stop(start + 0.18);
      }
    } catch {
      // ignore
    }
  }

  private scheduleHowlingWindGust(
    ctx: AudioContext,
    lowFreq: number,
    peakFreq: number
  ) {
    try {
      const now = ctx.currentTime;
      const duration = 1.9;
      const src = ctx.createBufferSource();
      src.buffer = this.getReusableNoiseBuffer(ctx);
      src.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(4.0, now);
      filter.frequency.setValueAtTime(lowFreq, now);
      filter.frequency.exponentialRampToValueAtTime(peakFreq, now + duration * 0.45);
      filter.frequency.exponentialRampToValueAtTime(lowFreq * 0.85, now + duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.02, now + duration * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0004, now + duration - 0.03);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.getOutputNode(ctx));
      src.start(now);
      src.stop(now + duration + 0.02);
    } catch {
      // ignore
    }
  }

  private scheduleTorchEmberCrackle(ctx: AudioContext, intense = false) {
    try {
      const now = ctx.currentTime;
      const pops = intense ? 3 : 2;
      const noiseBuf = this.getReusableNoiseBuffer(ctx);
      for (let i = 0; i < pops; i++) {
        const start = now + i * (0.09 + Math.random() * 0.12);
        const offset = Math.random() * 1.4;
        const src = ctx.createBufferSource();
        src.buffer = noiseBuf;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1700 + Math.random() * 1300, start);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(intense ? 0.02 : 0.014, start + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0004, start + 0.028);
        gain.gain.linearRampToValueAtTime(0, start + 0.032);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.getOutputNode(ctx));
        src.start(start, offset, 0.034);
      }
    } catch {
      // ignore
    }
  }

  private getProgressionChord(barIndex: number, tier: number): BarChord {
    // 4-Bar dark cinematic progression in D Minor / Harmonic Minor / Phrygian:
    // Bar 0: Dm -> Bar 1: Bb -> Bar 2: Gm (Floors 1–9) or Eb Phrygian (Floors 10+) -> Bar 3: A7 turnaround
    if (barIndex === 0) {
      return {
        bassRoot: 73.42, // D2
        bassOctave: 146.83, // D3
        bassFifth: 110.0, // A2
        padRoot: 73.42,
        padFifth: 110.0,
        padThird: 174.61, // F3
        arpNotes: [293.66, 349.23, 440.0, 587.33, 523.25, 440.0, 349.23, 329.63],
        tensionBell: 587.33, // D5
      };
    }
    if (barIndex === 1) {
      return {
        bassRoot: 58.27, // Bb1
        bassOctave: 116.54, // Bb2
        bassFifth: 87.31, // F2
        padRoot: 58.27,
        padFifth: 87.31,
        padThird: 146.83, // D3
        arpNotes: [233.08, 293.66, 349.23, 466.16, 440.0, 349.23, 293.66, 261.63],
        tensionBell: 698.46, // F5
      };
    }
    if (barIndex === 2) {
      if (tier >= 3) {
        // Phrygian Neapolitan Eb major tension (spine-chilling lift!)
        return {
          bassRoot: 77.78, // Eb2
          bassOctave: 155.56, // Eb3
          bassFifth: 116.54, // Bb2
          padRoot: 77.78,
          padFifth: 116.54,
          padThird: 196.0, // G3
          arpNotes: [311.13, 392.0, 466.16, 622.25, 587.33, 466.16, 392.0, 349.23],
          tensionBell: 622.25, // Eb5
        };
      }
      return {
        bassRoot: 98.0, // G2
        bassOctave: 196.0, // G3
        bassFifth: 146.83, // D3
        padRoot: 98.0,
        padFifth: 146.83,
        padThird: 233.08, // Bb3
        arpNotes: [196.0, 293.66, 349.23, 392.0, 466.16, 392.0, 349.23, 293.66],
        tensionBell: 783.99, // G5
      };
    }
    // Bar 3: A7 harmonic-minor dominant turnaround (C# pulls inexorably back to D)
    return {
      bassRoot: 55.0, // A1
      bassOctave: 110.0, // A2
      bassFifth: 82.41, // E2
      padRoot: 55.0,
      padFifth: 82.41,
      padThird: 138.59, // C#3
      arpNotes: [220.0, 277.18, 329.63, 440.0, 554.37, 523.25, 440.0, 329.63],
      tensionBell: 830.61, // G#5/Ab5 -> eerie climax, or A5 = 880 / C#6
    };
  }

  private scheduleMusicalStep(
    ctx: AudioContext,
    step: number,
    time: number,
    stepSec: number
  ) {
    const floor = this.currentFloor;
    const tier = this.getMusicTier(floor);
    const barIndex = Math.floor(step / 16) % 4;
    const stepInBar = step % 16;
    const chord = this.getProgressionChord(barIndex, tier);

    // 1. Sync harmonic pad voices smoothly on every bar downbeat
    if (stepInBar === 0) {
      this.padOsc1?.frequency.setTargetAtTime(chord.padRoot, time, 0.28);
      this.padOsc2?.frequency.setTargetAtTime(chord.padFifth, time, 0.28);
      this.padOsc3?.frequency.setTargetAtTime(chord.padThird, time, 0.28);
    }

    // 2. Melodic Harp / Plucked Ostinato (progresses from sparse 8ths -> driving 16ths)
    const arpIdx = Math.floor(stepInBar / 2) % chord.arpNotes.length;
    if (tier === 1) {
      // Floors 1–4: Haunting, spacious medieval pluck
      if (stepInBar === 0 || stepInBar === 4 || stepInBar === 6 || stepInBar === 10 || stepInBar === 12) {
        const note = chord.arpNotes[arpIdx];
        this.scheduleHarpLute(ctx, note, time, stepSec * 4.5, 0.032);
      }
    } else if (tier === 2) {
      // Floors 5–9: Syncopated driving dark pluck locked to the beat
      if (stepInBar % 2 === 0 || stepInBar === 11 || stepInBar === 15) {
        const note =
          stepInBar % 2 === 0
            ? chord.arpNotes[arpIdx]
            : chord.arpNotes[(arpIdx + 2) % chord.arpNotes.length];
        const accent = stepInBar % 4 === 0 ? 0.038 : 0.025;
        this.scheduleHarpLute(ctx, note, time, stepSec * 3.0, accent);
      }
    } else {
      // Floors 10+: Urgent, hair-raising 16th-note ostinato arpeggio
      const note =
        stepInBar % 2 === 0
          ? chord.arpNotes[arpIdx]
          : chord.arpNotes[(arpIdx + 3) % chord.arpNotes.length];
      const accent = stepInBar % 4 === 0 ? 0.04 : stepInBar % 2 === 0 ? 0.028 : 0.018;
      this.scheduleHarpLute(ctx, note, time, stepSec * 2.1, accent);
    }

    // 3. Eerie Suspense Cathedral Chime / High Tension Harmonic
    if (stepInBar === 0 && (barIndex === 0 || barIndex === 2)) {
      this.scheduleBell(ctx, chord.tensionBell, time, 0.012 + tier * 0.002);
    }
    // Spine-tingling minor-second / leading-tone bell on Bar 4 turnaround (Floor 5+)
    if (tier >= 2 && barIndex === 3 && (stepInBar === 0 || stepInBar === 8)) {
      const eerieNote = stepInBar === 0 ? 554.37 : 659.25; // C#5 -> E5
      this.scheduleBell(ctx, eerieNote, time, 0.016 + tier * 0.002);
    }

    // 4. High Tension Tremolo String Swell on Bar 3 & Bar 4 (Floor 10+)
    if (tier >= 3 && (barIndex === 2 || barIndex === 3) && stepInBar === 0) {
      const highPitch = barIndex === 2 ? chord.tensionBell : 659.25; // E5 high suspense drone
      this.scheduleTensionString(
        ctx,
        highPitch,
        time,
        stepSec * 15.5,
        tier >= 4 ? 0.024 : 0.016
      );
    }

    // 5. Rolling Cello / Sub-Bass Ostinato
    if (tier === 1) {
      // Floors 1–4: Deep sustaining bass anchor
      if (stepInBar === 0) {
        this.scheduleCelloBass(ctx, chord.bassRoot, time, stepSec * 12, 0.055);
      }
      if (floor >= 3 && stepInBar === 8) {
        this.scheduleCelloBass(ctx, chord.bassFifth, time, stepSec * 6, 0.042);
      }
    } else if (tier === 2) {
      // Floors 5–9: Driving 8th-note head-nodding octave bassline
      if (stepInBar % 2 === 0) {
        const isDownbeat = stepInBar % 4 === 0;
        const bassFreq =
          stepInBar === 14
            ? chord.bassFifth
            : isDownbeat
            ? chord.bassRoot
            : chord.bassOctave;
        this.scheduleCelloBass(
          ctx,
          bassFreq,
          time,
          stepSec * 1.85,
          isDownbeat ? 0.072 : 0.045
        );
      }
    } else {
      // Floors 10+: Relentless dark cinematic bass pulse with syncopated pickups
      if (stepInBar % 2 === 0 || stepInBar === 7 || stepInBar === 15) {
        const isDownbeat = stepInBar % 4 === 0;
        const bassFreq =
          stepInBar === 15
            ? chord.bassFifth
            : isDownbeat
            ? chord.bassRoot
            : chord.bassOctave;
        this.scheduleCelloBass(
          ctx,
          bassFreq,
          time,
          stepSec * 1.5,
          isDownbeat ? 0.08 : 0.05
        );
      }
    }

    // 6. Percussion Groove: Kick, Snare Backbeat (2 & 4!), Ticking Hats & Tom Fills
    if (tier === 1) {
      // Floors 1–4: Minimal heartbeat pulse + subtle brushed pulse on Floor 3–4
      if (stepInBar === 0 || (floor >= 3 && stepInBar === 8)) {
        this.schedulePunchKick(ctx, time, stepInBar === 0 ? 0.065 : 0.045);
      }
      if (floor >= 3 && stepInBar % 4 === 2) {
        this.scheduleTensionHat(ctx, time, 0.015, false);
      }
    } else {
      // FLOOR 5+ (TIER 2–5): Head-nodding groove & building suspense!
      // Kick drum pattern (1, syncopated "and" of 2, 3, and Floor 10+ syncopated pickups)
      const isKick =
        stepInBar === 0 ||
        stepInBar === 6 ||
        stepInBar === 8 ||
        (tier >= 3 && (stepInBar === 10 || (barIndex % 2 === 1 && stepInBar === 14)));
      if (isKick) {
        const kickVol =
          stepInBar === 0 ? 0.115 : stepInBar === 8 ? 0.095 : 0.072;
        this.schedulePunchKick(ctx, time, kickVol);
      }

      // Crisp dark snare/rim backbeat on Beats 2 & 4 (steps 4 & 12) — THE head-nod pocket
      if (stepInBar === 4 || stepInBar === 12) {
        this.scheduleDarkSnare(ctx, time, 0.078 + tier * 0.008);
      }

      // Suspenseful Bar 4 turnaround tom/snare fill (steps 13, 14, 15 on bar 3 -> Floor 7+)
      if (floor >= 7 && barIndex === 3 && (stepInBar === 13 || stepInBar === 14 || stepInBar === 15)) {
        const tomPitch = stepInBar === 13 ? 130 : stepInBar === 14 ? 110 : 92;
        this.scheduleWarTom(ctx, time, tomPitch, 0.055 + (stepInBar - 12) * 0.01);
      }

      // Ticking clockwork hi-hat / shaker pulse
      if (tier === 2) {
        // Floors 5–9: 8th-note groove with offbeat lift
        if (stepInBar % 2 === 0) {
          const offbeat = stepInBar % 4 === 2;
          this.scheduleTensionHat(ctx, time, offbeat ? 0.032 : 0.016, offbeat);
        }
      } else {
        // Floors 10+: Taut 16th-note suspense pulse that raises hairs on your neck
        const offbeat = stepInBar % 4 === 2;
        const vol = offbeat ? 0.04 : stepInBar % 2 === 0 ? 0.022 : 0.013;
        this.scheduleTensionHat(ctx, time, vol, offbeat);
      }
    }
  }

  public stopMusic() {
    this.musicEnabled = false;
    this.stopAmbiance();
    if (this.musicTimerId !== null) {
      clearTimeout(this.musicTimerId);
      this.musicTimerId = null;
    }
    try {
      if (this.padGain && this.ctx) {
        this.padGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.3);
      }
      setTimeout(() => {
        try {
          this.padOsc1?.stop();
          this.padOsc2?.stop();
          this.padOsc3?.stop();
        } catch {
          // ignore
        }
        this.padOsc1 = null;
        this.padOsc2 = null;
        this.padOsc3 = null;
        this.padFilter = null;
        this.padGain = null;
      }, 340);
    } catch {
      this.padOsc1 = null;
      this.padOsc2 = null;
      this.padOsc3 = null;
      this.padFilter = null;
      this.padGain = null;
    }
  }

  private scheduleHarpLute(
    ctx: AudioContext,
    freq: number,
    time: number,
    duration: number,
    volume: number
  ) {
    try {
      const bus = this.ensureMusicBus(ctx);
      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      oscA.type = 'triangle';
      oscA.frequency.setValueAtTime(freq, time);

      oscB.type = 'sine';
      oscB.frequency.setValueAtTime(freq * 1.003, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2100, time);
      filter.frequency.exponentialRampToValueAtTime(360, time + duration);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0004, time + duration);
      gain.gain.linearRampToValueAtTime(0, time + duration + 0.015);

      oscA.connect(filter);
      oscB.connect(filter);
      filter.connect(gain);
      gain.connect(bus);

      oscA.start(time);
      oscB.start(time);
      oscA.stop(time + duration + 0.02);
      oscB.stop(time + duration + 0.02);
    } catch {
      // ignore
    }
  }

  private scheduleBell(
    ctx: AudioContext,
    freq: number,
    time: number,
    volume: number
  ) {
    try {
      const bus = this.ensureMusicBus(ctx);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.016);
      gain.gain.exponentialRampToValueAtTime(0.0004, time + 1.05);
      gain.gain.linearRampToValueAtTime(0, time + 1.1);
      osc.connect(gain);
      gain.connect(bus);
      osc.start(time);
      osc.stop(time + 1.12);
    } catch {
      // ignore
    }
  }

  private scheduleTensionString(
    ctx: AudioContext,
    freq: number,
    time: number,
    duration: number,
    volume: number
  ) {
    try {
      const bus = this.ensureMusicBus(ctx);
      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      oscA.type = 'sawtooth';
      oscA.frequency.setValueAtTime(freq, time);
      oscB.type = 'triangle';
      oscB.frequency.setValueAtTime(freq * 1.004, time);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * 1.5, time);
      filter.frequency.linearRampToValueAtTime(freq * 2.4, time + duration * 0.7);
      filter.Q.setValueAtTime(1.8, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(volume, time + duration * 0.45);
      gain.gain.exponentialRampToValueAtTime(0.0004, time + duration - 0.03);
      gain.gain.linearRampToValueAtTime(0, time + duration);

      oscA.connect(filter);
      oscB.connect(filter);
      filter.connect(gain);
      gain.connect(bus);

      oscA.start(time);
      oscB.start(time);
      oscA.stop(time + duration + 0.02);
      oscB.stop(time + duration + 0.02);
    } catch {
      // ignore
    }
  }

  private schedulePunchKick(ctx: AudioContext, time: number, volume: number) {
    try {
      const bus = this.ensureMusicBus(ctx);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(125, time);
      osc.frequency.exponentialRampToValueAtTime(42, time + 0.11);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0006, time + 0.17);
      gain.gain.linearRampToValueAtTime(0, time + 0.19);

      osc.connect(gain);
      gain.connect(bus);
      osc.start(time);
      osc.stop(time + 0.2);
    } catch {
      // ignore
    }
  }

  private scheduleDarkSnare(ctx: AudioContext, time: number, volume: number) {
    try {
      const bus = this.ensureMusicBus(ctx);

      // Filtered noise crack
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = this.getReusableNoiseBuffer(ctx);
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1450, time);
      noiseFilter.Q.setValueAtTime(1.1, time);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, time);
      noiseGain.gain.linearRampToValueAtTime(volume * 0.72, time + 0.004);
      noiseGain.gain.exponentialRampToValueAtTime(0.0004, time + 0.12);
      noiseGain.gain.linearRampToValueAtTime(0, time + 0.14);

      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(bus);
      noiseSrc.start(time, (this.stepIndex * 0.17) % 1.4, 0.15);

      // Woody rim/body thwack
      const bodyOsc = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      bodyOsc.type = 'triangle';
      bodyOsc.frequency.setValueAtTime(195, time);
      bodyOsc.frequency.exponentialRampToValueAtTime(105, time + 0.07);

      bodyGain.gain.setValueAtTime(0.0001, time);
      bodyGain.gain.linearRampToValueAtTime(volume * 0.65, time + 0.004);
      bodyGain.gain.exponentialRampToValueAtTime(0.0005, time + 0.075);
      bodyGain.gain.linearRampToValueAtTime(0, time + 0.09);

      bodyOsc.connect(bodyGain);
      bodyGain.connect(bus);
      bodyOsc.start(time);
      bodyOsc.stop(time + 0.1);
    } catch {
      // ignore
    }
  }

  private scheduleWarTom(
    ctx: AudioContext,
    time: number,
    startFreq: number,
    volume: number
  ) {
    try {
      const bus = this.ensureMusicBus(ctx);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(startFreq, time);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 0.52, time + 0.14);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0005, time + 0.15);
      gain.gain.linearRampToValueAtTime(0, time + 0.17);

      osc.connect(gain);
      gain.connect(bus);
      osc.start(time);
      osc.stop(time + 0.18);
    } catch {
      // ignore
    }
  }

  private scheduleTensionHat(
    ctx: AudioContext,
    time: number,
    volume: number,
    openAccent: boolean
  ) {
    try {
      const bus = this.ensureMusicBus(ctx);
      const src = ctx.createBufferSource();
      src.buffer = this.getReusableNoiseBuffer(ctx);

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(openAccent ? 4600 : 6200, time);

      const dur = openAccent ? 0.065 : 0.032;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0004, time + dur);
      gain.gain.linearRampToValueAtTime(0, time + dur + 0.006);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      src.start(time, (this.stepIndex * 0.23) % 1.5, dur + 0.01);
    } catch {
      // ignore
    }
  }

  private scheduleCelloBass(
    ctx: AudioContext,
    freq: number,
    time: number,
    duration: number,
    volume: number
  ) {
    try {
      const bus = this.ensureMusicBus(ctx);
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(340, time);
      filter.frequency.exponentialRampToValueAtTime(160, time + duration);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0005, time + duration);
      gain.gain.linearRampToValueAtTime(0, time + duration + 0.015);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      osc.start(time);
      osc.stop(time + duration + 0.02);
    } catch {
      // ignore
    }
  }

  private tone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delaySec = 0
  ) {
    if (this.sfxMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const start = ctx.currentTime + delaySec;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, start);
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(25, freqEnd),
        start + duration
      );

      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(this.getOutputNode(ctx));
      osc.start(start);
      osc.stop(start + duration);
    } catch {
      // ignore
    }
  }

  public playButtonClick() {
    this.tone(480, 260, 0.08, 'triangle', 0.09);
    this.tone(720, 540, 0.05, 'sine', 0.04, 0.02);
  }

  public playCardFlip() {
    if (this.sfxMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const bufferSize = Math.floor(ctx.sampleRate * 0.09);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + 0.08);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.getOutputNode(ctx));
      noise.start();
    } catch {
      this.tone(360, 540, 0.07, 'sine', 0.05);
    }
  }

  public playSwordSlash() {
    this.tone(620, 140, 0.14, 'sawtooth', 0.085);
    this.tone(180, 70, 0.16, 'triangle', 0.1, 0.04);
  }

  public playHeroHurt(damage = 1) {
    if (this.sfxMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const intensity = Math.min(1.4, 0.8 + damage * 0.06);
    try {
      const now = ctx.currentTime;

      const voice = ctx.createOscillator();
      const formant = ctx.createBiquadFilter();
      const voiceGain = ctx.createGain();
      voice.type = 'sawtooth';
      voice.frequency.setValueAtTime(168, now);
      voice.frequency.exponentialRampToValueAtTime(76, now + 0.19);

      formant.type = 'bandpass';
      formant.frequency.setValueAtTime(460, now);
      formant.frequency.exponentialRampToValueAtTime(240, now + 0.19);
      formant.Q.setValueAtTime(3.2, now);

      voiceGain.gain.setValueAtTime(0.001, now);
      voiceGain.gain.linearRampToValueAtTime(0.16 * intensity, now + 0.018);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.21);

      voice.connect(formant);
      formant.connect(voiceGain);
      voiceGain.connect(this.getOutputNode(ctx));
      voice.start(now);
      voice.stop(now + 0.22);

      this.tone(115, 42, 0.14, 'sine', 0.14 * intensity, 0);
    } catch {
      this.tone(150, 70, 0.18, 'triangle', 0.12);
    }
  }

  public playShieldBlock() {
    this.tone(380, 240, 0.12, 'square', 0.06);
    this.tone(560, 480, 0.1, 'triangle', 0.05, 0.03);
  }

  public playEquipGear() {
    this.tone(340, 520, 0.1, 'triangle', 0.075);
    this.tone(520, 680, 0.09, 'sine', 0.06, 0.05);
  }

  public playHealPotion() {
    this.tone(440, 660, 0.16, 'sine', 0.075);
    this.tone(554, 880, 0.18, 'sine', 0.06, 0.07);
  }

  public playCoinChime() {
    this.tone(880, 920, 0.09, 'sine', 0.07);
    this.tone(1174, 1318, 0.14, 'sine', 0.075, 0.06);
  }

  public playSpellCast() {
    this.tone(520, 980, 0.18, 'sine', 0.07);
    this.tone(780, 1180, 0.16, 'triangle', 0.05, 0.05);
  }

  public playBonusChime() {
    this.tone(587.33, 587.33, 0.1, 'triangle', 0.085, 0);
    this.tone(739.99, 739.99, 0.1, 'triangle', 0.085, 0.08);
    this.tone(880, 1174.66, 0.22, 'sine', 0.1, 0.16);
  }

  public playCashOut() {
    this.tone(523.25, 523.25, 0.11, 'triangle', 0.09, 0);
    this.tone(659.25, 659.25, 0.11, 'triangle', 0.09, 0.09);
    this.tone(783.99, 783.99, 0.12, 'triangle', 0.09, 0.18);
    this.tone(1046.5, 1046.5, 0.28, 'sine', 0.1, 0.27);
  }

  public playForgeAnvil() {
    this.tone(920, 680, 0.09, 'triangle', 0.085, 0);
    this.tone(1240, 980, 0.14, 'sine', 0.075, 0.09);
  }

  public playBossSpawn() {
    this.tone(146.83, 110.0, 0.36, 'sawtooth', 0.07, 0);
    this.tone(220.0, 164.81, 0.34, 'triangle', 0.08, 0.06);
    this.tone(293.66, 220.0, 0.38, 'sine', 0.075, 0.12);
  }

  public playHordeTick(urgent: boolean) {
    if (urgent) {
      this.tone(980, 720, 0.055, 'triangle', 0.085, 0);
    } else {
      this.tone(660, 520, 0.045, 'triangle', 0.055, 0);
    }
  }

  public playSpeedBonus(chain: number) {
    const pitchBoost = Math.min(4, Math.max(0, chain - 1)) * 75;
    this.tone(680 + pitchBoost, 960 + pitchBoost, 0.09, 'triangle', 0.08, 0);
    this.tone(1020 + pitchBoost, 1360 + pitchBoost, 0.12, 'sine', 0.075, 0.05);
  }

  public playHordeOverrun() {
    this.tone(180, 62, 0.32, 'sawtooth', 0.11, 0);
    this.tone(135, 48, 0.42, 'sawtooth', 0.12, 0.08);
    this.tone(240, 95, 0.28, 'triangle', 0.09, 0.16);
  }

  public playDefeat() {
    this.tone(240, 160, 0.2, 'sawtooth', 0.08, 0);
    this.tone(180, 95, 0.34, 'sawtooth', 0.09, 0.16);
  }
}

export const soundEngine = new SoundEngine();
