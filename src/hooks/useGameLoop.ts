import { useEffect, useRef } from 'react';
import {
  startGameLoop,
  subscribeToGameLoop,
  type GameLoopCallback,
} from '@/engine/GameLoop';

/**
 * Subscribe a callback to the global game loop.
 * Starts the loop on mount, stops on unmount (if no other subscribers).
 */
export function useGameLoop(callback: GameLoopCallback): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    const unsubscribe = subscribeToGameLoop((deltaMs) => {
      callbackRef.current(deltaMs);
    });
    startGameLoop();

    return () => {
      unsubscribe();
    };
  }, []);
}
