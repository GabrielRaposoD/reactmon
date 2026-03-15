import { destroyInput, initInput } from '../engine/InputManager';

import { useEffect } from 'react';

/**
 * Initialize InputManager on mount, clean up on unmount.
 * Call this once in the root game component.
 */
export function useInput(): void {
  useEffect(() => {
    initInput();
    return () => {
      destroyInput();
    };
  }, []);
}
