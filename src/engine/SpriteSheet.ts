import { Assets, Spritesheet, Texture } from 'pixi.js';

const loadedSheets = new Map<string, Spritesheet>();
const loadedTextures = new Map<string, Texture>();

/** Load a spritesheet JSON (atlas) and cache it. */
export async function loadSpriteSheet(jsonPath: string): Promise<Spritesheet> {
  const cached = loadedSheets.get(jsonPath);
  if (cached) return cached;

  const sheet = await Assets.load<Spritesheet>(jsonPath);
  loadedSheets.set(jsonPath, sheet);
  return sheet;
}

/** Load a single texture and cache it. */
export async function loadTexture(path: string): Promise<Texture> {
  const cached = loadedTextures.get(path);
  if (cached) return cached;

  const texture = await Assets.load<Texture>(path);
  loadedTextures.set(path, texture);
  return texture;
}

/** Get a previously loaded texture from cache. Returns Texture.EMPTY if not found. */
export function getTexture(path: string): Texture {
  return loadedTextures.get(path) ?? Assets.get<Texture>(path) ?? Texture.EMPTY;
}

/** Get a frame from a previously loaded spritesheet. */
export function getSheetFrame(sheetPath: string, frameName: string): Texture {
  const sheet = loadedSheets.get(sheetPath);
  if (!sheet) {
    console.warn(`[SpriteSheet] Sheet "${sheetPath}" not loaded.`);
    return Texture.EMPTY;
  }
  return sheet.textures[frameName] ?? Texture.EMPTY;
}
