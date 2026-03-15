import { beforeEach, describe, expect, it } from 'vitest';
import {
  getFacing,
  getRenderPosition,
  initMovement,
  isMoving,
  isPassable,
  tryMove,
  updateMovement,
} from '@/systems/overworld/movement';

import type { GameMap } from '@/data/mapTypes';

/** Minimal test map: 3×3 blocks = 6×6 steps */
function createTestMap(): GameMap {
  // Collision grid (6×6 steps):
  // Row 0: 1,1,1,1,1,1  (top wall)
  // Row 1: 1,0,0,0,0,1
  // Row 2: 1,0,0,0,0,1
  // Row 3: 1,0,0,1,0,1  (obstacle at 3,3)
  // Row 4: 1,0,0,0,0,1
  // Row 5: 1,1,1,1,1,1  (bottom wall)
  const collisionGrid = [
    1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1,
    0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1,
  ];

  return {
    name: 'TestMap',
    widthBlocks: 3,
    heightBlocks: 3,
    widthSteps: 6,
    heightSteps: 6,
    widthPx: 96,
    heightPx: 96,
    groundData: new Array(9).fill(1),
    collisionGrid,
    tilesetImage: '/assets/tilesets/rendered/overworld.png',
    tilesetName: 'OVERWORLD',
    tilesetColumns: 16,
    tilesetTileCount: 128,
    warps: [],
    borderBlock: 1,
  };
}

describe('Overworld Movement', () => {
  let map: GameMap;

  beforeEach(() => {
    map = createTestMap();
    initMovement(2, 2, 'down');
  });

  it('should initialize at the correct position', () => {
    const pos = getRenderPosition();
    expect(pos.x).toBe(32); // 2 * 16
    expect(pos.y).toBe(32);
    expect(getFacing()).toBe('down');
    expect(isMoving()).toBe(false);
  });

  it('should allow movement to a passable tile', () => {
    const moved = tryMove(map, 2, 2, 'right');
    expect(moved).toBe(true);
    expect(isMoving()).toBe(true);
    expect(getFacing()).toBe('right');
  });

  it('should block movement to a solid tile', () => {
    // Step 3,3 is blocked
    const moved = tryMove(map, 2, 3, 'right');
    expect(moved).toBe(false);
    expect(isMoving()).toBe(false);
    expect(getFacing()).toBe('right'); // Facing should still update
  });

  it('should block movement out of bounds', () => {
    // Step 0,0 is a wall, but try moving off map entirely
    initMovement(0, 1, 'left');
    const moved = tryMove(map, 0, 1, 'left');
    expect(moved).toBe(false);
  });

  it('should complete movement after enough time', () => {
    tryMove(map, 2, 2, 'down');
    expect(isMoving()).toBe(true);

    // After STEP_DURATION_MS (268ms), movement should complete
    const result = updateMovement(300);
    expect(result).toEqual({ x: 2, y: 3 });
    expect(isMoving()).toBe(false);
    expect(getRenderPosition()).toEqual({ x: 32, y: 48 });
  });

  it('should interpolate position during movement', () => {
    tryMove(map, 2, 2, 'down');

    // At ~50% through (75ms of 150ms)
    updateMovement(75);
    const pos = getRenderPosition();
    expect(pos.x).toBe(32); // x shouldn't change for 'down' movement
    expect(pos.y).toBeGreaterThan(32);
    expect(pos.y).toBeLessThan(48);
    expect(isMoving()).toBe(true);
  });

  it('should report passability correctly', () => {
    expect(isPassable(map, 1, 1)).toBe(true); // Open
    expect(isPassable(map, 0, 0)).toBe(false); // Wall
    expect(isPassable(map, 3, 3)).toBe(false); // Obstacle
    expect(isPassable(map, -1, 0)).toBe(false); // Out of bounds
    expect(isPassable(map, 6, 0)).toBe(false); // Out of bounds
  });

  it('should not start a new move while already moving', () => {
    tryMove(map, 2, 2, 'down');
    const secondMove = tryMove(map, 2, 2, 'right');
    expect(secondMove).toBe(false);
    expect(getFacing()).toBe('right'); // Facing updates even if move is rejected
  });
});
