/**
 * Type definitions for Minimal Floor Heating Designer
 */

/** 2D Point in meters */
export interface Point {
  x: number;
  y: number;
}

/** Rectangle room definition */
export interface Room {
  width: number; // meters
  height: number; // meters
  position: Point; // top-left corner in meters
}

/** Obstacle (area without heating) */
export interface Obstacle {
  id: string;
  position: Point; // center in meters
  width: number; // meters
  height: number; // meters
  fabricObject?: any; // Reference to canvas object
}

/** Entry point for heating pipes */
export interface EntryPoint {
  position: Point; // in meters
  side: 'top' | 'right' | 'bottom' | 'left';
  fabricObject?: any;
}

/** Wall type for edge zone configuration */
export type WallType = 'window' | 'external-wall' | 'door' | 'internal-wall';

/** Edge zone configuration per wall */
export interface EdgeZoneConfig {
  top: WallType;
  right: WallType;
  bottom: WallType;
  left: WallType;
}

/** Edge zone configuration */
export interface EdgeZone {
  type: WallType;
  side: 'top' | 'right' | 'bottom' | 'left';
  start: number; // position along the side (0-1)
  length: number; // length as fraction (0-1)
  depth: number; // depth in meters (0.6, 0.7, 1.0)
}

/** Heating loop path point */
export interface LoopPoint extends Point {
  spacing?: number; // pipe spacing at this point (cm)
}

/** Generated heating loop */
export interface HeatingLoop {
  path: LoopPoint[];
  length: number; // total length in meters
  coverage: number; // heated area in m²
  fabricObjects?: any[];
}

/** Design metrics */
export interface Metrics {
  roomArea: number; // m²
  heatedArea: number; // m²
  loopLength: number; // m
  pipeDensity: number; // m/m²
  coverage: number; // percentage
  heatOutput?: number; // W (optional)
}

/** Tool types */
export type Tool = 'select' | 'draw-room' | 'add-obstacle' | 'set-entry' | 'pan' | 'zoom';

/** Layout pattern */
export type LayoutPattern = 'spiral' | 'meander';

/** Application state */
export interface DesignerState {
  currentTool: Tool;
  room: Room | null;
  obstacles: Obstacle[];
  entryPoint: EntryPoint | null;
  edgeZones: EdgeZone[];
  edgeZoneConfig: EdgeZoneConfig;
  heatingLoop: HeatingLoop | null;
  layoutPattern: LayoutPattern;
  pipeSpacing: number; // in meters (0.10 or 0.15)
  isGenerating: boolean;
  metrics: Metrics | null;
  snapToGrid: boolean;
}

/** Constants */
export const CONSTANTS = {
  PIXELS_PER_METER: 100, // 1m = 100px
  GRID_SIZE: 0.5, // 50cm grid
  DEFAULT_ROOM_WIDTH: 5, // meters
  DEFAULT_ROOM_HEIGHT: 4, // meters
  MIN_ROOM_SIZE: 2, // meters
  MAX_ROOM_SIZE: 20, // meters
  DEFAULT_OBSTACLE_SIZE: 1, // meters
  MIN_OBSTACLE_SIZE: 0.3, // meters
  PIPE_SPACING_NORMAL: 0.2, // 20cm
  PIPE_SPACING_EDGE: 0.1, // 10cm
  EDGE_ZONE_WINDOW: 1.0, // 100cm under windows
  EDGE_ZONE_EXTERNAL_WALL: 0.6, // 60cm at external walls
  EDGE_ZONE_DOOR: 0.7, // 70cm at external doors
  EDGE_ZONE_INTERNAL_WALL: 0.3, // 30cm at internal walls
} as const;

/** Get edge zone depth by wall type */
export function getEdgeZoneDepth(wallType: WallType): number {
  switch (wallType) {
    case 'window':
      return CONSTANTS.EDGE_ZONE_WINDOW;
    case 'external-wall':
      return CONSTANTS.EDGE_ZONE_EXTERNAL_WALL;
    case 'door':
      return CONSTANTS.EDGE_ZONE_DOOR;
    case 'internal-wall':
      return CONSTANTS.EDGE_ZONE_INTERNAL_WALL;
    default:
      return CONSTANTS.EDGE_ZONE_EXTERNAL_WALL;
  }
}
