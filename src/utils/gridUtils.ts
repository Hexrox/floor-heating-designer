// Grid and snapping utilities

export const PIXELS_PER_METER = 100; // 1m = 100px
export const GRID_SIZE_METERS = 0.1; // Grid co 10cm (bardziej precyzyjny)
export const WALL_THICKNESS = 0.2; // Ściana 20cm

export const GRID_SIZE_PIXELS = GRID_SIZE_METERS * PIXELS_PER_METER; // 10px

export type Point = {
  x: number; // w metrach
  y: number; // w metrach
};

/**
 * Convert meters to pixels
 */
export function metersToPixels(meters: number): number {
  return meters * PIXELS_PER_METER;
}

/**
 * Convert pixels to meters
 */
export function pixelsToMeters(pixels: number): number {
  return pixels / PIXELS_PER_METER;
}

/**
 * Snap point to grid (in meters)
 */
export function snapToGrid(point: Point, gridSize: number = GRID_SIZE_METERS): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize
  };
}

/**
 * Calculate distance between two points (in meters)
 */
export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Format meters for display - pokazuje w cm lub m+cm
 */
export function formatMeters(meters: number): string {
  const cm = Math.round(meters * 100);

  if (cm < 100) {
    // Poniżej metra - pokaż tylko cm
    return `${cm}cm`;
  } else if (cm % 100 === 0) {
    // Pełne metry - pokaż tylko m
    return `${cm / 100}m`;
  } else {
    // Kombinacja m + cm
    const m = Math.floor(cm / 100);
    const remainingCm = cm % 100;
    return `${m}m ${remainingCm}cm`;
  }
}

/**
 * Format centimeters for display (shorter version)
 */
export function formatCentimeters(meters: number): string {
  const cm = Math.round(meters * 100);
  return `${cm}cm`;
}

/**
 * Format area for display
 */
export function formatArea(squareMeters: number): string {
  return `${squareMeters.toFixed(2)} m²`;
}
