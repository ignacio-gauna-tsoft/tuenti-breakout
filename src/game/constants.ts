import type { PowerUpType } from "./types";

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
const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const BACKGROUND_IMAGE = publicAsset("assets/fondo-principal.png");

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

export const POWERUP_TYPES: PowerUpType[] = [
  "valentia",
  "fan_cliente",
  "equipazo",
  "todo_terreno",
  "dejamos_huella",
];

export function createPowerUpCountMap(): Record<PowerUpType, number> {
  return {
    valentia: 0,
    fan_cliente: 0,
    equipazo: 0,
    todo_terreno: 0,
    dejamos_huella: 0,
  };
}

export const POWERUP_COLORS: Record<PowerUpType, string> = {
  valentia: "#E91E8C",
  fan_cliente: "#9C5FD4",
  equipazo: "#00D4FF",
  todo_terreno: "#FF6B35",
  dejamos_huella: "#00E5A0",
};

// Labels with \n for two-line rendering (canvas and React)
export const POWERUP_LABELS: Record<PowerUpType, string> = {
  valentia: "Valentía que\nTransforma",
  fan_cliente: "Fan\nCliente",
  equipazo: "Equipazo",
  todo_terreno: "Todo\nTerreno",
  dejamos_huella: "Inspiramos y\nDejamos huella",
};

export const POWERUP_IMAGES: Record<PowerUpType, string> = {
  valentia: publicAsset("assets/prize-1.png"),
  fan_cliente: publicAsset("assets/prize-2.png"),
  equipazo: publicAsset("assets/prize-3.png"),
  todo_terreno: publicAsset("assets/prize-4.png"),
  dejamos_huella: publicAsset("assets/prize-5.png"),
};

// Unicode icons as fallback
export const POWERUP_ICONS: Record<PowerUpType, string> = {
  valentia: "🚀",
  fan_cliente: "★",
  equipazo: "🤝",
  todo_terreno: "🧭",
  dejamos_huella: "🔑",
};
