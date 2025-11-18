import * as fabric from 'fabric';
import { CONSTANTS } from '../types';
import type { Point } from '../types';

const { PIXELS_PER_METER, GRID_SIZE } = CONSTANTS;

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
 * Convert point from meters to pixels
 */
export function pointToPixels(point: Point): Point {
  return {
    x: metersToPixels(point.x),
    y: metersToPixels(point.y),
  };
}

/**
 * Convert point from pixels to meters
 */
export function pointToMeters(point: Point): Point {
  return {
    x: pixelsToMeters(point.x),
    y: pixelsToMeters(point.y),
  };
}

/**
 * Create grid background
 */
export function createGrid(
  width: number,
  height: number,
  gridSize: number = GRID_SIZE
): fabric.Group {
  const gridPixels = metersToPixels(gridSize);
  const lines: fabric.Line[] = [];

  // Vertical lines
  for (let x = 0; x <= width; x += gridPixels) {
    lines.push(
      new fabric.Line([x, 0, x, height], {
        stroke: '#E9ECEF',
        strokeWidth: x % (gridPixels * 2) === 0 ? 1 : 0.5,
        selectable: false,
        evented: false,
      })
    );
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += gridPixels) {
    lines.push(
      new fabric.Line([0, y, width, y], {
        stroke: '#E9ECEF',
        strokeWidth: y % (gridPixels * 2) === 0 ? 1 : 0.5,
        selectable: false,
        evented: false,
      })
    );
  }

  return new fabric.Group(lines, {
    selectable: false,
    evented: false,
  });
}

/**
 * Create room rectangle
 */
export function createRoomRect(
  x: number,
  y: number,
  width: number,
  height: number
): fabric.Rect {
  return new fabric.Rect({
    left: metersToPixels(x),
    top: metersToPixels(y),
    width: metersToPixels(width),
    height: metersToPixels(height),
    fill: 'rgba(255, 255, 255, 0.8)',
    stroke: '#3B82F6',
    strokeWidth: 3,
    selectable: false,
    evented: false,
    rx: 4,
    ry: 4,
  });
}

/**
 * Create obstacle rectangle
 */
export function createObstacleRect(
  x: number,
  y: number,
  width: number,
  height: number
): fabric.Rect {
  const pixelX = metersToPixels(x - width / 2);
  const pixelY = metersToPixels(y - height / 2);

  return new fabric.Rect({
    left: pixelX,
    top: pixelY,
    width: metersToPixels(width),
    height: metersToPixels(height),
    fill: 'rgba(239, 68, 68, 0.3)',
    stroke: '#EF4444',
    strokeWidth: 2,
    selectable: true,
    hasControls: true,
    hasBorders: true,
    lockRotation: true,
    rx: 4,
    ry: 4,
  });
}

/**
 * Create entry point marker
 */
export function createEntryPoint(x: number, y: number): fabric.Circle {
  return new fabric.Circle({
    left: metersToPixels(x),
    top: metersToPixels(y),
    radius: 8,
    fill: '#10B981',
    stroke: '#FFFFFF',
    strokeWidth: 2,
    originX: 'center',
    originY: 'center',
    selectable: true,
    hasControls: false,
    hasBorders: false,
  });
}

/**
 * Create edge zone overlay
 */
export function createEdgeZone(
  x: number,
  y: number,
  width: number,
  height: number
): fabric.Rect {
  return new fabric.Rect({
    left: metersToPixels(x),
    top: metersToPixels(y),
    width: metersToPixels(width),
    height: metersToPixels(height),
    fill: 'rgba(16, 185, 129, 0.15)',
    stroke: '#10B981',
    strokeWidth: 1,
    strokeDashArray: [5, 5],
    selectable: false,
    evented: false,
  });
}

/**
 * Create heating loop line
 */
export function createLoopPath(points: Point[]): fabric.Polyline {
  const pixelPoints = points.map((p) => ({
    x: metersToPixels(p.x),
    y: metersToPixels(p.y),
  }));

  return new fabric.Polyline(pixelPoints, {
    fill: 'transparent',
    stroke: '#F59E0B',
    strokeWidth: 2,
    selectable: false,
    evented: false,
    strokeLineCap: 'round',
    strokeLineJoin: 'round',
  });
}

/**
 * Add text label to canvas
 */
export function createLabel(
  text: string,
  x: number,
  y: number
): fabric.Text {
  return new fabric.Text(text, {
    left: metersToPixels(x),
    top: metersToPixels(y),
    fontSize: 12,
    fill: '#1F2937',
    fontFamily: 'system-ui, sans-serif',
    selectable: false,
    evented: false,
  });
}

/**
 * Create dimension label for room walls
 */
export function createDimensionLabel(
  text: string,
  x: number,
  y: number,
  options?: { fontSize?: number; fill?: string }
): fabric.Text {
  return new fabric.Text(text, {
    left: metersToPixels(x),
    top: metersToPixels(y),
    fontSize: options?.fontSize || 14,
    fill: options?.fill || '#3B82F6',
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 'bold',
    selectable: false,
    evented: false,
    originX: 'center',
    originY: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 4,
  });
}

/**
 * Create direction arrow for heating loop
 */
export function createDirectionArrow(
  from: Point,
  to: Point
): fabric.Polygon {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const headLength = 0.15; // 15cm arrow head

  // Arrow midpoint
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  // Arrow head points
  const tipX = midX + Math.cos(angle) * headLength / 2;
  const tipY = midY + Math.sin(angle) * headLength / 2;

  const leftX = tipX - Math.cos(angle + Math.PI / 6) * headLength;
  const leftY = tipY - Math.sin(angle + Math.PI / 6) * headLength;

  const rightX = tipX - Math.cos(angle - Math.PI / 6) * headLength;
  const rightY = tipY - Math.sin(angle - Math.PI / 6) * headLength;

  const points = [
    { x: metersToPixels(tipX), y: metersToPixels(tipY) },
    { x: metersToPixels(leftX), y: metersToPixels(leftY) },
    { x: metersToPixels(rightX), y: metersToPixels(rightY) },
  ];

  return new fabric.Polygon(points, {
    fill: '#F59E0B',
    stroke: '#F59E0B',
    strokeWidth: 1,
    selectable: false,
    evented: false,
  });
}
