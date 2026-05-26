import { useEffect, useRef, type CSSProperties } from "react";
import {
  BACKGROUND_IMAGE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  POWERUP_COLORS,
  POWERUP_IMAGES,
  POWERUP_LABELS,
} from "../../game/constants";
import { useBreakoutGame } from "../../hooks/useBreakoutGame";
import { HUD } from "./HUD";
import { PauseScreen } from "./PauseScreen";
import { GameOverScreen } from "../screens/GameOverScreen";

interface Props {
  onGoToMenu: () => void;
  playerName: string;
}

export function GameScreen({ onGoToMenu, playerName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { uiState, startGame, toasts, isPaused, resumeGame, togglePause } =
    useBreakoutGame(canvasRef);

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
              className="pause-toggle-btn"
              onClick={togglePause}
            >
              {isPaused ? "SEGUIR" : "PAUSA"}
            </button>
          )}

          {/* Floating powerup toasts */}
          <div className="powerup-toasts">
            {toasts.map((toast) => {
              const color = POWERUP_COLORS[toast.type] ?? "#fff";
              const image = POWERUP_IMAGES[toast.type];
              const label = POWERUP_LABELS[toast.type] ?? "?";
              const lines = label.split("\n");
              const pulseClass =
                toast.pulseKey > 0
                  ? `powerup-toast--pulse-${toast.pulseKey % 2}`
                  : "";
              return (
                <div
                  key={toast.id}
                  className={[
                    "powerup-toast",
                    pulseClass,
                    toast.closing ? "powerup-toast--closing" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ "--toast-color": color } as CSSProperties}
                >
                  <img
                    src={image}
                    alt={lines.join(" ")}
                    className="powerup-toast-img"
                  />
                  <span className="powerup-toast-name">
                    {lines.map((line, i) => (
                      <span key={i} className="powerup-toast-line">
                        {line}
                      </span>
                    ))}
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
    </div>
  );
}
