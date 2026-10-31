/**
 * Offline Web Audio Synthesizer for FocusGuard AI
 * Generates pleasant, latency-free notification chimes and alert sounds without external files.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private volume: number = 0.8;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setPreferences(enabled: boolean, volume: number): void {
    this.soundEnabled = enabled;
    this.volume = Math.max(0, Math.min(1, volume));
  }

  public playAlert(type: string = 'chime'): void {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume, now);
      masterGain.connect(ctx.destination);

      if (type === 'bell') {
        // Bell: Rich overtone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 1.2);
      } else if (type === 'radar') {
        // Radar: Two quick blips
        [0, 0.15].forEach((delay) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(880, now + delay); // A5
          gain.gain.setValueAtTime(0.4, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + delay);
          osc.stop(now + delay + 0.1);
        });
      } else if (type === 'warning') {
        // Attention-away alarm: 3 gentle warning tone steps
        [0, 0.12, 0.24].forEach((delay, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25 + idx * 80, now + delay);
          gain.gain.setValueAtTime(0.5, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.18);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + delay);
          osc.stop(now + delay + 0.18);
        });
      } else {
        // Default chime: C5 then G5
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        gain1.gain.setValueAtTime(0.5, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(783.99, now + 0.1); // G5
        gain2.gain.setValueAtTime(0.5, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc2.connect(gain2);
        gain2.connect(masterGain);

        osc1.start(now);
        osc1.stop(now + 0.6);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.9);
      }
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  }
}

export const soundSynth = new SoundSynthesizer();
