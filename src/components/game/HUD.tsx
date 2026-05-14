import type { ActiveEffect } from "../../game/types";
import {
  POWERUP_COLORS,
  POWERUP_LABELS,
  POWERUP_DURATION_MS,
} from "../../game/constants";

interface Props {
  lives: number;
  score: number;
  level: number;
  highScore: number;
  activeEffects: ActiveEffect[];
}

export function HUD({ lives, score, level, highScore, activeEffects }: Props) {
  return (
    <div className="hud">
      <div className="hud-top">
        <div className="hud-lives">
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i}
              className={`hud-heart ${i < lives ? "hud-heart--alive" : "hud-heart--lost"}`}
            >
              ♥
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

      {activeEffects.length > 0 && (
        <div className="hud-effects">
          {activeEffects.map((eff) => {
            const now = performance.now();
            const ratio = Math.max(
              0,
              (eff.expiresAt - now) / POWERUP_DURATION_MS,
            );
            const color = POWERUP_COLORS[eff.type] ?? "#fff";
            const label = POWERUP_LABELS[eff.type] ?? "?";
            return (
              <div key={eff.type} className="hud-effect-chip">
                <span className="hud-effect-label" style={{ color }}>
                  {label}
                </span>
                <div className="hud-effect-bar-bg">
                  <div
                    className="hud-effect-bar"
                    style={{ width: `${ratio * 100}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
