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

  // ─── Cultural cues (Prompt 02) ────────────────────────────────────────────
  // Each principle has a tiny signature played when its power-up activates.

  powerUpActivate(type: string) {
    switch (type) {
      case "todo_terreno":
        // Percusión corta + glide ascendente.
        this.tone(180, "square", 0.06, 0.18, 0);
        this.tone(320, "sine", 0.18, 0.16, 0.04);
        this.tone(520, "sine", 0.22, 0.12, 0.12);
        break;
      case "fan_cliente":
        // Dos tonos call-and-response.
        this.tone(660, "sine", 0.1, 0.18, 0);
        this.tone(990, "sine", 0.12, 0.16, 0.12);
        break;
      case "valentia":
        // Riser + golpe brillante.
        this.tone(280, "sawtooth", 0.18, 0.18, 0);
        this.tone(560, "square", 0.12, 0.16, 0.16);
        this.tone(1120, "triangle", 0.18, 0.16, 0.22);
        break;
      case "dejamos_huella":
        // Shimmer con eco corto.
        this.tone(880, "sine", 0.18, 0.14, 0);
        this.tone(1320, "sine", 0.22, 0.1, 0.1);
        this.tone(1760, "sine", 0.26, 0.06, 0.22);
        break;
      case "equipazo":
        // Tríada cálida.
        this.tone(523, "sine", 0.22, 0.16, 0);
        this.tone(659, "sine", 0.22, 0.14, 0);
        this.tone(784, "sine", 0.22, 0.12, 0);
        break;
      default:
        this.powerUpCollect();
    }
  }

  /** Subtle impact cue tied to a cultural micro-event. */
  principleImpact(type: string) {
    switch (type) {
      case "todo_terreno":
        // Mint "save" chime.
        this.tone(1320, "triangle", 0.08, 0.1, 0);
        this.tone(1760, "sine", 0.1, 0.08, 0.04);
        break;
      case "fan_cliente":
        // Priority brick break.
        this.tone(1480, "square", 0.08, 0.12, 0);
        break;
      case "valentia":
        // Chain transformation.
        this.tone(660, "sawtooth", 0.06, 0.12, 0);
        this.tone(990, "triangle", 0.1, 0.1, 0.05);
        break;
      case "dejamos_huella":
        // Combo with elegant delay.
        this.tone(1175, "sine", 0.12, 0.1, 0);
        this.tone(1567, "sine", 0.18, 0.08, 0.12);
        break;
      case "equipazo":
        // Bumper support.
        this.tone(880, "triangle", 0.06, 0.1, 0);
        break;
    }
  }

  /** ¡Gracias! recognition chime. */
  thanksBadge() {
    this.tone(880, "sine", 0.25, 0.16, 0);
    this.tone(1320, "sine", 0.32, 0.12, 0.08);
    this.tone(1760, "sine", 0.4, 0.08, 0.2);
  }
}

export const soundEngine = new SoundEngine();
