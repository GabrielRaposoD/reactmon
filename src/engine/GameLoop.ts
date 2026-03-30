export type GameLoopCallback = (deltaMs: number) => void;

interface GameLoopState {
  isRunning: boolean;
  rafId: number | null;
  lastTimestamp: number;
  callbacks: Set<GameLoopCallback>;
}

const state: GameLoopState = {
  isRunning: false,
  rafId: null,
  lastTimestamp: 0,
  callbacks: new Set(),
};

function tick(timestamp: number): void {
  if (!state.isRunning) return;

  const deltaMs =
    state.lastTimestamp === 0 ? 16.67 : timestamp - state.lastTimestamp;
  state.lastTimestamp = timestamp;

  // Cap delta to prevent spiral of death (e.g., tab was in background)
  const clampedDelta = Math.min(deltaMs, 100);

  for (const callback of state.callbacks) {
    callback(clampedDelta);
  }

  state.rafId = requestAnimationFrame(tick);
}

export function startGameLoop(): void {
  if (state.isRunning) return;
  state.isRunning = true;
  state.lastTimestamp = 0;
  state.rafId = requestAnimationFrame(tick);
}

export function stopGameLoop(): void {
  state.isRunning = false;
  if (state.rafId !== null) {
    cancelAnimationFrame(state.rafId);
    state.rafId = null;
  }
}

export function subscribeToGameLoop(callback: GameLoopCallback): () => void {
  state.callbacks.add(callback);
  return () => {
    state.callbacks.delete(callback);
  };
}

export function isGameLoopRunning(): boolean {
  return state.isRunning;
}
