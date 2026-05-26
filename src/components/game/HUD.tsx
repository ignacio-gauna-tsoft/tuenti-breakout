interface Props {
  lives: number;
  score: number;
  level: number;
  highScore: number;
}

export function HUD({ lives, score, level, highScore }: Props) {
  return (
    <div className="hud">
      <div className="hud-top">
        <div className="hud-lives">
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i}
              className={`hud-heart ${i < lives ? "hud-heart--alive" : "hud-heart--lost"}`}
            >
              &hearts;
            </span>
          ))}
        </div>

        <div className="hud-score">
          <span className="hud-score-value">{score.toLocaleString()}</span>
          <span className="hud-label">SCORE</span>
        </div>

        <div className="hud-right">
          <span className="hud-level">LVL {level}</span>
          <span className="hud-hs">
            <span className="hud-label">BEST </span>
            {highScore.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
