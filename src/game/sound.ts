class SoundEngine {
  private ctx: AudioContext | null = null;
  private _enabled = true;

  get isEnabled() {
    return this._enabled;
  }

  toggle() {
    this._enabled = !this._enabled;
  }

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private tone(
    freq: number,
    type: OscillatorType,
    duration: number,
    gain: number,
    startOffset = 0,
  ) {
    if (!this._enabled) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);

      const t = ctx.currentTime + startOffset;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.start(t);
      osc.stop(t + duration + 0.02);
    } catch {
      // AudioContext unavailable – fail silently
    }
  }

  paddleHit() {
    this.tone(440, "square", 0.07, 0.15);
  }

  brickHit() {
    this.tone(660, "square", 0.06, 0.12);
  }

  brickBreak(row: number) {
    this.tone(880 - row * 80, "sawtooth", 0.12, 0.2);
  }

  powerUpCollect() {
    [523, 659, 784, 1047].forEach((f, i) =>
      this.tone(f, "sine", 0.1, 0.15, i * 0.08),
    );
  }

  lifeLost() {
    this.tone(440, "sawtooth", 0.15, 0.3, 0);
    this.tone(330, "sawtooth", 0.2, 0.3, 0.15);
    this.tone(220, "sawtooth", 0.3, 0.3, 0.3);
  }

  gameOver() {
    this.tone(330, "sawtooth", 0.2, 0.3, 0);
    this.tone(277, "sawtooth", 0.2, 0.3, 0.2);
    this.tone(220, "sawtooth", 0.4, 0.3, 0.4);
  }

  levelComplete() {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      this.tone(f, "sine", 0.12, 0.25, i * 0.1),
    );
  }

  wallHit() {
    this.tone(220, "sine", 0.04, 0.08);
  }
}

export const soundEngine = new SoundEngine();
