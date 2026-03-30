import { Assets, ImageSource, Spritesheet, Texture } from 'pixi.js';

const loadedSheets = new Map<string, Spritesheet>();
const loadedTextures = new Map<string, Texture>();

/**
 * Game Boy palette color 0 (white) is transparent for sprites.
 * Post-processes a loaded PixiJS ImageSource by drawing its resource
 * to a canvas and zeroing alpha for pixels matching the key color.
 */
function applyColorKey(
  source: ImageSource,
  r: number,
  g: number,
  b: number,
): ImageSource {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d')!;

  // ImageSource.resource is HTMLImageElement | ImageBitmap | HTMLCanvasElement etc.
  // All are valid CanvasImageSource — drawImage handles them all.
  ctx.drawImage(source.resource as CanvasImageSource, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] === r && data[i + 1] === g && data[i + 2] === b) {
      data[i + 3] = 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  return new ImageSource({ resource: canvas });
}

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

/**
 * Load a sprite texture with Game Boy-style color-key transparency.
 * White (255,255,255) pixels become transparent — matching how the
 * original hardware treats palette color 0 for sprites.
 */
export async function loadSpriteTexture(path: string): Promise<Texture> {
  const key = `sprite:${path}`;
  const cached = loadedTextures.get(key);
  if (cached) return cached;

  const base = await Assets.load<Texture>(path);
  const transparentSource = applyColorKey(base.source, 255, 255, 255);
  const texture = new Texture({ source: transparentSource });
  loadedTextures.set(key, texture);
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
