/**
 * Seamless, lush multi-layered Web Audio API synthesizer for Torch.
 * Uses a single continuous musical clock (zero abrupt restarts on floor transitions)
 * and smooth harmonic/rhythmic evolution across dungeon tiers:
 * - Floors 1–4: Warm D-Dorian medieval harp & lush detuned pad (calm & immersive)
 * - Floors 5–9: Adds soft frame-drum pulse & richer minor-9th chords
 * - Floors 10–14 (Blood Sanctum): Adds warm cello bassline & Phrygian colors
 * - Floors 15–19 (Abyssal Rift): Adds ethereal bells & driving rhythmic pulse
 * - Floors 20+ (Dragon's Inferno): Full heroic climax with sweeping arpeggios & drums
 */

export type BiomeAmbianceId =
  | 'crypt'
  | 'catacombs'
  | 'blood_sanctum'
  | 'abyssal_rift'
  | 'inferno';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterVolume = 0.75;
  private sfxMuted = false;
  private musicEnabled = false;
  private musicRafId: number | null = null;
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
      crypt: { freq: 185, q: 1.4, lfoRate: 0.12, lfoDepth: 55, gain: 0.022 },
      catacombs: { freq: 240, q: 1.8, lfoRate: 0.16, lfoDepth: 85, gain: 0.026 },
      blood_sanctum: { freq: 210, q: 2.2, lfoRate: 0.2, lfoDepth: 110, gain: 0.03 },
      abyssal_rift: { freq: 360, q: 3.1, lfoRate: 0.26, lfoDepth: 190, gain: 0.034 },
      inferno: { freq: 295, q: 1.6, lfoRate: 0.3, lfoDepth: 150, gain: 0.036 },
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
    // Smoothly glide pad filter & harmonic third without breaking the groove
    if (this.padFilter) {
      const cutoff = 280 + tier * 75;
      this.padFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 1.2);
    }
    if (this.padOsc3) {
      // Shift from warm D3/F3 natural minor to richer tension colors on high floors
      const harmonyFreq =
        tier >= 4 ? 155.56 : tier >= 3 ? 138.59 : 174.61; // Eb3 / C#3 / F3
      this.padOsc3.frequency.setTargetAtTime(harmonyFreq, this.ctx.currentTime, 1.4);
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
      // Warm orchestral string/pad drone (no harsh sawtooth buzz)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(340, ctx.currentTime);
      filter.Q.setValueAtTime(0.8, ctx.currentTime);

      const pGain = ctx.createGain();
      pGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      pGain.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 1.8);

      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(73.42, ctx.currentTime); // D2 sub warmth

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(110.0, ctx.currentTime); // A2 fifth

      const osc3 = ctx.createOscillator();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(174.61, ctx.currentTime); // F3 minor third

      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(filter);
      filter.connect(pGain);
      pGain.connect(this.getOutputNode(ctx));

      osc1.start();
      osc2.start();
      osc3.start();

      this.padOsc1 = osc1;
      this.padOsc2 = osc2;
      this.padOsc3 = osc3;
      this.padFilter = filter;
      this.padGain = pGain;
      this.musicEnabled = true;
      this.startAmbiance();

      this.nextStepTime = ctx.currentTime + 0.1;

      // Seamless lookahead Web Audio scheduler (waits cleanly while suspended)
      const scheduleLoop = () => {
        if (!this.musicEnabled || this.sfxMuted || !this.ctx) return;
        if (this.ctx.state !== 'running') {
          this.nextStepTime = this.ctx.currentTime + 0.08;
          this.musicRafId = window.setTimeout(scheduleLoop, 120);
          return;
        }
        if (this.nextStepTime < this.ctx.currentTime - 0.5) {
          this.nextStepTime = this.ctx.currentTime + 0.05;
        }
        while (this.nextStepTime < this.ctx.currentTime + 0.25) {
          this.scheduleMusicalStep(this.ctx, this.stepIndex, this.nextStepTime);
          const tier = this.getMusicTier(this.currentFloor);
          const stepSec =
            tier === 1
              ? 0.52
              : tier === 2
              ? 0.46
              : tier === 3
              ? 0.4
              : tier === 4
              ? 0.35
              : 0.3;
          this.nextStepTime += stepSec;
          this.stepIndex = (this.stepIndex + 1) % 32;
        }
        this.musicRafId = window.setTimeout(scheduleLoop, 80);
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
      // Generate 3s looping pink-tinted cavern air buffer
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
        const delayMs = 2100 + Math.random() * 2500;
        this.ambianceEventTimer = window.setTimeout(scheduleNextAccent, delayMs);
      };

      this.ambianceEventTimer = window.setTimeout(scheduleNextAccent, 1300);
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
    if (biome === 'crypt') {
      if (roll < 0.55) {
        this.scheduleTorchEmberCrackle(ctx);
      } else if (roll < 0.85) {
        this.scheduleDistantChain(ctx);
      } else {
        this.scheduleHowlingWindGust(ctx, 160, 310);
      }
    } else if (biome === 'catacombs') {
      if (roll < 0.55) {
        this.scheduleTorchEmberCrackle(ctx);
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
      if (roll < 0.7) {
        this.scheduleHowlingWindGust(ctx, 280, 660);
      } else {
        this.scheduleDistantChain(ctx);
      }
    } else {
      // Inferno: blazing wind & crackling fire embers
      if (roll < 0.6) {
        this.scheduleTorchEmberCrackle(ctx, true);
      } else {
        this.scheduleHowlingWindGust(ctx, 190, 480);
      }
    }
  }

  private scheduleDistantChain(ctx: AudioContext) {
    try {
      const now = ctx.currentTime;
      const clinks = 3 + Math.floor(Math.random() * 2);
      for (let i = 0; i < clinks; i++) {
        const start = now + i * (0.09 + Math.random() * 0.06);
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        const f1 = 420 + Math.random() * 140;
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(f1, start);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(f1 * 1.63, start);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1050, start);
        filter.Q.setValueAtTime(2.6, start);

        const vol = 0.022 * (1 - i * 0.18);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(vol, start + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0004, start + 0.16);

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
      const duration = 2.1;
      const len = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const src = ctx.createBufferSource();
      src.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(4.2, now);
      filter.frequency.setValueAtTime(lowFreq, now);
      filter.frequency.exponentialRampToValueAtTime(peakFreq, now + duration * 0.45);
      filter.frequency.exponentialRampToValueAtTime(lowFreq * 0.85, now + duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.026, now + duration * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0004, now + duration);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.getOutputNode(ctx));
      src.start(now);
      src.stop(now + duration + 0.05);
    } catch {
      // ignore
    }
  }

  private scheduleTorchEmberCrackle(ctx: AudioContext, intense = false) {
    try {
      const now = ctx.currentTime;
      const pops = intense ? 4 : 2;
      for (let i = 0; i < pops; i++) {
        const start = now + i * (0.08 + Math.random() * 0.14);
        const len = Math.floor(ctx.sampleRate * 0.03);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let j = 0; j < len; j++) {
          d[j] = (Math.random() * 2 - 1) * (1 - j / len);
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1600 + Math.random() * 1400, start);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(intense ? 0.025 : 0.018, start);
        gain.gain.exponentialRampToValueAtTime(0.0005, start + 0.03);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.getOutputNode(ctx));
        src.start(start);
        src.stop(start + 0.035);
      }
    } catch {
      // ignore
    }
  }

  private scheduleMusicalStep(
    ctx: AudioContext,
    step: number,
    time: number
  ) {
    const tier = this.getMusicTier(this.currentFloor);

    // 32-step flowing medieval phrasing (2 bars of 16, calm -> lyrical -> epic)
    const calmPhrase = [
      293.66, 0, 349.23, 440.0, 523.25, 0, 440.0, 392.0,
      349.23, 0, 329.63, 293.66, 261.63, 0, 293.66, 0,
      293.66, 0, 392.0, 440.0, 587.33, 0, 523.25, 440.0,
      392.0, 0, 349.23, 329.63, 293.66, 0, 220.0, 0,
    ];

    const sanctumPhrase = [
      293.66, 349.23, 440.0, 0, 466.16, 440.0, 349.23, 329.63,
      293.66, 0, 311.13, 349.23, 392.0, 349.23, 311.13, 293.66,
      293.66, 349.23, 440.0, 523.25, 587.33, 523.25, 466.16, 440.0,
      392.0, 349.23, 329.63, 293.66, 277.18, 293.66, 329.63, 0,
    ];

    const climaxPhrase = [
      293.66, 440.0, 587.33, 440.0, 523.25, 440.0, 466.16, 440.0,
      392.0, 466.16, 587.33, 466.16, 554.37, 440.0, 349.23, 329.63,
      293.66, 440.0, 587.33, 698.46, 659.25, 587.33, 523.25, 440.0,
      466.16, 440.0, 392.0, 349.23, 329.63, 277.18, 293.66, 440.0,
    ];

    const phrase =
      tier <= 2 ? calmPhrase : tier <= 3 ? sanctumPhrase : climaxPhrase;
    const note = phrase[step % 32];

    if (note > 0) {
      this.scheduleHarpLute(
        ctx,
        note,
        time,
        tier >= 4 ? 0.55 : 0.85,
        0.032
      );
    }

    // Soft cathedral chime every 8 steps
    if (step % 8 === 0) {
      const bellNote = step % 16 === 0 ? 587.33 : 880.0;
      this.scheduleBell(ctx, bellNote, time, 0.014);
    }

    // Gentle frame drum starting Floor 5+ (tier 2+)
    if (tier >= 2 && step % 4 === 0) {
      this.scheduleWarDrum(ctx, time, step % 8 === 0 ? 0.055 : 0.036);
    }

    // Extra climax rhythmic pulse on Floor 10+ (tier 3+)
    if (tier >= 3 && step % 4 === 2) {
      this.scheduleCelloBass(
        ctx,
        step < 16 ? 73.42 : step < 24 ? 87.31 : 82.41,
        time,
        0.35,
        0.042
      );
    }

    // Floor 15+ & 20+ driving double-pulse drum
    if (tier >= 4 && step % 2 === 1) {
      this.scheduleWarDrum(ctx, time, 0.028);
    }
  }

  public stopMusic() {
    this.musicEnabled = false;
    this.stopAmbiance();
    if (this.musicRafId !== null) {
      clearTimeout(this.musicRafId);
      this.musicRafId = null;
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
      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      oscA.type = 'triangle';
      oscA.frequency.setValueAtTime(freq, time);

      // Subtle chorus detune for rich acoustic warmth
      oscB.type = 'sine';
      oscB.frequency.setValueAtTime(freq * 1.003, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, time);
      filter.frequency.exponentialRampToValueAtTime(380, time + duration);

      // Smooth 18ms attack avoids clicks completely
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0005, time + duration);

      oscA.connect(filter);
      oscB.connect(filter);
      filter.connect(gain);
      gain.connect(this.getOutputNode(ctx));

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
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0004, time + 1.1);
      osc.connect(gain);
      gain.connect(this.getOutputNode(ctx));
      osc.start(time);
      osc.stop(time + 1.15);
    } catch {
      // ignore
    }
  }

  private scheduleWarDrum(ctx: AudioContext, time: number, volume: number) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(92, time);
      osc.frequency.exponentialRampToValueAtTime(36, time + 0.16);
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0008, time + 0.18);
      osc.connect(gain);
      gain.connect(this.getOutputNode(ctx));
      osc.start(time);
      osc.stop(time + 0.2);
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
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, time);
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0008, time + duration);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.getOutputNode(ctx));
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

      // Vocal formant-filtered grunt drop (throaty "ugh!")
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

      // Heavy chest thud
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
