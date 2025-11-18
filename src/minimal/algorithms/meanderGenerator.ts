import type { Room, Obstacle, EntryPoint, EdgeZone, LoopPoint, HeatingLoop } from '../types';
import { CONSTANTS } from '../types';
import { distance } from '../lib/utils';

/**
 * Generate meander (serpentine/boustrophedon) heating loop
 */
export function generateMeanderLoop(
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

  const roomBounds = {
    left: room.position.x + 0.1,
    top: room.position.y + 0.1,
    right: room.position.x + room.width - 0.1,
    bottom: room.position.y + room.height - 0.1,
  };

  // Navigate to starting corner (top-left)
  currentX = roomBounds.left;
  currentY = roomBounds.top;
  path.push({ x: currentX, y: currentY, spacing: CONSTANTS.PIPE_SPACING_EDGE });

  // Meander pattern: horizontal serpentine
  const spacing = CONSTANTS.PIPE_SPACING_NORMAL;
  let goingRight = true;
  let y = roomBounds.top;

  while (y <= roomBounds.bottom) {
    if (goingRight) {
      // Move right
      let x = roomBounds.left;
      while (x <= roomBounds.right) {
        if (!isInObstacle(x, y, obstacles)) {
          path.push({ x, y, spacing });
        }
        x += spacing;
      }
      currentX = roomBounds.right;
    } else {
      // Move left
      let x = roomBounds.right;
      while (x >= roomBounds.left) {
        if (!isInObstacle(x, y, obstacles)) {
          path.push({ x, y, spacing });
        }
        x -= spacing;
      }
      currentX = roomBounds.left;
    }

    // Move down
    y += spacing;
    if (y <= roomBounds.bottom && !isInObstacle(currentX, y, obstacles)) {
      path.push({ x: currentX, y, spacing });
    }

    goingRight = !goingRight;
  }

  // Return to entry point
  path.push({ x: entryPoint.position.x, y: entryPoint.position.y, spacing: CONSTANTS.PIPE_SPACING_NORMAL });

  // Calculate total length
  let totalLength = 0;
  for (let i = 1; i < path.length; i++) {
    totalLength += distance(path[i - 1], path[i]);
  }

  // Calculate coverage
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
