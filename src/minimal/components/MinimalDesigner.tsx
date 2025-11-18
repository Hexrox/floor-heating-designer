import React, { useState, useCallback, useRef } from 'react';
import * as fabric from 'fabric';
import { toast, Toaster } from 'sonner';
import { TopBar } from './TopBar';
import { CanvasArea } from './CanvasArea';
import { FloatingToolbar } from './FloatingToolbar';
import { MetricsPanel } from './MetricsPanel';
import type {
  DesignerState,
  Tool,
  Room,
  Obstacle,
  EntryPoint,
  LayoutPattern,
  Metrics,
} from '../types';
import { CONSTANTS } from '../types';
import {
  createRoomRect,
  createObstacleRect,
  createEntryPoint,
  createEdgeZone,
  createLoopPath,
  pixelsToMeters,
  metersToPixels,
  pointToMeters,
} from '../lib/canvas-utils';
import { generateId } from '../lib/utils';
import { detectEdgeZones, getEdgeZoneRects } from '../algorithms/edgeZoneDetector';
import { generateSpiralLoop } from '../algorithms/spiralGenerator';

export function MinimalDesigner() {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const [state, setState] = useState<DesignerState>({
    currentTool: 'draw-room',
    room: null,
    obstacles: [],
    entryPoint: null,
    edgeZones: [],
    heatingLoop: null,
    layoutPattern: 'spiral',
    isGenerating: false,
    metrics: null,
  });

  const [history, setHistory] = useState<DesignerState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Canvas ready handler
  const handleCanvasReady = useCallback((canvas: fabric.Canvas) => {
    canvasRef.current = canvas;
  }, []);

  // Canvas click handler
  const handleCanvasClick = useCallback(
    (e: any) => {
      if (!canvasRef.current || !e.pointer) return;

      const pointer = e.pointer;
      const pointMeters = pointToMeters({ x: pointer.x, y: pointer.y });

      switch (state.currentTool) {
        case 'draw-room':
          handleDrawRoom(pointMeters);
          break;
        case 'add-obstacle':
          handleAddObstacle(pointMeters);
          break;
        case 'set-entry':
          handleSetEntryPoint(pointMeters);
          break;
      }
    },
    [state.currentTool, state.room]
  );

  // Draw room (simple rectangle for MVP)
  const handleDrawRoom = useCallback((point: { x: number; y: number }) => {
    if (!canvasRef.current) return;

    // Clear existing room
    if (state.room) {
      canvasRef.current.remove(
        ...canvasRef.current.getObjects().filter((obj: any) => obj.roomObject)
      );
    }

    // Create centered room at click position
    const width = CONSTANTS.DEFAULT_ROOM_WIDTH;
    const height = CONSTANTS.DEFAULT_ROOM_HEIGHT;
    const x = point.x - width / 2;
    const y = point.y - height / 2;

    const room: Room = {
      width,
      height,
      position: { x, y },
    };

    // Draw room rectangle
    const roomRect = createRoomRect(x, y, width, height);
    (roomRect as any).roomObject = true;
    canvasRef.current.add(roomRect);

    // Detect and draw edge zones
    const edgeZones = detectEdgeZones(room);
    const zoneRects = getEdgeZoneRects(room, edgeZones);

    for (const rect of zoneRects) {
      const zoneObj = createEdgeZone(rect.x, rect.y, rect.width, rect.height);
      (zoneObj as any).roomObject = true;
      canvasRef.current.add(zoneObj);
    }

    // Set default entry point
    const entryPoint: EntryPoint = {
      position: { x: x - 0.2, y: y + height / 2 },
      side: 'left',
    };

    const entryObj = createEntryPoint(entryPoint.position.x, entryPoint.position.y);
    (entryObj as any).entryObject = true;
    entryPoint.fabricObject = entryObj;
    canvasRef.current.add(entryObj);

    canvasRef.current.renderAll();

    setState((prev) => ({
      ...prev,
      room,
      edgeZones,
      entryPoint,
      obstacles: [],
      heatingLoop: null,
      metrics: null,
    }));

    toast.success(`Room created: ${width}m × ${height}m`);
  }, [state.room]);

  // Add obstacle
  const handleAddObstacle = useCallback(
    (point: { x: number; y: number }) => {
      if (!canvasRef.current || !state.room) return;

      const size = CONSTANTS.DEFAULT_OBSTACLE_SIZE;
      const obstacle: Obstacle = {
        id: generateId(),
        position: point,
        width: size,
        height: size,
      };

      const obstacleRect = createObstacleRect(point.x, point.y, size, size);
      (obstacleRect as any).obstacleId = obstacle.id;
      obstacle.fabricObject = obstacleRect;

      canvasRef.current.add(obstacleRect);
      canvasRef.current.renderAll();

      setState((prev) => ({
        ...prev,
        obstacles: [...prev.obstacles, obstacle],
        heatingLoop: null,
        metrics: null,
      }));

      toast.success('Obstacle added');
    },
    [state.room]
  );

  // Set entry point
  const handleSetEntryPoint = useCallback(
    (point: { x: number; y: number }) => {
      if (!canvasRef.current || !state.room) return;

      // Remove old entry point
      if (state.entryPoint?.fabricObject) {
        canvasRef.current.remove(state.entryPoint.fabricObject);
      }

      // Determine which side is closest
      const room = state.room;
      const distances = {
        left: Math.abs(point.x - room.position.x),
        right: Math.abs(point.x - (room.position.x + room.width)),
        top: Math.abs(point.y - room.position.y),
        bottom: Math.abs(point.y - (room.position.y + room.height)),
      };

      const side = (Object.keys(distances) as Array<keyof typeof distances>).reduce((a, b) =>
        distances[a] < distances[b] ? a : b
      );

      const entryPoint: EntryPoint = {
        position: point,
        side,
      };

      const entryObj = createEntryPoint(point.x, point.y);
      (entryObj as any).entryObject = true;
      entryPoint.fabricObject = entryObj;

      canvasRef.current.add(entryObj);
      canvasRef.current.renderAll();

      setState((prev) => ({
        ...prev,
        entryPoint,
        heatingLoop: null,
        metrics: null,
      }));

      toast.success(`Entry point set on ${side} side`);
    },
    [state.room, state.entryPoint]
  );

  // Generate heating loop
  const handleGenerate = useCallback(async () => {
    if (!canvasRef.current || !state.room || !state.entryPoint) {
      toast.error('Please create a room and set entry point first');
      return;
    }

    setState((prev) => ({ ...prev, isGenerating: true }));

    // Remove old loop
    if (state.heatingLoop?.fabricObjects) {
      canvasRef.current.remove(...state.heatingLoop.fabricObjects);
    }

    // Simulate async generation
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      // Generate loop
      const loop = generateSpiralLoop(
        state.room,
        state.entryPoint,
        state.obstacles,
        state.edgeZones
      );

      // Draw loop
      const loopPath = createLoopPath(loop.path);
      canvasRef.current.add(loopPath);
      loop.fabricObjects = [loopPath];

      // Calculate metrics
      const roomArea = state.room.width * state.room.height;
      const obstacleArea = state.obstacles.reduce(
        (sum, obs) => sum + obs.width * obs.height,
        0
      );
      const heatedArea = loop.coverage;
      const pipeDensity = loop.length / heatedArea;
      const coverage = (heatedArea / roomArea) * 100;

      const metrics: Metrics = {
        roomArea,
        heatedArea,
        loopLength: loop.length,
        pipeDensity,
        coverage,
      };

      canvasRef.current.renderAll();

      setState((prev) => ({
        ...prev,
        heatingLoop: loop,
        metrics,
        isGenerating: false,
      }));

      toast.success(`Loop generated: ${loop.length.toFixed(1)}m`);
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate loop');
      setState((prev) => ({ ...prev, isGenerating: false }));
    }
  }, [state.room, state.entryPoint, state.obstacles, state.edgeZones, state.heatingLoop]);

  // Export
  const handleExport = useCallback(() => {
    if (!canvasRef.current) return;

    const dataURL = canvasRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });

    const link = document.createElement('a');
    link.download = `floor-heating-${Date.now()}.png`;
    link.href = dataURL;
    link.click();

    toast.success('Design exported as PNG');
  }, []);

  // Undo/Redo (simplified)
  const handleUndo = useCallback(() => {
    toast.info('Undo functionality coming soon');
  }, []);

  const handleRedo = useCallback(() => {
    toast.info('Redo functionality coming soon');
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background">
      <Toaster position="top-right" />

      <TopBar
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={handleExport}
        canUndo={false}
        canRedo={false}
      />

      <div className="flex-1 relative">
        <CanvasArea onCanvasReady={handleCanvasReady} onCanvasClick={handleCanvasClick} />

        <FloatingToolbar
          currentTool={state.currentTool}
          onToolChange={(tool) => setState((prev) => ({ ...prev, currentTool: tool }))}
          onGenerate={handleGenerate}
          hasRoom={state.room !== null}
          layoutPattern={state.layoutPattern}
          onPatternChange={(pattern) =>
            setState((prev) => ({ ...prev, layoutPattern: pattern }))
          }
          isGenerating={state.isGenerating}
        />

        <MetricsPanel metrics={state.metrics} isVisible={state.metrics !== null} />
      </div>
    </div>
  );
}
