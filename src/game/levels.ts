import type { Brick, PowerUpType } from "./types";
import {
  BRICK_COLS,
  BRICK_ROWS,
  BRICK_WIDTH,
  BRICK_HEIGHT,
  BRICK_GAP,
  BRICK_OFFSET_TOP,
  BRICK_OFFSET_LEFT,
  BRICK_ROW_COLORS,
  BRICK_POINTS,
} from "./constants";

const POWERUP_POOL: PowerUpType[] = ["wide_paddle", "double_ball", "fireball"];

// 0 = empty, 1 = 1 hit, 2 = 2 hits, 3 = 3 hits
const LEVEL_LAYOUTS: number[][][] = [
  // Level 1 – full grid, 1-hit bricks
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  // Level 2 – introduces 2-hit bricks
  [
    [2, 2, 2, 2, 2, 2, 2, 2, 2],
    [1, 2, 1, 2, 1, 2, 1, 2, 1],
    [1, 1, 2, 1, 1, 1, 2, 1, 1],
    [1, 2, 1, 1, 2, 1, 1, 2, 1],
    [1, 1, 1, 2, 1, 2, 1, 1, 1],
    [1, 1, 2, 1, 1, 1, 2, 1, 1],
  ],
  // Level 3 – adds 3-hit bricks
  [
    [3, 3, 3, 3, 3, 3, 3, 3, 3],
    [2, 3, 2, 3, 2, 3, 2, 3, 2],
    [2, 2, 3, 2, 2, 2, 3, 2, 2],
    [1, 2, 2, 3, 2, 3, 2, 2, 1],
    [1, 1, 2, 2, 2, 2, 2, 1, 1],
    [1, 1, 1, 2, 1, 2, 1, 1, 1],
  ],
];

export function createBricks(
  level: number,
  idCounter: { value: number },
): Brick[] {
  const layoutIdx = Math.min(level - 1, LEVEL_LAYOUTS.length - 1);
  const layout = LEVEL_LAYOUTS[layoutIdx];
  const bricks: Brick[] = [];

  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      const hits = layout[row]?.[col] ?? 1;
      if (hits === 0) continue;

      const hasPowerUp = Math.random() < 0.2;
      const powerUp: PowerUpType | null = hasPowerUp
        ? POWERUP_POOL[Math.floor(Math.random() * POWERUP_POOL.length)]
        : null;

      bricks.push({
        id: idCounter.value++,
        col,
        row,
        x: BRICK_OFFSET_LEFT + col * (BRICK_WIDTH + BRICK_GAP),
        y: BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        color: BRICK_ROW_COLORS[row],
        hitsRequired: hits,
        hitsLeft: hits,
        points: BRICK_POINTS[row] * hits,
        powerUp,
        alive: true,
      });
    }
  }

  return bricks;
}
