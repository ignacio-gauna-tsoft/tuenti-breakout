export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 640;

export const PADDLE_BASE_WIDTH = 90;
export const PADDLE_HEIGHT = 12;
export const PADDLE_BOTTOM_MARGIN = 50;
export const PADDLE_SPEED = 7;

export const BALL_RADIUS = 7;
export const BALL_SPEED = 5.0;
export const BALL_MAX_SPEED = 10;

export const BRICK_COLS = 9;
export const BRICK_ROWS = 6;
export const BRICK_WIDTH = 44;
export const BRICK_HEIGHT = 18;
export const BRICK_GAP = 6;
export const BRICK_OFFSET_TOP = 90;
// (480 - 9*50 + 6) / 2 = 18
export const BRICK_OFFSET_LEFT = 18;

export const INITIAL_LIVES = 3;
export const POWERUP_FALL_SPEED = 2.5;
export const POWERUP_DURATION_MS = 9000;

// Points per row (top row = most valuable)
export const BRICK_POINTS = [150, 120, 90, 60, 40, 30];

// Colors per row (top → bottom)
export const BRICK_ROW_COLORS = [
  "#FF4DB8", // pitaya light
  "#E91E8C", // pitaya
  "#C2006B", // pitaya dark
  "#9C5FD4", // purple
  "#7C3ABF", // deep purple
  "#5C1BAA", // darker purple
];

export const POWERUP_COLORS: Record<string, string> = {
  wide_paddle: "#E91E8C",
  double_ball: "#00D4FF",
  fireball: "#9C5FD4",
};

// Labels with \n for two-line rendering (canvas and React)
export const POWERUP_LABELS: Record<string, string> = {
  wide_paddle: "Continuidad\nOperativa",
  double_ball: "Captura\nde Valor",
  fireball: "Transformación",
};

// Unicode icons rendered inside the circle badge
export const POWERUP_ICONS: Record<string, string> = {
  wide_paddle: "▶▶",
  double_ball: "★",
  fireball: "↻",
};
