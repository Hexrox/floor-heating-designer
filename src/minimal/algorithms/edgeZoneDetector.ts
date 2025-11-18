import type { Room, EdgeZone } from '../types';
import { CONSTANTS } from '../types';

/**
 * Detect and generate edge zones for a room
 * For MVP, we assume all walls are external with windows on longer walls
 */
export function detectEdgeZones(room: Room): EdgeZone[] {
  const zones: EdgeZone[] = [];

  // Determine which walls have windows (assume longer walls have windows)
  const hasWindowTop = room.width >= room.height;
  const hasWindowBottom = room.width >= room.height;

  // Top wall
  if (hasWindowTop) {
    zones.push({
      type: 'window',
      side: 'top',
      start: 0,
      length: 1,
      depth: CONSTANTS.EDGE_ZONE_WINDOW,
    });
  } else {
    zones.push({
      type: 'external-wall',
      side: 'top',
      start: 0,
      length: 1,
      depth: CONSTANTS.EDGE_ZONE_EXTERNAL_WALL,
    });
  }

  // Right wall (external wall)
  zones.push({
    type: 'external-wall',
    side: 'right',
    start: 0,
    length: 1,
    depth: CONSTANTS.EDGE_ZONE_EXTERNAL_WALL,
  });

  // Bottom wall
  if (hasWindowBottom) {
    zones.push({
      type: 'window',
      side: 'bottom',
      start: 0,
      length: 1,
      depth: CONSTANTS.EDGE_ZONE_WINDOW,
    });
  } else {
    zones.push({
      type: 'external-wall',
      side: 'bottom',
      start: 0,
      length: 1,
      depth: CONSTANTS.EDGE_ZONE_EXTERNAL_WALL,
    });
  }

  // Left wall (door - assume near bottom)
  zones.push({
    type: 'door',
    side: 'left',
    start: 0.6,
    length: 0.3,
    depth: CONSTANTS.EDGE_ZONE_DOOR,
  });

  return zones;
}

/**
 * Calculate edge zone rectangles for rendering
 */
export function getEdgeZoneRects(
  room: Room,
  zones: EdgeZone[]
): Array<{ x: number; y: number; width: number; height: number }> {
  const rects: Array<{ x: number; y: number; width: number; height: number }> = [];

  for (const zone of zones) {
    let rect: { x: number; y: number; width: number; height: number };

    switch (zone.side) {
      case 'top':
        rect = {
          x: room.position.x + zone.start * room.width,
          y: room.position.y,
          width: zone.length * room.width,
          height: zone.depth,
        };
        break;

      case 'right':
        rect = {
          x: room.position.x + room.width - zone.depth,
          y: room.position.y + zone.start * room.height,
          width: zone.depth,
          height: zone.length * room.height,
        };
        break;

      case 'bottom':
        rect = {
          x: room.position.x + zone.start * room.width,
          y: room.position.y + room.height - zone.depth,
          width: zone.length * room.width,
          height: zone.depth,
        };
        break;

      case 'left':
        rect = {
          x: room.position.x,
          y: room.position.y + zone.start * room.height,
          width: zone.depth,
          height: zone.length * room.height,
        };
        break;
    }

    rects.push(rect);
  }

  return rects;
}
