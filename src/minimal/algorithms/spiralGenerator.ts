import type { Room, Obstacle, EntryPoint, EdgeZone, LoopPoint, HeatingLoop } from '../types';
import { CONSTANTS } from '../types';
import { distance, isPointInRect } from '../lib/utils';

/**
 * Generate basic spiral heating loop (MVP - no obstacle avoidance)
 */
export function generateSpiralLoop(
  room: Room,
  entryPoint: EntryPoint,
  obstacles: Obstacle[],
  edgeZones: EdgeZone[]
): HeatingLoop {
  const path: LoopPoint[] = [];

  // Start from entry point
  let currentX = entryPoint.position.x;
  let currentY = entryPoint.position.y;

  path.push({ x: currentX, y: currentY, spacing: CONSTANTS.PIPE_SPACING_NORMAL });

  // Move to room corner based on entry side
  const roomBounds = {
    left: room.position.x,
    top: room.position.y,
    right: room.position.x + room.width,
    bottom: room.position.y + room.height,
  };

  // Navigate to nearest corner
  switch (entryPoint.side) {
    case 'left':
      currentX = roomBounds.left + 0.1;
      currentY = roomBounds.top + 0.1;
      break;
    case 'right':
      currentX = roomBounds.right - 0.1;
      currentY = roomBounds.top + 0.1;
      break;
    case 'top':
      currentX = roomBounds.left + 0.1;
      currentY = roomBounds.top + 0.1;
      break;
    case 'bottom':
      currentX = roomBounds.left + 0.1;
      currentY = roomBounds.bottom - 0.1;
      break;
  }

  path.push({ x: currentX, y: currentY, spacing: CONSTANTS.PIPE_SPACING_EDGE });

  // Generate spiral from outside to inside
  let layer = 0;
  let direction = 0; // 0=right, 1=down, 2=left, 3=up
  const maxLayers = Math.floor(Math.min(room.width, room.height) / (CONSTANTS.PIPE_SPACING_NORMAL * 2));

  while (layer < maxLayers) {
    const spacing = layer === 0 ? CONSTANTS.PIPE_SPACING_EDGE : CONSTANTS.PIPE_SPACING_NORMAL;
    const margin = 0.1 + layer * spacing;

    const bounds = {
      left: roomBounds.left + margin,
      top: roomBounds.top + margin,
      right: roomBounds.right - margin,
      bottom: roomBounds.bottom - margin,
    };

    // Check if bounds are valid
    if (bounds.left >= bounds.right || bounds.top >= bounds.bottom) {
      break;
    }

    // Draw rectangle layer
    switch (direction % 4) {
      case 0: // Move right
        while (currentX < bounds.right) {
          currentX += spacing;
          if (currentX > bounds.right) currentX = bounds.right;
          if (!isInObstacle(currentX, currentY, obstacles)) {
            path.push({ x: currentX, y: currentY, spacing });
          }
        }
        direction++;
        break;

      case 1: // Move down
        while (currentY < bounds.bottom) {
          currentY += spacing;
          if (currentY > bounds.bottom) currentY = bounds.bottom;
          if (!isInObstacle(currentX, currentY, obstacles)) {
            path.push({ x: currentX, y: currentY, spacing });
          }
        }
        direction++;
        break;

      case 2: // Move left
        while (currentX > bounds.left) {
          currentX -= spacing;
          if (currentX < bounds.left) currentX = bounds.left;
          if (!isInObstacle(currentX, currentY, obstacles)) {
            path.push({ x: currentX, y: currentY, spacing });
          }
        }
        direction++;
        break;

      case 3: // Move up
        while (currentY > bounds.top) {
          currentY -= spacing;
          if (currentY < bounds.top) currentY = bounds.top;
          if (!isInObstacle(currentX, currentY, obstacles)) {
            path.push({ x: currentX, y: currentY, spacing });
          }
        }
        direction++;
        layer++;
        break;
    }
  }

  // Return to entry point
  path.push({ x: entryPoint.position.x, y: entryPoint.position.y, spacing: CONSTANTS.PIPE_SPACING_NORMAL });

  // Calculate total length
  let totalLength = 0;
  for (let i = 1; i < path.length; i++) {
    totalLength += distance(path[i - 1], path[i]);
  }

  // Calculate coverage (simple approximation)
  const roomArea = room.width * room.height;
  const obstacleArea = obstacles.reduce((sum, obs) => sum + obs.width * obs.height, 0);
  const heatedArea = roomArea - obstacleArea;

  return {
    path,
    length: totalLength,
    coverage: heatedArea,
    fabricObjects: [],
  };
}

/**
 * Check if point is inside any obstacle
 */
function isInObstacle(x: number, y: number, obstacles: Obstacle[]): boolean {
  for (const obs of obstacles) {
    const halfW = obs.width / 2;
    const halfH = obs.height / 2;
    if (
      x >= obs.position.x - halfW &&
      x <= obs.position.x + halfW &&
      y >= obs.position.y - halfH &&
      y <= obs.position.y + halfH
    ) {
      return true;
    }
  }
  return false;
}
