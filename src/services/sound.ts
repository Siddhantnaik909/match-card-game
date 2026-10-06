/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Audio API Synthesizer with SFX + Ambient Lo-Fi BGM generator
class SoundService {
  private ctx: AudioContext | null = null;
  public sfxEnabled: boolean = true;
  public musicEnabled: boolean = false;
  public sfxVolume: number = 0.8;
  public musicVolume: number = 0.5;

  private bgmInterval: NodeJS.Timeout | null = null;
  private bgmStep: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      const storedSfx = localStorage.getItem('match_collect_sfx');
      if (storedSfx !== null) {
        this.sfxEnabled = storedSfx === 'true';
      }
      const storedMusic = localStorage.getItem('match_collect_music');
      if (storedMusic !== null) {
        this.musicEnabled = storedMusic === 'true';
      }
      const storedVol = localStorage.getItem('match_collect_sfx_vol');
      if (storedVol !== null) {
        this.sfxVolume = parseFloat(storedVol) || 0.8;
      }
    }
  }

  public get enabled(): boolean {
    return this.sfxEnabled;
  }

  public set enabled(val: boolean) {
    this.setSfxEnabled(val);
  }

  public setSfxEnabled(val: boolean): void {
    this.sfxEnabled = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('match_collect_sfx', String(val));
    }
  }

  public setMusicEnabled(val: boolean): void {
    this.musicEnabled = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('match_collect_music', String(val));
    }
    if (val) {
      this.startAmbientMusic();
    } else {
      this.stopAmbientMusic();
    }
  }

  public setSfxVolume(val: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (typeof window !== 'undefined') {
      localStorage.setItem('match_collect_sfx_vol', String(this.sfxVolume));
    }
  }

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // --- AMBIENT BGM GENERATOR (Web Audio API) ---
  public startAmbientMusic(): void {
    if (!this.musicEnabled) return;
    if (this.bgmInterval) return;

    const ctx = this.getContext();
    if (!ctx) return;

    // Pleasant relaxing office progression chords (Fmaj7, Cmaj7, G6, Am7)
    const chords = [
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [196.0, 246.94, 293.66, 392.0],  // G6
      [220.0, 261.63, 329.63, 440.0],  // Am7
    ];

    this.bgmInterval = setInterval(() => {
      if (!this.musicEnabled) {
        this.stopAmbientMusic();
        return;
      }
      const c = this.getContext();
      if (!c) return;

      const chord = chords[Math.floor(this.bgmStep / 4) % chords.length];
      const noteFreq = chord[this.bgmStep % chord.length];
      this.bgmStep = (this.bgmStep + 1) % 16;

      try {
        const osc = c.createOscillator();
        const gain = c.createGain();
        const filter = c.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(noteFreq, c.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, c.currentTime);

        const targetGain = 0.035 * this.musicVolume;
        gain.gain.setValueAtTime(0.001, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(targetGain, c.currentTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.85);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(c.destination);

        osc.start(c.currentTime);
        osc.stop(c.currentTime + 0.85);
      } catch {
        // Silently catch audio buffer quirks
      }
    }, 750);
  }

  public stopAmbientMusic(): void {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  // --- SOUND EFFECTS ---
  public playCardSelect(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

    const vol = 0.12 * this.sfxVolume;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  public playCardPass(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(720, ctx.currentTime + 0.18);

    const vol = 0.18 * this.sfxVolume;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  }

  public playCardReceive(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(680, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(540, ctx.currentTime + 0.12);

    const vol = 0.14 * this.sfxVolume;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  public playCountdown(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);

    const vol = 0.1 * this.sfxVolume;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  public playUrgentTick(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(850, ctx.currentTime);

    const vol = 0.14 * this.sfxVolume;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  public playGoBuzzer(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.25);

    const vol = 0.2 * this.sfxVolume;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }

  public playDeal(): void {
    this.playDealCascade();
  }

  public playDealCascade(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400 + i * 120, ctx.currentTime + i * 0.07);

      const vol = 0.08 * this.sfxVolume;
      gain.gain.setValueAtTime(vol, ctx.currentTime + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.07 + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.07);
      osc.stop(ctx.currentTime + i * 0.07 + 0.08);
    }
  }

  public playButtonClick(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, ctx.currentTime);

    const vol = 0.05 * this.sfxVolume;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  }

  public playVictory(): void {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

      const vol = 0.22 * this.sfxVolume;
      gain.gain.setValueAtTime(vol, ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.12 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.45);
    });
  }
}

export const sound = new SoundService();
