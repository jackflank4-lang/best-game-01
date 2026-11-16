// Synthesised sound effects with the Web Audio API: no audio files, no
// network, just oscillators. The pentatonic chime climbs in pitch with the
// combo, so a hot streak sounds like one.
export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  // Browsers only let audio start after a user gesture; call this from one.
  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.22;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch { /* audio is optional; the game plays fine silent */ }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (!this.ctx || this.muted) return;
    try {
      const t0 = this.ctx.currentTime + when;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch { /* ignore */ }
  }

  // Pentatonic ladder: A C D E G A — the step rises with the combo.
  mote(combo) {
    const scale = [440, 523.25, 587.33, 659.25, 783.99, 880];
    const f = scale[Math.min(Math.max(combo - 1, 0), scale.length - 1)];
    this.tone(f, 0.22, 'sine', 0.5);
    this.tone(f * 2, 0.12, 'triangle', 0.15);
  }

  hit() {
    this.tone(160, 0.35, 'sawtooth', 0.4, 0, 55);
    this.tone(90, 0.3, 'sine', 0.5, 0, 40);
  }

  levelUp() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.35, i * 0.07));
  }

  dawn() {
    [392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.tone(f, 0.4, 'sine', 0.3, i * 0.09));
  }

  gameOver() {
    [392, 329.63, 261.63, 196].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.3, i * 0.14));
  }

  click() {
    this.tone(700, 0.06, 'square', 0.15);
  }
}
