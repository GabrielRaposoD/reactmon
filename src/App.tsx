import './App.css';

import { Application, extend, useTick } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { clearInputFrame, isHeld } from './engine/InputManager';
import { useCallback, useRef } from 'react';

import { updateCurrentScene } from './engine/SceneManager';
import { useGameLoop } from './hooks/useGameLoop';
import { useInput } from './hooks/useInput';

extend({ Container, Graphics });

const GAME_WIDTH = 240;
const GAME_HEIGHT = 160;

function GameWorld() {
  const inputGfxRef = useRef<Graphics>(null);

  useGameLoop((deltaMs) => {
    updateCurrentScene(deltaMs);
    clearInputFrame();
  });

  useTick(() => {
    const g = inputGfxRef.current;
    if (!g) return;

    g.clear();
    const baseX = 10;
    const baseY = 10;
    const size = 6;
    const gap = 8;

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
  });

  const drawTestRect = useCallback((g: Graphics) => {
    g.clear();
    g.rect(100, 60, 40, 40);
    g.fill({ color: 0x00ff88 });
  }, []);

  return (
    <pixiContainer>
      <pixiGraphics draw={drawTestRect} />
      <pixiGraphics ref={inputGfxRef} draw={() => {}} />
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
