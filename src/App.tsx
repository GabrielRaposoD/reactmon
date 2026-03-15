import './App.css';

import { Application, extend } from '@pixi/react';
import { Container, Graphics, Sprite } from 'pixi.js';
import { useEffect, useState } from 'react';

import type { GameMap } from '@/data/mapTypes';
import { OverworldScene } from '@/scenes/OverworldScene';
import { clearInputFrame } from '@/engine/InputManager';
import { loadMap } from '@/systems/overworld/mapLoader';
import { updateCurrentScene } from '@/engine/SceneManager';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useInput } from '@/hooks/useInput';

extend({ Container, Graphics, Sprite });

const GAME_WIDTH = 240;
const GAME_HEIGHT = 160;

function GameWorld() {
  const [map, setMap] = useState<GameMap | null>(null);

  useGameLoop((deltaMs) => {
    updateCurrentScene(deltaMs);
    clearInputFrame();
  });

  useEffect(() => {
    loadMap('PalletTown').then(setMap);
  }, []);

  if (!map) return null;

  return <OverworldScene map={map} />;
}

function App() {
  useInput();

  return (
    <div className='game-wrapper'>
      <Application
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        backgroundColor={0x111111}
        antialias={false}
        roundPixels={true}
      >
        <GameWorld />
      </Application>
    </div>
  );
}

export { App };
