/** Step size in pixels (the movement unit). */
export const STEP_PX = 16;

/** Block size in pixels (the tile grid unit in Tiled maps). */
export const BLOCK_PX = 32;

/** Steps per block (2×2 steps per block). */
export const STEPS_PER_BLOCK = 2;

/** Facing / movement direction. */
export const DIRECTIONS = ['up', 'down', 'left', 'right'] as const;
export type Direction = (typeof DIRECTIONS)[number];

/** Direction vectors in step units. */
export const DIRECTION_VECTORS: Record<Direction, { dx: number; dy: number }> =
  {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 },
  };

// ── TMJ types (matching Tiled JSON output from convert-maps) ───────────

interface TmjProperty {
  readonly name: string;
  readonly type: string;
  readonly value: string | number;
}

interface TmjTileLayer {
  readonly id: number;
  readonly name: string;
  readonly type: 'tilelayer';
  readonly width: number;
  readonly height: number;
  readonly data: readonly number[];
  readonly opacity: number;
  readonly visible: boolean;
}

interface TmjObjectProperty {
  readonly name: string;
  readonly type: string;
  readonly value: string | number;
}

interface TmjObject {
  readonly id: number;
  readonly name: string;
  readonly type: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly properties?: readonly TmjObjectProperty[];
}

interface TmjObjectLayer {
  readonly id: number;
  readonly name: string;
  readonly type: 'objectgroup';
  readonly objects: readonly TmjObject[];
  readonly opacity: number;
  readonly visible: boolean;
}

type TmjLayer = TmjTileLayer | TmjObjectLayer;

interface TmjTileset {
  readonly firstgid: number;
  readonly name: string;
  readonly tilewidth: number;
  readonly tileheight: number;
  readonly tilecount: number;
  readonly columns: number;
  readonly image: string;
  readonly imagewidth: number;
  readonly imageheight: number;
}

export interface TmjMap {
  readonly type: 'map';
  readonly width: number;
  readonly height: number;
  readonly tilewidth: number;
  readonly tileheight: number;
  readonly properties: readonly TmjProperty[];
  readonly layers: readonly TmjLayer[];
  readonly tilesets: readonly TmjTileset[];
}

// ── Parsed game-ready map data ─────────────────────────────────────────

export interface WarpData {
  readonly x: number;
  readonly y: number;
  readonly destMap: string;
  readonly destWarpId: number;
}

export interface GameMap {
  /** Map name (e.g. "PalletTown") */
  readonly name: string;
  /** Width in blocks */
  readonly widthBlocks: number;
  /** Height in blocks */
  readonly heightBlocks: number;
  /** Width in steps (widthBlocks × 2) */
  readonly widthSteps: number;
  /** Height in steps (heightBlocks × 2) */
  readonly heightSteps: number;
  /** Width in pixels */
  readonly widthPx: number;
  /** Height in pixels */
  readonly heightPx: number;
  /** Ground layer block GIDs (1-indexed, row-major) */
  readonly groundData: readonly number[];
  /** Collision grid at step resolution (0 = passable, 1 = blocked) */
  readonly collisionGrid: readonly number[];
  /** Tileset image path relative to public/ */
  readonly tilesetImage: string;
  /** Tileset name constant (e.g. "OVERWORLD") */
  readonly tilesetName: string;
  /** Number of columns in the rendered tileset image */
  readonly tilesetColumns: number;
  /** Total tile count in tileset */
  readonly tilesetTileCount: number;
  /** Warp points */
  readonly warps: readonly WarpData[];
  /** Border block GID (1-indexed) for out-of-bounds rendering */
  readonly borderBlock: number;
}
