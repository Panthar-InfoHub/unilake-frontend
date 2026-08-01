// Utilities to convert between normalized API coordinates (0-1) and Konva canvas coordinates (pixels)

/**
 * Converts normalized API values (0.0 to 1.0) to actual canvas pixels
 */
export function normalizedToPixel(
  value: number,
  canvasSize: number,
  imageOriginalSize: number,
  imageRenderedSize: number
): number {
  // First, find what pixel this is on the ORIGINAL image
  const originalPixel = value * imageOriginalSize;
  
  // Then scale that to however the image is currently rendered on canvas
  const scale = imageRenderedSize / imageOriginalSize;
  
  return originalPixel * scale;
}

/**
 * Converts actual canvas pixels to normalized API values (0.0 to 1.0)
 */
export function pixelToNormalized(
  pixelValue: number,
  canvasSize: number,
  imageOriginalSize: number,
  imageRenderedSize: number
): number {
  // Find what the original pixel would be
  const scale = imageRenderedSize / imageOriginalSize;
  const originalPixel = pixelValue / scale;
  
  // Convert to 0-1 fraction
  return originalPixel / imageOriginalSize;
}

export function toFixed(value: number, precision: number = 4): number {
  return parseFloat(value.toFixed(precision));
}

// Bubble.fontSize is a fraction of the artwork's HEIGHT, never a pixel value.
// These bounds mirror MIN/MAX/DEFAULT_FONT_SIZE in the backend's
// src/config/generation.ts — sending anything outside them returns a 400.
export const MIN_FONT_SIZE = 0.005;
export const MAX_FONT_SIZE = 0.25;
export const DEFAULT_FONT_SIZE = 0.02;

/** Fraction → pixels on a surface of the given height. */
export function fontSizeToPx(fraction: number, surfaceHeight: number): number {
  return fraction * surfaceHeight;
}

/** Pixels → fraction, clamped to the backend's accepted range. */
export function pxToFontSize(px: number, artworkHeight: number): number {
  const raw = px / artworkHeight;
  return Math.min(Math.max(raw, MIN_FONT_SIZE), MAX_FONT_SIZE);
}

// Smallest bubble we allow, as a fraction. Matches the Math.max(0.01, …) the
// canvas used before clamping was centralised here.
export const MIN_BUBBLE_SIZE = 0.01;

export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Constrains a normalized rectangle so it sits entirely inside the artwork,
 * mirroring the backend's rules (bubble.service + createBubbleSchema):
 *   0 <= x, 0 <= y, x + width <= 1, y + height <= 1
 *
 * Size is clamped and rounded FIRST, then the position limit is derived from
 * the rounded size — so `x + width` can never round its way past 1 and trip the
 * server's bounds check.
 */
export function clampRect(rect: NormalizedRect): NormalizedRect {
  const width = toFixed(Math.min(Math.max(rect.width, MIN_BUBBLE_SIZE), 1));
  const height = toFixed(Math.min(Math.max(rect.height, MIN_BUBBLE_SIZE), 1));

  return {
    width,
    height,
    x: toFixed(Math.min(Math.max(rect.x, 0), 1 - width)),
    y: toFixed(Math.min(Math.max(rect.y, 0), 1 - height)),
  };
}
