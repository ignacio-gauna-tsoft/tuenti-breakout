import type {
  Ball,
  Brick,
  GameState,
  InputState,
  Particle,
  Paddle,
  PowerUpType,
} from "./types";
import {
  BALL_MAX_SPEED,
  BALL_RADIUS,
  BALL_SPEED,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  INITIAL_LIVES,
  PADDLE_BASE_WIDTH,
  PADDLE_BOTTOM_MARGIN,
  PADDLE_HEIGHT,
  PADDLE_SPEED,
  POWERUP_DURATION_MS,
  POWERUP_FALL_SPEED,
  POWERUP_COLORS,
  createPowerUpCountMap,
} from "./constants";
import { createBricks } from "./levels";
import { soundEngine } from "./sound";

function makePaddle(): Paddle {
  return {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - PADDLE_BOTTOM_MARGIN,
    width: PADDLE_BASE_WIDTH,
    height: PADDLE_HEIGHT,
    baseWidth: PADDLE_BASE_WIDTH,
  };
}

function makeBallOnPaddle(paddle: Paddle, id: number): Ball {
  return {
    id,
    x: paddle.x,
    y: paddle.y - paddle.height / 2 - BALL_RADIUS - 1,
    vx: 0,
    vy: 0,
    radius: BALL_RADIUS,
    fireball: false,
  };
}

function speedForLevel(level: number): number {
  return Math.min(BALL_SPEED + (level - 1) * 0.4, BALL_MAX_SPEED);
}

export class GameEngine {
  state: GameState;

  constructor(level = 1, highScore = 0) {
    const idCounter = { value: 0 };
    const paddle = makePaddle();

    this.state = {
      phase: "ready",
      balls: [makeBallOnPaddle(paddle, idCounter.value++)],
      paddle,
      bricks: createBricks(level, idCounter),
      particles: [],
      droppingPowerUps: [],
      activeEffects: [],
      score: 0,
      highScore,
      lives: INITIAL_LIVES,
      level,
      frame: 0,
      _nextId: idCounter.value,
      powerUpsCaught: 0,
      powerUpsMissed: 0,
      bricksBroken: 0,
      powerUpsCaughtMap: createPowerUpCountMap(),
      powerUpsMissedMap: createPowerUpCountMap(),
    };
  }

  tick(input: InputState, now: number): void {
    const { phase } = this.state;

    if (phase === "ready") {
      this.tickReady(input);
    } else if (phase === "playing") {
      this.tickPlaying(input, now);
    }

    this.updateParticles();
    this.state.frame++;
  }

  // ─── Ready phase ────────────────────────────────────────────────────────────

  private tickReady(input: InputState): void {
    this.movePaddle(input);

    const ball = this.state.balls[0];
    if (ball) {
      ball.x = this.state.paddle.x;
      ball.y =
        this.state.paddle.y - this.state.paddle.height / 2 - ball.radius - 1;
    }

    if (input.spaceJustPressed || input.pointerX !== null) {
      this.launchBall();
    }
  }

  private launchBall(): void {
    const ball = this.state.balls[0];
    if (!ball) return;

    const speed = speedForLevel(this.state.level);
    // angle between -60° and -120° from horizontal (pointing upward)
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 3);
    ball.vx = Math.cos(angle) * speed;
    ball.vy = Math.sin(angle) * speed;
    this.state.phase = "playing";
  }

  // ─── Playing phase ──────────────────────────────────────────────────────────

  private tickPlaying(input: InputState, now: number): void {
    this.movePaddle(input);
    this.updateBalls();
    this.updateDroppingPowerUps(now);
    this.expireEffects(now);

    if (this.state.bricks.every((b) => !b.alive)) {
      soundEngine.levelComplete();
      this.advanceLevel();
    }
  }

  private advanceLevel(): void {
    const nextLevel = this.state.level + 1;
    const idCounter = { value: this.state._nextId };
    const paddle = makePaddle();

    this.state.balls = [makeBallOnPaddle(paddle, idCounter.value++)];
    this.state.paddle = paddle;
    this.state.bricks = createBricks(nextLevel, idCounter);
    this.state._nextId = idCounter.value;
    this.state.level = nextLevel;
    this.state.activeEffects = [];
    this.state.droppingPowerUps = [];
    this.state.phase = "ready";
  }

  // ─── Paddle ─────────────────────────────────────────────────────────────────

  private movePaddle(input: InputState): void {
    const { paddle } = this.state;
    const half = paddle.width / 2;

    if (input.pointerX !== null) {
      const target = Math.max(
        half,
        Math.min(CANVAS_WIDTH - half, input.pointerX),
      );
      paddle.x += (target - paddle.x) * 0.25;
    } else {
      if (input.left) paddle.x -= PADDLE_SPEED;
      if (input.right) paddle.x += PADDLE_SPEED;
    }

    paddle.x = Math.max(half, Math.min(CANVAS_WIDTH - half, paddle.x));
  }

  // ─── Balls ──────────────────────────────────────────────────────────────────

  private updateBalls(): void {
    const lost: number[] = [];

    for (const ball of this.state.balls) {
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Walls
      if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx);
        soundEngine.wallHit();
      } else if (ball.x + ball.radius > CANVAS_WIDTH) {
        ball.x = CANVAS_WIDTH - ball.radius;
        ball.vx = -Math.abs(ball.vx);
        soundEngine.wallHit();
      }

      if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy);
        soundEngine.wallHit();
      }

      if (ball.y - ball.radius > CANVAS_HEIGHT) {
        lost.push(ball.id);
        continue;
      }

      this.checkPaddleCollision(ball);
      this.checkBrickCollisions(ball);
    }

    this.state.balls = this.state.balls.filter((b) => !lost.includes(b.id));

    if (this.state.balls.length === 0) {
      this.loseLife();
    }
  }

  private checkPaddleCollision(ball: Ball): void {
    const { paddle } = this.state;
    const paddleLeft = paddle.x - paddle.width / 2;
    const paddleRight = paddle.x + paddle.width / 2;
    const paddleTop = paddle.y - paddle.height / 2;

    if (
      ball.vy > 0 &&
      ball.x >= paddleLeft &&
      ball.x <= paddleRight &&
      ball.y + ball.radius >= paddleTop &&
      ball.y + ball.radius <= paddleTop + paddle.height + Math.abs(ball.vy) + 2
    ) {
      ball.y = paddleTop - ball.radius;
      ball.vy = -Math.abs(ball.vy);

      // Angle based on hit position (-1 … 1)
      const hitPos = (ball.x - paddle.x) / (paddle.width / 2);
      const speed = speedForLevel(this.state.level);
      ball.vx = hitPos * speed * 1.3;

      // Clamp total speed
      const totalSpeed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
      const clampedSpeed = Math.min(
        BALL_MAX_SPEED,
        Math.max(speed, totalSpeed),
      );
      const scale = clampedSpeed / totalSpeed;
      ball.vx *= scale;
      ball.vy *= scale;

      soundEngine.paddleHit();
    }
  }

  private checkBrickCollisions(ball: Ball): void {
    for (const brick of this.state.bricks) {
      if (!brick.alive) continue;

      const side = this.collisionSide(ball, brick);
      if (!side) continue;

      if (!ball.fireball) {
        if (side === "left" || side === "right") ball.vx = -ball.vx;
        else ball.vy = -ball.vy;
      }

      brick.hitsLeft--;

      if (brick.hitsLeft <= 0) {
        brick.alive = false;
        this.state.bricksBroken++;
        this.state.score += brick.points;
        if (this.state.score > this.state.highScore) {
          this.state.highScore = this.state.score;
          localStorage.setItem(
            "tuenti-breakout-hs",
            String(this.state.highScore),
          );
        }
        soundEngine.brickBreak(brick.row);
        this.spawnBrickParticles(brick);
        if (brick.powerUp) this.spawnDroppingPowerUp(brick);
      } else {
        soundEngine.brickHit();
        this.spawnHitParticles(brick);
      }

      // One brick collision per ball per frame (unless fireball)
      if (!ball.fireball) break;
    }
  }

  private collisionSide(
    ball: Ball,
    brick: Brick,
  ): "top" | "bottom" | "left" | "right" | null {
    const bRight = brick.x + brick.width;
    const bBottom = brick.y + brick.height;

    if (
      ball.x + ball.radius < brick.x ||
      ball.x - ball.radius > bRight ||
      ball.y + ball.radius < brick.y ||
      ball.y - ball.radius > bBottom
    )
      return null;

    const oL = ball.x + ball.radius - brick.x;
    const oR = bRight - (ball.x - ball.radius);
    const oT = ball.y + ball.radius - brick.y;
    const oB = bBottom - (ball.y - ball.radius);
    const min = Math.min(oL, oR, oT, oB);

    if (min === oT) return "top";
    if (min === oB) return "bottom";
    if (min === oL) return "left";
    return "right";
  }

  // ─── Life management ────────────────────────────────────────────────────────

  private loseLife(): void {
    this.state.lives--;
    soundEngine.lifeLost();

    if (this.state.lives <= 0) {
      this.state.phase = "gameover";
      soundEngine.gameOver();
      localStorage.setItem("tuenti-breakout-hs", String(this.state.highScore));
      return;
    }

    const paddle = makePaddle();
    this.state.paddle = paddle;
    this.state.balls = [makeBallOnPaddle(paddle, this.state._nextId++)];
    this.state.activeEffects = [];
    this.state.droppingPowerUps = [];
    this.state.paddle.width = PADDLE_BASE_WIDTH;
    this.state.phase = "ready";
  }

  // ─── Power-ups ──────────────────────────────────────────────────────────────

  private spawnDroppingPowerUp(brick: Brick): void {
    this.state.droppingPowerUps.push({
      id: this.state._nextId++,
      x: brick.x + brick.width / 2,
      y: brick.y + brick.height / 2,
      vy: POWERUP_FALL_SPEED,
      type: brick.powerUp!,
    });
  }

  private updateDroppingPowerUps(now: number): void {
    const gone: number[] = [];

    for (const pu of this.state.droppingPowerUps) {
      pu.y += pu.vy;

      const { paddle } = this.state;
      const pL = paddle.x - paddle.width / 2 - 12;
      const pR = paddle.x + paddle.width / 2 + 12;
      const pT = paddle.y - paddle.height / 2;
      const pB = paddle.y + paddle.height / 2;

      if (pu.x >= pL && pu.x <= pR && pu.y + 10 >= pT && pu.y <= pB) {
        gone.push(pu.id);
        this.applyPowerUp(pu.type, now);
        this.spawnCollectParticles(pu.x, pu.y, pu.type);
      } else if (pu.y > CANVAS_HEIGHT + 30) {
        gone.push(pu.id);
        this.state.powerUpsMissed++;
        this.state.powerUpsMissedMap[pu.type]++;
      }
    }

    this.state.droppingPowerUps = this.state.droppingPowerUps.filter(
      (pu) => !gone.includes(pu.id),
    );
  }

  private applyPowerUp(type: PowerUpType, now: number): void {
    soundEngine.powerUpCollect();
    this.state.powerUpsCaught++;
    this.state.powerUpsCaughtMap[type]++;

    // Refresh or add effect
    this.state.activeEffects = this.state.activeEffects.filter(
      (e) => e.type !== type,
    );
    this.state.activeEffects.push({
      type,
      expiresAt: now + POWERUP_DURATION_MS,
      collectedAt: now,
    });

    switch (type) {
      case "equipazo":
      case "todo_terreno":
        this.state.paddle.width = this.state.paddle.baseWidth * 1.7;
        break;

      case "fan_cliente":
      case "dejamos_huella":
        if (this.state.balls.length < 4) {
          const src = this.state.balls[0];
          if (src) {
            this.state.balls.push({
              id: this.state._nextId++,
              x: src.x,
              y: src.y,
              vx: -src.vx + (Math.random() - 0.5) * 2,
              vy: src.vy,
              radius: BALL_RADIUS,
              fireball: false,
            });
          }
        }
        break;

      case "valentia":
        this.state.balls.forEach((b) => {
          b.fireball = true;
        });
        break;
    }
  }

  private expireEffects(now: number): void {
    for (const eff of this.state.activeEffects) {
      if (now < eff.expiresAt) continue;

      switch (eff.type) {
        case "equipazo":
        case "todo_terreno":
          this.state.paddle.width = this.state.paddle.baseWidth;
          break;
        case "valentia":
          this.state.balls.forEach((b) => {
            b.fireball = false;
          });
          break;
        case "fan_cliente":
        case "dejamos_huella":
          // Balls remain, effect just expires
          break;
      }
    }

    this.state.activeEffects = this.state.activeEffects.filter(
      (e) => now < e.expiresAt,
    );
  }

  // ─── Particles ──────────────────────────────────────────────────────────────

  private spawnBrickParticles(brick: Brick): void {
    const cx = brick.x + brick.width / 2;
    const cy = brick.y + brick.height / 2;

    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
      const speed = 2 + Math.random() * 5;
      this.addParticle({
        x: cx + (Math.random() - 0.5) * brick.width * 0.5,
        y: cy + (Math.random() - 0.5) * brick.height * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.025 + Math.random() * 0.025,
        color: brick.color,
        size: 3 + Math.random() * 4,
      });
    }
  }

  private spawnHitParticles(brick: Brick): void {
    const cx = brick.x + brick.width / 2;
    const cy = brick.y + brick.height / 2;

    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      this.addParticle({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.07 + Math.random() * 0.04,
        color: brick.color,
        size: 2 + Math.random() * 2,
      });
    }
  }

  private spawnCollectParticles(x: number, y: number, type: PowerUpType): void {
    const color = POWERUP_COLORS[type];

    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const speed = 3 + Math.random() * 4;
      this.addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.03 + Math.random() * 0.02,
        color,
        size: 3 + Math.random() * 3,
      });
    }
  }

  private addParticle(p: Omit<Particle, "id">): void {
    this.state.particles.push({ id: this.state._nextId++, ...p });
  }

  private updateParticles(): void {
    for (const p of this.state.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12; // gravity
      p.vx *= 0.98; // drag
      p.life -= p.decay;
    }
    this.state.particles = this.state.particles.filter((p) => p.life > 0);
  }
}
