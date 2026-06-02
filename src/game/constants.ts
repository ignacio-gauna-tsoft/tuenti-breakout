import type { PowerUpType } from "./types";
import type { PrincipleStat } from "./types";

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
export const POWERUP_DURATION_MS = 15000;
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

export function createPrincipleStats(): Record<PowerUpType, PrincipleStat> {
  const blank = (): PrincipleStat => ({
    spawned: 0,
    caught: 0,
    missed: 0,
    uptimeMs: 0,
    impactScore: 0,
    custom: {},
  });
  return {
    valentia: blank(),
    fan_cliente: blank(),
    equipazo: blank(),
    todo_terreno: blank(),
    dejamos_huella: blank(),
  };
}

// ─── Mechanic balance (Prompt 02) ─────────────────────────────────────────────

// Todo Terreno · Modo Resolver
export const TODOTERRENO_PADDLE_MULT = 1.3;
export const TODOTERRENO_MAGNET_RADIUS = 24;
export const TODOTERRENO_RECOVERY_LIMIT = 3;
/** A bounce is considered "edge save" if hit position is in the outer 15 %. */
export const TODOTERRENO_EDGE_THRESHOLD = 0.85;
/** Min |vy/vx| ratio after a paddle hit — below this, the angle is corrected. */
export const TODOTERRENO_MIN_VY_RATIO = 0.55;

// Fan Cliente · Radar Cliente
export const FANCLIENTE_PRIORITY_COUNT = 5;
export const FANCLIENTE_BONUS_MULT = 1.15;
export const FANCLIENTE_MAX_NUDGE_RAD = (8 * Math.PI) / 180; // 8°

// Valentía · Turbo Cambio
export const VALENTIA_SPEED_MULT = 1.06;
export const VALENTIA_CHAIN_EVERY = 3;

// Dejamos Huella · Modo Legado
export const HUELLA_MARK_DURATION_MS = 4000;
export const HUELLA_COMBO_BONUS = 25;

// Equipazo · Red de Apoyo
export const EQUIPAZO_BUMPER_RADIUS = 12;
export const EQUIPAZO_BUMPER_COOLDOWN_MS = 900;
export const EQUIPAZO_MAX_BALLS = 4;

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

// ─── Cultural catalog ─────────────────────────────────────────────────────────
// Single source of truth that UI, toasts, HUD and GameOver share so the same
// language is used everywhere. Mechanics stay as they are in this iteration.

export interface PrincipleMeta {
  /** Internal code (matches PowerUpType). */
  code: PowerUpType;
  /** Long, official cultural label. */
  label: string;
  /** Short label for chips, badges, HUD. */
  shortLabel: string;
  /** Gameplay-mode name shown in toasts and chips. */
  modeName: string;
  /** Cultural description (one-liner). */
  description: string;
  /** Short gameplay-effect label. */
  effectLabel: string;
  /** First-time educative toast copy. */
  educationalCopy: string;
  /** Long-form copy for GameOver cards and detailed views. */
  extendedCopy: string;
  /** One-liner shown in HUD rotator. */
  rotatorTip: string;
  /** Primary brand color. */
  color: string;
  /** Soft accent color. */
  accentColor: string;
  /** Image asset path. */
  image: string;
}

export const PRINCIPLES: Record<PowerUpType, PrincipleMeta> = {
  todo_terreno: {
    code: "todo_terreno",
    label: "Todo Terreno",
    shortLabel: "Todo Terreno",
    modeName: "Modo Resolver",
    description: "Siempre encontramos la manera de resolver.",
    effectLabel: "Paleta adaptable y asistencia de rescate.",
    educationalCopy:
      "Modo Resolver · Siempre encontramos la manera de resolver.",
    extendedCopy:
      "Cuando aparece un bloqueo, no frenamos: cambiamos la ruta hasta encontrar cómo sí.",
    rotatorTip: "Todo Terreno: siempre encontramos la manera.",
    color: "#FF6B35",
    accentColor: "#FFB07A",
    image: publicAsset("assets/prize-4.png"),
  },
  fan_cliente: {
    code: "fan_cliente",
    label: "Fan Cliente",
    shortLabel: "Fan Cliente",
    modeName: "Radar Cliente",
    description: "Escuchamos, entendemos y nos ponemos en su lugar.",
    effectLabel: "Radar y guía inteligente hacia objetivos.",
    educationalCopy:
      "Radar Cliente · Escuchamos, entendemos y nos ponemos en su lugar.",
    extendedCopy:
      "Escuchar bien cambia el resultado: entender la necesidad real ayuda a priorizar mejor.",
    rotatorTip: "Fan Cliente: escuchar > adivinar.",
    color: "#9C5FD4",
    accentColor: "#C8A6F0",
    image: publicAsset("assets/prize-2.png"),
  },
  valentia: {
    code: "valentia",
    label: "Valentía que Transforma",
    shortLabel: "Valentía",
    modeName: "Turbo Cambio",
    description: "Nos animamos a cambiar para crecer.",
    effectLabel: "Fireball transformadora.",
    educationalCopy:
      "Turbo Cambio · Nos animamos a cambiar para crecer.",
    extendedCopy:
      "Cambiar da vértigo, pero abre camino: probar con criterio también es avanzar.",
    rotatorTip: "Valentía: probar con criterio también es avanzar.",
    color: "#E91E8C",
    accentColor: "#FF7AC4",
    image: publicAsset("assets/prize-1.png"),
  },
  dejamos_huella: {
    code: "dejamos_huella",
    label: "Inspiramos y Dejamos Huella",
    shortLabel: "Dejás Huella",
    modeName: "Modo Legado",
    description: "Construimos un camino que inspira y hace la diferencia.",
    effectLabel: "Estela, marca y combo de legado.",
    educationalCopy:
      "Modo Legado · Construimos un camino que inspira y hace la diferencia.",
    extendedCopy:
      "No alcanza con pasar: buscamos dejar algo mejor que antes.",
    rotatorTip: "Dejás Huella: dejamos algo mejor que antes.",
    color: "#00E5A0",
    accentColor: "#7DFFD3",
    image: publicAsset("assets/prize-5.png"),
  },
  equipazo: {
    code: "equipazo",
    label: "Equipazo",
    shortLabel: "Equipazo",
    modeName: "Red de Apoyo",
    description: "Trabajamos juntos para alcanzar nuestros logros.",
    effectLabel: "Apoyos reales que rescatan y multiplican jugadas.",
    educationalCopy:
      "Red de Apoyo · Trabajamos juntos para alcanzar nuestros logros.",
    extendedCopy: "Solo se llega rápido; juntos se llega mejor.",
    rotatorTip: "Equipazo: juntos llegamos mejor.",
    color: "#56C7FF",
    accentColor: "#A6E0FF",
    image: publicAsset("assets/prize-3.png"),
  },
};

// Display order for cultural surfaces (StartScreen chips, GameOver cards).
// Matches the institutional order used in brand materials.
export const PRINCIPLES_ORDER: PowerUpType[] = [
  "todo_terreno",
  "fan_cliente",
  "valentia",
  "dejamos_huella",
  "equipazo",
];

// "¡Gracias!" is NOT a power-up — it is a recognition layer used on:
//  - new high score
//  - level complete
//  - share / open ranking
//  - 3+ distinct principles caught in a single run
export const GRACIAS = {
  label: "¡Gracias!",
  copy: "Reconocer también es cultura.",
} as const;
