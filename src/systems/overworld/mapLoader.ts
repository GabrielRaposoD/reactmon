import { BLOCK_PX, STEPS_PER_BLOCK } from '@/data/mapTypes';
import type { GameMap, TmjMap, WarpData } from '@/data/mapTypes';

/**
 * Resolve the tileset image path from the TMJ-relative path
 * to a path usable by the browser (relative to public/).
 *
 * TMJ files store paths like "../../tilesets/rendered/overworld.png"
 * relative to their own location. We convert to "/assets/tilesets/rendered/overworld.png".
 */
function resolveTilesetPath(tmjRelPath: string): string {
  const filename = tmjRelPath.split('/').pop()!;
  return `/assets/tilesets/rendered/${filename}`;
}

function getProperty<T extends string | number>(
  properties: readonly { name: string; type: string; value: string | number }[],
  name: string,
): T | undefined {
  const prop = properties.find((p) => p.name === name);
  return prop?.value as T | undefined;
}

/** Parse a TMJ JSON object into a game-ready GameMap. */
export function parseTmj(name: string, tmj: TmjMap): GameMap {
  const widthBlocks = tmj.width;
  const heightBlocks = tmj.height;
  const widthSteps = widthBlocks * STEPS_PER_BLOCK;
  const heightSteps = heightBlocks * STEPS_PER_BLOCK;
  const widthPx = widthBlocks * BLOCK_PX;
  const heightPx = heightBlocks * BLOCK_PX;

  // Ground layer
  const groundLayer = tmj.layers.find(
    (l): l is TmjMap['layers'][number] & { type: 'tilelayer' } =>
      l.type === 'tilelayer' && l.name === 'ground',
  );
  const groundData =
    groundLayer && groundLayer.type === 'tilelayer' ? groundLayer.data : [];

  // Collision grid from properties
  const collisionStr =
    getProperty<string>(tmj.properties, 'collisionGrid') ?? '';
  const collisionGrid = collisionStr
    ? collisionStr.split(',').map(Number)
    : new Array(widthSteps * heightSteps).fill(1);

  // Tileset info
  const tileset = tmj.tilesets[0];
  const tilesetImage = resolveTilesetPath(tileset.image);
  const tilesetName =
    getProperty<string>(tmj.properties, 'tilesetName') ?? tileset.name;

  // Border block
  const borderBlock = getProperty<number>(tmj.properties, 'borderBlock') ?? 0;

  // Warps from object layer
  const objectLayer = tmj.layers.find(
    (l): l is TmjMap['layers'][number] & { type: 'objectgroup' } =>
      l.type === 'objectgroup',
  );
  const warps: WarpData[] = [];

  if (objectLayer && objectLayer.type === 'objectgroup') {
    for (const obj of objectLayer.objects) {
      if (obj.type !== 'warp' || !obj.properties) continue;

      const destMap = obj.properties.find(
        (p: { name: string }) => p.name === 'destMap',
      )?.value as string | undefined;
      const destWarpId = obj.properties.find(
        (p: { name: string }) => p.name === 'destWarpId',
      )?.value as number | undefined;

      if (destMap !== undefined && destWarpId !== undefined) {
        warps.push({
          x: obj.x / BLOCK_PX, // Convert pixel coords back to step coords
          y: obj.y / BLOCK_PX,
          destMap,
          destWarpId,
        });
      }
    }
  }

  return {
    name,
    widthBlocks,
    heightBlocks,
    widthSteps,
    heightSteps,
    widthPx,
    heightPx,
    groundData,
    collisionGrid,
    tilesetImage,
    tilesetName,
    tilesetColumns: tileset.columns,
    tilesetTileCount: tileset.tilecount,
    warps,
    borderBlock: borderBlock + 1, // Convert to 1-indexed GID
  };
}

/** Fetch and parse a .tmj file. */
export async function loadMap(mapName: string): Promise<GameMap> {
  const url = `/assets/maps/converted/${mapName}.tmj`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load map "${mapName}": ${response.status}`);
  }

  const tmj = (await response.json()) as TmjMap;
  return parseTmj(mapName, tmj);
}
