import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Point } from '../types';

/**
 * Merge Tailwind classes properly
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Format meters to display string
 */
export function formatMeters(meters: number): string {
  if (meters < 1) {
    return `${(meters * 100).toFixed(0)} cm`;
  }
  return `${meters.toFixed(2)} m`;
}

/**
 * Format area to display string
 */
export function formatArea(area: number): string {
  return `${area.toFixed(2)} m²`;
}

/**
 * Check if point is inside rectangle
 */
export function isPointInRect(
  point: Point,
  rectPos: Point,
  rectWidth: number,
  rectHeight: number
): boolean {
  return (
    point.x >= rectPos.x &&
    point.x <= rectPos.x + rectWidth &&
    point.y >= rectPos.y &&
    point.y <= rectPos.y + rectHeight
  );
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Snap value to grid
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Snap point to grid
 */
export function snapPointToGrid(point: { x: number; y: number }, gridSize: number): { x: number; y: number } {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}
