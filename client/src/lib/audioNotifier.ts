/**
 * Elegant Web Audio API chime generator for time-based reminders
 * Works completely in-browser without external audio asset downloads.
 */

class AudioNotifier {
  private ctx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Safe catch if user interaction has not occurred yet
      });
    }

    return this.ctx;
  }

  /**
   * Play an elegant double-harmonic chime (D5 -> A5)
   */
  playChime(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1: D5 (587.33 Hz)
      this.playTone(ctx, 587.33, now, 0.45, 0.15);

      // Note 2: A5 (880.00 Hz) - slightly delayed
      this.playTone(ctx, 880.0, now + 0.18, 0.65, 0.2);

      // Note 3: F#6 (1479.98 Hz) - gentle sparkle
      this.playTone(ctx, 1174.66, now + 0.38, 0.8, 0.08);
    } catch (err) {
      console.warn('AudioNotifier: Could not play chime', err);
    }
  }

  private playTone(
    ctx: AudioContext,
    frequency: number,
    startTime: number,
    duration: number,
    gainLevel: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, startTime);

    // Smooth envelope attack and exponential decay
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainLevel, startTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }
}

export const audioNotifier = new AudioNotifier();
