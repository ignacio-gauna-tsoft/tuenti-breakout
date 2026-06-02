import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PRINCIPLES, POWERUP_DURATION_MS } from "../../game/constants";
import type { ActiveEffect } from "../../game/types";

interface Props {
  activeEffects: ActiveEffect[];
}

interface EffectState {
  type: string;
  secsLeft: number;
  progress: number; // 0→1 remaining
}

export function ActiveEffectsBar({ activeEffects }: Props) {
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);

  useEffect(() => {
    if (activeEffects.length === 0) return;

    let running = true;
    const loop = (ts: number) => {
      if (!running) return;
      if (ts - lastRef.current >= 100) {
        lastRef.current = ts;
        setTick((t) => t + 1);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [activeEffects.length]);

  const now = Date.now();
  const effects: EffectState[] = activeEffects
    .filter((e) => e.expiresAt > now)
    .map((e) => {
      const remaining = Math.max(0, e.expiresAt - now);
      return {
        type: e.type,
        secsLeft: Math.ceil(remaining / 1000),
        progress: remaining / POWERUP_DURATION_MS,
      };
    });

  if (effects.length === 0) return null;

  // SVG spinner constants
  const RADIUS = 14;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  return (
    <div className="active-effects-bar" aria-label="Power-ups activos">
      {effects.map((eff) => {
        const p = PRINCIPLES[eff.type as keyof typeof PRINCIPLES];
        if (!p) return null;
        const dashOffset = CIRCUMFERENCE * (1 - Math.min(1, eff.progress));

        return (
          <div
            key={eff.type}
            className="active-effect-chip"
            style={{ "--eff-color": p.color } as CSSProperties}
          >
            <div className="active-effect-spinner-wrap">
              {/* SVG spinner */}
              <svg
                className="active-effect-spinner"
                width="36"
                height="36"
                viewBox="0 0 36 36"
                aria-hidden="true"
              >
                {/* Track */}
                <circle
                  cx="18"
                  cy="18"
                  r={RADIUS}
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="2.5"
                />
                {/* Progress arc */}
                <circle
                  cx="18"
                  cy="18"
                  r={RADIUS}
                  fill="none"
                  stroke={p.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 18 18)"
                  style={{ filter: `drop-shadow(0 0 4px ${p.color})` }}
                />
              </svg>
              {/* Principle icon centered inside spinner */}
              <img
                src={p.image}
                alt={p.shortLabel}
                className="active-effect-icon"
              />
            </div>
            {/* Seconds countdown below */}
            <span className="active-effect-secs">{eff.secsLeft}s</span>
          </div>
        );
      })}
    </div>
  );
}
