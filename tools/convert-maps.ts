import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'fs';
import { join, resolve } from 'path';

import { PNG } from 'pngjs';

// ── Constants ──────────────────────────────────────────────────────────────

const ASSETS_DIR = resolve(import.meta.dirname, '../public/assets');
const TILE_PX = 8;
const BLOCK_TILES = 4; // 4×4 tiles per block
const BLOCK_PX = TILE_PX * BLOCK_TILES; // 32px
const RENDERED_COLS = 16; // blocks per row in rendered tileset

/** Maps tileset constant names (from map headers) to file basenames */
const TILESET_FILE_MAP: Record<string, string> = {
  OVERWORLD: 'overworld',
  REDS_HOUSE_1: 'reds_house',
  REDS_HOUSE_2: 'reds_house',
  MART: 'pokecenter',
  FOREST: 'forest',
  DOJO: 'gym',
  POKECENTER: 'pokecenter',
  GYM: 'gym',
  HOUSE: 'house',
  FOREST_GATE: 'gate',
  MUSEUM: 'gate',
  UNDERGROUND: 'underground',
  GATE: 'gate',
  SHIP: 'ship',
  SHIP_PORT: 'ship_port',
  CEMETERY: 'cemetery',
  INTERIOR: 'interior',
  CAVERN: 'cavern',
  LOBBY: 'lobby',
  MANSION: 'mansion',
  LAB: 'lab',
  CLUB: 'club',
  FACILITY: 'facility',
  PLATEAU: 'plateau',
  BEACH_HOUSE: 'beach_house',
};

/** Maps tileset constant names to collision label prefixes in collision_tile_ids.asm */
const TILESET_COLLISION_MAP: Record<string, string> = {
  OVERWORLD: 'Overworld',
  REDS_HOUSE_1: 'RedsHouse1',
  REDS_HOUSE_2: 'RedsHouse2',
  MART: 'Mart',
  FOREST: 'Forest',
  DOJO: 'Dojo',
  POKECENTER: 'Pokecenter',
  GYM: 'Gym',
  HOUSE: 'House',
  FOREST_GATE: 'ForestGate',
  MUSEUM: 'Museum',
  UNDERGROUND: 'Underground',
  GATE: 'Gate',
  SHIP: 'Ship',
  SHIP_PORT: 'ShipPort',
  CEMETERY: 'Cemetery',
  INTERIOR: 'Interior',
  CAVERN: 'Cavern',
  LOBBY: 'Lobby',
  MANSION: 'Mansion',
  LAB: 'Lab',
  CLUB: 'Club',
  FACILITY: 'Facility',
  PLATEAU: 'Plateau',
  BEACH_HOUSE: 'BeachHouse',
};

// ── Types ──────────────────────────────────────────────────────────────────

interface MapDimensions {
  width: number;
  height: number;
}

interface MapHeader {
  name: string;
  constant: string;
  tileset: string;
  connections: string[];
}

interface WarpEvent {
  x: number;
  y: number;
  destMap: string;
  destWarpId: number;
}

interface BgEvent {
  x: number;
  y: number;
  textId: string;
}

interface ObjectEvent {
  x: number;
  y: number;
  sprite: string;
  movement: string;
  direction: string;
  textId: string;
}

interface MapObjects {
  borderBlock: number;
  warps: WarpEvent[];
  signs: BgEvent[];
  objects: ObjectEvent[];
}

interface RenderedTileset {
  imageFile: string;
  imageWidth: number;
  imageHeight: number;
  blockCount: number;
  columns: number;
  blocks: number[][]; // cached blockset data (4×4 tile indices per block)
}

// ── Parsing: Map Constants ─────────────────────────────────────────────────

function parseMapConstants(filePath: string): Map<string, MapDimensions> {
  const content = readFileSync(filePath, 'utf-8');
  const dims = new Map<string, MapDimensions>();
  const re = /map_const\s+(\w+),\s*(\d+),\s*(\d+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const [, name, w, h] = match;
    const width = parseInt(w, 10);
    const height = parseInt(h, 10);
    if (width > 0 && height > 0) {
      dims.set(name, { width, height });
    }
  }
  return dims;
}

// ── Parsing: Map Headers ───────────────────────────────────────────────────

function parseMapHeader(filePath: string): MapHeader | null {
  const content = readFileSync(filePath, 'utf-8');
  const re = /map_header\s+(\w+),\s*(\w+),\s*(\w+),\s*(.+)/;
  const match = content.match(re);
  if (!match) return null;
  const [, name, constant, tileset, connStr] = match;
  const connections = connStr
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s !== '0');
  return { name, constant, tileset, connections };
}

// ── Parsing: Collision Data ────────────────────────────────────────────────

function parseCollisionData(filePath: string): Map<string, Set<number>> {
  const content = readFileSync(filePath, 'utf-8');
  const result = new Map<string, Set<number>>();

  // Match labels like "Overworld_Coll::" or shared labels
  // "Mart_Coll::\nPokecenter_Coll::\n\tcoll_tiles ..."
  const lines = content.split('\n');
  let currentLabels: string[] = [];

  for (const line of lines) {
    const labelMatch = line.match(/^(\w+)_Coll::/);
    if (labelMatch) {
      currentLabels.push(labelMatch[1]);
      continue;
    }

    const tilesMatch = line.match(/coll_tiles\s+(.*)/);
    if (tilesMatch && currentLabels.length > 0) {
      const hexValues = tilesMatch[1]
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const blockIds = new Set<number>();
      for (const hex of hexValues) {
        const val = parseInt(hex.replace('$', '0x'), 16);
        if (!isNaN(val)) blockIds.add(val);
      }
      for (const label of currentLabels) {
        result.set(label, blockIds);
      }
      currentLabels = [];
      continue;
    }

    // Reset if we hit a non-label, non-coll_tiles line between labels
    if (line.trim().length > 0 && !labelMatch) {
      // Keep collecting labels only if the line is a label too
      if (!line.match(/^\w+_Coll::/) && !line.match(/coll_tiles/)) {
        // Only reset if this isn't a comment or empty
        if (!line.trim().startsWith(';') && line.trim().length > 0) {
          currentLabels = [];
        }
      }
    }
  }

  return result;
}

// ── Parsing: Map Objects ───────────────────────────────────────────────────

function parseMapObjects(filePath: string): MapObjects {
  const content = readFileSync(filePath, 'utf-8');
  const result: MapObjects = {
    borderBlock: 0,
    warps: [],
    signs: [],
    objects: [],
  };

  // Border block
  const borderMatch = content.match(
    /db\s+\$([0-9a-fA-F]+)\s*;\s*border\s*block/i,
  );
  if (borderMatch) {
    result.borderBlock = parseInt(borderMatch[1], 16);
  }

  // Warps: warp_event  5,  5, REDS_HOUSE_1F, 1
  const warpRe = /warp_event\s+(\d+),\s*(\d+),\s*(\w+),\s*(\d+)/g;
  let match: RegExpExecArray | null;
  while ((match = warpRe.exec(content)) !== null) {
    result.warps.push({
      x: parseInt(match[1], 10),
      y: parseInt(match[2], 10),
      destMap: match[3],
      destWarpId: parseInt(match[4], 10),
    });
  }

  // Background events (signs): bg_event 13, 13, TEXT_...
  const bgRe = /bg_event\s+(\d+),\s*(\d+),\s*(\w+)/g;
  while ((match = bgRe.exec(content)) !== null) {
    result.signs.push({
      x: parseInt(match[1], 10),
      y: parseInt(match[2], 10),
      textId: match[3],
    });
  }

  // Object events: object_event 10, 4, SPRITE_OAK, STAY, NONE, TEXT_...
  const objRe =
    /object_event\s+(\d+),\s*(\d+),\s*(\w+),\s*(\w+),\s*(\w+),\s*(\w+)/g;
  while ((match = objRe.exec(content)) !== null) {
    result.objects.push({
      x: parseInt(match[1], 10),
      y: parseInt(match[2], 10),
      sprite: match[3],
      movement: match[4],
      direction: match[5],
      textId: match[6],
    });
  }

  return result;
}

// ── Tileset / Blockset Reading ─────────────────────────────────────────────

function readPng(filePath: string): PNG {
  const buffer = readFileSync(filePath);
  return PNG.sync.read(buffer);
}

/**
 * Extract all 8×8 tiles from a tileset PNG.
 * Returns array of RGBA pixel data (8×8×4 = 256 bytes each).
 */
function extractTiles(png: PNG): Buffer[] {
  const tilesPerRow = Math.floor(png.width / TILE_PX);
  const tileRows = Math.floor(png.height / TILE_PX);
  const tiles: Buffer[] = [];

  for (let ty = 0; ty < tileRows; ty++) {
    for (let tx = 0; tx < tilesPerRow; tx++) {
      const tile = Buffer.alloc(TILE_PX * TILE_PX * 4);
      for (let py = 0; py < TILE_PX; py++) {
        for (let px = 0; px < TILE_PX; px++) {
          const srcIdx =
            ((ty * TILE_PX + py) * png.width + (tx * TILE_PX + px)) * 4;
          const dstIdx = (py * TILE_PX + px) * 4;
          png.data.copy(tile, dstIdx, srcIdx, srcIdx + 4);
        }
      }
      tiles.push(tile);
    }
  }

  return tiles;
}

/**
 * Read a .bst blockset file.
 * Returns array of blocks, each block is an array of 16 tile indices (4×4 grid).
 */
function readBlockset(filePath: string): number[][] {
  const data = readFileSync(filePath);
  const blockCount = Math.floor(data.length / 16);
  const blocks: number[][] = [];

  for (let i = 0; i < blockCount; i++) {
    const block: number[] = [];
    for (let j = 0; j < 16; j++) {
      block.push(data[i * 16 + j]);
    }
    blocks.push(block);
  }

  return blocks;
}

// ── Rendering ──────────────────────────────────────────────────────────────

/**
 * Render all blocks into a composite tileset PNG.
 * Each block is 32×32px, arranged in RENDERED_COLS columns.
 */
function renderBlockTileset(
  tiles: Buffer[],
  blocks: number[][],
  outputPath: string,
): RenderedTileset {
  const blockCount = blocks.length;
  const cols = RENDERED_COLS;
  const rows = Math.ceil(blockCount / cols);
  const imgWidth = cols * BLOCK_PX;
  const imgHeight = rows * BLOCK_PX;

  const png = new PNG({ width: imgWidth, height: imgHeight });

  for (let blockIdx = 0; blockIdx < blockCount; blockIdx++) {
    const block = blocks[blockIdx];
    const bx = (blockIdx % cols) * BLOCK_PX;
    const by = Math.floor(blockIdx / cols) * BLOCK_PX;

    for (let tilePos = 0; tilePos < 16; tilePos++) {
      const tileIdx = block[tilePos];
      const tx = (tilePos % BLOCK_TILES) * TILE_PX;
      const ty = Math.floor(tilePos / BLOCK_TILES) * TILE_PX;

      const tileData = tiles[tileIdx];
      if (!tileData) continue; // tile index out of range — leave transparent

      for (let py = 0; py < TILE_PX; py++) {
        for (let px = 0; px < TILE_PX; px++) {
          const srcIdx = (py * TILE_PX + px) * 4;
          const dstX = bx + tx + px;
          const dstY = by + ty + py;
          const dstIdx = (dstY * imgWidth + dstX) * 4;
          tileData.copy(png.data, dstIdx, srcIdx, srcIdx + 4);
        }
      }
    }
  }

  mkdirSync(resolve(outputPath, '..'), { recursive: true });
  writeFileSync(outputPath, PNG.sync.write(png));

  return {
    imageFile: outputPath,
    imageWidth: imgWidth,
    imageHeight: imgHeight,
    blockCount,
    columns: cols,
    blocks, // preserve for collision computation
  };
}

// ── Tiled JSON Generation ──────────────────────────────────────────────────

/**
 * Compute step-resolution collision grid.
 * Each block (32×32) contains 2×2 step positions (16×16 each).
 * Each step position has 2×2 tiles (8×8). A step is passable if ALL
 * its tiles are in the passable tile ID set.
 *
 * Returns flat array of (width*2) × (height*2) values: 0=passable, 1=blocked.
 */
function computeStepCollision(
  width: number,
  height: number,
  blkData: Buffer,
  blocks: number[][],
  passableTileIds: Set<number>,
): number[] {
  const stepW = width * 2;
  const stepH = height * 2;
  const collision: number[] = new Array(stepW * stepH).fill(1);

  for (let by = 0; by < height; by++) {
    for (let bx = 0; bx < width; bx++) {
      const blkIdx = by * width + bx;
      const blockId = blkIdx < blkData.length ? blkData[blkIdx] : 0;
      const block = blocks[blockId];
      if (!block) continue;

      // 4 step positions per block (2×2)
      for (let sy = 0; sy < 2; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          // Each step = 2×2 tiles within the 4×4 block grid
          const tileRow = sy * 2;
          const tileCol = sx * 2;
          const t0 = block[tileRow * 4 + tileCol];
          const t1 = block[tileRow * 4 + tileCol + 1];
          const t2 = block[(tileRow + 1) * 4 + tileCol];
          const t3 = block[(tileRow + 1) * 4 + tileCol + 1];

          const passable =
            passableTileIds.has(t0) &&
            passableTileIds.has(t1) &&
            passableTileIds.has(t2) &&
            passableTileIds.has(t3);

          const stepX = bx * 2 + sx;
          const stepY = by * 2 + sy;
          collision[stepY * stepW + stepX] = passable ? 0 : 1;
        }
      }
    }
  }

  return collision;
}

function generateTmj(
  mapName: string,
  width: number,
  height: number,
  blkData: Buffer,
  tilesetName: string,
  tilesetRelPath: string,
  renderedTileset: RenderedTileset,
  passableTileIds: Set<number>,
  objects: MapObjects,
  constantToName: Map<string, string>,
): object {
  // Ground layer: block IDs from .blk, converted to 1-indexed Tiled GIDs
  const groundData: number[] = [];
  for (let i = 0; i < width * height; i++) {
    const blockId = i < blkData.length ? blkData[i] : 0;
    groundData.push(blockId + 1); // Tiled uses 1-indexed GIDs (0 = empty)
  }

  // Step-resolution collision grid (2× map dimensions, 16×16 per cell)
  const collisionGrid = computeStepCollision(
    width,
    height,
    blkData,
    renderedTileset.blocks,
    passableTileIds,
  );

  // Object layer: warps, signs, NPCs
  const tiledObjects: object[] = [];
  let objectId = 1;

  // In Gen 1, object coordinates are in "steps" (16px units) within the map.
  // The map is in blocks (32px). Object x,y are in step coordinates.
  // Tiled uses pixel coordinates, so multiply by 16.
  for (const warp of objects.warps) {
    // Resolve UPPER_SNAKE_CASE constant to PascalCase filename.
    // LAST_MAP is a special sentinel meaning "return to previous map".
    const resolvedDest =
      warp.destMap === 'LAST_MAP'
        ? 'LAST_MAP'
        : (constantToName.get(warp.destMap) ?? warp.destMap);
    tiledObjects.push({
      id: objectId++,
      name: `warp_${warp.destMap}`,
      type: 'warp',
      x: warp.x * 16,
      y: warp.y * 16,
      width: 16,
      height: 16,
      properties: [
        { name: 'destMap', type: 'string', value: resolvedDest },
        { name: 'destWarpId', type: 'int', value: warp.destWarpId },
      ],
    });
  }

  for (const sign of objects.signs) {
    tiledObjects.push({
      id: objectId++,
      name: sign.textId,
      type: 'sign',
      x: sign.x * 16,
      y: sign.y * 16,
      width: 16,
      height: 16,
      properties: [{ name: 'textId', type: 'string', value: sign.textId }],
    });
  }

  for (const obj of objects.objects) {
    tiledObjects.push({
      id: objectId++,
      name: obj.sprite,
      type: 'npc',
      x: obj.x * 16,
      y: obj.y * 16,
      width: 16,
      height: 16,
      properties: [
        { name: 'sprite', type: 'string', value: obj.sprite },
        { name: 'movement', type: 'string', value: obj.movement },
        { name: 'direction', type: 'string', value: obj.direction },
        { name: 'textId', type: 'string', value: obj.textId },
      ],
    });
  }

  return {
    type: 'map',
    version: '1.10',
    tiledversion: '1.11.2',
    orientation: 'orthogonal',
    renderorder: 'right-down',
    width,
    height,
    tilewidth: BLOCK_PX,
    tileheight: BLOCK_PX,
    infinite: false,
    properties: [
      { name: 'tilesetName', type: 'string', value: tilesetName },
      { name: 'borderBlock', type: 'int', value: objects.borderBlock },
      { name: 'collisionGridWidth', type: 'int', value: width * 2 },
      { name: 'collisionGridHeight', type: 'int', value: height * 2 },
      { name: 'collisionGrid', type: 'string', value: collisionGrid.join(',') },
    ],
    layers: [
      {
        id: 1,
        name: 'ground',
        type: 'tilelayer',
        x: 0,
        y: 0,
        width,
        height,
        data: groundData,
        opacity: 1,
        visible: true,
      },
      {
        id: 3,
        name: 'objects',
        type: 'objectgroup',
        x: 0,
        y: 0,
        objects: tiledObjects,
        opacity: 1,
        visible: true,
      },
    ],
    tilesets: [
      {
        firstgid: 1,
        name: tilesetName,
        tilewidth: BLOCK_PX,
        tileheight: BLOCK_PX,
        tilecount: renderedTileset.blockCount,
        columns: renderedTileset.columns,
        image: tilesetRelPath,
        imagewidth: renderedTileset.imageWidth,
        imageheight: renderedTileset.imageHeight,
      },
    ],
  };
}

// ── Main ───────────────────────────────────────────────────────────────────

function main(): void {
  console.log('=== Reactmon Map Converter ===\n');

  // 1. Parse map constants (dimensions)
  const constantsPath = join(ASSETS_DIR, 'maps/data/map_constants.asm');
  if (!existsSync(constantsPath)) {
    console.error('Missing map_constants.asm — run extraction first');
    process.exit(1);
  }
  const mapDimensions = parseMapConstants(constantsPath);
  console.log(`Loaded ${mapDimensions.size} map dimensions`);

  // 2. Parse collision data
  const collisionPath = join(ASSETS_DIR, 'maps/data/collision_tile_ids.asm');
  const collisionData = parseCollisionData(collisionPath);
  console.log(`Loaded collision data for ${collisionData.size} tilesets`);

  // 3. Discover all map headers
  const headersDir = join(ASSETS_DIR, 'maps/headers');
  const headerFiles = readdirSync(headersDir).filter((f) => f.endsWith('.asm'));
  console.log(`Found ${headerFiles.length} map header files`);

  // 4. Render unique tilesets (only render each file once)
  const renderedTilesets = new Map<string, RenderedTileset>();
  const renderedDir = join(ASSETS_DIR, 'tilesets/rendered');
  mkdirSync(renderedDir, { recursive: true });

  function ensureTilesetRendered(tilesetConst: string): RenderedTileset | null {
    const fileBase = TILESET_FILE_MAP[tilesetConst];
    if (!fileBase) {
      console.warn(`  Unknown tileset constant: ${tilesetConst}`);
      return null;
    }

    if (renderedTilesets.has(fileBase)) {
      return renderedTilesets.get(fileBase)!;
    }

    const pngPath = join(ASSETS_DIR, `tilesets/${fileBase}.png`);
    const bstPath = join(ASSETS_DIR, `blocksets/${fileBase}.bst`);

    if (!existsSync(pngPath) || !existsSync(bstPath)) {
      console.warn(`  Missing tileset files for ${fileBase}`);
      return null;
    }

    console.log(`  Rendering tileset: ${fileBase}`);
    const png = readPng(pngPath);
    const tiles = extractTiles(png);
    const blocks = readBlockset(bstPath);
    const outputPath = join(renderedDir, `${fileBase}.png`);
    const result = renderBlockTileset(tiles, blocks, outputPath);
    renderedTilesets.set(fileBase, result);
    return result;
  }

  // 5. Build constant → PascalCase name lookup for warp resolution
  const constantToName = new Map<string, string>();
  for (const headerFile of headerFiles) {
    const headerPath = join(headersDir, headerFile);
    const header = parseMapHeader(headerPath);
    if (header) {
      constantToName.set(header.constant, header.name);
    }
  }
  console.log(`Built ${constantToName.size} constant→name mappings`);

  // 6. Convert each map
  const convertedDir = join(ASSETS_DIR, 'maps/converted');
  mkdirSync(convertedDir, { recursive: true });

  let converted = 0;
  let skipped = 0;

  for (const headerFile of headerFiles) {
    const headerPath = join(headersDir, headerFile);
    const header = parseMapHeader(headerPath);
    if (!header) {
      skipped++;
      continue;
    }

    // Get dimensions
    const dims = mapDimensions.get(header.constant);
    if (!dims) {
      console.warn(`  No dimensions for ${header.constant}, skipping`);
      skipped++;
      continue;
    }

    // Check .blk file exists
    const blkPath = join(ASSETS_DIR, `maps/${header.name}.blk`);
    if (!existsSync(blkPath)) {
      skipped++;
      continue;
    }

    // Ensure tileset is rendered
    const renderedTileset = ensureTilesetRendered(header.tileset);
    if (!renderedTileset) {
      skipped++;
      continue;
    }

    // Read map data
    const blkData = readFileSync(blkPath);
    const expectedSize = dims.width * dims.height;
    if (blkData.length < expectedSize) {
      console.warn(
        `  ${header.name}: .blk size ${blkData.length} < expected ${expectedSize}, skipping`,
      );
      skipped++;
      continue;
    }

    // Get passable tile IDs for this tileset
    const collisionLabel = TILESET_COLLISION_MAP[header.tileset];
    const passableTileIds = collisionLabel
      ? (collisionData.get(collisionLabel) ?? new Set<number>())
      : new Set<number>();

    // Parse objects
    const objectsPath = join(ASSETS_DIR, `maps/objects/${header.name}.asm`);
    const objects: MapObjects = existsSync(objectsPath)
      ? parseMapObjects(objectsPath)
      : { borderBlock: 0, warps: [], signs: [], objects: [] };

    // Generate .tmj
    const fileBase = TILESET_FILE_MAP[header.tileset] ?? 'unknown';
    const tilesetRelPath = `../../tilesets/rendered/${fileBase}.png`;

    const tmj = generateTmj(
      header.name,
      dims.width,
      dims.height,
      blkData,
      header.tileset,
      tilesetRelPath,
      renderedTileset,
      passableTileIds,
      objects,
      constantToName,
    );

    const tmjPath = join(convertedDir, `${header.name}.tmj`);
    writeFileSync(tmjPath, JSON.stringify(tmj, null, 2));
    converted++;
  }

  console.log(`\nDone! Converted ${converted} maps, skipped ${skipped}`);
  console.log(`Rendered ${renderedTilesets.size} unique tilesets`);
  console.log(`Output: ${convertedDir}`);
}

main();
