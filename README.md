# Tuenti Breakout

Demo web de un juego tipo Breakout con estética moderna de Tuenti (colores pitaya). React + Vite + TypeScript + GSAP.

## Stack

| Tecnología    | Versión | Rol                      |
| ------------- | ------- | ------------------------ |
| React         | 19      | UI y componentes         |
| Vite          | 8       | Build tool + dev server  |
| TypeScript    | 6       | Tipos estáticos          |
| GSAP          | 3       | Animaciones de pantallas |
| Web Audio API | nativa  | Sonidos procedurales     |
| Canvas 2D API | nativa  | Renderizado del juego    |

## Cómo levantar el proyecto

```bash
npm install       # instalar dependencias
npm run dev       # dev server en http://localhost:5173
npm run build     # build de producción
npm run preview   # preview del build
```

## Estructura

```
src/
  game/
    types.ts        Tipos del dominio del juego
    constants.ts    Tamaños, velocidades, colores
    levels.ts       Layouts de ladrillos por nivel (3 niveles)
    sound.ts        Motor de sonido (Web Audio API)
    engine.ts       GameEngine - toda la lógica del juego
    renderer.ts     Renderizado en canvas (función pura)
  hooks/
    useBreakoutGame.ts  RAF loop, input, sincronización con React
  components/
    game/
      GameScreen.tsx    Canvas + HUD + overlay de GameOver
      HUD.tsx           Vidas, score, nivel, efectos activos
    screens/
      StartScreen.tsx     Pantalla de inicio (GSAP)
      GameOverScreen.tsx  Pantalla game over (GSAP)
  App.tsx       Router de pantallas (start / game)
  main.tsx      Entry point
  index.css     Design system completo (CSS custom properties)
```

## Diseño visual — Paleta Tuenti Pitaya

| Token CSS      | Valor   | Uso                                      |
| -------------- | ------- | ---------------------------------------- |
| --pitaya       | #E91E8C | Color principal, glow de pelota y paleta |
| --pitaya-light | #FF4DB8 | Highlights y títulos                     |
| --pitaya-dark  | #C2006B | Degradados profundos                     |
| --bg           | #07071A | Fondo de la app                          |
| --cyan         | #00D4FF | Power-up Wide Paddle                     |
| --yellow       | #FFD600 | Power-up Double Ball, highscore          |
| --green        | #00E5A0 | Power-up Slow Ball                       |
| --orange       | #FF6B35 | Power-up Fireball                        |

Tipografía: **Orbitron** (display/scores) + **Space Grotesk** (cuerpo).

## Mecánica

### Controles

| Acción        | Desktop       | Mobile         |
| ------------- | ------------- | -------------- |
| Mover paleta  | Flechas / A D | Arrastrar dedo |
| Lanzar pelota | SPACE         | Tocar pantalla |

### Niveles

- **Nivel 1**: grid completo, 1 golpe por ladrillo
- **Nivel 2**: ladrillos de 2 golpes en patrón diagonal
- **Nivel 3**: mezcla de 1, 2 y 3 golpes
- **Nivel 4+**: reutiliza layout del 3, velocidad creciente (+0.4 px/frame, cap 10)

### Puntuación por fila (top a bottom)

150 · 120 · 90 · 60 · 40 · 30 pts (ladrillos de N golpes dan Nx los puntos base).

### Power-ups (drop chance 20%, duración 9s)

| ID             | Efecto                                 |
| -------------- | -------------------------------------- |
| WIDE (cyan)    | Paleta 1.7x más ancha                  |
| x2 (amarillo)  | Segunda pelota (máx 4)                 |
| SLOW (verde)   | Velocidad al 60%                       |
| FIRE (naranja) | Pelota atraviesa ladrillos sin rebotar |

## Animaciones

**GSAP**: StartScreen con stagger de entrada + pulso en CTA. GameOverScreen con bounce-in + fade-out al navegar.

**Partículas canvas**: explosión radial en destrucción (14 partículas), hit sin destruir (5), recolectar power-up (20 en anillo). Todas con gravedad y drag.

**Canvas**: glow via shadowBlur en pelota/paleta, gradientes en ladrillos, grilla tenue de fondo, overlay de crack en multi-hit.

## Sonidos (Web Audio API, sin assets externos)

paddleHit: square 440Hz | brickHit: square 660Hz | brickBreak: sawtooth 880-rowx80Hz | powerUp: sine arpeggio | lifeLost: sawtooth descendente | gameOver: sawtooth | levelComplete: sine arpeggio ascendente.

## Decisiones de arquitectura

1. **Sin React state en game loop**: estado del juego en `engineRef` (mutable). Solo se sincroniza a `useState` lo mínimo (score, vidas, phase). Sin reconciliación en cada frame.
2. **RAF loop siempre activo**: simplifica ciclo de vida. Sin engine activo, no hace nada.
3. **Renderer puro**: `renderGame(ctx, state)` sin estado ni efectos secundarios.
4. **Engine como clase**: estado mutable natural para física frame-a-frame.
5. **Sin StrictMode**: el doble-mounting crearía dos RAF loops en desarrollo.
6. **Sonido procedural**: sin assets de audio. Funciona offline.
7. **Canvas responsivo**: resolución fija 480x640, escalada con CSS aspect-ratio.

## Persistencia

Highscore en `localStorage` bajo la clave `tuenti-breakout-hs`.
