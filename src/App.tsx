import './App.css';

import { Application, extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { clearInputFrame, isHeld } from './engine/InputManager';

import { updateCurrentScene } from './engine/SceneManager';
import { useCallback } from 'react';
import { useGameLoop } from './hooks/useGameLoop';
import { useInput } from './hooks/useInput';

extend({ Container, Graphics });

const GAME_WIDTH = 240;
const GAME_HEIGHT = 160;

function GameWorld() {
  useGameLoop((deltaMs) => {
    updateCurrentScene(deltaMs);
    clearInputFrame();
  });

  const drawTestRect = useCallback((g: Graphics) => {
    g.clear();
    g.rect(100, 60, 40, 40);
    g.fill({ color: 0x00ff88 });
  }, []);

  const drawInputIndicator = useCallback((g: Graphics) => {
    g.clear();
    const baseX = 10;
    const baseY = 10;
    const size = 6;
    const gap = 8;

    // Draw direction indicators
    const directions: Array<{
      action: 'up' | 'down' | 'left' | 'right';
      dx: number;
      dy: number;
    }> = [
      { action: 'up', dx: gap, dy: 0 },
      { action: 'down', dx: gap, dy: gap * 2 },
      { action: 'left', dx: 0, dy: gap },
      { action: 'right', dx: gap * 2, dy: gap },
    ];

    for (const { action, dx, dy } of directions) {
      const color = isHeld(action) ? 0xffff00 : 0x444444;
      g.rect(baseX + dx, baseY + dy, size, size);
      g.fill({ color });
    }
  }, []);

  return (
    <pixiContainer>
      <pixiGraphics draw={drawTestRect} />
      <pixiGraphics draw={drawInputIndicator} />
    </pixiContainer>
  );
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
