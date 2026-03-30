import React, { useEffect, useRef, useState } from 'react';
import { centerCameraOn, getCameraOffset } from '@/engine/Camera';
import { extend, useTick } from '@pixi/react';
import {
  getFacing,
  getRenderPosition,
  initMovement,
  isMoving as isPlayerMoving,
  tryMove,
  updateMovement,
} from '@/systems/overworld/movement';

import { Container } from 'pixi.js';
import type { GameMap } from '@/data/mapTypes';
import { PlayerSprite } from '@/components/PlayerSprite';
import { STEP_PX } from '@/data/mapTypes';
import { TilemapRenderer } from '@/components/TilemapRenderer';
import { isHeld } from '@/engine/InputManager';
import { usePlayerStore } from '@/stores/playerStore';

extend({ Container });

interface OverworldSceneProps {
  map: GameMap;
}

function OverworldScene({ map }: OverworldSceneProps): React.JSX.Element {
  const containerRef = useRef<Container>(null);
  const { stepX, stepY, facing, setPosition, setFacing } = usePlayerStore();
  const [initialized, setInitialized] = useState(false);

  // Initialize movement system when map/position changes
  useEffect(() => {
    initMovement(stepX, stepY, facing);
    setInitialized(true);
  }, [map.name]);

  // Per-frame update: handle input, update movement, update camera
  useTick((ticker) => {
    if (!initialized) return;

    const deltaMs = ticker.deltaMS;

    // Read directional input and try to move
    if (!isPlayerMoving()) {
      const { stepX: currentX, stepY: currentY } = usePlayerStore.getState();

      if (isHeld('up')) {
        tryMove(map, currentX, currentY, 'up');
      } else if (isHeld('down')) {
        tryMove(map, currentX, currentY, 'down');
      } else if (isHeld('left')) {
        tryMove(map, currentX, currentY, 'left');
      } else if (isHeld('right')) {
        tryMove(map, currentX, currentY, 'right');
      }
    }

    // Update movement animation
    const arrived = updateMovement(deltaMs);
    if (arrived) {
      setPosition(arrived.x, arrived.y);
      setFacing(getFacing());
    }

    // Update camera to follow player
    const renderPos = getRenderPosition();
    // Center on the middle of the player sprite (8px offset for 16px sprite)
    centerCameraOn(
      renderPos.x + STEP_PX / 2,
      renderPos.y + STEP_PX / 2,
      map.widthPx,
      map.heightPx,
    );

    // Apply camera offset to the world container
    const offset = getCameraOffset();
    const container = containerRef.current;
    if (container) {
      container.x = offset.x;
      container.y = offset.y;
    }
  });

  return (
    <pixiContainer ref={containerRef}>
      <TilemapRenderer map={map} />
      <PlayerSprite />
    </pixiContainer>
  );
}

export { OverworldScene };
