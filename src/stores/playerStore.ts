import type { Direction } from '@/data/mapTypes';
import { create } from 'zustand';

interface PlayerState {
  /** Current step X coordinate (step grid, 16px units). */
  readonly stepX: number;
  /** Current step Y coordinate (step grid, 16px units). */
  readonly stepY: number;
  /** Direction the player is facing. */
  readonly facing: Direction;
  /** Current map name. */
  readonly currentMap: string;
}

interface PlayerActions {
  setPosition: (stepX: number, stepY: number) => void;
  setFacing: (direction: Direction) => void;
  setCurrentMap: (mapName: string) => void;
}

export const usePlayerStore = create<PlayerState & PlayerActions>((set) => ({
  stepX: 7,
  stepY: 9,
  facing: 'down',
  currentMap: 'PalletTown',

  setPosition: (stepX: number, stepY: number) => set({ stepX, stepY }),
  setFacing: (direction: Direction) => set({ facing: direction }),
  setCurrentMap: (mapName: string) => set({ currentMap: mapName }),
}));
