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

/** Edge zone configuration */
export interface EdgeZone {
  type: 'window' | 'external-wall' | 'door';
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
  heatingLoop: HeatingLoop | null;
  layoutPattern: LayoutPattern;
  isGenerating: boolean;
  metrics: Metrics | null;
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
} as const;
