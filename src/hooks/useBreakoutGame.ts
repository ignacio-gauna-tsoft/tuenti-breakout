import { useCallback, useEffect, useRef, useState } from "react";
import { GameEngine } from "../game/engine";
import { renderGame } from "../game/renderer";
import type { InputState, GamePhase, ActiveEffect } from "../game/types";
import { CANVAS_WIDTH } from "../game/constants";

export interface GameUIState {
  phase: GamePhase;
  score: number;
  lives: number;
  level: number;
  highScore: number;
  activeEffects: ActiveEffect[];
}

const INITIAL_UI: GameUIState = {
  phase: "ready",
  score: 0,
  lives: 3,
  level: 1,
  highScore: parseInt(localStorage.getItem("tuenti-breakout-hs") ?? "0", 10),
  activeEffects: [],
};

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

  const [uiState, setUiState] = useState<GameUIState>(INITIAL_UI);

  // ─── Start / restart ────────────────────────────────────────────────────────
  const startGame = useCallback((level = 1) => {
    const hs = parseInt(localStorage.getItem("tuenti-breakout-hs") ?? "0", 10);
    engineRef.current = new GameEngine(level, hs);
    setUiState({
      phase: "ready",
      score: 0,
      lives: 3,
      level,
      highScore: hs,
      activeEffects: [],
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
          engine.tick({ ...inputRef.current }, performance.now());

          // Consume space after one tick
          if (inputRef.current.spaceJustPressed) {
            inputRef.current.spaceJustPressed = false;
          }

          renderGame(ctx, engine.state);

          const { phase, score, lives, level, highScore, activeEffects } =
            engine.state;
          setUiState((prev) => {
            if (
              prev.phase !== phase ||
              prev.score !== score ||
              prev.lives !== lives ||
              prev.level !== level ||
              prev.highScore !== highScore ||
              prev.activeEffects.length !== activeEffects.length
            ) {
              return { phase, score, lives, level, highScore, activeEffects };
            }
            return prev;
          });
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [canvasRef]);

  // ─── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A")
        inputRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D")
        inputRef.current.right = true;
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
  }, []);

  // ─── Mouse / touch ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const toCanvasX = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      return (clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (pointerDown.current) inputRef.current.pointerX = toCanvasX(e.clientX);
    };
    const onMouseDown = (e: MouseEvent) => {
      pointerDown.current = true;
      inputRef.current.pointerX = toCanvasX(e.clientX);
      if (engineRef.current?.state.phase === "ready") {
        inputRef.current.spaceJustPressed = true;
      }
    };
    const onMouseUp = () => {
      pointerDown.current = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      inputRef.current.pointerX = toCanvasX(e.touches[0].clientX);
      if (engineRef.current?.state.phase === "ready") {
        inputRef.current.spaceJustPressed = true;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
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

  return { uiState, startGame };
}
