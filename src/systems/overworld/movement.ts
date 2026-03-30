import { DIRECTION_VECTORS, STEP_PX } from '@/data/mapTypes';

import type { Direction } from '@/data/mapTypes';
import type { GameMap } from '@/data/mapTypes';

/** Duration of a single step movement in milliseconds.
 *  Pokeyellow: wWalkCounter=8, 2 DelayFrames/loop = 16 VBlanks/step.
 *  16 / 59.7275 Hz ≈ 268 ms. */
const STEP_DURATION_MS = 268;

interface MovementState {
  /** True while the player is animating between steps. */
  moving: boolean;
  /** Elapsed time into the current step movement (ms). */
  elapsed: number;
  /** Start pixel position of current movement. */
  startPx: { x: number; y: number };
  /** Target pixel position of current movement. */
  targetPx: { x: number; y: number };
  /** Target step position of current movement. */
  targetStep: { x: number; y: number };
  /** Current interpolated pixel position (for rendering). */
  renderX: number;
  renderY: number;
  /** Current direction for animation frame. */
  facing: Direction;
  /** Walk animation frame counter (toggles 0/1 each step). */
  walkFrame: number;
}

const state: MovementState = {
  moving: false,
  elapsed: 0,
  startPx: { x: 0, y: 0 },
  targetPx: { x: 0, y: 0 },
  targetStep: { x: 0, y: 0 },
  renderX: 0,
  renderY: 0,
  facing: 'down',
  walkFrame: 0,
};

/** Initialize the movement system to a given step position. */
export function initMovement(
  stepX: number,
  stepY: number,
  facing: Direction,
): void {
  state.moving = false;
  state.elapsed = 0;
  state.renderX = stepX * STEP_PX;
  state.renderY = stepY * STEP_PX;
  state.startPx = { x: state.renderX, y: state.renderY };
  state.targetPx = { x: state.renderX, y: state.renderY };
  state.targetStep = { x: stepX, y: stepY };
  state.facing = facing;
  state.walkFrame = 0;
}

/** Check if a step position is passable on the given map. */
export function isPassable(
  map: GameMap,
  stepX: number,
  stepY: number,
): boolean {
  if (
    stepX < 0 ||
    stepY < 0 ||
    stepX >= map.widthSteps ||
    stepY >= map.heightSteps
  ) {
    return false;
  }
  return map.collisionGrid[stepY * map.widthSteps + stepX] === 0;
}

/**
 * Try to start a step in the given direction.
 * Always updates facing direction.
 * Returns true if movement started, false if blocked.
 */
export function tryMove(
  map: GameMap,
  currentStepX: number,
  currentStepY: number,
  direction: Direction,
): boolean {
  state.facing = direction;

  if (state.moving) return false;

  const { dx, dy } = DIRECTION_VECTORS[direction];
  const nextX = currentStepX + dx;
  const nextY = currentStepY + dy;

  if (!isPassable(map, nextX, nextY)) return false;

  state.moving = true;
  state.elapsed = 0;
  state.startPx = { x: currentStepX * STEP_PX, y: currentStepY * STEP_PX };
  state.targetPx = { x: nextX * STEP_PX, y: nextY * STEP_PX };
  state.targetStep = { x: nextX, y: nextY };
  state.walkFrame = (state.walkFrame + 1) % 2;

  return true;
}

/**
 * Update the movement interpolation.
 * Returns the completed target step if movement just finished, otherwise null.
 */
export function updateMovement(
  deltaMs: number,
): { x: number; y: number } | null {
  if (!state.moving) return null;

  state.elapsed += deltaMs;
  const t = Math.min(state.elapsed / STEP_DURATION_MS, 1);

  state.renderX = state.startPx.x + (state.targetPx.x - state.startPx.x) * t;
  state.renderY = state.startPx.y + (state.targetPx.y - state.startPx.y) * t;

  if (t >= 1) {
    state.moving = false;
    state.renderX = state.targetPx.x;
    state.renderY = state.targetPx.y;
    return { x: state.targetStep.x, y: state.targetStep.y };
  }

  return null;
}

export function isMoving(): boolean {
  return state.moving;
}

export function getRenderPosition(): { x: number; y: number } {
  return { x: state.renderX, y: state.renderY };
}

export function getFacing(): Direction {
  return state.facing;
}

export function getWalkFrame(): number {
  return state.walkFrame;
}

/** Returns 0–1 progress through the current step, or 0 if idle. */
export function getStepProgress(): number {
  if (!state.moving) return 0;
  return Math.min(state.elapsed / STEP_DURATION_MS, 1);
}
