export type GamePhase = "ready" | "playing" | "gameover";

export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  fireball: boolean;
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
}

export type PowerUpType = "wide_paddle" | "double_ball" | "fireball";

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
}
