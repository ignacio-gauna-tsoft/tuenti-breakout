import { useCallback, useEffect, useRef, useState } from "react";
import { GameEngine } from "../game/engine";
import { renderGame } from "../game/renderer";
import type {
  InputState,
  GamePhase,
  ActiveEffect,
  PowerUpType,
  PrincipleStat,
} from "../game/types";
import {
  CANVAS_WIDTH,
  createPowerUpCountMap,
  createPrincipleStats,
} from "../game/constants";

export interface PowerUpToast {
  id: number;
  type: PowerUpType;
  count: number;
  pulseKey: number;
  closing: boolean;
}

export interface GameUIState {
  phase: GamePhase;
  score: number;
  lives: number;
  level: number;
  highScore: number;
  activeEffects: ActiveEffect[];
  powerUpsCaught: number;
  powerUpsMissed: number;
  bricksBroken: number;
  bricksRemaining: number;
  powerUpsCaughtMap: Record<PowerUpType, number>;
  powerUpsMissedMap: Record<PowerUpType, number>;
  principleStats: Record<PowerUpType, PrincipleStat>;
  graciasMoment: boolean;
}

const INITIAL_UI: GameUIState = {
  phase: "ready",
  score: 0,
  lives: 3,
  level: 1,
  highScore: parseInt(localStorage.getItem("tuenti-breakout-hs") ?? "0", 10),
  activeEffects: [],
  powerUpsCaught: 0,
  powerUpsMissed: 0,
  bricksBroken: 0,
  bricksRemaining: 0,
  powerUpsCaughtMap: createPowerUpCountMap(),
  powerUpsMissedMap: createPowerUpCountMap(),
  principleStats: createPrincipleStats(),
  graciasMoment: false,
};

interface ToastTimers {
  close: number;
  remove: number;
}

const TOAST_VISIBLE_MS = 1800;
const TOAST_OUT_MS = 400;

export function useBreakoutGame(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const engineRef = useRef<GameEngine | null>(null);
  const rafRef = useRef<number>(0);
  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    spaceJustPressed: false,
    pointerX: null,
  });
  const spaceHeld = useRef(false);
  const pointerDown = useRef(false);
  const pausedRef = useRef(false);
  const pauseStartedAtRef = useRef<number | null>(null);

  const [uiState, setUiState] = useState<GameUIState>(INITIAL_UI);
  const [isPaused, setIsPaused] = useState(false);
  const [toasts, setToasts] = useState<PowerUpToast[]>([]);
  // Maps type → last known collectedAt timestamp (detects re-collections)
  const prevCollectedAtRef = useRef<Map<PowerUpType, number>>(new Map());
  // Tracks which powerup types currently have a visible toast (prevents spam)
  const visibleToastTypesRef = useRef<Set<PowerUpType>>(new Set());
  const visibleToastIdsRef = useRef<Map<PowerUpType, number>>(new Map());
  const toastTimersRef = useRef<Map<PowerUpType, ToastTimers>>(new Map());
  const toastIdRef = useRef(0);

  const clearToastTimers = useCallback((type: PowerUpType) => {
    const timers = toastTimersRef.current.get(type);
    if (!timers) return;

    window.clearTimeout(timers.close);
    window.clearTimeout(timers.remove);
    toastTimersRef.current.delete(type);
  }, []);

  useEffect(() => {
    const toastTimers = toastTimersRef.current;

    return () => {
      toastTimers.forEach((timers) => {
        window.clearTimeout(timers.close);
        window.clearTimeout(timers.remove);
      });
      toastTimers.clear();
    };
  }, []);

  const scheduleToastRemoval = useCallback(
    (type: PowerUpType, id: number) => {
      clearToastTimers(type);

      const close = window.setTimeout(() => {
        setToasts((current) =>
          current.map((toast) =>
            toast.id === id ? { ...toast, closing: true } : toast,
          ),
        );
      }, TOAST_VISIBLE_MS);

      const remove = window.setTimeout(() => {
        visibleToastTypesRef.current.delete(type);
        visibleToastIdsRef.current.delete(type);
        toastTimersRef.current.delete(type);
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, TOAST_VISIBLE_MS + TOAST_OUT_MS);

      toastTimersRef.current.set(type, { close, remove });
    },
    [clearToastTimers],
  );

  const showPowerUpToast = useCallback(
    (type: PowerUpType) => {
      const existingId = visibleToastIdsRef.current.get(type);

      if (existingId !== undefined) {
        setToasts((current) =>
          current.map((toast) =>
            toast.id === existingId
              ? {
                  ...toast,
                  count: toast.count + 1,
                  pulseKey: toast.pulseKey + 1,
                  closing: false,
                }
              : toast,
          ),
        );
        scheduleToastRemoval(type, existingId);
        return;
      }

      const id = toastIdRef.current++;
      visibleToastTypesRef.current.add(type);
      visibleToastIdsRef.current.set(type, id);
      setToasts((current) => [
        ...current,
        { id, type, count: 1, pulseKey: 0, closing: false },
      ]);
      scheduleToastRemoval(type, id);
    },
    [scheduleToastRemoval],
  );

  const pauseGame = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || engine.state.phase === "gameover" || pausedRef.current) {
      return;
    }

    pausedRef.current = true;
    pauseStartedAtRef.current = performance.now();
    inputRef.current.left = false;
    inputRef.current.right = false;
    inputRef.current.spaceJustPressed = false;
    inputRef.current.pointerX = null;
    pointerDown.current = false;
    setIsPaused(true);
  }, []);

  const resumeGame = useCallback(() => {
    if (!pausedRef.current) return;

    const engine = engineRef.current;
    const pauseStartedAt = pauseStartedAtRef.current;
    if (engine && pauseStartedAt !== null) {
      const pausedMs = performance.now() - pauseStartedAt;
      engine.state.activeEffects = engine.state.activeEffects.map((effect) => ({
        ...effect,
        expiresAt: effect.expiresAt + pausedMs,
      }));
    }

    pausedRef.current = false;
    pauseStartedAtRef.current = null;
    setIsPaused(false);
  }, []);

  const togglePause = useCallback(() => {
    if (pausedRef.current) {
      resumeGame();
    } else {
      pauseGame();
    }
  }, [pauseGame, resumeGame]);

  // ─── Start / restart ────────────────────────────────────────────────────────
  const startGame = useCallback((level = 1) => {
    toastTimersRef.current.forEach((timers) => {
      window.clearTimeout(timers.close);
      window.clearTimeout(timers.remove);
    });
    toastTimersRef.current.clear();
    visibleToastTypesRef.current.clear();
    visibleToastIdsRef.current.clear();
    prevCollectedAtRef.current.clear();
    pausedRef.current = false;
    pauseStartedAtRef.current = null;
    setToasts([]);
    setIsPaused(false);

    const hs = parseInt(localStorage.getItem("tuenti-breakout-hs") ?? "0", 10);
    engineRef.current = new GameEngine(level, hs);
    setUiState({
      phase: "ready",
      score: 0,
      lives: 3,
      level,
      highScore: hs,
      activeEffects: [],
      powerUpsCaught: 0,
      powerUpsMissed: 0,
      bricksBroken: 0,
      bricksRemaining: 0,
      powerUpsCaughtMap: createPowerUpCountMap(),
      powerUpsMissedMap: createPowerUpCountMap(),
      principleStats: createPrincipleStats(),
      graciasMoment: false,
    });
  }, []);

  // ─── RAF loop ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const engine = engineRef.current;
      const canvas = canvasRef.current;

      if (engine && canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          if (!pausedRef.current) {
            engine.tick({ ...inputRef.current }, performance.now());
          }

          // Consume space after one tick
          if (inputRef.current.spaceJustPressed) {
            inputRef.current.spaceJustPressed = false;
          }

          renderGame(ctx, engine.state);

          const {
            phase,
            score,
            lives,
            level,
            highScore,
            activeEffects,
            powerUpsCaught,
            powerUpsMissed,
            bricksBroken,
            bricks,
            powerUpsCaughtMap,
            powerUpsMissedMap,
            principleStats,
            graciasMoment,
          } = engine.state;
          const bricksRemaining = bricks.filter((b) => b.alive).length;

          // Detect powerup collections via collectedAt changes
          for (const eff of activeEffects) {
            const prev = prevCollectedAtRef.current.get(eff.type);
            if (prev !== eff.collectedAt) {
              // New or re-collection — only show if no toast for this type is visible
              showPowerUpToast(eff.type);
              prevCollectedAtRef.current.set(eff.type, eff.collectedAt);
            }
          }
          // Clean up expired effects from the tracking map
          const activeTypes = new Set(activeEffects.map((e) => e.type));
          prevCollectedAtRef.current.forEach((_, type) => {
            if (!activeTypes.has(type)) prevCollectedAtRef.current.delete(type);
          });

          setUiState((prev) => {
            if (
              prev.phase !== phase ||
              prev.score !== score ||
              prev.lives !== lives ||
              prev.level !== level ||
              prev.highScore !== highScore ||
              prev.activeEffects.length !== activeEffects.length ||
              prev.powerUpsCaught !== powerUpsCaught ||
              prev.powerUpsMissed !== powerUpsMissed ||
              prev.bricksBroken !== bricksBroken ||
              prev.bricksRemaining !== bricksRemaining ||
              prev.graciasMoment !== graciasMoment
            ) {
              return {
                phase,
                score,
                lives,
                level,
                highScore,
                activeEffects,
                powerUpsCaught,
                powerUpsMissed,
                bricksBroken,
                bricksRemaining,
                // Shallow-clone so React sees a new reference when counts change
                powerUpsCaughtMap: { ...powerUpsCaughtMap },
                powerUpsMissedMap: { ...powerUpsMissedMap },
                principleStats: { ...principleStats },
                graciasMoment,
              };
            }
            return prev;
          });
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [canvasRef, showPowerUpToast]);

  // ─── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "p" || e.key === "P") {
        if (engineRef.current?.state.phase !== "gameover") {
          togglePause();
          e.preventDefault();
        }
        return;
      }

      if (pausedRef.current) return;

      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        inputRef.current.left = true;
        inputRef.current.pointerX = null;
        pointerDown.current = false; // prevent mousemove from overriding keyboard
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        inputRef.current.right = true;
        inputRef.current.pointerX = null;
        pointerDown.current = false; // prevent mousemove from overriding keyboard
      }
      if (e.key === " " && !spaceHeld.current) {
        inputRef.current.spaceJustPressed = true;
        spaceHeld.current = true;
        e.preventDefault();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A")
        inputRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D")
        inputRef.current.right = false;
      if (e.key === " ") spaceHeld.current = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [togglePause]);

  // ─── Mouse / touch ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const toCanvasX = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      return (clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (pausedRef.current) return;
      if (pointerDown.current) inputRef.current.pointerX = toCanvasX(e.clientX);
    };
    const onMouseDown = (e: MouseEvent) => {
      if (pausedRef.current) return;
      pointerDown.current = true;
      inputRef.current.pointerX = toCanvasX(e.clientX);
      if (engineRef.current?.state.phase === "ready") {
        inputRef.current.spaceJustPressed = true;
      }
    };
    const onMouseUp = () => {
      pointerDown.current = false;
      inputRef.current.pointerX = null; // release mouse control so keyboard can resume
    };

    const onTouchStart = (e: TouchEvent) => {
      if (pausedRef.current) return;
      e.preventDefault();
      inputRef.current.pointerX = toCanvasX(e.touches[0].clientX);
      if (engineRef.current?.state.phase === "ready") {
        inputRef.current.spaceJustPressed = true;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (pausedRef.current) return;
      e.preventDefault();
      inputRef.current.pointerX = toCanvasX(e.touches[0].clientX);
    };
    const onTouchEnd = () => {
      // Keep last position so paddle doesn't teleport on lift
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);

    return () => {
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [canvasRef]);

  return { uiState, startGame, toasts, isPaused, pauseGame, resumeGame, togglePause };
}
