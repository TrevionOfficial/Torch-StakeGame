/**
 * Seamless, organic Web Audio API soundtrack & SFX engine for Torch.
 * Uses a single continuous swung 16th-note clock with warm analog-style saturation,
 * sampled-feel felt piano / Rhodes keys, deep 808 sub bass, layered hip-hop drums,
 * and progressive cinematic suspense across dungeon floors:
 * - Floors 1–2 (Starting / Post-Run): Moody 88 BPM dark felt piano, warm sub root & subtle rim pulse
 * - Floors 3–4: Muffled heartbeat kick, swung brushed hats & haunted upper piano echoes
 * - Floors 5–6: Full hip-hop groove drops in seamlessly (808 sub, boom-bap kick, 2 & 4 snare/clap, swung hats)
 * - Floors 7–9: Syncopated ghost snares, open-hat lifts & dark pizzicato counter-melody
 * - Floors 10–14 (Blood Sanctum): Phrygian Eb shift, tight trap hi-hat stutter rolls & bowed string swells
 * - Floors 15–20+ (Abyssal & Inferno): Relentless cinematic dark hip-hop climax & eerie high harmonics
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
  chordNotes: number[];
  arpNotes: number[];
  eerieTop: number;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicCompressor: DynamicsCompressorNode | null = null;
  private musicWarmFilter: BiquadFilterNode | null = null;
  private musicBusGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private masterVolume = 0.75;
  private sfxMuted = false;
  private musicEnabled = false;
  private musicTimerId: number | null = null;
  private heartbeatTimer: number | null = null;

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
  private currentBpm = 88;
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
    if (!this.musicBusGain || !this.musicCompressor || !this.musicWarmFilter) {
      // Gentle analog-style high-end roll-off so everything sounds warm & organic, never fizzy/synth-like
      const warmFilter = ctx.createBiquadFilter();
      warmFilter.type = 'lowpass';
      warmFilter.frequency.setValueAtTime(7200, ctx.currentTime);
      warmFilter.Q.setValueAtTime(0.5, ctx.currentTime);

      // Soft wave-shaper saturation for console/vinyl glue
      const shaper = ctx.createWaveShaper();
      const samples = 1024;
      const curve = new Float32Array(samples);
      for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        curve[i] = Math.tanh(x * 1.35) / Math.tanh(1.35);
      }
      shaper.curve = curve;
      shaper.oversample = '2x';

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-15, ctx.currentTime);
      compressor.knee.setValueAtTime(16, ctx.currentTime);
      compressor.ratio.setValueAtTime(3.5, ctx.currentTime);
      compressor.attack.setValueAtTime(0.008, ctx.currentTime);
      compressor.release.setValueAtTime(0.16, ctx.currentTime);

      const bus = ctx.createGain();
      bus.gain.setValueAtTime(0.96, ctx.currentTime);

      bus.connect(warmFilter);
      warmFilter.connect(shaper);
      shaper.connect(compressor);
      compressor.connect(this.getOutputNode(ctx));

      this.musicWarmFilter = warmFilter;
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
    if (floor >= 15) return 5;
    if (floor >= 10) return 4;
    if (floor >= 7) return 3;
    if (floor >= 5) return 2;
    if (floor >= 3) return 1;
    return 0;
  }

  private getTargetBpm(floor: number): number {
    // True hip-hop head-nod pocket (88 BPM calm -> 96 BPM intense climax)
    if (floor >= 20) return 97;
    if (floor >= 15) return 96;
    if (floor >= 10) return 94;
    if (floor >= 7) return 93;
    if (floor >= 5) return 92;
    if (floor >= 3) return 90;
    return 88;
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
      crypt: { freq: 185, q: 1.4, lfoRate: 0.12, lfoDepth: 55, gain: 0.014 },
      catacombs: { freq: 230, q: 1.6, lfoRate: 0.16, lfoDepth: 75, gain: 0.016 },
      blood_sanctum: { freq: 210, q: 2.0, lfoRate: 0.2, lfoDepth: 95, gain: 0.018 },
      abyssal_rift: { freq: 320, q: 2.4, lfoRate: 0.24, lfoDepth: 140, gain: 0.02 },
      inferno: { freq: 280, q: 1.5, lfoRate: 0.28, lfoDepth: 120, gain: 0.022 },
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

    // Gradually open the master warmth filter on deeper floors for brighter hi-hat/piano bite
    if (this.musicWarmFilter) {
      const tier = this.getMusicTier(this.currentFloor);
      const cutoff = 5400 + tier * 750;
      this.musicWarmFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.8);
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
      this.ensureMusicBus(ctx);
      this.musicEnabled = true;
      this.currentBpm = this.getTargetBpm(this.currentFloor);
      this.startAmbiance();

      this.nextStepTime = ctx.currentTime + 0.08;

      const scheduleLoop = () => {
        if (!this.musicEnabled || this.sfxMuted || !this.ctx) return;
        if (this.ctx.state !== 'running') {
          this.nextStepTime = this.ctx.currentTime + 0.08;
          this.musicTimerId = window.setTimeout(scheduleLoop, 90);
          return;
        }
        if (this.nextStepTime < this.ctx.currentTime - 0.35) {
          this.nextStepTime = this.ctx.currentTime + 0.05;
        }
        while (this.nextStepTime < this.ctx.currentTime + 0.18) {
          const targetBpm = this.getTargetBpm(this.currentFloor);
          this.currentBpm += (targetBpm - this.currentBpm) * 0.04;
          const sixteenthSec = 60 / this.currentBpm / 4;

          // Subtle human MPC hip-hop swing on odd 16th-note offbeats
          const swingOffset = this.stepIndex % 2 === 1 ? sixteenthSec * 0.16 : 0;

          this.scheduleMusicalStep(
            this.ctx,
            this.stepIndex,
            this.nextStepTime + swingOffset,
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
        const delayMs = 2800 + Math.random() * 3000;
        this.ambianceEventTimer = window.setTimeout(scheduleNextAccent, delayMs);
      };

      this.ambianceEventTimer = window.setTimeout(scheduleNextAccent, 1800);
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

        const vol = 0.014 * (1 - i * 0.22);
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
      gain.gain.linearRampToValueAtTime(0.016, now + duration * 0.4);
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
        gain.gain.linearRampToValueAtTime(intense ? 0.018 : 0.012, start + 0.004);
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
    // 4-Bar dark hip-hop / cinematic minor chord progression:
    // Bar 0: Dm9 -> Bar 1: Bbmaj7 -> Bar 2: Gm7 (F1-9) / EbMaj7 Phrygian (F10+) -> Bar 3: A7b9 turnaround
    if (barIndex === 0) {
      return {
        bassRoot: 73.42, // D2
        bassOctave: 146.83, // D3
        bassFifth: 110.0, // A2
        chordNotes: [146.83, 174.61, 220.0, 329.63], // D3, F3, A3, E4 (Dm9)
        arpNotes: [293.66, 349.23, 440.0, 587.33, 523.25, 440.0],
        eerieTop: 659.25, // E5
      };
    }
    if (barIndex === 1) {
      return {
        bassRoot: 58.27, // Bb1
        bassOctave: 116.54, // Bb2
        bassFifth: 87.31, // F2
        chordNotes: [116.54, 174.61, 220.0, 293.66], // Bb2, F3, A3, D4 (Bbmaj7)
        arpNotes: [233.08, 293.66, 349.23, 440.0, 466.16, 349.23],
        eerieTop: 587.33, // D5
      };
    }
    if (barIndex === 2) {
      if (tier >= 4) {
        // Phrygian Neapolitan EbMaj7 (dark, tense lift!)
        return {
          bassRoot: 77.78, // Eb2
          bassOctave: 155.56, // Eb3
          bassFifth: 116.54, // Bb2
          chordNotes: [155.56, 196.0, 233.08, 293.66], // Eb3, G3, Bb3, D4
          arpNotes: [311.13, 392.0, 466.16, 587.33, 622.25, 466.16],
          eerieTop: 622.25, // Eb5
        };
      }
      return {
        bassRoot: 49.0, // G1
        bassOctave: 98.0, // G2
        bassFifth: 73.42, // D2
        chordNotes: [146.83, 174.61, 196.0, 233.08], // D3, F3, G3, Bb3 (Gm7)
        arpNotes: [196.0, 233.08, 293.66, 349.23, 392.0, 293.66],
        eerieTop: 698.46, // F5
      };
    }
    // Bar 3: A7b9 dominant turnaround (Bb -> A and C# -> D pulls back to Dm)
    return {
      bassRoot: 55.0, // A1
      bassOctave: 110.0, // A2
      bassFifth: 82.41, // E2
      chordNotes: [138.59, 164.81, 220.0, 233.08], // C#3, E3, A3, Bb3
      arpNotes: [220.0, 277.18, 329.63, 440.0, 466.16, 554.37],
      eerieTop: 554.37, // C#5
    };
  }

  private scheduleMusicalStep(
    ctx: AudioContext,
    step: number,
    time: number,
    stepSec: number
  ) {
    const tier = this.getMusicTier(this.currentFloor);
    const barIndex = Math.floor(step / 16) % 4;
    const stepInBar = step % 16;
    const chord = this.getProgressionChord(barIndex, tier);

    // 1. DARK FELT PIANO / RHODES CHORDS (Warm organic foundation, zero buzz)
    if (stepInBar === 0) {
      this.scheduleFeltPianoChord(
        ctx,
        chord.chordNotes,
        time,
        tier >= 2 ? stepSec * 8.5 : stepSec * 12.5,
        tier >= 2 ? 0.036 : 0.032
      );
    }
    // Classic hip-hop chord chop anticipation on "and" of beat 3 (step 10) starting Tier 2+
    if (tier >= 2 && stepInBar === 10 && barIndex % 2 === 1) {
      this.scheduleFeltPianoChord(
        ctx,
        chord.chordNotes.slice(1),
        time,
        stepSec * 3.5,
        0.022
      );
    }

    // 2. HAUNTING SPARSE PIANO / PIZZICATO TOP NOTES (Builds suspense per floor)
    if (tier === 0) {
      // Starting / Post-run (Floor 1–2): Intimate, calm dark piano melody
      if (stepInBar === 4 || stepInBar === 10 || (barIndex === 3 && stepInBar === 14)) {
        const note = chord.arpNotes[(stepInBar + barIndex) % chord.arpNotes.length];
        this.scheduleFeltPianoNote(ctx, note, time, stepSec * 5.2, 0.03);
      }
    } else if (tier === 1) {
      // Floor 3–4: Haunted high piano echoes enter
      if (stepInBar === 3 || stepInBar === 6 || stepInBar === 12 || stepInBar === 14) {
        const note = chord.arpNotes[(stepInBar + barIndex) % chord.arpNotes.length];
        this.scheduleFeltPianoNote(ctx, note, time, stepSec * 4.0, 0.03);
      }
    } else {
      // Floor 5+: Dark plucked pizzicato & moody piano top notes locked to the pocket
      if (stepInBar === 3 || stepInBar === 7 || stepInBar === 11 || stepInBar === 14) {
        const note = chord.arpNotes[(Math.floor(stepInBar / 2) + barIndex) % chord.arpNotes.length];
        this.schedulePizzicato(ctx, note, time, stepSec * 2.2, 0.03 + tier * 0.002);
      }
      if (tier >= 3 && barIndex === 3 && (stepInBar === 8 || stepInBar === 12)) {
        // Spine-tingling minor-second / C# tension motif on turnaround
        const tenseNote = stepInBar === 8 ? 587.33 : 554.37; // D5 -> C#5
        this.scheduleFeltPianoNote(ctx, tenseNote, time, stepSec * 4.5, 0.034);
      }
    }

    // 3. WARM BOWED STRING SWELL & EERIE HARMONIC (Floor 7+ / Floor 10+ suspense)
    if (tier >= 3 && (barIndex === 1 || barIndex === 3) && stepInBar === 0) {
      this.scheduleWarmStringSwell(
        ctx,
        chord.eerieTop * 0.5,
        time,
        stepSec * 14,
        tier >= 4 ? 0.024 : 0.016
      );
    }
    if (tier >= 4 && (barIndex === 2 || barIndex === 3) && stepInBar === 8) {
      this.scheduleEerieHarmonic(ctx, chord.eerieTop, time, stepSec * 7.5, 0.016);
    }

    // 4. DEEP 808 / WARM SUB BASS (Clean round chest weight)
    if (tier <= 1) {
      // Floors 1–4: Subtle deep sub warmth on downbeats
      if (stepInBar === 0) {
        this.schedule808Sub(ctx, chord.bassRoot, time, stepSec * 9.5, 0.095);
      }
    } else {
      // Floors 5+: Syncopated hip-hop 808 sub locked strictly with the kick pattern
      const hit808 =
        stepInBar === 0 ||
        stepInBar === 6 ||
        stepInBar === 8 ||
        (tier >= 3 && stepInBar === 14 && barIndex % 2 === 1);
      if (hit808) {
        const pitch =
          stepInBar === 14
            ? chord.bassOctave
            : stepInBar === 6 && tier >= 4
            ? chord.bassFifth
            : chord.bassRoot;
        const dur = stepInBar === 0 ? stepSec * 5.2 : stepSec * 2.4;
        const vol = stepInBar === 0 ? 0.145 : 0.11;
        this.schedule808Sub(ctx, pitch, time, dur, vol);
      }
    }

    // 5. ORGANIC HIP-HOP DRUM GROOVE
    if (tier === 0) {
      // Floors 1–2 (Starting Music): Gentle rimshot heartbeat + soft atmospheric pulse
      if (stepInBar === 0) {
        this.scheduleHipHopKick(ctx, time, 0.06, true);
      }
      if (stepInBar === 4 || stepInBar === 12) {
        this.scheduleHipHopRim(ctx, time, 0.018);
      }
      if (stepInBar % 4 === 2) {
        this.scheduleHipHopHat(ctx, time, 0.008, false);
      }
    } else if (tier === 1) {
      // Floors 3–4 (Building tension): Muffled kick bounce + swung brushed hats + rim backbeat
      if (stepInBar === 0 || stepInBar === 6 || stepInBar === 8) {
        this.scheduleHipHopKick(ctx, time, stepInBar === 0 ? 0.085 : 0.055, true);
      }
      if (stepInBar === 4 || stepInBar === 12) {
        this.scheduleHipHopRim(ctx, time, 0.028);
      }
      if (stepInBar % 2 === 0) {
        const accent = stepInBar % 4 === 2;
        this.scheduleHipHopHat(ctx, time, accent ? 0.018 : 0.01, false);
      }
    } else {
      // FLOORS 5+: SEAMLESS HEAD-NODDING HIP-HOP BEAT!
      // Kick groove: Boom on 1 (0), bounce on 'and' of 2 (6), punch on 3 (8), pickup on 14/15
      const isMainKick = stepInBar === 0 || stepInBar === 6 || stepInBar === 8;
      const isBounceKick =
        (tier >= 3 && stepInBar === 14 && barIndex % 2 === 1) ||
        (tier >= 4 && stepInBar === 10 && barIndex === 2) ||
        (tier >= 5 && stepInBar === 3);

      if (isMainKick || isBounceKick) {
        const kickVol =
          stepInBar === 0
            ? 0.165
            : stepInBar === 8
            ? 0.135
            : isBounceKick
            ? 0.095
            : 0.115;
        this.scheduleHipHopKick(ctx, time, kickVol, false);
      }

      // Crisp layered Snare + Pre-Clap on Beats 2 & 4 (steps 4 & 12)
      if (stepInBar === 4 || stepInBar === 12) {
        this.scheduleHipHopSnare(ctx, time, 0.085 + tier * 0.006);
      }
      // Subtle ghost snare / rim bounce on Floors 7+
      if (tier >= 3 && (stepInBar === 7 || (barIndex % 2 === 1 && stepInBar === 15))) {
        this.scheduleHipHopRim(ctx, time, 0.024);
      }

      // Swung Hi-Hats + Open-Hat Lifts + Trap Stutter Rolls on deep floors
      if (tier === 2) {
        // Floors 5–6: Clean swinging 8th-note boom-bap hats with open-hat lift on 14
        if (stepInBar % 2 === 0) {
          const isOpen = barIndex % 2 === 1 && stepInBar === 14;
          const accent = stepInBar % 4 === 2;
          this.scheduleHipHopHat(ctx, time, accent ? 0.032 : 0.018, isOpen);
        }
      } else {
        // Floors 7+: 16th-note swung hi-hat pocket
        const isOpen = barIndex % 2 === 1 && stepInBar === 14;
        const accent = stepInBar % 4 === 2;
        const vol = isOpen
          ? 0.036
          : accent
          ? 0.03
          : stepInBar % 2 === 0
          ? 0.018
          : 0.011;
        this.scheduleHipHopHat(ctx, time, vol, isOpen);

        // Iconic hip-hop / trap double & triplet hi-hat stutter rolls on Floors 10+
        if (tier >= 4 && ((barIndex === 1 && stepInBar === 11) || (barIndex === 3 && stepInBar === 15))) {
          const subdivisions = tier >= 5 ? 3 : 2;
          for (let sub = 1; sub < subdivisions; sub++) {
            this.scheduleHipHopHat(
              ctx,
              time + (stepSec / subdivisions) * sub,
              0.016,
              false
            );
          }
        }
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
  }

  private scheduleFeltPianoNote(
    ctx: AudioContext,
    freq: number,
    time: number,
    duration: number,
    volume: number
  ) {
    try {
      const bus = this.ensureMusicBus(ctx);
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      // Warm electric/felt piano body: pure fundamental + soft 2nd harmonic
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, time);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.001, time);

      const harmGain = ctx.createGain();
      harmGain.gain.setValueAtTime(0.28, time);
      harmGain.gain.exponentialRampToValueAtTime(0.04, time + duration * 0.45);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1550, time);
      filter.frequency.exponentialRampToValueAtTime(340, time + duration);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.009);
      gain.gain.exponentialRampToValueAtTime(0.0004, time + duration);
      gain.gain.linearRampToValueAtTime(0, time + duration + 0.015);

      osc1.connect(filter);
      osc2.connect(harmGain);
      harmGain.connect(filter);
      filter.connect(gain);
      gain.connect(bus);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + duration + 0.02);
      osc2.stop(time + duration + 0.02);
    } catch {
      // ignore
    }
  }

  private scheduleFeltPianoChord(
    ctx: AudioContext,
    notes: number[],
    time: number,
    duration: number,
    volume: number
  ) {
    // Micro-strummed 10ms chord voicing so it sounds played by human hands on keys
    const perNoteVol = volume / Math.sqrt(Math.max(1, notes.length));
    notes.forEach((freq, idx) => {
      this.scheduleFeltPianoNote(
        ctx,
        freq,
        time + idx * 0.012,
        duration,
        perNoteVol * (idx === 0 ? 1.08 : 0.92)
      );
    });
  }

  private schedulePizzicato(
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

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, time);
      filter.frequency.exponentialRampToValueAtTime(280, time + duration);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0004, time + duration);
      gain.gain.linearRampToValueAtTime(0, time + duration + 0.01);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      osc.start(time);
      osc.stop(time + duration + 0.015);
    } catch {
      // ignore
    }
  }

  private scheduleWarmStringSwell(
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

      // Gentle detuned warm triangles (no buzzy sawtooth) filtered softly like muted cellos/violas
      oscA.type = 'triangle';
      oscA.frequency.setValueAtTime(freq, time);
      oscB.type = 'sine';
      oscB.frequency.setValueAtTime(freq * 1.0035, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(520, time);
      filter.frequency.linearRampToValueAtTime(880, time + duration * 0.65);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(volume, time + duration * 0.45);
      gain.gain.exponentialRampToValueAtTime(0.0004, time + duration - 0.04);
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

  private scheduleEerieHarmonic(
    ctx: AudioContext,
    freq: number,
    time: number,
    duration: number,
    volume: number
  ) {
    try {
      const bus = this.ensureMusicBus(ctx);
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(4.5, time);
      lfoGain.gain.setValueAtTime(2.5, time);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(volume, time + duration * 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0004, time + duration - 0.03);
      gain.gain.linearRampToValueAtTime(0, time + duration);

      osc.connect(gain);
      gain.connect(bus);

      osc.start(time);
      lfo.start(time);
      osc.stop(time + duration + 0.02);
      lfo.stop(time + duration + 0.02);
    } catch {
      // ignore
    }
  }

  private schedule808Sub(
    ctx: AudioContext,
    freq: number,
    time: number,
    duration: number,
    volume: number
  ) {
    try {
      const bus = this.ensureMusicBus(ctx);
      const subOsc = ctx.createOscillator();
      const bodyOsc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      // Clean chest-thumping sine sub + subtle warm 2nd harmonic under 170Hz
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq * 1.4, time);
      subOsc.frequency.exponentialRampToValueAtTime(freq, time + 0.03);

      bodyOsc.type = 'triangle';
      bodyOsc.frequency.setValueAtTime(freq, time);

      const bodyGain = ctx.createGain();
      bodyGain.gain.setValueAtTime(0.24, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(175, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0006, time + duration);
      gain.gain.linearRampToValueAtTime(0, time + duration + 0.02);

      subOsc.connect(filter);
      bodyOsc.connect(bodyGain);
      bodyGain.connect(filter);
      filter.connect(gain);
      gain.connect(bus);

      subOsc.start(time);
      bodyOsc.start(time);
      subOsc.stop(time + duration + 0.025);
      bodyOsc.stop(time + duration + 0.025);
    } catch {
      // ignore
    }
  }

  private scheduleHipHopKick(
    ctx: AudioContext,
    time: number,
    volume: number,
    soft: boolean
  ) {
    try {
      const bus = this.ensureMusicBus(ctx);

      // Sub punch body
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(soft ? 96 : 122, time);
      osc.frequency.exponentialRampToValueAtTime(43, time + 0.095);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0005, time + 0.16);
      gain.gain.linearRampToValueAtTime(0, time + 0.18);

      osc.connect(gain);
      gain.connect(bus);
      osc.start(time);
      osc.stop(time + 0.19);

      // Tight acoustic beater transient so kick cuts cleanly through mobile speakers
      if (!soft) {
        const clickSrc = ctx.createBufferSource();
        clickSrc.buffer = this.getReusableNoiseBuffer(ctx);
        const clickFilter = ctx.createBiquadFilter();
        clickFilter.type = 'bandpass';
        clickFilter.frequency.setValueAtTime(950, time);
        clickFilter.Q.setValueAtTime(1.4, time);

        const clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(0.0001, time);
        clickGain.gain.linearRampToValueAtTime(volume * 0.28, time + 0.002);
        clickGain.gain.exponentialRampToValueAtTime(0.0004, time + 0.018);
        clickGain.gain.linearRampToValueAtTime(0, time + 0.022);

        clickSrc.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(bus);
        clickSrc.start(time, (this.stepIndex * 0.11) % 1.3, 0.025);
      }
    } catch {
      // ignore
    }
  }

  private scheduleHipHopSnare(ctx: AudioContext, time: number, volume: number) {
    try {
      const bus = this.ensureMusicBus(ctx);
      const noiseBuf = this.getReusableNoiseBuffer(ctx);

      // Micro pre-clap flam (-8ms offset clamped to currentTime) for live studio snap
      const preTime = Math.max(ctx.currentTime + 0.001, time - 0.008);
      const preSrc = ctx.createBufferSource();
      preSrc.buffer = noiseBuf;
      const preFilter = ctx.createBiquadFilter();
      preFilter.type = 'bandpass';
      preFilter.frequency.setValueAtTime(1650, preTime);
      preFilter.Q.setValueAtTime(1.2, preTime);
      const preGain = ctx.createGain();
      preGain.gain.setValueAtTime(0.0001, preTime);
      preGain.gain.linearRampToValueAtTime(volume * 0.36, preTime + 0.003);
      preGain.gain.exponentialRampToValueAtTime(0.0004, preTime + 0.028);
      preGain.gain.linearRampToValueAtTime(0, preTime + 0.032);
      preSrc.connect(preFilter);
      preFilter.connect(preGain);
      preGain.connect(bus);
      preSrc.start(preTime, 0.3, 0.035);

      // Main crisp snare wire + clap tail
      const wireSrc = ctx.createBufferSource();
      wireSrc.buffer = noiseBuf;
      const wireFilter = ctx.createBiquadFilter();
      wireFilter.type = 'bandpass';
      wireFilter.frequency.setValueAtTime(2150, time);
      wireFilter.Q.setValueAtTime(0.95, time);

      const wireGain = ctx.createGain();
      wireGain.gain.setValueAtTime(0.0001, time);
      wireGain.gain.linearRampToValueAtTime(volume * 0.72, time + 0.004);
      wireGain.gain.exponentialRampToValueAtTime(0.0004, time + 0.13);
      wireGain.gain.linearRampToValueAtTime(0, time + 0.145);

      wireSrc.connect(wireFilter);
      wireFilter.connect(wireGain);
      wireGain.connect(bus);
      wireSrc.start(time, (this.stepIndex * 0.19) % 1.4, 0.155);

      // Warm woody drum shell thud
      const bodyOsc = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      bodyOsc.type = 'triangle';
      bodyOsc.frequency.setValueAtTime(192, time);
      bodyOsc.frequency.exponentialRampToValueAtTime(122, time + 0.065);

      bodyGain.gain.setValueAtTime(0.0001, time);
      bodyGain.gain.linearRampToValueAtTime(volume * 0.62, time + 0.003);
      bodyGain.gain.exponentialRampToValueAtTime(0.0004, time + 0.075);
      bodyGain.gain.linearRampToValueAtTime(0, time + 0.09);

      bodyOsc.connect(bodyGain);
      bodyGain.connect(bus);
      bodyOsc.start(time);
      bodyOsc.stop(time + 0.095);
    } catch {
      // ignore
    }
  }

  private scheduleHipHopRim(ctx: AudioContext, time: number, volume: number) {
    try {
      const bus = this.ensureMusicBus(ctx);
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(840, time);
      osc.frequency.exponentialRampToValueAtTime(490, time + 0.018);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, time);
      filter.Q.setValueAtTime(1.8, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0004, time + 0.028);
      gain.gain.linearRampToValueAtTime(0, time + 0.034);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      osc.start(time);
      osc.stop(time + 0.038);
    } catch {
      // ignore
    }
  }

  private scheduleHipHopHat(
    ctx: AudioContext,
    time: number,
    volume: number,
    open: boolean
  ) {
    try {
      const bus = this.ensureMusicBus(ctx);
      const src = ctx.createBufferSource();
      src.buffer = this.getReusableNoiseBuffer(ctx);

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(open ? 7400 : 8400, time);
      bp.Q.setValueAtTime(open ? 0.9 : 1.3, time);

      const dur = open ? 0.115 : 0.028;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0004, time + dur);
      gain.gain.linearRampToValueAtTime(0, time + dur + 0.006);

      src.connect(bp);
      bp.connect(gain);
      gain.connect(bus);
      src.start(time, (this.stepIndex * 0.27) % 1.4, dur + 0.01);
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
