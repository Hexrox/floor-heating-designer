// Loop generation algorithms for floor heating
import * as fabric from 'fabric';
import { type Point, metersToPixels, distance } from './gridUtils';
import { isPointInPolygon } from './roomDetection';

export interface LoopGenerationParams {
  pipeSpacing: number; // in cm (e.g., 20cm)
  edgeZone: boolean;
  edgeSpacing: number; // in cm (e.g., 10cm)
  pattern: 'spiral' | 'meander';
}

export interface LoopResult {
  loopPath: fabric.Path;
  supplyPath: fabric.Line;
  returnPath: fabric.Line;
  loopLength: number; // in meters
  routingLength: number; // in meters
  entryPoint: Point; // in meters
}

/**
 * Generate heating loop for a room
 * @param roomPolygon - Room polygon points in METERS
 * @param manifoldPosition - Manifold position in METERS
 * @param params - Loop generation parameters
 * @returns LoopResult with fabric objects and calculations
 */
export function generateLoopForRoom(
  roomPolygon: Point[],
  manifoldPosition: Point,
  params: LoopGenerationParams
): LoopResult {
  // Find entry point (closest point on polygon to manifold)
  const entryPoint = findClosestPointOnPolygon(manifoldPosition, roomPolygon);

  // Calculate routing distance (manifold to entry point)
  const routingDist = distance(entryPoint, manifoldPosition);

  // Generate loop in room based on pattern
  const loopPath = params.pattern === 'spiral'
    ? generateReverseReturnSpiral(roomPolygon, entryPoint, params)
    : generateMeanderLoop(roomPolygon, entryPoint, params);

  // Create supply path (manifold to entry point) - RED
  const supplyPath = new fabric.Line(
    [
      metersToPixels(manifoldPosition.x),
      metersToPixels(manifoldPosition.y),
      metersToPixels(entryPoint.x),
      metersToPixels(entryPoint.y)
    ],
    {
      stroke: '#ef4444',
      strokeWidth: 3,
      selectable: false,
      evented: false,
      strokeDashArray: [10, 5]
    }
  );

  // Create return path (exit point to manifold) - BLUE
  const returnPath = new fabric.Line(
    [
      metersToPixels(entryPoint.x),
      metersToPixels(entryPoint.y),
      metersToPixels(manifoldPosition.x),
      metersToPixels(manifoldPosition.y)
    ],
    {
      stroke: '#3b82f6',
      strokeWidth: 3,
      selectable: false,
      evented: false,
      strokeDashArray: [10, 5]
    }
  );

  // Calculate loop length from path
  const loopLength = estimatePathLength(loopPath);

  return {
    loopPath,
    supplyPath,
    returnPath,
    loopLength: loopLength,
    routingLength: routingDist * 2, // supply + return
    entryPoint
  };
}

/**
 * Generate reverse return spiral pattern
 * Spiral inward from perimeter to center, then spiral outward (return path)
 */
function generateReverseReturnSpiral(
  polygon: Point[],
  entryPoint: Point,
  params: LoopGenerationParams
): fabric.Path {
  // Calculate bounding box in meters
  const minX = Math.min(...polygon.map(p => p.x));
  const maxX = Math.max(...polygon.map(p => p.x));
  const minY = Math.min(...polygon.map(p => p.y));
  const maxY = Math.max(...polygon.map(p => p.y));

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const width = maxX - minX;
  const height = maxY - minY;

  const spacing = params.pipeSpacing / 100; // convert cm to meters

  let pathData = `M ${metersToPixels(entryPoint.x)} ${metersToPixels(entryPoint.y)}`;

  // Edge zone if enabled
  if (params.edgeZone) {
    const edgeSpacingM = params.edgeSpacing / 100;

    // Go around perimeter with edge spacing
    const edgeOffset = edgeSpacingM;
    const edgePoints = [
      { x: minX + edgeOffset, y: minY + edgeOffset },
      { x: maxX - edgeOffset, y: minY + edgeOffset },
      { x: maxX - edgeOffset, y: maxY - edgeOffset },
      { x: minX + edgeOffset, y: maxY - edgeOffset }
    ];

    for (const pt of edgePoints) {
      if (isPointInPolygon(pt, polygon)) {
        pathData += ` L ${metersToPixels(pt.x)} ${metersToPixels(pt.y)}`;
      }
    }
  }

  // Spiral inward to center
  let angle = 0;
  let radius = Math.min(width, height) / 2;

  while (radius > spacing) {
    angle += 0.2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    if (isPointInPolygon({ x, y }, polygon)) {
      pathData += ` L ${metersToPixels(x)} ${metersToPixels(y)}`;
    }

    radius -= spacing / 15;
  }

  // Spiral outward (return path)
  radius = spacing;
  while (radius < Math.min(width, height) / 2) {
    angle += 0.2;
    const x = centerX + radius * Math.cos(angle + Math.PI);
    const y = centerY + radius * Math.sin(angle + Math.PI);

    if (isPointInPolygon({ x, y }, polygon)) {
      pathData += ` L ${metersToPixels(x)} ${metersToPixels(y)}`;
    }

    radius += spacing / 15;
  }

  // Return to entry point
  pathData += ` L ${metersToPixels(entryPoint.x)} ${metersToPixels(entryPoint.y)}`;

  return new fabric.Path(pathData, {
    stroke: '#f97316',
    strokeWidth: 2,
    fill: '',
    selectable: false,
    evented: false
  });
}

/**
 * Generate meander (serpentine) pattern
 * Back-and-forth horizontal lines covering the room
 */
function generateMeanderLoop(
  polygon: Point[],
  entryPoint: Point,
  params: LoopGenerationParams
): fabric.Path {
  // Calculate bounding box in meters
  const minX = Math.min(...polygon.map(p => p.x));
  const maxX = Math.max(...polygon.map(p => p.x));
  const minY = Math.min(...polygon.map(p => p.y));
  const maxY = Math.max(...polygon.map(p => p.y));

  const spacing = params.pipeSpacing / 100; // convert cm to meters
  const step = 0.05; // 5cm step for smooth lines

  let pathData = `M ${metersToPixels(entryPoint.x)} ${metersToPixels(entryPoint.y)}`;
  let direction = 1;

  for (let y = minY; y < maxY; y += spacing) {
    if (direction === 1) {
      // Left to right
      for (let x = minX; x < maxX; x += step) {
        if (isPointInPolygon({ x, y }, polygon)) {
          pathData += ` L ${metersToPixels(x)} ${metersToPixels(y)}`;
        }
      }
    } else {
      // Right to left
      for (let x = maxX; x > minX; x -= step) {
        if (isPointInPolygon({ x, y }, polygon)) {
          pathData += ` L ${metersToPixels(x)} ${metersToPixels(y)}`;
        }
      }
    }
    direction *= -1;
  }

  // Return to entry point
  pathData += ` L ${metersToPixels(entryPoint.x)} ${metersToPixels(entryPoint.y)}`;

  return new fabric.Path(pathData, {
    stroke: '#f97316',
    strokeWidth: 2,
    fill: '',
    selectable: false,
    evented: false
  });
}

/**
 * Find closest point on polygon to given point
 */
function findClosestPointOnPolygon(
  point: Point,
  polygon: Point[]
): Point {
  let minDist = Infinity;
  let closest = polygon[0];

  for (const p of polygon) {
    const dist = distance(point, p);
    if (dist < minDist) {
      minDist = dist;
      closest = p;
    }
  }

  return closest;
}

/**
 * Estimate path length in meters
 * Approximation: count L/M commands and multiply by average spacing
 */
function estimatePathLength(path: fabric.Path): number {
  if (!path.path) return 0;

  let totalLength = 0;
  let lastPoint: [number, number] | null = null;

  for (const cmd of path.path) {
    if (cmd[0] === 'M' || cmd[0] === 'L') {
      const currentPoint: [number, number] = [cmd[1] as number, cmd[2] as number];

      if (lastPoint) {
        // Calculate distance in pixels, convert to meters
        const dx = currentPoint[0] - lastPoint[0];
        const dy = currentPoint[1] - lastPoint[1];
        const distPixels = Math.sqrt(dx * dx + dy * dy);
        totalLength += distPixels / 100; // 100 pixels = 1 meter
      }

      lastPoint = currentPoint;
    }
  }

  return totalLength;
}
