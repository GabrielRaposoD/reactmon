export const GAME_ACTIONS = [
  'up',
  'down',
  'left',
  'right',
  'a',
  'b',
  'start',
  'select',
] as const;

export type GameAction = (typeof GAME_ACTIONS)[number];

type ActionState = Record<GameAction, boolean>;
type JustPressedState = Record<GameAction, boolean>;

const KEY_MAP: Record<string, GameAction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  z: 'a', // A button
  x: 'b', // B button
  Enter: 'start',
  Shift: 'select',
};

const held: ActionState = {
  up: false,
  down: false,
  left: false,
  right: false,
  a: false,
  b: false,
  start: false,
  select: false,
};

const justPressed: JustPressedState = {
  up: false,
  down: false,
  left: false,
  right: false,
  a: false,
  b: false,
  start: false,
  select: false,
};

const justReleased: JustPressedState = {
  up: false,
  down: false,
  left: false,
  right: false,
  a: false,
  b: false,
  start: false,
  select: false,
};

let initialized = false;

function onKeyDown(event: KeyboardEvent): void {
  const action = KEY_MAP[event.key];
  if (action === undefined) return;

  event.preventDefault();

  if (!held[action]) {
    justPressed[action] = true;
  }
  held[action] = true;
}

function onKeyUp(event: KeyboardEvent): void {
  const action = KEY_MAP[event.key];
  if (action === undefined) return;

  event.preventDefault();

  held[action] = false;
  justReleased[action] = true;
}

export function initInput(): void {
  if (initialized) return;
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  initialized = true;
}

export function destroyInput(): void {
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  initialized = false;
}

/** Call once per frame AFTER all systems have read input. */
export function clearInputFrame(): void {
  for (const action of GAME_ACTIONS) {
    justPressed[action] = false;
    justReleased[action] = false;
  }
}

/** True while the key is held down. */
export function isHeld(action: GameAction): boolean {
  return held[action];
}

/** True only on the first frame the key was pressed. */
export function isJustPressed(action: GameAction): boolean {
  return justPressed[action];
}

/** True only on the frame the key was released. */
export function isJustReleased(action: GameAction): boolean {
  return justReleased[action];
}
