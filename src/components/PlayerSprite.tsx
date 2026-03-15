import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Rectangle, Sprite, Texture } from 'pixi.js';
import { extend, useTick } from '@pixi/react';
import {
  getFacing,
  getRenderPosition,
  getWalkFrame,
  isMoving,
} from '@/systems/overworld/movement';

import type { Direction } from '@/data/mapTypes';
import { loadSpriteTexture } from '@/engine/SpriteSheet';

extend({ Sprite });

/** Sprite strip is 16×96: 6 frames of 16×16, vertically arranged. */
const FRAME_SIZE = 16;

/**
 * Gen 1 overworld sprite layout (16×96 vertical strip):
 * Frame 0 (y=0):  Down, standing
 * Frame 1 (y=16): Up, standing
 * Frame 2 (y=32): Side, standing (faces left; flip for right)
 * Frame 3 (y=48): Down, walking
 * Frame 4 (y=64): Up, walking
 * Frame 5 (y=80): Side, walking (faces left; flip for right)
 */
const DIRECTION_FRAMES: Record<
  Direction,
  { standing: number; walking: number }
> = {
  down: { standing: 0, walking: 3 },
  up: { standing: 1, walking: 4 },
  left: { standing: 2, walking: 5 },
  right: { standing: 2, walking: 5 },
};

function PlayerSprite(): React.JSX.Element | null {
  const [sheetTexture, setSheetTexture] = useState<Texture | null>(null);
  const spriteRef = useRef<Sprite>(null);

  useEffect(() => {
    let cancelled = false;
    loadSpriteTexture('/assets/sprites/red.png').then((tex) => {
      if (!cancelled) setSheetTexture(tex);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const frameTextures = useMemo(() => {
    if (!sheetTexture) return null;

    const textures: Texture[] = [];
    for (let i = 0; i < 6; i++) {
      const frame = new Rectangle(0, i * FRAME_SIZE, FRAME_SIZE, FRAME_SIZE);
      textures.push(new Texture({ source: sheetTexture.source, frame }));
    }
    return textures;
  }, [sheetTexture]);

  // Imperatively update sprite every frame — bypasses React render cycle
  useTick(() => {
    const sprite = spriteRef.current;
    if (!sprite || !frameTextures) return;

    const facing = getFacing();
    const pos = getRenderPosition();
    const moving = isMoving();

    const frames = DIRECTION_FRAMES[facing];

    // Walk cycle: walkFrame toggles 0/1 each step.
    // Down/Up: always show walking frame while moving; flip horizontally on
    //   alternate steps so the opposite leg appears forward.
    // Side: alternate standing ↔ walking frame each step (flipping would
    //   reverse the sprite direction).
    let frameIdx: number;
    let flipForWalk = false;
    if (!moving) {
      frameIdx = frames.standing;
    } else {
      const walkFrame = getWalkFrame();
      if (facing === 'down' || facing === 'up') {
        frameIdx = frames.walking;
        flipForWalk = walkFrame === 1;
      } else {
        frameIdx = walkFrame === 1 ? frames.walking : frames.standing;
      }
    }
    sprite.texture = frameTextures[frameIdx];

    const flipDirection = facing === 'right';
    const shouldFlip = flipDirection !== flipForWalk;
    sprite.scale.x = shouldFlip ? -1 : 1;
    sprite.x = pos.x + (shouldFlip ? FRAME_SIZE : 0);
    sprite.y = pos.y;
  });

  if (!frameTextures) return null;

  return <pixiSprite ref={spriteRef} texture={frameTextures[0]} />;
}

export { PlayerSprite };
