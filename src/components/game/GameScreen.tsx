import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  BACKGROUND_IMAGE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PRINCIPLES,
  PRINCIPLES_ORDER,
} from "../../game/constants";
import { useBreakoutGame } from "../../hooks/useBreakoutGame";
import { HUD } from "./HUD";
import { PauseScreen } from "./PauseScreen";
import { GameOverScreen } from "../screens/GameOverScreen";
import { ActiveEffectsBar } from "./ActiveEffectsBar";

const SEEN_PRINCIPLES_KEY = "tuenti-breakout-principles-seen";

interface Props {
  onGoToMenu: () => void;
  playerName: string;
}

export function GameScreen({ onGoToMenu, playerName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { uiState, startGame, toasts, isPaused, resumeGame, togglePause } =
    useBreakoutGame(canvasRef);

  const [showPrinciples, setShowPrinciples] = useState(() => {
    return !localStorage.getItem(SEEN_PRINCIPLES_KEY);
  });

  const closePrinciples = () => {
    localStorage.setItem(SEEN_PRINCIPLES_KEY, "1");
    setShowPrinciples(false);
  };

  // Auto-start when component mounts
  useEffect(() => {
    startGame(1);
  }, [startGame]);

  const isNewHighScore =
    uiState.score > 0 && uiState.score >= uiState.highScore;
  const gameStats = {
    powerUpsCaughtMap: uiState.powerUpsCaughtMap,
    powerUpsMissedMap: uiState.powerUpsMissedMap,
    bricksBroken: uiState.bricksBroken,
    bricksRemaining: uiState.bricksRemaining,
    principleStats: uiState.principleStats,
    graciasMoment: uiState.graciasMoment,
  };

  return (
    <div
      className="game-screen"
      style={
        { "--game-background-image": `url("${BACKGROUND_IMAGE}")` } as CSSProperties
      }
    >
      <HUD
        lives={uiState.lives}
        score={uiState.score}
        level={uiState.level}
        highScore={uiState.highScore}
        activeEffects={uiState.activeEffects}
      />

      <div className="canvas-area">
        <div className="canvas-outer">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="game-canvas"
          />

          {uiState.phase !== "gameover" && (
            <button
              type="button"
              className="pause-toggle-btn pause-toggle-btn--icon"
              aria-label={isPaused ? "Reanudar" : "Pausar"}
              onClick={togglePause}
            >
              {isPaused ? (
                // Play triangle
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                  <polygon points="3,1 13,7 3,13" />
                </svg>
              ) : (
                // Pause two bars
                <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
                  <rect x="0" y="0" width="4" height="14" rx="1" />
                  <rect x="8" y="0" width="4" height="14" rx="1" />
                </svg>
              )}
            </button>
          )}

          {uiState.phase !== "gameover" && (
            <ActiveEffectsBar activeEffects={uiState.activeEffects ?? []} />
          )}

          {/* Cultural power-up toasts: educative on first catch, compact on repeats. */}
          <div className="powerup-toasts" aria-live="polite">
            {toasts.map((toast) => {
              const p = PRINCIPLES[toast.type];
              if (!p) return null;
              const isFirst = toast.count <= 1;
              const pulseClass =
                toast.pulseKey > 0
                  ? `powerup-toast--pulse-${toast.pulseKey % 2}`
                  : "";
              const variantClass = isFirst
                ? "powerup-toast--educational"
                : "powerup-toast--compact";
              return (
                <div
                  key={toast.id}
                  className={[
                    "powerup-toast",
                    variantClass,
                    pulseClass,
                    toast.closing ? "powerup-toast--closing" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ "--toast-color": p.color } as CSSProperties}
                >
                  <img
                    src={p.image}
                    alt=""
                    aria-hidden="true"
                    className="powerup-toast-img"
                  />
                  <span className="powerup-toast-body">
                    <span className="powerup-toast-title">
                      {p.shortLabel}
                    </span>
                    {isFirst && (
                      <span className="powerup-toast-subtitle">
                        {p.modeName} · {p.description}
                      </span>
                    )}
                    {!isFirst && (
                      <span className="powerup-toast-subtitle">
                        {p.modeName}
                      </span>
                    )}
                  </span>
                  {toast.count > 1 && (
                    <span className="powerup-toast-count">x{toast.count}</span>
                  )}
                </div>
              );
            })}
          </div>

          {isPaused && uiState.phase !== "gameover" && (
            <PauseScreen
              score={uiState.score}
              highScore={uiState.highScore}
              level={uiState.level}
              stats={gameStats}
              onResume={resumeGame}
              onGoToMenu={onGoToMenu}
            />
          )}

          {uiState.phase === "gameover" && (
            <GameOverScreen
              score={uiState.score}
              highScore={uiState.highScore}
              isNewHighScore={isNewHighScore}
              onPlayAgain={() => startGame(1)}
              onGoToMenu={onGoToMenu}
              playerName={playerName}
              level={uiState.level}
              stats={gameStats}
            />
          )}
        </div>
      </div>

      {/* Principles intro modal — shown once before first launch */}
      {showPrinciples && (
        <div className="principles-backdrop" onClick={closePrinciples}>
          <div
            className="principles-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="principles-modal-close"
              onClick={closePrinciples}
              aria-label="Cerrar"
            >
              ✕
            </button>
            <h2 className="principles-modal-title">
              Nuestra cultura, tu gameplay
            </h2>
            <p className="principles-modal-sub">
              Cada power-up representa un principio Supernova.
            </p>
            <div className="principles-modal-list">
              {PRINCIPLES_ORDER.map((code) => {
                const p = PRINCIPLES[code];
                return (
                  <div
                    key={code}
                    className="principles-modal-card"
                    style={
                      { ["--card-color" as string]: p.color } as CSSProperties
                    }
                  >
                    <img
                      src={p.image}
                      alt=""
                      aria-hidden="true"
                      className="principles-modal-card-img"
                    />
                    <div className="principles-modal-card-text">
                      <span className="principles-modal-card-title">
                        {p.shortLabel}
                      </span>
                      <span className="principles-modal-card-mode">
                        {p.modeName}
                      </span>
                      <span className="principles-modal-card-desc">
                        {p.description}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              className="btn btn--primary principles-modal-cta"
              onClick={closePrinciples}
            >
              ¡A JUGAR!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
