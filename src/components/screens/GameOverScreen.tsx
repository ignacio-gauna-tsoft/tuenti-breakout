import { useEffect, useRef } from "react";
import gsap from "gsap";

interface Props {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  onPlayAgain: () => void;
  onGoToMenu: () => void;
}

export function GameOverScreen({
  score,
  highScore,
  isNewHighScore,
  onPlayAgain,
  onGoToMenu,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "back.out(1.4)" } });

      tl.fromTo(
        rootRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2, ease: "none" },
      )
        .fromTo(
          titleRef.current,
          { y: -50, opacity: 0, scale: 0.8 },
          { y: 0, opacity: 1, scale: 1, duration: 0.6 },
        )
        .fromTo(
          scoreRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5 },
          "-=0.2",
        )
        .fromTo(
          buttonsRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45 },
          "-=0.15",
        );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const animateOut = (cb: () => void) => {
    gsap.to(rootRef.current, {
      opacity: 0,
      y: 20,
      duration: 0.25,
      ease: "power2.in",
      onComplete: cb,
    });
  };

  return (
    <div className="gameover-screen" ref={rootRef}>
      <div className="gameover-card">
        <div className="gameover-title" ref={titleRef}>
          GAME OVER
        </div>

        <div className="gameover-scores" ref={scoreRef}>
          <div className="gameover-score-block">
            <span className="gameover-score-label">SCORE</span>
            <span className="gameover-score-value">
              {score.toLocaleString()}
            </span>
          </div>
          <div className="gameover-score-block">
            <span className="gameover-score-label">
              BEST{" "}
              {isNewHighScore && <span className="gameover-new">NEW!</span>}
            </span>
            <span className="gameover-score-value gameover-score-value--hs">
              {highScore.toLocaleString()}
            </span>
          </div>
        </div>

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
    </div>
  );
}
