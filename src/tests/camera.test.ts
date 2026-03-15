import {
  centerCameraOn,
  getCameraOffset,
  getCameraState,
  setCameraPosition,
  setViewportSize,
} from '../engine/Camera';
import { describe, expect, it } from 'vitest';

describe('Camera', () => {
  it('should set camera position', () => {
    setCameraPosition(50, 30);
    const state = getCameraState();
    expect(state.x).toBe(50);
    expect(state.y).toBe(30);
  });

  it('should return negative offset for rendering', () => {
    setCameraPosition(100, 80);
    const offset = getCameraOffset();
    expect(offset.x).toBe(-100);
    expect(offset.y).toBe(-80);
  });

  it('should center on target and clamp to map bounds', () => {
    setViewportSize(240, 160);

    // Target at center of a large map — no clamping needed
    centerCameraOn(400, 300, 800, 600);
    const state = getCameraState();
    expect(state.x).toBe(400 - 120); // 280
    expect(state.y).toBe(300 - 80); // 220

    // Target near top-left — should clamp to 0,0
    centerCameraOn(50, 30, 800, 600);
    const clamped = getCameraState();
    expect(clamped.x).toBe(0);
    expect(clamped.y).toBe(0);

    // Target near bottom-right — should clamp to max
    centerCameraOn(780, 590, 800, 600);
    const clampedMax = getCameraState();
    expect(clampedMax.x).toBe(560); // 800 - 240
    expect(clampedMax.y).toBe(440); // 600 - 160
  });
});
