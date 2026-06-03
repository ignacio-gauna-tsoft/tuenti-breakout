import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import gsap from "gsap";
import { soundEngine } from "../../game/sound";
import {
  GRACIAS,
  POWERUP_TYPES,
  PRINCIPLES,
  PRINCIPLES_ORDER,
} from "../../game/constants";
import type { PowerUpType, PrincipleStat } from "../../game/types";
import {
  submitScore,
  fetchRanking,
  USER_ID,
  type ScoreEntry,
} from "../../services/ranking";

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
  principleStats?: Record<PowerUpType, PrincipleStat>;
  graciasMoment?: boolean;
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
  const stage1Ref = useRef<HTMLDivElement>(null);
  const stage2Ref = useRef<HTMLDivElement>(null);
  const scoreValueRef = useRef<HTMLSpanElement>(null);
  const hsValueRef = useRef<HTMLSpanElement>(null);
  const dominantCardRef = useRef<HTMLDivElement>(null);

  const [stage, setStage] = useState<1 | 2>(1);
  const [ranking, setRanking] = useState<ScoreEntry[]>([]);
  const [rankingState, setRankingState] = useState<
    "loading" | "done" | "error"
  >("loading");
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [showRanking, setShowRanking] = useState(false);

  // ─── Computed values (safe, no undefined risk) ──────────────────────────────
  const dominant: PowerUpType | null = useMemo(() => {
    let best: PowerUpType | null = null;
    let bestCount = 0;
    for (const code of PRINCIPLES_ORDER) {
      const c = stats.powerUpsCaughtMap?.[code] ?? 0;
      if (c > bestCount) {
        bestCount = c;
        best = code;
      }
    }
    return bestCount > 0 ? best : null;
  }, [stats.powerUpsCaughtMap]);

  const distinctPrinciplesCaught = useMemo(
    () =>
      POWERUP_TYPES.reduce(
        (acc, t) => acc + ((stats.powerUpsCaughtMap?.[t] ?? 0) > 0 ? 1 : 0),
        0,
      ),
    [stats.powerUpsCaughtMap],
  );

  const levelComplete =
    (stats.bricksRemaining ?? 0) === 0 && (stats.bricksBroken ?? 0) > 0;
  const showGracias =
    isNewHighScore ||
    levelComplete ||
    distinctPrinciplesCaught >= 3 ||
    !!stats.graciasMoment;

  // ─── Thanks sound ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (showGracias) {
      soundEngine.thanksBadge();
    }
  }, [showGracias]);

  // ─── Stage 1 animation + auto-transition to stage 2 ────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "back.out(1.4)" } });

      tl.fromTo(
        rootRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2, ease: "none" },
      ).fromTo(
        stage1Ref.current,
        { y: -30, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5 },
      );

      // Animated score counter
      const counter = { val: 0 };
      if (scoreValueRef.current) {
        gsap.to(counter, {
          val: score,
          duration: 0.9,
          delay: 0.4,
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
            delay: 1.0,
          },
        );
      }

      // Dominant card entrance in Stage 1
      if (dominantCardRef.current) {
        gsap.fromTo(
          dominantCardRef.current,
          { y: 20, opacity: 0, scale: 0.9 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.5,
            delay: 0.9,
            ease: "back.out(1.4)",
          },
        );
      }
    }, rootRef);

    // Auto-advance to stage 2 after 3.5s
    const timer = window.setTimeout(() => setStage(2), 3500);

    return () => {
      ctx.revert();
      window.clearTimeout(timer);
    };
  }, [score, isNewHighScore]);

  // ─── Stage 2 entrance ───────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 2 || !stage2Ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        stage2Ref.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" },
      );
      // Stagger rows
      const rows = stage2Ref.current!.querySelectorAll(".gameover-stats-row");
      if (rows.length > 0) {
        gsap.fromTo(
          rows,
          { x: -12, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.3,
            stagger: 0.06,
            ease: "power2.out",
            delay: 0.2,
          },
        );
      }
    }, rootRef);
    return () => ctx.revert();
  }, [stage]);

  // ─── Submit score + fetch ranking ───────────────────────────────────────────
  useEffect(() => {
    const totalCaught = POWERUP_TYPES.reduce(
      (s, t) => s + (stats.powerUpsCaughtMap?.[t] ?? 0),
      0,
    );
    const run = async () => {
      try {
        const { rank } = await submitScore({
          name: playerName || "Anónimo",
          score,
          level,
          bricksBroken: stats.bricksBroken ?? 0,
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
        {/* ─── STAGE 1: Emotional impact ──────────────────────────── */}
        <div
          className={`gameover-stage1 ${stage >= 1 ? "gameover-stage--visible" : ""}`}
          ref={stage1Ref}
        >
          <span className="gameover-hero-eyebrow">
            {levelComplete ? "NIVEL COMPLETO" : "PARTIDA FINALIZADA"}
          </span>

          {playerName && (
            <div className="gameover-player-name">{playerName}</div>
          )}

          <div className="gameover-scores">
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

          {showGracias && (
            <div className="gracias-badge" role="status">
              <span className="gracias-badge-dot" aria-hidden="true" />
              <span className="gracias-badge-text">
                {GRACIAS.label}
                <small>{GRACIAS.copy}</small>
              </span>
            </div>
          )}

          {/* Dominant principle revealed in Stage 1 */}
          {dominant && (
            <div
              ref={dominantCardRef}
              className="dominant-card dominant-card--stage1"
              style={
                {
                  ["--dom-color" as string]: PRINCIPLES[dominant].color,
                  opacity: 0,
                } as CSSProperties
              }
            >
              <img
                src={PRINCIPLES[dominant].image}
                alt=""
                aria-hidden="true"
                className="dominant-card-img"
              />
              <div className="dominant-card-text">
                <span className="dominant-card-eyebrow">
                  PRINCIPIO DOMINANTE
                </span>
                <span className="dominant-card-name">
                  {PRINCIPLES[dominant].shortLabel}
                </span>
                <span className="dominant-card-mode">
                  {PRINCIPLES[dominant].modeName}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ─── STAGE 2: Summary ───────────────────────────────────── */}
        {stage >= 2 && (
          <div className="gameover-stage2" ref={stage2Ref}>
            {/* Per-principle stats */}
            <div className="gameover-stats">
              {PRINCIPLES_ORDER.map((type) => {
                const p = PRINCIPLES[type];
                const caught = stats.powerUpsCaughtMap?.[type] ?? 0;
                const missed = stats.powerUpsMissedMap?.[type] ?? 0;
                const impact = stats.principleStats?.[type]?.impactScore ?? 0;
                if (caught === 0 && missed === 0) return null;
                return (
                  <div key={type} className="gameover-stats-row">
                    <img
                      src={p.image}
                      alt=""
                      aria-hidden="true"
                      className="gameover-stats-pu-icon gameover-stats-pu-img"
                    />
                    <span className="gameover-stats-label">{p.shortLabel}</span>
                    <span className="gameover-stats-mode">{p.modeName}</span>
                    <span className="gameover-stats-caught">✓ {caught}</span>
                    <span className="gameover-stats-missed">✕ {missed}</span>
                    {impact > 0 && (
                      <span className="gameover-stats-impact">+{impact}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="gameover-buttons">
              <button
                className="btn btn--primary gameover-btn--play"
                onClick={() => animateOut(onPlayAgain)}
              >
                JUGAR DE NUEVO
              </button>
              <div className="gameover-buttons-secondary">
                <button
                  className="btn btn--ranking gameover-btn--secondary"
                  onClick={() => setShowRanking(true)}
                >
                  RANKING
                  {playerRank !== null && (
                    <span className="btn-ranking-badge">#{playerRank}</span>
                  )}
                </button>
                <button
                  className="btn btn--ghost gameover-btn--secondary"
                  onClick={() => animateOut(onGoToMenu)}
                >
                  MENÚ
                </button>
              </div>
            </div>
          </div>
        )}
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
