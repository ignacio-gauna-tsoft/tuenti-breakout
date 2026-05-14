import { useEffect, useRef } from "react";
import gsap from "gsap";

interface Props {
  highScore: number;
  onStart: () => void;
}

export function StartScreen({ highScore, onStart }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        logoRef.current,
        { y: -60, opacity: 0, scale: 0.85 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8 },
      )
        .fromTo(
          subtitleRef.current,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6 },
          "-=0.4",
        )
        .fromTo(
          infoRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5 },
          "-=0.2",
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.4 },
          "-=0.1",
        );

      // Pulsing CTA
      gsap.to(ctaRef.current, {
        scale: 1.04,
        duration: 0.9,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1.2,
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const handleStart = () => {
    gsap.to(rootRef.current, {
      opacity: 0,
      scale: 1.06,
      duration: 0.35,
      ease: "power2.in",
      onComplete: onStart,
    });
  };

  return (
    <div className="start-screen" ref={rootRef}>
      {/* Animated background blobs */}
      <div className="start-bg-blob start-bg-blob--1" />
      <div className="start-bg-blob start-bg-blob--2" />

      <div className="start-content">
        <div className="start-logo" ref={logoRef}>
          <span className="start-logo-t">T</span>
          <span className="start-logo-uenti">uenti</span>
        </div>

        <div className="start-subtitle" ref={subtitleRef}>
          <span className="start-subtitle-text">BREAKOUT</span>
        </div>

        <div className="start-info" ref={infoRef}>
          {highScore > 0 && (
            <p className="start-hs">
              BEST&nbsp;<strong>{highScore.toLocaleString()}</strong>
            </p>
          )}
          <div className="start-controls">
            <span>← → / A D &nbsp;·&nbsp; Mover paleta</span>
            <span>SPACE / TAP &nbsp;·&nbsp; Lanzar pelota</span>
          </div>
        </div>

        <button className="start-cta" ref={ctaRef} onClick={handleStart}>
          JUGAR
        </button>
      </div>
    </div>
  );
}
