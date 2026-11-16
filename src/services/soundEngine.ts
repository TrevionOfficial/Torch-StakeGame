/**
 * Immersive Dark-Fantasy & Organic Hip-Hop Web Audio Engine for Torch.
 *
 * Audio Architecture:
 * - Procedural Stereo Cavern Convolution Reverb (ConvolverNode) + Dotted-8th Stereo Delay
 *   so keys, choir pads, harp plucks, and drums breathe inside an atmospheric stone crypt.
 * - Console-style Warm Saturation + Gentle Analog Low-Pass + Master Compressor (zero harsh synth buzz).
 * - Seamless 8-Bar (128-step) Swung 16th-Note Clock with human micro-velocity & bar-7 suspense breath:
 *   - Title / Floors 1–2 (Calm / Post-Run): Reverb-soaked felt piano + lush cathedral pad + warm vinyl dust & chime echoes
 *   - Floors 3–4 (Tension Building): Distant heartbeat kick, brushed shakers, rim echoes & haunting high choir notes
 *   - Floors 5–6 (Full Groove Drop): Deep chest-thumping 808 sub w/ glides, boom-bap kick, reverb snare/pre-clap & swung hats
 *   - Floors 7–9 (Rising Stakes): Syncopated ghost percussion, dark harp counter-melody & urgent chord stabs
 *   - Floors 10–14 (Blood Sanctum): Phrygian Eb shift, trap hi-hat stutter rolls & bowed cello/choir swells
 *   - Floors 15+ (Abyssal & Inferno): Relentless cinematic climax + eerie harmonics & heavy 808 turnaround drops
 */

export type BiomeAmbianceId =
  | 'crypt'
  | 'catacombs'
  | 'blood_sanctum'
  | 'abyssal_rift'
  | 'inferno';

interface BarChord {
  bassRoot: number;
  bassGlideTarget: number;
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
  private reverbNode: ConvolverNode | null = null;
  private reverbSendGain: GainNode | null = null;
  private echoDelayL: DelayNode | null = null;
  private echoDelayR: DelayNode | null = null;
  private echoSendGain: GainNode | null = null;
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

  private createCavernImpulseResponse(ctx: AudioContext): AudioBuffer {
    // 1.35s stereo dark stone tail with rapid natural damping so grooves stay clean
    const durationSec = 1.35;
    const length = Math.floor(ctx.sampleRate * durationSec);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < length; i++) {
        const t = i / length;
        // Pre-delay ~16ms so dry transients punch cleanly before the cavern bloom
        if (i < ctx.sampleRate * 0.016) {
          data[i] = 0;
          continue;
        }
        const env = Math.pow(1 - t, 3.1);
        const white = Math.random() * 2 - 1;
        const damp = 0.12 + (1 - t) * 0.2;
        lp = lp + damp * (white - lp);
        data[i] = lp * env * 0.85;
      }
    }
    return impulse;
  }

  private ensureMusicBus(ctx: AudioContext): AudioNode {
    if (!this.musicBusGain || !this.musicCompressor || !this.musicWarmFilter) {
      const warmFilter = ctx.createBiquadFilter();
      warmFilter.type = 'lowpass';
      warmFilter.frequency.setValueAtTime(6400, ctx.currentTime);
      warmFilter.Q.setValueAtTime(0.42, ctx.currentTime);

      // Gentle console saturation curve
      const shaper = ctx.createWaveShaper();
      const samples = 1024;
      const curve = new Float32Array(samples);
      for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        curve[i] = Math.tanh(x * 1.22) / Math.tanh(1.22);
      }
      shaper.curve = curve;
      shaper.oversample = '2x';

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-16, ctx.currentTime);
      compressor.knee.setValueAtTime(18, ctx.currentTime);
      compressor.ratio.setValueAtTime(3.0, ctx.currentTime);
      compressor.attack.setValueAtTime(0.01, ctx.currentTime);
      compressor.release.setValueAtTime(0.18, ctx.currentTime);

      const bus = ctx.createGain();
      bus.gain.setValueAtTime(0.88, ctx.currentTime);

      bus.connect(warmFilter);
      warmFilter.connect(shaper);
      shaper.connect(compressor);
      compressor.connect(this.getOutputNode(ctx));

      // Subtle Stereo Cavern Reverb Send
      const reverb = ctx.createConvolver();
      reverb.buffer = this.createCavernImpulseResponse(ctx);
      const reverbFilter = ctx.createBiquadFilter();
      reverbFilter.type = 'lowpass';
      reverbFilter.frequency.setValueAtTime(2200, ctx.currentTime);
      const reverbReturn = ctx.createGain();
      reverbReturn.gain.setValueAtTime(0.22, ctx.currentTime);
      const reverbSend = ctx.createGain();
      reverbSend.gain.setValueAtTime(1.0, ctx.currentTime);

      reverbSend.connect(reverb);
      reverb.connect(reverbFilter);
      reverbFilter.connect(reverbReturn);
      reverbReturn.connect(compressor);

      // Light Dotted-8th Stereo Echo Send (sparse melodic tails only)
      const echoSend = ctx.createGain();
      echoSend.gain.setValueAtTime(0.13, ctx.currentTime);
      const delayL = ctx.createDelay(1.0);
      const delayR = ctx.createDelay(1.0);
      delayL.delayTime.setValueAtTime(0.255, ctx.currentTime);
      delayR.delayTime.setValueAtTime(0.382, ctx.currentTime);

      const echoFbL = ctx.createGain();
      const echoFbR = ctx.createGain();
      echoFbL.gain.setValueAtTime(0.15, ctx.currentTime);
      echoFbR.gain.setValueAtTime(0.12, ctx.currentTime);

      const echoFilter = ctx.createBiquadFilter();
      echoFilter.type = 'lowpass';
      echoFilter.frequency.setValueAtTime(1650, ctx.currentTime);

      const merger = ctx.createChannelMerger(2);
      const echoReturn = ctx.createGain();
      echoReturn.gain.setValueAtTime(0.45, ctx.currentTime);

      echoSend.connect(delayL);
      echoSend.connect(delayR);
      delayL.connect(echoFbL);
      echoFbL.connect(delayR);
      delayR.connect(echoFbR);
      echoFbR.connect(delayL);
      delayL.connect(merger, 0, 0);
      delayR.connect(merger, 0, 1);
      merger.connect(echoFilter);
      echoFilter.connect(echoReturn);
      echoReturn.connect(reverbSend);
      echoReturn.connect(compressor);

      this.musicWarmFilter = warmFilter;
      this.musicCompressor = compressor;
      this.musicBusGain = bus;
      this.reverbNode = reverb;
      this.reverbSendGain = reverbSend;
      this.echoDelayL = delayL;
      this.echoDelayR = delayR;
      this.echoSendGain = echoSend;
    }
    return this.musicBusGain;
  }

  private duckMusic(dipLevel = 0.54, holdSec = 0.16) {
    if (!this.ctx || !this.musicBusGain || !this.musicEnabled || this.sfxMuted) {
      return;
    }
    const now = this.ctx.currentTime;
    const g = this.musicBusGain.gain;
    g.cancelScheduledValues(now);
    g.setTargetAtTime(dipLevel, now, 0.015);
    g.setTargetAtTime(0.88, now + holdSec, 0.22);
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
      crypt: { freq: 155, q: 1.2, lfoRate: 0.09, lfoDepth: 35, gain: 0.0055 },
      catacombs: { freq: 185, q: 1.4, lfoRate: 0.13, lfoDepth: 50, gain: 0.0075 },
      blood_sanctum: { freq: 195, q: 1.7, lfoRate: 0.17, lfoDepth: 70, gain: 0.0095 },
      abyssal_rift: { freq: 270, q: 1.9, lfoRate: 0.21, lfoDepth: 95, gain: 0.011 },
      inferno: { freq: 245, q: 1.4, lfoRate: 0.24, lfoDepth: 90, gain: 0.012 },
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

    if (this.musicWarmFilter) {
      const tier = this.getMusicTier(this.currentFloor);
      const cutoff = 4200 + tier * 850;
      this.musicWarmFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.8);
    }

    // Keep stereo echo musically locked to tempo (dotted 8th & quarter)
    const beatSec = 60 / this.currentBpm;
    this.echoDelayL?.delayTime.setTargetAtTime(beatSec * 0.5, this.ctx.currentTime, 0.25);
    this.echoDelayR?.delayTime.setTargetAtTime(beatSec * 0.75, this.ctx.currentTime, 0.25);
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

      // Gentle fade-in + offset so beat 1 never collides with start/click SFX
      if (this.musicBusGain) {
        const now = ctx.currentTime;
        this.musicBusGain.gain.cancelScheduledValues(now);
        this.musicBusGain.gain.setValueAtTime(0.001, now);
        this.musicBusGain.gain.linearRampToValueAtTime(0.88, now + 0.55);
      }

      this.stepIndex = 0;
      this.nextStepTime = ctx.currentTime + 0.28;

      const scheduleLoop = () => {
        if (!this.musicEnabled || this.sfxMuted || !this.ctx) return;
        if (this.ctx.state !== 'running') {
          this.nextStepTime = this.ctx.currentTime + 0.12;
          this.musicTimerId = window.setTimeout(scheduleLoop, 90);
          return;
        }
        if (this.nextStepTime < this.ctx.currentTime - 0.35) {
          this.nextStepTime = this.ctx.currentTime + 0.08;
        }
        while (this.nextStepTime < this.ctx.currentTime + 0.18) {
          const targetBpm = this.getTargetBpm(this.currentFloor);
          this.currentBpm += (targetBpm - this.currentBpm) * 0.04;
          const sixteenthSec = 60 / this.currentBpm / 4;

          // Human MPC hip-hop swing on odd 16th-note offbeats
          const swingOffset = this.stepIndex % 2 === 1 ? sixteenthSec * 0.17 : 0;

          this.scheduleMusicalStep(
            this.ctx,
            this.stepIndex,
            this.nextStepTime + swingOffset,
            sixteenthSec
          );
          this.nextStepTime += sixteenthSec;
          this.stepIndex = (this.stepIndex + 1) % 128; // 8-bar evolving cycle
        }
        this.musicTimerId = window.setTimeout(scheduleLoop, 42);
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
      const length = Math.floor(ctx.sampleRate * 3.5);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.032;
        b2 = 0.95 * b2 + white * 0.045;
        data[i] = (b0 + b1 + b2 + white * 0.04) * 0.38;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(175, ctx.currentTime);
      filter.Q.setValueAtTime(1.3, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.11, ctx.currentTime);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(55, ctx.currentTime);

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
        // Keep base/calm tiers (Floors 1-2) clean without distracting ambient cues
        if (this.currentFloor >= 3) {
          this.triggerBiomeEnvironmentalCue(this.ctx, this.biomeId);
        }
        const delayMs = 4800 + Math.random() * 4400;
        this.ambianceEventTimer = window.setTimeout(scheduleNextAccent, delayMs);
      };

      this.ambianceEventTimer = window.setTimeout(scheduleNextAccent, 3800);
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
      if (roll < 0.72) {
        this.scheduleTorchEmberCrackle(ctx, false);
      } else {
        this.scheduleHowlingWindGust(ctx, 160, 290);
      }
    } else if (biome === 'blood_sanctum') {
      if (roll < 0.45) {
        this.scheduleDistantChain(ctx);
      } else {
        this.scheduleHowlingWindGust(ctx, 210, 390);
      }
    } else if (biome === 'abyssal_rift') {
      if (roll < 0.65) {
        this.scheduleHowlingWindGust(ctx, 260, 560);
      } else {
        this.scheduleDistantChain(ctx);
      }
    } else {
      if (roll < 0.6) {
        this.scheduleTorchEmberCrackle(ctx, true);
      } else {
        this.scheduleHowlingWindGust(ctx, 190, 440);
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

        const vol = 0.012 * (1 - i * 0.22);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(vol, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0004, start + 0.15);
        gain.gain.linearRampToValueAtTime(0, start + 0.17);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.getOutputNode(ctx));
        if (this.reverbSendGain) gain.connect(this.reverbSendGain);

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
      const duration = 2.0;
      const src = ctx.createBufferSource();
      src.buffer = this.getReusableNoiseBuffer(ctx);
      src.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(3.8, now);
      filter.frequency.setValueAtTime(lowFreq, now);
      filter.frequency.exponentialRampToValueAtTime(peakFreq, now + duration * 0.45);
      filter.frequency.exponentialRampToValueAtTime(lowFreq * 0.85, now + duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.014, now + duration * 0.4);
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
        gain.gain.linearRampToValueAtTime(intense ? 0.016 : 0.011, start + 0.004);
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
    // 8-Bar evolving dark hip-hop / cinematic minor chord progression:
    // Bars 0–3 (A Section): Dm9 -> Bbmaj7 -> Gm7 (or EbMaj7 F10+) -> A7b9
    // Bars 4–7 (B Section): Dm11 -> C6/E -> Bbmaj7#11 -> A7sus4 / A7b9 turnaround
    const barMod = barIndex % 8;

    if (barMod === 0) {
      return {
        bassRoot: 73.42, // D2
        bassGlideTarget: 82.41, // E2
        bassOctave: 146.83, // D3
        bassFifth: 110.0, // A2
        chordNotes: [146.83, 174.61, 220.0, 329.63], // Dm9
        arpNotes: [293.66, 349.23, 440.0, 587.33, 523.25, 440.0],
        eerieTop: 659.25,
      };
    }
    if (barMod === 1) {
      return {
        bassRoot: 58.27, // Bb1
        bassGlideTarget: 65.41, // C2
        bassOctave: 116.54, // Bb2
        bassFifth: 87.31, // F2
        chordNotes: [116.54, 174.61, 220.0, 293.66], // Bbmaj7
        arpNotes: [233.08, 293.66, 349.23, 440.0, 466.16, 349.23],
        eerieTop: 587.33,
      };
    }
    if (barMod === 2) {
      if (tier >= 4) {
        return {
          bassRoot: 77.78, // Eb2
          bassGlideTarget: 73.42, // D2
          bassOctave: 155.56,
          bassFifth: 116.54,
          chordNotes: [155.56, 196.0, 233.08, 293.66], // EbMaj7
          arpNotes: [311.13, 392.0, 466.16, 587.33, 622.25, 466.16],
          eerieTop: 622.25,
        };
      }
      return {
        bassRoot: 49.0, // G1
        bassGlideTarget: 55.0, // A1
        bassOctave: 98.0,
        bassFifth: 73.42,
        chordNotes: [146.83, 174.61, 196.0, 233.08], // Gm7
        arpNotes: [196.0, 233.08, 293.66, 349.23, 392.0, 293.66],
        eerieTop: 698.46,
      };
    }
    if (barMod === 3) {
      return {
        bassRoot: 55.0, // A1
        bassGlideTarget: 73.42, // D2 turnaround glide
        bassOctave: 110.0,
        bassFifth: 82.41,
        chordNotes: [138.59, 164.81, 220.0, 233.08], // A7b9
        arpNotes: [220.0, 277.18, 329.63, 440.0, 466.16, 554.37],
        eerieTop: 554.37,
      };
    }
    if (barMod === 4) {
      // B Section opens darker & wider: Dm11
      return {
        bassRoot: 73.42, // D2
        bassGlideTarget: 65.41, // C2
        bassOctave: 146.83,
        bassFifth: 110.0,
        chordNotes: [146.83, 196.0, 220.0, 261.63, 349.23], // Dm11
        arpNotes: [293.66, 392.0, 440.0, 523.25, 659.25, 440.0],
        eerieTop: 659.25,
      };
    }
    if (barMod === 5) {
      // C6/E passing lift
      return {
        bassRoot: 65.41, // C2
        bassGlideTarget: 58.27, // Bb1
        bassOctave: 130.81,
        bassFifth: 98.0,
        chordNotes: [130.81, 164.81, 196.0, 220.0, 293.66],
        arpNotes: [261.63, 329.63, 392.0, 440.0, 587.33, 392.0],
        eerieTop: 587.33,
      };
    }
    if (barMod === 6) {
      // Bbmaj7#11 suspense lift
      return {
        bassRoot: 58.27, // Bb1
        bassGlideTarget: 55.0, // A1
        bassOctave: 116.54,
        bassFifth: 87.31,
        chordNotes: [116.54, 164.81, 220.0, 293.66],
        arpNotes: [233.08, 329.63, 349.23, 440.0, 523.25, 349.23],
        eerieTop: 659.25,
      };
    }
    // Bar 7: A7sus4 -> A7b9 dramatic turnaround breath before dropping back into Bar 0!
    return {
      bassRoot: 55.0, // A1
      bassGlideTarget: 73.42, // D2
      bassOctave: 110.0,
      bassFifth: 82.41,
      chordNotes: [146.83, 164.81, 220.0, 277.18],
      arpNotes: [220.0, 277.18, 349.23, 440.0, 554.37, 440.0],
      eerieTop: 554.37,
    };
  }

  private scheduleMusicalStep(
    ctx: AudioContext,
    step: number,
    time: number,
    stepSec: number
  ) {
    const tier = this.getMusicTier(this.currentFloor);
    const barIndex = Math.floor(step / 16) % 8;
    const stepInBar = step % 16;
    const chord = this.getProgressionChord(barIndex, tier);

    // Subtle human velocity variance (92%..106%) so hits stay natural
    const humanVel = 0.92 + ((step * 37 + barIndex * 13) % 15) * 0.01;
    // Bar 7 suspense drop-out breath before Bar 0 slams back in
    const isDropBreath = tier >= 2 && barIndex === 7 && stepInBar >= 10;

    // 1. WARM ATMOSPHERIC PAD / SUBTLE CHOIR UNDERLAY
    // Slightly offset from beat 1 (+0.03s) so downbeats & card SFX stay crisp and clean
    if (stepInBar === 0 && barIndex % 2 === 0) {
      const padVol = tier === 0 ? 0.011 : tier >= 3 ? 0.017 : 0.014;
      this.scheduleWarmStringSwell(
        ctx,
        chord.chordNotes[0],
        time + 0.03,
        stepSec * 28,
        padVol
      );
      if (tier >= 1) {
        this.scheduleWarmStringSwell(
          ctx,
          chord.chordNotes[2],
          time + 0.06,
          stepSec * 28,
          padVol * 0.65
        );
      }
    }

    // 2. SPARSE DARK FELT PIANO (Calm base has NO heavy beat-1 slam)
    if (tier === 0) {
      // Base Audio (Title / Floors 1-2 / Post-Run):
      // Minimal, eerie, breathing — soft sustained root chord every 2 bars,
      // and only 1-2 gentle offbeat notes so UI & card sounds never clash.
      if (stepInBar === 0 && barIndex % 2 === 0) {
        this.scheduleFeltPianoChord(
          ctx,
          [chord.chordNotes[0], chord.chordNotes[2]],
          time + 0.025,
          stepSec * 24.0,
          0.02 * humanVel,
          false
        );
      }
      if (stepInBar === 6 || (barIndex % 2 === 1 && stepInBar === 12)) {
        const note = chord.arpNotes[(stepInBar + barIndex) % chord.arpNotes.length];
        this.scheduleFeltPianoNote(
          ctx,
          note,
          time,
          stepSec * 7.5,
          0.021 * humanVel,
          false,
          false
        );
      }
      return;
    }

    // Tiers 1+ (Active Descent Progression)
    if (stepInBar === 0 && (tier >= 2 || barIndex % 2 === 0)) {
      this.scheduleFeltPianoChord(
        ctx,
        tier >= 2 ? chord.chordNotes.slice(0, 3) : [chord.chordNotes[0], chord.chordNotes[2]],
        time + 0.015,
        tier >= 2 ? stepSec * 8.5 : stepSec * 12.0,
        (tier >= 2 ? 0.028 : 0.024) * humanVel,
        tier >= 2
      );
    }

    // 3. CLEAN MELODIC POCKET (Spacious phrasing — never muddy)
    if (tier === 1) {
      if (stepInBar === 6 || stepInBar === 12) {
        const note = chord.arpNotes[(stepInBar + barIndex) % chord.arpNotes.length];
        this.scheduleFeltPianoNote(
          ctx,
          note,
          time,
          stepSec * 5.0,
          0.024 * humanVel,
          true,
          false
        );
      }
    } else {
      if (stepInBar === 3 || stepInBar === 11) {
        const note =
          chord.arpNotes[(Math.floor(stepInBar / 2) + barIndex) % chord.arpNotes.length];
        this.schedulePizzicato(
          ctx,
          note,
          time,
          stepSec * 2.2,
          (0.023 + tier * 0.002) * humanVel,
          tier === 2
        );
      }
      if (
        tier >= 3 &&
        (barIndex === 3 || barIndex === 7) &&
        (stepInBar === 8 || stepInBar === 12)
      ) {
        const tenseNote = stepInBar === 8 ? 587.33 : 554.37; // D5 -> C#5 hair-raising pull
        this.scheduleFeltPianoNote(
          ctx,
          tenseNote,
          time,
          stepSec * 4.8,
          0.026 * humanVel,
          true,
          false
        );
      }
    }

    // Eerie high string / harmonic tension on deep floors (Bars 1, 2, 5, 6 only)
    if (tier >= 4 && (barIndex === 1 || barIndex === 5) && stepInBar === 0) {
      this.scheduleWarmStringSwell(
        ctx,
        chord.eerieTop * 0.5,
        time + 0.04,
        stepSec * 14,
        0.015
      );
    }
    if (tier >= 5 && (barIndex === 2 || barIndex === 6) && stepInBar === 8) {
      this.scheduleEerieHarmonic(ctx, chord.eerieTop, time, stepSec * 7.5, 0.012);
    }

    // 4. DEEP 808 SUB BASS WITH CLEAN GLIDE TURNAROUNDS
    if (tier === 1) {
      if (stepInBar === 0) {
        this.schedule808Sub(ctx, chord.bassRoot, time, stepSec * 8.0, 0.072);
      }
    } else if (!isDropBreath) {
      const hit808 =
        stepInBar === 0 ||
        stepInBar === 8 ||
        (tier >= 3 && stepInBar === 14 && barIndex % 2 === 1);
      if (hit808) {
        const isGlideTurnaround =
          (barIndex === 3 || barIndex === 7) && stepInBar === 14;
        const pitch =
          stepInBar === 14
            ? chord.bassOctave
            : stepInBar === 8 && tier >= 4 && barIndex % 2 === 1
            ? chord.bassFifth
            : chord.bassRoot;
        const dur = stepInBar === 0 ? stepSec * 5.2 : stepSec * 2.4;
        const vol = (stepInBar === 0 ? 0.132 : 0.102) * humanVel;
        this.schedule808Sub(
          ctx,
          pitch,
          time,
          dur,
          vol,
          isGlideTurnaround ? chord.bassGlideTarget : undefined
        );
      }
    }

    // 5. PROGRESSIVE HIP-HOP DRUM GROOVE (Spacious Pocket — No Clutter)
    if (tier === 1) {
      // Floors 3–4: Gentle heartbeat pulse + rimshot tension
      if (stepInBar === 0 || stepInBar === 8) {
        this.scheduleHipHopKick(ctx, time, (stepInBar === 0 ? 0.068 : 0.048) * humanVel, true);
      }
      if (stepInBar === 12) {
        this.scheduleHipHopRim(ctx, time, 0.02 * humanVel);
      }
    } else {
      // Floors 5+: Clean, head-nodding boom-bap / dark trap groove
      if (!isDropBreath) {
        const isMainKick = stepInBar === 0 || stepInBar === 6 || stepInBar === 8;
        const isBounceKick =
          (tier >= 3 && stepInBar === 14 && barIndex % 2 === 1) ||
          (tier >= 5 && stepInBar === 3 && barIndex % 2 === 0);

        if (isMainKick || isBounceKick) {
          const kickVol =
            (stepInBar === 0
              ? 0.148
              : stepInBar === 8
              ? 0.122
              : isBounceKick
              ? 0.088
              : 0.105) * humanVel;
          this.scheduleHipHopKick(ctx, time, kickVol, false);
        }
      }

      // Snare on 2 & 4 (plus bar-7 dramatic turnaround fill)
      if (stepInBar === 4 || stepInBar === 12) {
        this.scheduleHipHopSnare(ctx, time, (0.076 + tier * 0.004) * humanVel);
      } else if (barIndex === 7 && (stepInBar === 14 || stepInBar === 15)) {
        this.scheduleHipHopRim(ctx, time, 0.026 * humanVel);
      }

      if (tier >= 3 && !isDropBreath && barIndex % 2 === 1 && stepInBar === 7) {
        this.scheduleHipHopRim(ctx, time, 0.018 * humanVel);
      }

      if (!isDropBreath) {
        if (tier === 2) {
          // Steady clean 8th hats (no simultaneous shaker clash)
          if (stepInBar % 2 === 0) {
            const isOpen = barIndex % 2 === 1 && stepInBar === 14;
            const accent = stepInBar % 4 === 2;
            this.scheduleHipHopHat(ctx, time, (accent ? 0.025 : 0.015) * humanVel, isOpen);
          }
        } else {
          // Tier 3+: Tight 16th hats with subtle dynamics + clean turnaround roll
          const isOpen = barIndex % 2 === 1 && stepInBar === 14;
          const accent = stepInBar % 4 === 2;
          const vol =
            (isOpen ? 0.03 : accent ? 0.024 : stepInBar % 2 === 0 ? 0.014 : 0.008) *
            humanVel;
          this.scheduleHipHopHat(ctx, time, vol, isOpen);

          if (
            tier >= 4 &&
            ((barIndex === 3 && stepInBar === 15) ||
              (barIndex === 7 && stepInBar === 11))
          ) {
            const subdivisions = tier >= 5 ? 3 : 2;
            for (let sub = 1; sub < subdivisions; sub++) {
              this.scheduleHipHopHat(
                ctx,
                time + (stepSec / subdivisions) * sub,
                0.013,
                false
              );
            }
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
    volume: number,
    sendToEcho = false,
    withHammerNoise = true
  ) {
    try {
      const bus = this.ensureMusicBus(ctx);
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      // Clean warm felt piano / Rhodes body (lighter node count, cleaner headroom)
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, time);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.001, time);

      const harmGain = ctx.createGain();
      harmGain.gain.setValueAtTime(0.2, time);
      harmGain.gain.exponentialRampToValueAtTime(0.025, time + duration * 0.45);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1450, time);
      filter.frequency.exponentialRampToValueAtTime(280, time + duration);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.016);
      gain.gain.exponentialRampToValueAtTime(0.0004, time + duration);
      gain.gain.linearRampToValueAtTime(0, time + duration + 0.02);

      osc1.connect(filter);
      osc2.connect(harmGain);
      harmGain.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      if (this.reverbSendGain) gain.connect(this.reverbSendGain);
      if (sendToEcho && this.echoSendGain) gain.connect(this.echoSendGain);

      if (withHammerNoise) {
        const hammer = ctx.createBufferSource();
        hammer.buffer = this.getReusableNoiseBuffer(ctx);
        const hFilter = ctx.createBiquadFilter();
        hFilter.type = 'bandpass';
        hFilter.frequency.setValueAtTime(560, time);
        hFilter.Q.setValueAtTime(1.8, time);
        const hGain = ctx.createGain();
        hGain.gain.setValueAtTime(0.0001, time);
        hGain.gain.linearRampToValueAtTime(volume * 0.14, time + 0.002);
        hGain.gain.exponentialRampToValueAtTime(0.0004, time + 0.012);
        hammer.connect(hFilter);
        hFilter.connect(hGain);
        hGain.connect(bus);
        hammer.start(time, (this.stepIndex * 0.09) % 1.4, 0.016);
      }

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + duration + 0.025);
      osc2.stop(time + duration + 0.025);
    } catch {
      // ignore
    }
  }

  private scheduleFeltPianoChord(
    ctx: AudioContext,
    notes: number[],
    time: number,
    duration: number,
    volume: number,
    withHammerNoise = false
  ) {
    const perNoteVol = volume / Math.sqrt(Math.max(1, notes.length));
    notes.forEach((freq, idx) => {
      this.scheduleFeltPianoNote(
        ctx,
        freq,
        time + idx * 0.016,
        duration,
        perNoteVol * (idx === 0 ? 1.04 : 0.88),
        false,
        withHammerNoise && idx === 0
      );
    });
  }

  private schedulePizzicato(
    ctx: AudioContext,
    freq: number,
    time: number,
    duration: number,
    volume: number,
    sendToEcho = false
  ) {
    try {
      const bus = this.ensureMusicBus(ctx);
      const osc = ctx.createOscillator();
      const oscOct = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);
      oscOct.type = 'sine';
      oscOct.frequency.setValueAtTime(freq * 2.0, time);

      const octGain = ctx.createGain();
      octGain.gain.setValueAtTime(0.16, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, time);
      filter.frequency.exponentialRampToValueAtTime(260, time + duration);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0004, time + duration);
      gain.gain.linearRampToValueAtTime(0, time + duration + 0.015);

      osc.connect(filter);
      oscOct.connect(octGain);
      octGain.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      if (this.reverbSendGain) gain.connect(this.reverbSendGain);
      if (sendToEcho && this.echoSendGain) gain.connect(this.echoSendGain);

      osc.start(time);
      oscOct.start(time);
      osc.stop(time + duration + 0.02);
      oscOct.stop(time + duration + 0.02);
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
      const oscC = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      // 3-voice lush detuned cathedral pad / cello-choir ensemble
      oscA.type = 'triangle';
      oscA.frequency.setValueAtTime(freq, time);
      oscB.type = 'sine';
      oscB.frequency.setValueAtTime(freq * 1.0038, time);
      oscC.type = 'sine';
      oscC.frequency.setValueAtTime(freq * 0.9964, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(460, time);
      filter.frequency.linearRampToValueAtTime(920, time + duration * 0.55);
      filter.frequency.linearRampToValueAtTime(420, time + duration);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(volume, time + duration * 0.42);
      gain.gain.exponentialRampToValueAtTime(0.0004, time + duration - 0.04);
      gain.gain.linearRampToValueAtTime(0, time + duration);

      oscA.connect(filter);
      oscB.connect(filter);
      oscC.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      if (this.reverbSendGain) gain.connect(this.reverbSendGain);

      oscA.start(time);
      oscB.start(time);
      oscC.start(time);
      oscA.stop(time + duration + 0.02);
      oscB.stop(time + duration + 0.02);
      oscC.stop(time + duration + 0.02);
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
      lfo.frequency.setValueAtTime(4.2, time);
      lfoGain.gain.setValueAtTime(2.6, time);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(volume, time + duration * 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0004, time + duration - 0.03);
      gain.gain.linearRampToValueAtTime(0, time + duration);

      osc.connect(gain);
      gain.connect(bus);
      if (this.reverbSendGain) gain.connect(this.reverbSendGain);
      if (this.echoSendGain) gain.connect(this.echoSendGain);

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
    volume: number,
    glideToFreq?: number
  ) {
    try {
      const bus = this.ensureMusicBus(ctx);
      const subOsc = ctx.createOscillator();
      const bodyOsc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq * 1.42, time);
      subOsc.frequency.exponentialRampToValueAtTime(freq, time + 0.032);
      if (glideToFreq) {
        subOsc.frequency.setValueAtTime(freq, time + duration * 0.45);
        subOsc.frequency.exponentialRampToValueAtTime(glideToFreq, time + duration * 0.92);
      }

      bodyOsc.type = 'triangle';
      bodyOsc.frequency.setValueAtTime(freq, time);
      if (glideToFreq) {
        bodyOsc.frequency.setValueAtTime(freq, time + duration * 0.45);
        bodyOsc.frequency.exponentialRampToValueAtTime(glideToFreq, time + duration * 0.92);
      }

      const bodyGain = ctx.createGain();
      bodyGain.gain.setValueAtTime(0.24, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, time);

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

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(soft ? 96 : 124, time);
      osc.frequency.exponentialRampToValueAtTime(42, time + 0.095);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0005, time + 0.16);
      gain.gain.linearRampToValueAtTime(0, time + 0.18);

      osc.connect(gain);
      gain.connect(bus);
      osc.start(time);
      osc.stop(time + 0.19);

      if (!soft) {
        const clickSrc = ctx.createBufferSource();
        clickSrc.buffer = this.getReusableNoiseBuffer(ctx);
        const clickFilter = ctx.createBiquadFilter();
        clickFilter.type = 'bandpass';
        clickFilter.frequency.setValueAtTime(980, time);
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

      const wireSrc = ctx.createBufferSource();
      wireSrc.buffer = noiseBuf;
      const wireFilter = ctx.createBiquadFilter();
      wireFilter.type = 'bandpass';
      wireFilter.frequency.setValueAtTime(2150, time);
      wireFilter.Q.setValueAtTime(0.95, time);

      const wireGain = ctx.createGain();
      wireGain.gain.setValueAtTime(0.0001, time);
      wireGain.gain.linearRampToValueAtTime(volume * 0.7, time + 0.004);
      wireGain.gain.exponentialRampToValueAtTime(0.0004, time + 0.13);
      wireGain.gain.linearRampToValueAtTime(0, time + 0.145);

      wireSrc.connect(wireFilter);
      wireFilter.connect(wireGain);
      wireGain.connect(bus);
      if (this.reverbSendGain) wireGain.connect(this.reverbSendGain);
      wireSrc.start(time, (this.stepIndex * 0.19) % 1.4, 0.155);

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
      if (this.reverbSendGain) gain.connect(this.reverbSendGain);
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

  public playMysteryReveal() {
    this.duckMusic(0.45, 0.24);
    this.tone(523.25, 783.99, 0.12, 'sine', 0.085, 0);
    this.tone(783.99, 1046.5, 0.16, 'triangle', 0.065, 0.045);
  }

  public playSwordSlash() {
    this.duckMusic(0.62, 0.14);
    this.tone(620, 140, 0.14, 'sawtooth', 0.085);
    this.tone(180, 70, 0.16, 'triangle', 0.1, 0.04);
  }

  public playHeroHurt(damage = 1) {
    if (this.sfxMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.duckMusic(0.48, 0.24);

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
    this.duckMusic(0.5, 0.28);
    this.tone(587.33, 587.33, 0.1, 'triangle', 0.085, 0);
    this.tone(739.99, 739.99, 0.1, 'triangle', 0.085, 0.08);
    this.tone(880, 1174.66, 0.22, 'sine', 0.1, 0.16);
  }

  public playCashOut() {
    this.duckMusic(0.4, 0.42);
    this.tone(523.25, 523.25, 0.11, 'triangle', 0.09, 0);
    this.tone(659.25, 659.25, 0.11, 'triangle', 0.09, 0.09);
    this.tone(783.99, 783.99, 0.12, 'triangle', 0.09, 0.18);
    this.tone(1046.5, 1046.5, 0.28, 'sine', 0.1, 0.27);
  }

  public playForgeAnvil() {
    this.duckMusic(0.62, 0.18);
    this.tone(920, 680, 0.09, 'triangle', 0.085, 0);
    this.tone(1240, 980, 0.14, 'sine', 0.075, 0.09);
  }

  public playBossSpawn() {
    this.duckMusic(0.45, 0.36);
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
