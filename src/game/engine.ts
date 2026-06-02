import type {
  Ball,
  Brick,
  Bumper,
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
  createPrincipleStats,
  TODOTERRENO_PADDLE_MULT,
  TODOTERRENO_MAGNET_RADIUS,
  TODOTERRENO_RECOVERY_LIMIT,
  TODOTERRENO_EDGE_THRESHOLD,
  TODOTERRENO_MIN_VY_RATIO,
  FANCLIENTE_PRIORITY_COUNT,
  FANCLIENTE_BONUS_MULT,
  FANCLIENTE_MAX_NUDGE_RAD,
  VALENTIA_SPEED_MULT,
  VALENTIA_CHAIN_EVERY,
  HUELLA_MARK_DURATION_MS,
  HUELLA_COMBO_BONUS,
  EQUIPAZO_BUMPER_RADIUS,
  EQUIPAZO_BUMPER_COOLDOWN_MS,
  EQUIPAZO_MAX_BALLS,
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
      principleStats: createPrincipleStats(),
      bumpers: [],
      pierceCounter: 0,
      graciasMoment: false,
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
    this.updateBumpers(now);
    this.updateBalls(now);
    this.updateDroppingPowerUps(now);
    this.maintainPriorityCluster(now);
    this.cleanupMarks(now);
    this.expireEffects(now);

    if (this.state.bricks.every((b) => !b.alive)) {
      soundEngine.levelComplete();
      this.state.graciasMoment = true;
      this.advanceLevel();
    }
  }

  // True if the player currently has the given active effect.
  private hasEffect(type: PowerUpType): boolean {
    return this.state.activeEffects.some((e) => e.type === type);
  }

  private bump(type: PowerUpType, key: string, by = 1): void {
    const s = this.state.principleStats[type];
    s.custom[key] = (s.custom[key] ?? 0) + by;
    s.impactScore += by;
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
    this.state.bumpers = [];
    this.state.pierceCounter = 0;
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

  private updateBalls(now: number): void {
    const lost: number[] = [];
    const wantTrail =
      this.hasEffect("valentia") || this.hasEffect("dejamos_huella");

    for (const ball of this.state.balls) {
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Maintain trail (Valentía / Dejamos Huella)
      if (wantTrail) {
        if (!ball.trail) ball.trail = [];
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 10) ball.trail.shift();
      } else if (ball.trail && ball.trail.length > 0) {
        ball.trail.length = 0;
      }

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

      this.checkBumperCollisions(ball, now);
      this.checkPaddleCollision(ball, now);
      this.checkBrickCollisions(ball, now);
    }

    this.state.balls = this.state.balls.filter((b) => !lost.includes(b.id));

    if (this.state.balls.length === 0) {
      this.loseLife();
    }
  }

  private checkPaddleCollision(ball: Ball, now: number): void {
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

      // ── Todo Terreno · Recovery Assist ─────────────────────────────────
      // If the player has the principle active, correct dangerous angles
      // (edge hits / near-horizontal exits) up to RECOVERY_LIMIT times.
      if (this.hasEffect("todo_terreno")) {
        const recoveriesUsed =
          this.state.principleStats.todo_terreno.custom.recoveryBounces ?? 0;
        if (recoveriesUsed < TODOTERRENO_RECOVERY_LIMIT) {
          const edge = Math.abs(hitPos) >= TODOTERRENO_EDGE_THRESHOLD;
          const flat =
            Math.abs(ball.vy) / Math.max(0.001, Math.abs(ball.vx)) <
            TODOTERRENO_MIN_VY_RATIO;
          if (edge || flat) {
            // Re-aim ball toward a safe upward angle.
            const totalNow = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
            const targetAngle = -Math.PI / 2 + hitPos * (Math.PI / 4); // ±45°
            ball.vx = Math.cos(targetAngle) * totalNow;
            ball.vy = Math.sin(targetAngle) * totalNow;
            this.bump("todo_terreno", "recoveryBounces");
            if (edge) this.bump("todo_terreno", "edgeSaves");
            this.state.graciasMoment = true;
            soundEngine.principleImpact("todo_terreno");
          }
        }
      }

      // ── Fan Cliente · Smart Targeting ──────────────────────────────────
      // Soft nudge of up to 8° toward a priority brick after paddle rebound.
      if (this.hasEffect("fan_cliente")) {
        const target = this.pickPriorityTarget(ball);
        if (target) {
          const cx = target.x + target.width / 2;
          const cy = target.y + target.height / 2;
          const desired = Math.atan2(cy - ball.y, cx - ball.x);
          const current = Math.atan2(ball.vy, ball.vx);
          let delta = desired - current;
          while (delta > Math.PI) delta -= Math.PI * 2;
          while (delta < -Math.PI) delta += Math.PI * 2;
          const clamped = Math.max(
            -FANCLIENTE_MAX_NUDGE_RAD,
            Math.min(FANCLIENTE_MAX_NUDGE_RAD, delta),
          );
          const speedNow = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
          const finalAngle = current + clamped;
          ball.vx = Math.cos(finalAngle) * speedNow;
          ball.vy = Math.sin(finalAngle) * speedNow;
          if (Math.abs(clamped) > 0.001) {
            this.bump("fan_cliente", "assistCorrections");
          }
        }
      }

      void now;
      soundEngine.paddleHit();
    }
  }

  // Finds the priority brick most aligned with the ball's upward trajectory.
  private pickPriorityTarget(ball: Ball): Brick | null {
    let best: Brick | null = null;
    let bestScore = -Infinity;
    for (const b of this.state.bricks) {
      if (!b.alive || !b.priority) continue;
      const cx = b.x + b.width / 2;
      const cy = b.y + b.height / 2;
      if (cy >= ball.y) continue; // only targets above
      const dx = cx - ball.x;
      const dy = cy - ball.y;
      const dist = Math.hypot(dx, dy);
      // Prefer closer + higher-row bricks
      const score = -dist - cy * 0.5;
      if (score > bestScore) {
        bestScore = score;
        best = b;
      }
    }
    return best;
  }

  private checkBrickCollisions(ball: Ball, now: number): void {
    for (const brick of this.state.bricks) {
      if (!brick.alive) continue;

      const side = this.collisionSide(ball, brick);
      if (!side) continue;

      const wasPriority = !!brick.priority;
      const wasMarked = !!brick.markedUntil && brick.markedUntil > now;

      if (!ball.fireball) {
        if (side === "left" || side === "right") ball.vx = -ball.vx;
        else ball.vy = -ball.vy;
      } else {
        // Valentía pierce: count and chain every Nth hit.
        this.state.pierceCounter++;
        this.bump("valentia", "pierceHits");
        brick.ignitedAt = now;
        if (this.state.pierceCounter % VALENTIA_CHAIN_EVERY === 0) {
          this.applyTransformationChain(brick, now);
        }
      }

      brick.hitsLeft--;

      if (brick.hitsLeft <= 0) {
        brick.alive = false;
        this.state.bricksBroken++;
        let earned = brick.points;
        if (wasPriority) {
          earned = Math.round(earned * FANCLIENTE_BONUS_MULT);
          const bonus = earned - brick.points;
          this.bump("fan_cliente", "priorityBricksBroken");
          this.bump("fan_cliente", "clientBonusScore", bonus);
          soundEngine.principleImpact("fan_cliente");
        }
        if (wasMarked) {
          earned += HUELLA_COMBO_BONUS;
          this.bump("dejamos_huella", "markedBricksBroken");
          this.bump("dejamos_huella", "trailComboCount");
          this.bump("dejamos_huella", "legacyBonusScore", HUELLA_COMBO_BONUS);
          soundEngine.principleImpact("dejamos_huella");
        }
        this.state.score += earned;
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

        // Dejamos Huella · mark orthogonal neighbors for HUELLA_MARK_DURATION_MS.
        if (this.hasEffect("dejamos_huella")) {
          this.markNeighbors(brick, now);
        }
      } else {
        soundEngine.brickHit();
        this.spawnHitParticles(brick);
      }

      // One brick collision per ball per frame (unless fireball)
      if (!ball.fireball) break;
    }
  }

  // Valentía transformation chain: crack a neighbor brick.
  private applyTransformationChain(origin: Brick, now: number): void {
    const neighbor = this.state.bricks.find(
      (b) =>
        b.alive &&
        b !== origin &&
        Math.abs(b.col - origin.col) + Math.abs(b.row - origin.row) === 1,
    );
    if (!neighbor) return;
    neighbor.hitsLeft = Math.max(0, neighbor.hitsLeft - 1);
    neighbor.ignitedAt = now;
    this.bump("valentia", "transformationChains");
    if (neighbor.hitsLeft <= 0) {
      neighbor.alive = false;
      this.state.bricksBroken++;
      this.state.score += neighbor.points;
      this.spawnBrickParticles(neighbor);
      this.bump("valentia", "ignitedBricks");
    }
    soundEngine.principleImpact("valentia");
  }

  private markNeighbors(origin: Brick, now: number): void {
    const expires = now + HUELLA_MARK_DURATION_MS;
    for (const b of this.state.bricks) {
      if (!b.alive || b === origin) continue;
      if (Math.abs(b.col - origin.col) + Math.abs(b.row - origin.row) === 1) {
        b.markedUntil = expires;
        this.bump("dejamos_huella", "markedBricksCreated");
      }
    }
  }

  private cleanupMarks(now: number): void {
    for (const b of this.state.bricks) {
      if (b.markedUntil && b.markedUntil <= now) {
        b.markedUntil = undefined;
      }
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
    this.state.bumpers = [];
    this.state.pierceCounter = 0;
    // Clear cultural brick states.
    for (const b of this.state.bricks) {
      b.priority = false;
      b.markedUntil = undefined;
      b.ignitedAt = undefined;
    }
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
    this.state.principleStats[brick.powerUp!].spawned++;
  }

  private updateDroppingPowerUps(now: number): void {
    const gone: number[] = [];
    // Todo Terreno extends the catch radius around the paddle.
    const magnet = this.hasEffect("todo_terreno")
      ? TODOTERRENO_MAGNET_RADIUS
      : 0;

    for (const pu of this.state.droppingPowerUps) {
      pu.y += pu.vy;

      const { paddle } = this.state;
      const pL = paddle.x - paddle.width / 2 - 12 - magnet;
      const pR = paddle.x + paddle.width / 2 + 12 + magnet;
      const pT = paddle.y - paddle.height / 2 - magnet * 0.4;
      const pB = paddle.y + paddle.height / 2;

      if (pu.x >= pL && pu.x <= pR && pu.y + 10 >= pT && pu.y <= pB) {
        gone.push(pu.id);
        if (magnet > 0) this.bump("todo_terreno", "magnetizedPickups");
        this.applyPowerUp(pu.type, now);
        this.spawnCollectParticles(pu.x, pu.y, pu.type);
      } else if (pu.y > CANVAS_HEIGHT + 30) {
        gone.push(pu.id);
        this.state.powerUpsMissed++;
        this.state.powerUpsMissedMap[pu.type]++;
        this.state.principleStats[pu.type].missed++;
      }
    }

    this.state.droppingPowerUps = this.state.droppingPowerUps.filter(
      (pu) => !gone.includes(pu.id),
    );
  }

  private applyPowerUp(type: PowerUpType, now: number): void {
    soundEngine.powerUpCollect();
    soundEngine.powerUpActivate(type);
    this.state.powerUpsCaught++;
    this.state.powerUpsCaughtMap[type]++;
    this.state.principleStats[type].caught++;

    // Refresh or add effect (re-collection extends duration).
    this.state.activeEffects = this.state.activeEffects.filter(
      (e) => e.type !== type,
    );
    this.state.activeEffects.push({
      type,
      expiresAt: now + POWERUP_DURATION_MS,
      collectedAt: now,
    });

    switch (type) {
      case "todo_terreno":
        // Adaptive paddle: 30 % wider; magnet radius handled in pickup.
        this.state.paddle.width =
          this.state.paddle.baseWidth * TODOTERRENO_PADDLE_MULT;
        // Reset recovery counter so the player gets a fresh quota.
        this.state.principleStats.todo_terreno.custom.recoveryBounces = 0;
        break;

      case "fan_cliente":
        // Build a small priority cluster of bricks.
        this.rebuildPriorityCluster();
        break;

      case "valentia":
        // Fireball + +6 % speed.
        this.state.balls.forEach((b) => {
          b.fireball = true;
          const s = Math.sqrt(b.vx ** 2 + b.vy ** 2);
          if (s > 0) {
            const ns = Math.min(BALL_MAX_SPEED, s * VALENTIA_SPEED_MULT);
            b.vx *= ns / s;
            b.vy *= ns / s;
          }
        });
        this.state.pierceCounter = 0;
        break;

      case "dejamos_huella":
        // No instant action — works passively on brick breaks.
        break;

      case "equipazo":
        // Spawn two wingmate bumpers + an auxiliary ball if needed.
        this.spawnBumpers();
        if (this.state.balls.length < 2) {
          const src = this.state.balls[0];
          if (src) {
            this.state.balls.push({
              id: this.state._nextId++,
              x: src.x,
              y: src.y,
              vx: -src.vx + (Math.random() - 0.5) * 2,
              vy: src.vy,
              radius: BALL_RADIUS,
              fireball: src.fireball,
            });
          }
        }
        break;
    }
  }

  private expireEffects(now: number): void {
    for (const eff of this.state.activeEffects) {
      if (now < eff.expiresAt) continue;

      switch (eff.type) {
        case "todo_terreno":
          this.state.paddle.width = this.state.paddle.baseWidth;
          break;
        case "valentia":
          this.state.balls.forEach((b) => {
            b.fireball = false;
            if (b.trail) b.trail.length = 0;
          });
          this.state.pierceCounter = 0;
          break;
        case "fan_cliente":
          // Clear priority highlight when the effect expires.
          for (const b of this.state.bricks) b.priority = false;
          break;
        case "equipazo":
          this.state.bumpers = [];
          break;
        case "dejamos_huella":
          this.state.balls.forEach((b) => {
            if (b.trail) b.trail.length = 0;
          });
          break;
      }
    }

    this.state.activeEffects = this.state.activeEffects.filter(
      (e) => now < e.expiresAt,
    );
  }

  // ─── Fan Cliente · Priority cluster ─────────────────────────────────────────

  private rebuildPriorityCluster(): void {
    const alive = this.state.bricks.filter((b) => b.alive);
    if (alive.length === 0) return;
    // Score each alive brick: prefer high-value (lower row) + near horizontal center.
    const cx = CANVAS_WIDTH / 2;
    const ranked = alive
      .map((b) => {
        const dx = Math.abs(b.x + b.width / 2 - cx);
        const score = b.points * 2 - dx * 0.4 - b.row * 6;
        return { brick: b, score };
      })
      .sort((a, b) => b.score - a.score);

    for (const b of this.state.bricks) b.priority = false;
    for (const { brick } of ranked.slice(0, FANCLIENTE_PRIORITY_COUNT)) {
      brick.priority = true;
    }
  }

  private maintainPriorityCluster(_now: number): void {
    if (!this.hasEffect("fan_cliente")) return;
    const remaining = this.state.bricks.some((b) => b.alive && b.priority);
    if (!remaining) this.rebuildPriorityCluster();
  }

  // ─── Equipazo · Bumpers ─────────────────────────────────────────────────────

  private spawnBumpers(): void {
    const y = CANVAS_HEIGHT - PADDLE_BOTTOM_MARGIN + 4;
    const margin = 38;
    this.state.bumpers = [
      {
        id: this.state._nextId++,
        x: margin,
        y,
        radius: EQUIPAZO_BUMPER_RADIUS,
        cooldownUntil: 0,
        flashAt: 0,
      },
      {
        id: this.state._nextId++,
        x: CANVAS_WIDTH - margin,
        y,
        radius: EQUIPAZO_BUMPER_RADIUS,
        cooldownUntil: 0,
        flashAt: 0,
      },
    ];
  }

  private updateBumpers(_now: number): void {
    // Bumpers are stationary for now; this hook is reserved for future motion.
    void _now;
  }

  private checkBumperCollisions(ball: Ball, now: number): void {
    if (this.state.bumpers.length === 0) return;
    for (const bump of this.state.bumpers) {
      if (bump.cooldownUntil > now) continue;
      const dx = ball.x - bump.x;
      const dy = ball.y - bump.y;
      const dist = Math.hypot(dx, dy);
      const minDist = ball.radius + bump.radius;
      if (dist > minDist) continue;
      // Reflect off the bumper center.
      const nx = dx / (dist || 1);
      const ny = dy / (dist || 1);
      const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
      // Push ball out and reflect upward bias.
      ball.x = bump.x + nx * (minDist + 0.5);
      ball.y = bump.y + ny * (minDist + 0.5);
      ball.vx = nx * speed;
      ball.vy = -Math.abs(ny * speed) - 0.5; // always push back up
      bump.cooldownUntil = now + EQUIPAZO_BUMPER_COOLDOWN_MS;
      bump.flashAt = now;
      this.bump("equipazo", "bumperReflections");
      // Below the paddle line: this is effectively a save.
      if (ball.y > this.state.paddle.y - 4) {
        this.bump("equipazo", "teamSaves");
        this.state.graciasMoment = true;
      }
      soundEngine.principleImpact("equipazo");
      break;
    }
    void EQUIPAZO_MAX_BALLS;
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
