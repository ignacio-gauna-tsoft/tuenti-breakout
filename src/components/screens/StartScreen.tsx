import { useEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { QRCodeSVG } from "qrcode.react";
import { BACKGROUND_IMAGE } from "../../game/constants";

const SHARE_URL = "https://ignacio-gauna-tsoft.github.io/tuenti-breakout/";

interface Props {
  highScore: number;
  onStart: (name: string) => void;
}

export function StartScreen({ highScore, onStart }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const [showShare, setShowShare] = useState(false);
  const [name, setName] = useState("");

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
    const trimmed = name.trim();
    if (!trimmed) return;

    gsap.to(rootRef.current, {
      opacity: 0,
      scale: 1.06,
      duration: 0.35,
      ease: "power2.in",
      onComplete: () => onStart(trimmed),
    });
  };

  return (
    <div
      className="start-screen"
      ref={rootRef}
      style={
        { "--start-background-image": `url("${BACKGROUND_IMAGE}")` } as CSSProperties
      }
    >
      <div className="start-content">
        <div className="start-logo" ref={logoRef}>
          <span className="start-logo-supernova">Supernova</span>
        </div>

        <div className="start-subtitle" ref={subtitleRef}>
          <span className="start-subtitle-text">conecta sin limites</span>
        </div>

        <div className="start-info" ref={infoRef}>
          {highScore > 0 && (
            <p className="start-hs">
              BEST&nbsp;<strong>{highScore.toLocaleString()}</strong>
            </p>
          )}
          <div className="start-controls">
            <span className="desktop-instruction">
              &larr; &rarr; / A D &nbsp;&middot;&nbsp; Mover paleta
            </span>
            <span className="desktop-instruction">
              SPACE / TAP &nbsp;&middot;&nbsp; Lanzar pelota
            </span>
            <span className="mobile-instruction">Desliza para mover</span>
            <span className="mobile-instruction">
              Toca y arrastra para lanzar
            </span>
          </div>
        </div>

        <div className="start-name-field">
          <input
            className="start-name-input"
            type="text"
            placeholder="Tu nombre o nick"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStart()}
            aria-label="Nombre del jugador"
          />
        </div>

        <button
          className="start-cta"
          ref={ctaRef}
          onClick={handleStart}
          disabled={!name.trim()}
        >
          JUGAR
        </button>

        <button className="start-share-btn" onClick={() => setShowShare(true)}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Compartir
        </button>
      </div>

      {showShare && (
        <div className="share-backdrop" onClick={() => setShowShare(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="share-modal-close"
              onClick={() => setShowShare(false)}
              aria-label="Cerrar"
            >
              x
            </button>
            <h2 className="share-modal-title">Compartir juego</h2>
            <p className="share-modal-subtitle">Escanea el QR para jugar</p>
            <div className="share-modal-qr">
              <QRCodeSVG
                value={SHARE_URL}
                size={200}
                bgColor="transparent"
                fgColor="#ffffff"
                level="M"
              />
            </div>
            <p className="share-modal-url">{SHARE_URL}</p>
          </div>
        </div>
      )}
    </div>
  );
}
