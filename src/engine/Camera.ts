export interface CameraState {
  x: number;
  y: number;
  viewportWidth: number;
  viewportHeight: number;
}

const state: CameraState = {
  x: 0,
  y: 0,
  viewportWidth: 240,
  viewportHeight: 160,
};

/** Set the camera position (top-left corner in pixels). */
export function setCameraPosition(x: number, y: number): void {
  state.x = x;
  state.y = y;
}

/** Center the camera on a point, clamped to map bounds. */
export function centerCameraOn(
  targetX: number,
  targetY: number,
  mapWidthPx: number,
  mapHeightPx: number,
): void {
  state.x = Math.max(
    0,
    Math.min(
      targetX - state.viewportWidth / 2,
      mapWidthPx - state.viewportWidth,
    ),
  );
  state.y = Math.max(
    0,
    Math.min(
      targetY - state.viewportHeight / 2,
      mapHeightPx - state.viewportHeight,
    ),
  );
}

export function setViewportSize(width: number, height: number): void {
  state.viewportWidth = width;
  state.viewportHeight = height;
}

export function getCameraState(): Readonly<CameraState> {
  return state;
}

/** Get the offset to apply to the world container (negative camera position). */
export function getCameraOffset(): { x: number; y: number } {
  return { x: -state.x, y: -state.y };
}
