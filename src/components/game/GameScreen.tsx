import { useEffect, useRef } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../../game/constants";
import { useBreakoutGame } from "../../hooks/useBreakoutGame";
import { HUD } from "./HUD";
import { GameOverScreen } from "../screens/GameOverScreen";

interface Props {
  onGoToMenu: () => void;
}

export function GameScreen({ onGoToMenu }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { uiState, startGame } = useBreakoutGame(canvasRef);

  // Auto-start when component mounts
  useEffect(() => {
    startGame(1);
  }, [startGame]);

  const isNewHighScore =
    uiState.score > 0 && uiState.score >= uiState.highScore;

  return (
    <div className="game-screen">
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

          {uiState.phase === "gameover" && (
            <GameOverScreen
              score={uiState.score}
              highScore={uiState.highScore}
              isNewHighScore={isNewHighScore}
              onPlayAgain={() => startGame(1)}
              onGoToMenu={onGoToMenu}
            />
          )}
        </div>
      </div>
    </div>
  );
}
