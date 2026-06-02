import type { GameState } from "./types";
import {
  BACKGROUND_IMAGE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  POWERUP_COLORS,
  POWERUP_IMAGES,
} from "./constants";

// ─── Prize image cache ────────────────────────────────────────────────────────

const _imgCache = new Map<string, HTMLImageElement>();
let _backgroundLayer: HTMLCanvasElement | null = null;

const BACKGROUND_STARS = Array.from({ length: 32 }, (_, i) => {
  const xSeed = (i * 67 + 19) % 480;
  const ySeed = (i * 113 + 41) % 640;
  const phase = ((i * 31) % 100) / 100;
  const radius = 0.45 + ((i * 17) % 9) * 0.11;
  return { phase, radius, x: xSeed, y: ySeed };
});

function getCachedImage(src: string): HTMLImageElement {
  if (!_imgCache.has(src)) {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    _imgCache.set(src, img);
  }
  return _imgCache.get(src)!;
}

getCachedImage(BACKGROUND_IMAGE);
Object.values(POWERUP_IMAGES).forEach(getCachedImage);

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
): void {
  const baseScale = Math.max(
    CANVAS_WIDTH / img.naturalWidth,
    CANVAS_HEIGHT / img.naturalHeight,
  );
  const driftScale = 1.06;
  const scale = baseScale * driftScale;
  const width = img.naturalWidth * scale;
  const height = img.naturalHeight * scale;
  const x = (CANVAS_WIDTH - width) / 2;
  const y = (CANVAS_HEIGHT - height) / 2;

  ctx.drawImage(img, x, y, width, height);
}

function drawStarfield(ctx: CanvasRenderingContext2D, frame: number): void {
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (const star of BACKGROUND_STARS) {
    const twinkle = Math.sin(frame * 0.025 + star.phase * Math.PI * 2);
    const alpha = 0.2 + (twinkle + 1) * 0.22;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawSupernovaGlow(ctx: CanvasRenderingContext2D): void {
  const cx = CANVAS_WIDTH * 0.72;
  const cy = CANVAS_HEIGHT * 0.82;

  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 210);
  glow.addColorStop(0, "rgba(255,120,220,0.26)");
  glow.addColorStop(0.28, "rgba(155,70,255,0.2)");
  glow.addColorStop(0.72, "rgba(40,80,255,0.08)");
  glow.addColorStop(1, "rgba(7,7,26,0)");

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.restore();
}

function getBackgroundLayer(img: HTMLImageElement): HTMLCanvasElement | null {
  if (!img.complete || img.naturalWidth <= 0) return null;
  if (_backgroundLayer) return _backgroundLayer;

  const layer = document.createElement("canvas");
  layer.width = CANVAS_WIDTH;
  layer.height = CANVAS_HEIGHT;

  const layerCtx = layer.getContext("2d");
  if (!layerCtx) return null;

  drawCoverImage(layerCtx, img);
  drawSupernovaGlow(layerCtx);

  const overlay = layerCtx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  overlay.addColorStop(0, "rgba(7,7,26,0.32)");
  overlay.addColorStop(1, "rgba(7,7,26,0.5)");
  layerCtx.fillStyle = overlay;
  layerCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  _backgroundLayer = layer;
  return layer;
}

// ─── Layers ──────────────────────────────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D, frame: number): void {
  const bgImage = getCachedImage(BACKGROUND_IMAGE);
  const backgroundLayer = getBackgroundLayer(bgImage);

  if (backgroundLayer) {
    ctx.drawImage(backgroundLayer, 0, 0);
  } else {
    ctx.fillStyle = "#07071a";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  drawStarfield(ctx, frame);

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
  const now = performance.now();
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

    // Fan Cliente · priority outline (radar pulse).
    if (brick.priority) {
      const pulse = 0.55 + Math.sin(state.frame * 0.12) * 0.25;
      ctx.shadowBlur = 0;
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(156, 95, 212, ${pulse})`;
      roundRect(ctx, x - 1, y - 1, w + 2, h + 2, 5);
      ctx.stroke();
    }

    // Dejamos Huella · marked halo.
    if (brick.markedUntil && brick.markedUntil > now) {
      const remaining = (brick.markedUntil - now) / 4000; // assume 4s
      const a = 0.25 + remaining * 0.45;
      ctx.shadowColor = "#00E5A0";
      ctx.shadowBlur = 14;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `rgba(0, 229, 160, ${a})`;
      roundRect(ctx, x - 2, y - 2, w + 4, h + 4, 6);
      ctx.stroke();
    }

    // Valentía · ignited flash.
    if (brick.ignitedAt && now - brick.ignitedAt < 180) {
      const a = 1 - (now - brick.ignitedAt) / 180;
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(255, 209, 102, ${a * 0.55})`;
      roundRect(ctx, x, y, w, h, 4);
      ctx.fill();
    }

    ctx.restore();
  }
}

function drawPaddle(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { paddle } = state;
  const px = paddle.x - paddle.width / 2;
  const py = paddle.y - paddle.height / 2;

  const hasTodoTerreno = state.activeEffects.some(
    (e) => e.type === "todo_terreno",
  );

  ctx.save();

  // Todo Terreno aura: stable, "resolutive" ring around the paddle.
  if (hasTodoTerreno) {
    ctx.save();
    const pulse = 0.5 + Math.sin(state.frame * 0.08) * 0.18;
    ctx.shadowColor = "#FF6B35";
    ctx.shadowBlur = 18;
    ctx.strokeStyle = `rgba(255, 107, 53, ${pulse})`;
    ctx.lineWidth = 2;
    roundRect(ctx, px - 6, py - 6, paddle.width + 12, paddle.height + 12, 10);
    ctx.stroke();
    // Soft mint route lines suggesting "rerouting".
    ctx.strokeStyle = "rgba(84, 228, 193, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px - 14, py + paddle.height / 2);
    ctx.lineTo(px - 4, py + paddle.height / 2);
    ctx.moveTo(px + paddle.width + 4, py + paddle.height / 2);
    ctx.lineTo(px + paddle.width + 14, py + paddle.height / 2);
    ctx.stroke();
    ctx.restore();
  }

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

function drawBumpers(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (state.bumpers.length === 0) return;
  const now = performance.now();
  ctx.save();
  for (const b of state.bumpers) {
    const flashing = now - b.flashAt < 220;
    const onCooldown = b.cooldownUntil > now;
    const baseAlpha = onCooldown ? 0.45 : 0.85;
    // Connection line from paddle to bumper.
    ctx.strokeStyle = "rgba(86, 199, 255, 0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(state.paddle.x, state.paddle.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    ctx.shadowColor = "#56C7FF";
    ctx.shadowBlur = flashing ? 22 : 12;
    const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
    grad.addColorStop(0, `rgba(255,255,255,${baseAlpha})`);
    grad.addColorStop(0.5, `rgba(166,224,255,${baseAlpha})`);
    grad.addColorStop(1, "rgba(86, 199, 255, 0.85)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();

    if (flashing) {
      const a = 1 - (now - b.flashAt) / 220;
      ctx.strokeStyle = `rgba(84, 228, 193, ${a})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius + 4 + (1 - a) * 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawBalls(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const ball of state.balls) {
    ctx.save();

    // Trail (Valentía + Dejamos Huella).
    if (ball.trail && ball.trail.length > 1) {
      const trailColor = ball.fireball ? "#FF6B35" : "#00E5A0";
      ctx.shadowColor = trailColor;
      ctx.shadowBlur = 12;
      for (let i = 0; i < ball.trail.length; i++) {
        const p = ball.trail[i];
        const a = (i + 1) / ball.trail.length;
        ctx.globalAlpha = a * 0.5;
        ctx.fillStyle = trailColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, ball.radius * (0.3 + a * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

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
    const imgSrc = POWERUP_IMAGES[pu.type];
    const size = 32; // diameter

    ctx.save();

    // Outer glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;

    if (imgSrc) {
      const img = getCachedImage(imgSrc);
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, pu.x - size / 2, pu.y - size / 2, size, size);
      } else {
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, size / 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

function isMobileInput(): boolean {
  return (
    window.innerWidth <= 640 ||
    window.matchMedia?.("(pointer: coarse)").matches ||
    false
  );
}

function drawReadyOverlay(ctx: CanvasRenderingContext2D, frame: number): void {
  const pulse = Math.sin(frame * 0.07) * 0.35 + 0.65;
  const arrowShift = Math.sin(frame * 0.08) * 10;
  const mobile = isMobileInput();
  const title = mobile ? "DESLIZA PARA EMPEZAR" : "PRESS SPACE TO LAUNCH";
  const hint = mobile ? "mueve la paleta con el dedo" : "mueve con flechas o A/D";

  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.shadowColor = "#E91E8C";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = 'bold 22px "Orbitron", monospace';
  ctx.fillText("\u2190", CANVAS_WIDTH / 2 - 46 - arrowShift, CANVAS_HEIGHT - 126);
  ctx.fillText("\u2192", CANVAS_WIDTH / 2 + 46 + arrowShift, CANVAS_HEIGHT - 126);

  ctx.shadowBlur = 8;
  ctx.font = 'bold 11px "Space Grotesk", sans-serif';
  ctx.fillText(title, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 96);

  ctx.globalAlpha = pulse * 0.7;
  ctx.shadowBlur = 0;
  ctx.font = '9px "Space Grotesk", sans-serif';
  ctx.fillText(hint, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 78);
  ctx.restore();
}

// ─── Public ───────────────────────────────────────────────────────────────────

export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
): void {
  drawBackground(ctx, state.frame);
  drawBricks(ctx, state);
  drawDroppingPowerUps(ctx, state);
  drawBumpers(ctx, state);
  drawPaddle(ctx, state);
  drawBalls(ctx, state);
  drawParticles(ctx, state);

  if (state.phase === "ready") {
    drawReadyOverlay(ctx, state.frame);
  }
}
