import { useState } from 'react';
import { StartScreen } from './components/screens/StartScreen';
import { GameScreen }  from './components/game/GameScreen';

type AppScreen = 'start' | 'game';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('start');
  const [gameKey, setGameKey] = useState(0);
  const [highScore] = useState(
    () => parseInt(localStorage.getItem('tuenti-breakout-hs') ?? '0', 10),
  );
  const goToGame = () => setScreen('game');
  const goToMenu = () => { setGameKey((k) => k + 1); setScreen('start'); };
  return (
    <div className='app'>
      {screen === 'start' && (<StartScreen highScore={highScore} onStart={goToGame} />)}
      {screen === 'game' && (<GameScreen key={gameKey} onGoToMenu={goToMenu} />)}
    </div>
  );
}
