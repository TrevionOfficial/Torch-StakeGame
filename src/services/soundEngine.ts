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

  private getMusicTier(floor: number): number {
    if (floor >= 20) return 5;
    if (floor >= 15) return 4;
    if (floor >= 10) return 3;
    if (floor >= 5) return 2;
    return 1;
  }

  public setFloorTension(floor: number) {
    this.currentFloor = Math.max(1, floor);
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
    if (this.sfxMuted || this.musicEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

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

      this.nextStepTime = ctx.currentTime + 0.1;

      // Seamless lookahead Web Audio scheduler (never glitches or restarts mid-bar)
      const scheduleLoop = () => {
        if (!this.musicEnabled || this.sfxMuted || !this.ctx) return;
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
