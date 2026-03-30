import { Container, Rectangle, Sprite, Texture } from 'pixi.js';
import { useEffect, useMemo, useRef, useState } from 'react';

import { BLOCK_PX } from '@/data/mapTypes';
import type { GameMap } from '@/data/mapTypes';
import { extend } from '@pixi/react';
import { loadTexture } from '@/engine/SpriteSheet';

extend({ Container, Sprite });

interface TilemapRendererProps {
  map: GameMap;
}

/**
 * Renders the ground layer of a GameMap.
 * Each block in the map grid becomes a Sprite using a sub-region of the rendered tileset.
 */
function TilemapRenderer({
  map,
}: TilemapRendererProps): React.JSX.Element | null {
  const [tilesetTexture, setTilesetTexture] = useState<Texture | null>(null);
  const containerRef = useRef<Container>(null);

  // Load the tileset texture
  useEffect(() => {
    let cancelled = false;
    loadTexture(map.tilesetImage).then((tex) => {
      if (!cancelled) setTilesetTexture(tex);
    });
    return () => {
      cancelled = true;
    };
  }, [map.tilesetImage]);

  // Create block textures from the tileset (one per unique GID)
  const blockTextures = useMemo(() => {
    if (!tilesetTexture) return new Map<number, Texture>();

    const textures = new Map<number, Texture>();

    for (const gid of map.groundData) {
      if (gid === 0 || textures.has(gid)) continue;
      const blockIndex = gid - 1; // GIDs are 1-indexed
      const col = blockIndex % map.tilesetColumns;
      const row = Math.floor(blockIndex / map.tilesetColumns);

      const frame = new Rectangle(
        col * BLOCK_PX,
        row * BLOCK_PX,
        BLOCK_PX,
        BLOCK_PX,
      );
      textures.set(gid, new Texture({ source: tilesetTexture.source, frame }));
    }

    return textures;
  }, [tilesetTexture, map.groundData, map.tilesetColumns]);

  if (!tilesetTexture || blockTextures.size === 0) {
    return null;
  }

  return (
    <pixiContainer ref={containerRef}>
      {map.groundData.map((gid, index) => {
        if (gid === 0) return null;
        const texture = blockTextures.get(gid);
        if (!texture) return null;

        const bx = (index % map.widthBlocks) * BLOCK_PX;
        const by = Math.floor(index / map.widthBlocks) * BLOCK_PX;

        return <pixiSprite key={index} texture={texture} x={bx} y={by} />;
      })}
    </pixiContainer>
  );
}

export { TilemapRenderer };
