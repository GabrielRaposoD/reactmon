export const SCENE_NAMES = [
  'title',
  'overworld',
  'battle',
  'menu',
  'dialogue',
] as const;

export type SceneName = (typeof SCENE_NAMES)[number];

export interface Scene {
  readonly name: SceneName;
  onEnter?: () => void;
  onExit?: () => void;
  update?: (deltaMs: number) => void;
}

interface SceneManagerState {
  currentScene: Scene | null;
  scenes: Map<SceneName, Scene>;
}

const state: SceneManagerState = {
  currentScene: null,
  scenes: new Map(),
};

export function registerScene(scene: Scene): void {
  state.scenes.set(scene.name, scene);
}

export function unregisterScene(name: SceneName): void {
  if (state.currentScene?.name === name) {
    state.currentScene.onExit?.();
    state.currentScene = null;
  }
  state.scenes.delete(name);
}

export function switchScene(name: SceneName): void {
  const next = state.scenes.get(name);
  if (!next) {
    console.warn(`[SceneManager] Scene "${name}" not registered.`);
    return;
  }

  if (state.currentScene) {
    state.currentScene.onExit?.();
  }

  state.currentScene = next;
  state.currentScene.onEnter?.();
}

export function updateCurrentScene(deltaMs: number): void {
  state.currentScene?.update?.(deltaMs);
}

export function getCurrentScene(): Scene | null {
  return state.currentScene;
}

export function getCurrentSceneName(): SceneName | null {
  return state.currentScene?.name ?? null;
}
