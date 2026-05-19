import type { GameState } from "./types";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  POWERUP_COLORS,
  POWERUP_ICONS,
} from "./constants";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function lighten(hex: string, amt: number): string {
  const r = Math.min(
    255,
    parseInt(hex.slice(1, 3), 16) + Math.round(255 * amt),
  );
  const g = Math.min(
    255,
    parseInt(hex.slice(3, 5), 16) + Math.round(255 * amt),
  );
  const b = Math.min(
    255,
    parseInt(hex.slice(5, 7), 16) + Math.round(255 * amt),
  );
  return `rgb(${r},${g},${b})`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

// ─── Layers ──────────────────────────────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D): void {
  const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  bg.addColorStop(0, "#07071A");
  bg.addColorStop(1, "#0E0E2A");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Subtle grid
  ctx.strokeStyle = "rgba(233,30,140,0.04)";
  ctx.lineWidth = 1;
  const gs = 32;
  for (let x = 0; x <= CANVAS_WIDTH; x += gs) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += gs) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }
}

function drawBricks(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const brick of state.bricks) {
    if (!brick.alive) continue;

    const { x, y, width: w, height: h, color, hitsLeft, hitsRequired } = brick;

    ctx.save();

    // Body
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, lighten(color, 0.28));
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    roundRect(ctx, x, y, w, h, 4);
    ctx.fill();

    // Cracked overlay
    if (hitsLeft < hitsRequired) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 0;
      roundRect(ctx, x, y, w, h, 4);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.28, y + 2);
      ctx.lineTo(x + w * 0.5, y + h / 2);
      ctx.lineTo(x + w * 0.72, y + h - 2);
      ctx.stroke();
    }

    // Top highlight
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.shadowBlur = 0;
    roundRect(ctx, x + 2, y + 2, w - 4, 3, 2);
    ctx.fill();

    // Power-up hint
    if (brick.powerUp) {
      const dotColor = POWERUP_COLORS[brick.powerUp] ?? "#fff";
      ctx.fillStyle = dotColor;
      ctx.shadowColor = dotColor;
      ctx.shadowBlur = 6;
      ctx.font = 'bold 8px "Space Grotesk", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(";)", x + w / 2, y + h / 2);
    }

    ctx.restore();
  }
}

function drawPaddle(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { paddle } = state;
  const px = paddle.x - paddle.width / 2;
  const py = paddle.y - paddle.height / 2;

  ctx.save();
  ctx.shadowColor = "#E91E8C";
  ctx.shadowBlur = 22;

  const grad = ctx.createLinearGradient(px, py, px + paddle.width, py);
  grad.addColorStop(0, "#FF4DB8");
  grad.addColorStop(0.5, "#E91E8C");
  grad.addColorStop(1, "#C2006B");
  ctx.fillStyle = grad;
  roundRect(ctx, px, py, paddle.width, paddle.height, 6);
  ctx.fill();

  // Highlight
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  roundRect(ctx, px + 4, py + 2, paddle.width - 8, 3, 2);
  ctx.fill();

  ctx.restore();
}

function drawBalls(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const ball of state.balls) {
    ctx.save();

    if (ball.fireball) {
      ctx.shadowColor = "#FF6B35";
      ctx.shadowBlur = 28;
      const fg = ctx.createRadialGradient(
        ball.x,
        ball.y,
        0,
        ball.x,
        ball.y,
        ball.radius,
      );
      fg.addColorStop(0, "#FFD600");
      fg.addColorStop(0.5, "#FF6B35");
      fg.addColorStop(1, "#E91E8C");
      ctx.fillStyle = fg;
    } else {
      ctx.shadowColor = "#E91E8C";
      ctx.shadowBlur = 20;
      const bg = ctx.createRadialGradient(
        ball.x - ball.radius * 0.3,
        ball.y - ball.radius * 0.3,
        0,
        ball.x,
        ball.y,
        ball.radius,
      );
      bg.addColorStop(0, "#FFFFFF");
      bg.addColorStop(0.4, "#FFB3DB");
      bg.addColorStop(1, "#E91E8C");
      ctx.fillStyle = bg;
    }

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const p of state.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.5, p.size * p.life), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawDroppingPowerUps(
  ctx: CanvasRenderingContext2D,
  state: GameState,
): void {
  for (const pu of state.droppingPowerUps) {
    const color = POWERUP_COLORS[pu.type] ?? "#fff";
    const icon = POWERUP_ICONS[pu.type] ?? "?";
    const cr = 14; // circle radius

    ctx.save();

    // Outer glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;

    // Circle background gradient
    const grad = ctx.createRadialGradient(
      pu.x - cr * 0.3,
      pu.y - cr * 0.35,
      0,
      pu.x,
      pu.y,
      cr,
    );
    grad.addColorStop(0, hexToRgba(color, 1));
    grad.addColorStop(1, hexToRgba(color, 0.55));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pu.x, pu.y, cr, 0, Math.PI * 2);
    ctx.fill();

    // Subtle inner ring
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pu.x, pu.y, cr - 1, 0, Math.PI * 2);
    ctx.stroke();

    // Icon inside circle
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(icon, pu.x, pu.y);

    ctx.restore();
  }
}

function drawReadyOverlay(ctx: CanvasRenderingContext2D, frame: number): void {
  const pulse = Math.sin(frame * 0.07) * 0.35 + 0.65;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = '13px "Space Grotesk", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    "PRESS SPACE OR TAP TO LAUNCH",
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT - 95,
  );
  ctx.restore();
}

// ─── Public ───────────────────────────────────────────────────────────────────

export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
): void {
  drawBackground(ctx);
  drawBricks(ctx, state);
  drawDroppingPowerUps(ctx, state);
  drawPaddle(ctx, state);
  drawBalls(ctx, state);
  drawParticles(ctx, state);

  if (state.phase === "ready") {
    drawReadyOverlay(ctx, state.frame);
  }
}
