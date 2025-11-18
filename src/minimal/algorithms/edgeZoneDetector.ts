import type { Room, EdgeZone, EdgeZoneConfig } from '../types';
import { getEdgeZoneDepth } from '../types';

/**
 * Detect and generate edge zones for a room based on wall configuration
 */
export function detectEdgeZones(room: Room, config: EdgeZoneConfig): EdgeZone[] {
  const zones: EdgeZone[] = [];

  // Top wall - full length if not internal
  if (config.top !== 'internal-wall') {
    zones.push({
      type: config.top,
      side: 'top',
      start: 0,
      length: 1,
      depth: getEdgeZoneDepth(config.top),
    });
  }

  // Right wall - full length if not internal
  if (config.right !== 'internal-wall') {
    zones.push({
      type: config.right,
      side: 'right',
      start: 0,
      length: 1,
      depth: getEdgeZoneDepth(config.right),
    });
  }

  // Bottom wall - full length if not internal
  if (config.bottom !== 'internal-wall') {
    zones.push({
      type: config.bottom,
      side: 'bottom',
      start: 0,
      length: 1,
      depth: getEdgeZoneDepth(config.bottom),
    });
  }

  // Left wall - full length if not internal
  if (config.left !== 'internal-wall') {
    zones.push({
      type: config.left,
      side: 'left',
      start: 0,
      length: 1,
      depth: getEdgeZoneDepth(config.left),
    });
  }

  return zones;
}

/**
 * Check if a point is inside any edge zone
 */
export function isPointInEdgeZone(
  point: { x: number; y: number },
  room: Room,
  zones: EdgeZone[]
): boolean {
  for (const zone of zones) {
    const zoneRect = getZoneRect(zone, room);
    if (
      point.x >= zoneRect.x &&
      point.x <= zoneRect.x + zoneRect.width &&
      point.y >= zoneRect.y &&
      point.y <= zoneRect.y + zoneRect.height
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Helper to get zone rectangle
 */
function getZoneRect(
  zone: EdgeZone,
  room: Room
): { x: number; y: number; width: number; height: number } {
  switch (zone.side) {
    case 'top':
      return {
        x: room.position.x + zone.start * room.width,
        y: room.position.y,
        width: zone.length * room.width,
        height: zone.depth,
      };
    case 'right':
      return {
        x: room.position.x + room.width - zone.depth,
        y: room.position.y + zone.start * room.height,
        width: zone.depth,
        height: zone.length * room.height,
      };
    case 'bottom':
      return {
        x: room.position.x + zone.start * room.width,
        y: room.position.y + room.height - zone.depth,
        width: zone.length * room.width,
        height: zone.depth,
      };
    case 'left':
      return {
        x: room.position.x,
        y: room.position.y + zone.start * room.height,
        width: zone.depth,
        height: zone.length * room.height,
      };
  }
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
