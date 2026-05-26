import { PowerUpStats, type GameStats } from "./PowerUpStats";

interface Props {
  score: number;
  highScore: number;
  level: number;
  stats: GameStats;
  onResume: () => void;
  onGoToMenu: () => void;
}

export function PauseScreen({
  score,
  highScore,
  level,
  stats,
  onResume,
  onGoToMenu,
}: Props) {
  return (
    <div className="pause-screen">
      <div className="pause-card">
        <div className="pause-title">PAUSA</div>

        <div className="pause-score-grid">
          <div className="pause-score-block">
            <span className="gameover-score-label">SCORE</span>
            <span className="gameover-score-value">{score.toLocaleString()}</span>
          </div>
          <div className="pause-score-block">
            <span className="gameover-score-label">BEST</span>
            <span className="gameover-score-value pause-score-best">
              {highScore.toLocaleString()}
            </span>
          </div>
          <div className="pause-score-block">
            <span className="gameover-score-label">LVL</span>
            <span className="gameover-score-value">{level}</span>
          </div>
        </div>

        <PowerUpStats stats={stats} />

        <div className="pause-actions">
          <button className="btn btn--primary" onClick={onResume}>
            CONTINUAR
          </button>
          <button className="btn btn--ghost" onClick={onGoToMenu}>
            MENU
          </button>
        </div>

        <p className="pause-hint">P / ESC para continuar</p>
      </div>
    </div>
  );
}
