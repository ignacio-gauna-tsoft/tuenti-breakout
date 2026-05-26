import {
  POWERUP_COLORS,
  POWERUP_IMAGES,
  POWERUP_LABELS,
  POWERUP_TYPES,
} from "../../game/constants";
import type { PowerUpType } from "../../game/types";

export interface GameStats {
  powerUpsCaughtMap: Record<PowerUpType, number>;
  powerUpsMissedMap: Record<PowerUpType, number>;
  bricksBroken: number;
  bricksRemaining: number;
}

interface Props {
  stats: GameStats;
}

export function PowerUpStats({ stats }: Props) {
  return (
    <div className="gameover-stats">
      <div className="gameover-stats-legend">
        <span className="gameover-stats-legend-caught">+ agarraste</span>
        <span className="gameover-stats-legend-sep">/</span>
        <span className="gameover-stats-legend-missed">- se escaparon</span>
      </div>

      {POWERUP_TYPES.map((type) => {
        const caught = stats.powerUpsCaughtMap[type] ?? 0;
        const missed = stats.powerUpsMissedMap[type] ?? 0;
        const label = (POWERUP_LABELS[type] ?? type).replace("\n", " ");
        const imgSrc = POWERUP_IMAGES[type];
        const color = POWERUP_COLORS[type] ?? "#fff";

        return (
          <div key={type} className="gameover-stats-row">
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={label}
                className="gameover-stats-pu-icon gameover-stats-pu-img"
              />
            ) : (
              <span className="gameover-stats-pu-icon" style={{ color }}>
                {type}
              </span>
            )}
            <span className="gameover-stats-label">{label}</span>
            <span className="gameover-stats-caught">+ {caught}</span>
            <span className="gameover-stats-missed">- {missed}</span>
          </div>
        );
      })}

      <div className="gameover-stats-divider" />
      <div className="gameover-stats-row">
        <span className="gameover-stats-label gameover-stats-label--wide">
          Bloques destruidos
        </span>
        <span className="gameover-stats-caught"># {stats.bricksBroken}</span>
        <span className="gameover-stats-neutral">
          {stats.bricksRemaining}
        </span>
      </div>
    </div>
  );
}
