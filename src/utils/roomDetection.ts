// Room detection algorithm using flood-fill
import { type Point, pixelsToMeters, metersToPixels } from './gridUtils';

export interface Wall {
  start: Point;
  end: Point;
}

/**
 * Detect room boundaries using flood-fill algorithm
 * @param clickPoint - Point where user clicked (in meters)
 * @param walls - Array of walls
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 * @param gridResolution - Grid resolution for detection (pixels per cell)
 * @returns Array of points forming the room polygon (in meters), or null if no room found
 */
export function detectRoom(
  clickPoint: Point,
  walls: Wall[],
  canvasWidth: number,
  canvasHeight: number,
  gridResolution: number = 10 // 10px per cell for detection
): Point[] | null {
  // Create grid
  const cols = Math.ceil(canvasWidth / gridResolution);
  const rows = Math.ceil(canvasHeight / gridResolution);
  const grid: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));

  // Mark walls on grid
  walls.forEach(wall => {
    markWallOnGrid(grid, wall, gridResolution, cols, rows);
  });

  // Convert click point to grid coordinates
  const startCol = Math.floor(metersToPixels(clickPoint.x) / gridResolution);
  const startRow = Math.floor(metersToPixels(clickPoint.y) / gridResolution);

  // Check if starting point is valid
  if (startCol < 0 || startCol >= cols || startRow < 0 || startRow >= rows) {
    return null;
  }

  if (grid[startRow][startCol]) {
    // Clicked on a wall
    return null;
  }

  // Flood fill to find all connected cells
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const queue: [number, number][] = [[startRow, startCol]];
  visited[startRow][startCol] = true;

  let minRow = startRow;
  let maxRow = startRow;
  let minCol = startCol;
  let maxCol = startCol;

  // Flood fill
  while (queue.length > 0) {
    const [row, col] = queue.shift()!;

    minRow = Math.min(minRow, row);
    maxRow = Math.max(maxRow, row);
    minCol = Math.min(minCol, col);
    maxCol = Math.max(maxCol, col);

    // Check 4 neighbors
    const neighbors = [
      [row - 1, col], // up
      [row + 1, col], // down
      [row, col - 1], // left
      [row, col + 1]  // right
    ];

    for (const [nRow, nCol] of neighbors) {
      if (
        nRow >= 0 && nRow < rows &&
        nCol >= 0 && nCol < cols &&
        !visited[nRow][nCol] &&
        !grid[nRow][nCol]
      ) {
        visited[nRow][nCol] = true;
        queue.push([nRow, nCol]);
      }
    }
  }

  // Check if room is bounded (doesn't reach canvas edges)
  const isBounded = minRow > 0 && maxRow < rows - 1 && minCol > 0 && maxCol < cols - 1;

  if (!isBounded) {
    // Room is not enclosed - extends to canvas edge
    return null;
  }

  // Convert filled area to polygon using marching squares algorithm
  const polygon = extractPolygon(visited, gridResolution);

  if (polygon.length < 3) {
    return null;
  }

  return polygon;
}

/**
 * Mark wall on grid using Bresenham's line algorithm
 */
function markWallOnGrid(
  grid: boolean[][],
  wall: Wall,
  gridResolution: number,
  cols: number,
  rows: number
): void {
  const x0 = Math.floor(metersToPixels(wall.start.x) / gridResolution);
  const y0 = Math.floor(metersToPixels(wall.start.y) / gridResolution);
  const x1 = Math.floor(metersToPixels(wall.end.x) / gridResolution);
  const y1 = Math.floor(metersToPixels(wall.end.y) / gridResolution);

  // Bresenham's line algorithm
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let x = x0;
  let y = y0;

  const wallThickness = 2; // Mark 2 cells thick for walls

  while (true) {
    // Mark wall cells with thickness
    for (let dy = -wallThickness; dy <= wallThickness; dy++) {
      for (let dx = -wallThickness; dx <= wallThickness; dx++) {
        const ny = y + dy;
        const nx = x + dx;
        if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
          grid[ny][nx] = true;
        }
      }
    }

    if (x === x1 && y === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

/**
 * Extract polygon from visited grid using marching squares
 * Returns polygon points in meters
 */
function extractPolygon(visited: boolean[][], gridResolution: number): Point[] {
  const rows = visited.length;
  const cols = visited[0].length;

  // Find boundary cells
  const boundaryCells: [number, number][] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (visited[row][col]) {
        // Check if this is a boundary cell (has at least one non-visited neighbor)
        const isEdge =
          row === 0 || row === rows - 1 || col === 0 || col === cols - 1 ||
          !visited[row - 1][col] ||
          !visited[row + 1][col] ||
          !visited[row][col - 1] ||
          !visited[row][col + 1];

        if (isEdge) {
          boundaryCells.push([row, col]);
        }
      }
    }
  }

  if (boundaryCells.length === 0) {
    return [];
  }

  // Convert boundary cells to approximate polygon
  // For simplicity, we'll create a convex hull or use corner cells
  // Here we'll use a simplified approach: find min/max bounds and create rectangle

  let minRow = Infinity, maxRow = -Infinity;
  let minCol = Infinity, maxCol = -Infinity;

  for (const [row, col] of boundaryCells) {
    minRow = Math.min(minRow, row);
    maxRow = Math.max(maxRow, row);
    minCol = Math.min(minCol, col);
    maxCol = Math.max(maxCol, col);
  }

  // Create polygon from bounds (rectangle approximation)
  const polygon: Point[] = [
    { x: pixelsToMeters(minCol * gridResolution), y: pixelsToMeters(minRow * gridResolution) },
    { x: pixelsToMeters(maxCol * gridResolution), y: pixelsToMeters(minRow * gridResolution) },
    { x: pixelsToMeters(maxCol * gridResolution), y: pixelsToMeters(maxRow * gridResolution) },
    { x: pixelsToMeters(minCol * gridResolution), y: pixelsToMeters(maxRow * gridResolution) }
  ];

  return polygon;
}

/**
 * Calculate polygon area using shoelace formula
 * @param points - Polygon points in meters
 * @returns Area in square meters
 */
export function calculatePolygonArea(points: Point[]): number {
  if (points.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }

  return Math.abs(area / 2);
}

/**
 * Check if point is inside polygon (ray casting algorithm)
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > point.y) !== (yj > point.y))
      && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}
