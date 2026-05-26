import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  POWERUP_LABELS,
  POWERUP_IMAGES,
  POWERUP_COLORS,
  POWERUP_TYPES,
} from "../../game/constants";
import type { PowerUpType } from "../../game/types";
import {
  submitScore,
  fetchRanking,
  USER_ID,
  type ScoreEntry,
} from "../../services/ranking";

// Build a map of name → ordered list of distinct userIds (for disambiguation)
function buildNameMap(entries: ScoreEntry[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const e of entries) {
    if (!e.userId) continue;
    if (!map.has(e.name)) map.set(e.name, []);
    const ids = map.get(e.name)!;
    if (!ids.includes(e.userId)) ids.push(e.userId);
  }
  return map;
}

// Returns "Name" for the first userId of that name, "Name #2" for second, etc.
function getDisplayName(
  entry: ScoreEntry,
  nameMap: Map<string, string[]>,
): string {
  if (!entry.userId) return entry.name;
  const ids = nameMap.get(entry.name);
  if (!ids || ids.length <= 1) return entry.name;
  const idx = ids.indexOf(entry.userId);
  return idx <= 0 ? entry.name : `${entry.name} #${idx + 1}`;
}

interface Stats {
  powerUpsCaughtMap: Record<PowerUpType, number>;
  powerUpsMissedMap: Record<PowerUpType, number>;
  bricksBroken: number;
  bricksRemaining: number;
}

interface Props {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  onPlayAgain: () => void;
  onGoToMenu: () => void;
  playerName: string;
  level: number;
  stats: Stats;
}

export function GameOverScreen({
  score,
  highScore,
  isNewHighScore,
  onPlayAgain,
  onGoToMenu,
  playerName,
  level,
  stats,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const scoreValueRef = useRef<HTMLSpanElement>(null);
  const hsValueRef = useRef<HTMLSpanElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  const [ranking, setRanking] = useState<ScoreEntry[]>([]);
  const [rankingState, setRankingState] = useState<
    "loading" | "done" | "error"
  >("loading");
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [showRanking, setShowRanking] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "back.out(1.4)" } });

      tl.fromTo(
        rootRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.15, ease: "none" },
      )
        .fromTo(
          titleRef.current,
          { y: -40, opacity: 0, scale: 0.75, filter: "blur(8px)" },
          { y: 0, opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.55 },
        )
        .fromTo(
          dividerRef.current,
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 0.4, ease: "power2.out" },
          "-=0.1",
        )
        .fromTo(
          scoreRef.current,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45 },
          "-=0.15",
        )
        .fromTo(
          buttonsRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4 },
          "-=0.1",
        );

      // Animated score counter
      const counter = { val: 0 };
      if (scoreValueRef.current) {
        gsap.to(counter, {
          val: score,
          duration: 0.9,
          delay: 0.6,
          ease: "power2.out",
          onUpdate: () => {
            if (scoreValueRef.current)
              scoreValueRef.current.textContent = Math.round(
                counter.val,
              ).toLocaleString();
          },
        });
      }

      // New high score pulse
      if (isNewHighScore && hsValueRef.current) {
        gsap.fromTo(
          hsValueRef.current,
          { scale: 1 },
          {
            scale: 1.12,
            duration: 0.4,
            repeat: 3,
            yoyo: true,
            ease: "sine.inOut",
            delay: 1.2,
          },
        );
      }
    }, rootRef);

    return () => ctx.revert();
  }, [score, highScore, isNewHighScore]);

  // Submit score + fetch ranking once on mount
  useEffect(() => {
    const totalCaught = POWERUP_TYPES.reduce(
      (s, t) => s + (stats.powerUpsCaughtMap[t] ?? 0),
      0,
    );
    const run = async () => {
      try {
        const { rank } = await submitScore({
          name: playerName || "Anónimo",
          score,
          level,
          bricksBroken: stats.bricksBroken,
          powerUpsCaught: totalCaught,
        });
        setPlayerRank(rank);
        const entries = await fetchRanking(10);
        setRanking(entries);
        setRankingState("done");
      } catch {
        setRankingState("error");
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animateOut = (cb: () => void) => {
    gsap.to(rootRef.current, {
      opacity: 0,
      y: 16,
      duration: 0.22,
      ease: "power2.in",
      onComplete: cb,
    });
  };

  return (
    <div className="gameover-screen" ref={rootRef}>
      <div className="gameover-card">
        <div className="gameover-title" ref={titleRef}>
          GAME
          <br />
          OVER
        </div>

        {playerName && <div className="gameover-player-name">{playerName}</div>}

        <div className="gameover-divider" ref={dividerRef} />

        <div className="gameover-scores" ref={scoreRef}>
          <div className="gameover-score-block">
            <span className="gameover-score-label">SCORE</span>
            <span className="gameover-score-value" ref={scoreValueRef}>
              0
            </span>
          </div>
          <div className="gameover-score-sep" />
          <div className="gameover-score-block">
            <span className="gameover-score-label">
              BEST{" "}
              {isNewHighScore && <span className="gameover-new">NEW!</span>}
            </span>
            <span
              className={`gameover-score-value ${isNewHighScore ? "gameover-score-value--hs" : ""}`}
              ref={hsValueRef}
            >
              {highScore.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Per-type powerup stats */}
        <div className="gameover-stats">
          {/* Legend */}
          <div className="gameover-stats-legend">
            <span className="gameover-stats-legend-caught">✓ agarraste</span>
            <span className="gameover-stats-legend-sep">·</span>
            <span className="gameover-stats-legend-missed">✕ se escaparon</span>
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
                <span className="gameover-stats-caught">✓ {caught}</span>
                <span className="gameover-stats-missed">✕ {missed}</span>
              </div>
            );
          })}
          <div className="gameover-stats-divider" />
          <div className="gameover-stats-row">
            <span className="gameover-stats-label gameover-stats-label--wide">
              Bloques destruidos
            </span>
            <span className="gameover-stats-caught">
              ■ {stats.bricksBroken}
            </span>
            <span className="gameover-stats-neutral">
              □ {stats.bricksRemaining}
            </span>
          </div>
        </div>

        {/* VER RANKING button */}
        <button
          className="btn btn--ranking"
          onClick={() => setShowRanking(true)}
        >
          VER RANKING
          {playerRank !== null && (
            <span className="btn-ranking-badge">#{playerRank}</span>
          )}
        </button>

        <div className="gameover-buttons" ref={buttonsRef}>
          <button
            className="btn btn--primary"
            onClick={() => animateOut(onPlayAgain)}
          >
            JUGAR DE NUEVO
          </button>
          <button
            className="btn btn--ghost"
            onClick={() => animateOut(onGoToMenu)}
          >
            MENÚ
          </button>
        </div>
      </div>

      {/* Ranking modal */}
      {showRanking && (
        <div className="ranking-backdrop" onClick={() => setShowRanking(false)}>
          <div className="ranking-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="ranking-modal-close"
              onClick={() => setShowRanking(false)}
              aria-label="Cerrar ranking"
            >
              ✕
            </button>
            <h2 className="ranking-modal-title">RANKING</h2>
            {rankingState === "loading" && (
              <p className="ranking-modal-msg">Cargando…</p>
            )}
            {rankingState === "error" && (
              <p className="ranking-modal-msg">No disponible</p>
            )}
            {rankingState === "done" && ranking.length === 0 && (
              <p className="ranking-modal-msg">Sin entradas aún</p>
            )}
            {rankingState === "done" &&
              ranking.length > 0 &&
              (() => {
                const nameMap = buildNameMap(ranking);
                return (
                  <ol className="ranking-modal-list">
                    {ranking.map((entry) => {
                      const isMe = entry.userId === USER_ID;
                      return (
                        <li
                          key={entry.rank}
                          className={
                            "ranking-modal-entry" +
                            (isMe ? " ranking-modal-entry--me" : "")
                          }
                        >
                          <span className="ranking-modal-pos">
                            {entry.rank}
                          </span>
                          <span className="ranking-modal-name">
                            {getDisplayName(entry, nameMap)}
                          </span>
                          {isMe && (
                            <span className="ranking-modal-you">TÚ</span>
                          )}
                          <span className="ranking-modal-score">
                            {entry.score.toLocaleString()}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                );
              })()}
          </div>
        </div>
      )}
    </div>
  );
}
