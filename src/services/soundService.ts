// src/services/soundService.ts

class SoundService {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      // @ts-ignore
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    return this.ctx;
  }

  // Tactical cyberpunk scan/sonar sound
  playSonar() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const time = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, time);
      osc.frequency.exponentialRampToValueAtTime(150, time + 0.5);

      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.5);
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  }

  // Strategic success sound (double beep)
  playSuccess() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const time = ctx.currentTime;
      
      // High beep 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.frequency.setValueAtTime(600, time);
      gain1.gain.setValueAtTime(0.1, time);
      gain1.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(time);
      osc1.stop(time + 0.15);

      // High beep 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.frequency.setValueAtTime(900, time + 0.1);
      gain2.gain.setValueAtTime(0.1, time + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(time + 0.1);
      osc2.stop(time + 0.3);
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  }

  // Access denied error sound (low buzz)
  playDenied() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const time = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, time);
      osc.frequency.linearRampToValueAtTime(80, time + 0.25);

      gain.gain.setValueAtTime(0.12, time);
      gain.gain.linearRampToValueAtTime(0.01, time + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.25);
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  }

  // Quick tactile tick/click sound
  playClick() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const time = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, time);
      osc.frequency.exponentialRampToValueAtTime(300, time + 0.05);

      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.05);
    } catch (e) {
      // noop
    }
  }
}

export const soundService = new SoundService();
