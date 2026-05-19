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
  const scoreValueRef = useRef<HTMLSpanElement>(null);
  const hsValueRef = useRef<HTMLSpanElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

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
