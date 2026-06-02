export type GamePhase = "ready" | "playing" | "gameover";

export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  fireball: boolean;
  /** Recent positions for trail rendering (Valentía / Dejamos Huella). */
  trail?: Array<{ x: number; y: number }>;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  baseWidth: number;
}

export interface Brick {
  id: number;
  col: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  hitsRequired: number;
  hitsLeft: number;
  points: number;
  powerUp: PowerUpType | null;
  alive: boolean;
  /** Fan Cliente priority target (resets on cluster rebuild). */
  priority?: boolean;
  /** Dejamos Huella: timestamp until which this brick is "marked". */
  markedUntil?: number;
  /** Valentía: timestamp of last pierce flash, for renderer. */
  ignitedAt?: number;
}

export type PowerUpType =
  | "valentia"
  | "fan_cliente"
  | "equipazo"
  | "todo_terreno"
  | "dejamos_huella";

export interface DroppingPowerUp {
  id: number;
  x: number;
  y: number;
  vy: number;
  type: PowerUpType;
}

export interface ActiveEffect {
  type: PowerUpType;
  expiresAt: number;
  collectedAt: number;
}

/** Equipazo wingmate bumper. */
export interface Bumper {
  id: number;
  x: number;
  y: number;
  radius: number;
  /** Timestamp until which this bumper is on cooldown. */
  cooldownUntil: number;
  /** Timestamp of last successful reflection, for flash render. */
  flashAt: number;
}

/** Per-principle impact stats; lives in parallel to the legacy maps. */
export interface PrincipleStat {
  spawned: number;
  caught: number;
  missed: number;
  uptimeMs: number;
  impactScore: number;
  custom: Record<string, number>;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  color: string;
  size: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  spaceJustPressed: boolean;
  pointerX: number | null;
}

export interface GameState {
  phase: GamePhase;
  balls: Ball[];
  paddle: Paddle;
  bricks: Brick[];
  particles: Particle[];
  droppingPowerUps: DroppingPowerUp[];
  activeEffects: ActiveEffect[];
  score: number;
  highScore: number;
  lives: number;
  level: number;
  frame: number;
  _nextId: number;
  // Session stats (cumulative across levels)
  powerUpsCaught: number;
  powerUpsMissed: number;
  bricksBroken: number;
  // Per-type breakdowns for the end-of-game summary
  powerUpsCaughtMap: Record<PowerUpType, number>;
  powerUpsMissedMap: Record<PowerUpType, number>;
  // Per-principle cultural stats (impact score, custom counters per principle)
  principleStats: Record<PowerUpType, PrincipleStat>;
  // Equipazo wingmates (active only while Equipazo is on).
  bumpers: Bumper[];
  // Valentía pierce counter (for transformation chains every 3 hits).
  pierceCounter: number;
  // Flagged when a particularly close save happens (used for ¡Gracias! badge).
  graciasMoment: boolean;
}
