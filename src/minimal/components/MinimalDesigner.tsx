import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  pointToPixels,
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

    // Add event handlers for object interactions
    canvas.on('object:modified', (e: any) => {
      if (!e.target) return;

      const obj = e.target;

      // Handle obstacle moved/resized
      if ((obj as any).obstacleId) {
        const obstacleId = (obj as any).obstacleId;
        const rect = obj as fabric.Rect;

        setState((prev) => ({
          ...prev,
          obstacles: prev.obstacles.map((obs) =>
            obs.id === obstacleId
              ? {
                  ...obs,
                  position: pointToMeters({
                    x: (rect.left || 0) + (rect.width || 0) * (rect.scaleX || 1) / 2,
                    y: (rect.top || 0) + (rect.height || 0) * (rect.scaleY || 1) / 2,
                  }),
                  width: pixelsToMeters((rect.width || 0) * (rect.scaleX || 1)),
                  height: pixelsToMeters((rect.height || 0) * (rect.scaleY || 1)),
                }
              : obs
          ),
          heatingLoop: null,
          metrics: null,
        }));
      }

      // Handle entry point moved
      if ((obj as any).entryObject) {
        const circle = obj as fabric.Circle;
        setState((prev) => {
          if (!prev.entryPoint || !prev.room) return prev;

          const newPos = pointToMeters({
            x: circle.left || 0,
            y: circle.top || 0,
          });

          // Determine which side is closest
          const room = prev.room;
          const distances = {
            left: Math.abs(newPos.x - room.position.x),
            right: Math.abs(newPos.x - (room.position.x + room.width)),
            top: Math.abs(newPos.y - room.position.y),
            bottom: Math.abs(newPos.y - (room.position.y + room.height)),
          };

          const side = (Object.keys(distances) as Array<keyof typeof distances>).reduce(
            (a, b) => (distances[a] < distances[b] ? a : b)
          );

          return {
            ...prev,
            entryPoint: {
              ...prev.entryPoint,
              position: newPos,
              side,
            },
            heatingLoop: null,
            metrics: null,
          };
        });
      }
    });

    // Handle selection for delete
    canvas.on('selection:created', (e: any) => {
      if (e.selected && e.selected.length > 0) {
        const obj = e.selected[0];
        (obj as any).isSelected = true;
      }
    });

    canvas.on('selection:cleared', () => {
      // Clear selection flag
    });
  }, []);

  // Canvas click handler
  const handleCanvasClick = useCallback((e: any) => {
    if (!e.pointer) return;

    const pointer = e.pointer;
    const pointMeters = pointToMeters({ x: pointer.x, y: pointer.y });

    setState((prev) => {
      const canvas = canvasRef.current;
      if (!canvas) return prev;

      switch (prev.currentTool) {
        case 'draw-room':
          return handleDrawRoom(prev, canvas, pointMeters);
        case 'add-obstacle':
          return handleAddObstacle(prev, canvas, pointMeters);
        case 'set-entry':
          return handleSetEntryPoint(prev, canvas, pointMeters);
        default:
          return prev;
      }
    });
  }, []);

  // Draw room (pure function)
  const handleDrawRoom = (
    prevState: DesignerState,
    canvas: fabric.Canvas,
    point: { x: number; y: number }
  ): DesignerState => {
    // Clear existing room
    if (prevState.room) {
      canvas.remove(...canvas.getObjects().filter((obj: any) => obj.roomObject));
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
    canvas.add(roomRect);

    // Detect and draw edge zones
    const edgeZones = detectEdgeZones(room);
    const zoneRects = getEdgeZoneRects(room, edgeZones);

    for (const rect of zoneRects) {
      const zoneObj = createEdgeZone(rect.x, rect.y, rect.width, rect.height);
      (zoneObj as any).roomObject = true;
      canvas.add(zoneObj);
    }

    // Set default entry point (on the left wall, inside the room)
    const entryPoint: EntryPoint = {
      position: { x: x + 0.1, y: y + height / 2 },
      side: 'left',
    };

    const entryObj = createEntryPoint(entryPoint.position.x, entryPoint.position.y);
    (entryObj as any).entryObject = true;
    entryPoint.fabricObject = entryObj;
    canvas.add(entryObj);

    canvas.renderAll();

    toast.success(`Room created: ${width}m × ${height}m`);

    return {
      ...prevState,
      room,
      edgeZones,
      entryPoint,
      obstacles: [],
      heatingLoop: null,
      metrics: null,
    };
  };

  // Add obstacle (pure function)
  const handleAddObstacle = (
    prevState: DesignerState,
    canvas: fabric.Canvas,
    point: { x: number; y: number }
  ): DesignerState => {
    if (!prevState.room) {
      toast.error('Please create a room first');
      return prevState;
    }

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

    canvas.add(obstacleRect);
    canvas.renderAll();

    toast.success('Obstacle added - drag to move, resize with handles');

    return {
      ...prevState,
      obstacles: [...prevState.obstacles, obstacle],
      heatingLoop: null,
      metrics: null,
    };
  };

  // Set entry point (pure function)
  const handleSetEntryPoint = (
    prevState: DesignerState,
    canvas: fabric.Canvas,
    point: { x: number; y: number }
  ): DesignerState => {
    if (!prevState.room) {
      toast.error('Please create a room first');
      return prevState;
    }

    // Remove old entry point
    if (prevState.entryPoint?.fabricObject) {
      canvas.remove(prevState.entryPoint.fabricObject);
    }

    // Determine which side is closest
    const room = prevState.room;
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

    canvas.add(entryObj);
    canvas.renderAll();

    toast.success(`Entry point set on ${side} side - drag to move`);

    return {
      ...prevState,
      entryPoint,
      heatingLoop: null,
      metrics: null,
    };
  };

  // Generate heating loop
  const handleGenerate = useCallback(async () => {
    if (!canvasRef.current || !state.room || !state.entryPoint) {
      toast.error('Please create a room and set entry point first');
      return;
    }

    setState((prev) => ({ ...prev, isGenerating: true }));

    const canvas = canvasRef.current;

    // Remove old loop
    if (state.heatingLoop?.fabricObjects) {
      canvas.remove(...state.heatingLoop.fabricObjects);
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
      canvas.add(loopPath);
      canvas.sendObjectToBack(loopPath);
      loop.fabricObjects = [loopPath];

      // Calculate metrics
      const roomArea = state.room.width * state.room.height;
      const obstacleArea = state.obstacles.reduce(
        (sum, obs) => sum + obs.width * obs.height,
        0
      );
      const heatedArea = loop.coverage;
      const pipeDensity = heatedArea > 0 ? loop.length / heatedArea : 0;
      const coverage = (heatedArea / roomArea) * 100;

      const metrics: Metrics = {
        roomArea,
        heatedArea,
        loopLength: loop.length,
        pipeDensity,
        coverage,
      };

      canvas.renderAll();

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

  // Delete selected obstacle
  const handleDelete = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const activeObject = canvas.getActiveObject();

    if (!activeObject) {
      toast.info('Select an obstacle first');
      return;
    }

    // Check if it's an obstacle
    if ((activeObject as any).obstacleId) {
      const obstacleId = (activeObject as any).obstacleId;

      setState((prev) => ({
        ...prev,
        obstacles: prev.obstacles.filter((obs) => obs.id !== obstacleId),
        heatingLoop: null,
        metrics: null,
      }));

      canvas.remove(activeObject);
      canvas.renderAll();

      toast.success('Obstacle deleted');
    } else if ((activeObject as any).entryObject) {
      toast.error('Cannot delete entry point - move it instead');
    } else {
      toast.error('Cannot delete room elements');
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      switch (e.key.toLowerCase()) {
        case 'r':
          setState((prev) => ({ ...prev, currentTool: 'draw-room' }));
          toast.info('Tool: Draw Room');
          break;
        case 'o':
          setState((prev) => ({ ...prev, currentTool: 'add-obstacle' }));
          toast.info('Tool: Add Obstacle');
          break;
        case 'e':
          setState((prev) => ({ ...prev, currentTool: 'set-entry' }));
          toast.info('Tool: Set Entry Point');
          break;
        case 'escape':
          setState((prev) => ({ ...prev, currentTool: 'select' }));
          if (canvasRef.current) {
            canvasRef.current.discardActiveObject();
            canvasRef.current.renderAll();
          }
          toast.info('Tool: Select');
          break;
        case 'delete':
        case 'backspace':
          handleDelete();
          break;
        case 'g':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleGenerate();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleDelete, handleGenerate]);

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
      <Toaster position="top-right" richColors />

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

        {/* Keyboard shortcuts help */}
        <div className="absolute bottom-20 left-6 bg-white/90 backdrop-blur rounded-lg shadow-lg px-4 py-3 text-xs text-text-light">
          <div className="font-semibold mb-2 text-text">Keyboard Shortcuts:</div>
          <div className="space-y-1">
            <div><kbd className="px-1.5 py-0.5 bg-gray-200 rounded">R</kbd> Draw Room</div>
            <div><kbd className="px-1.5 py-0.5 bg-gray-200 rounded">O</kbd> Add Obstacle</div>
            <div><kbd className="px-1.5 py-0.5 bg-gray-200 rounded">E</kbd> Set Entry</div>
            <div><kbd className="px-1.5 py-0.5 bg-gray-200 rounded">Esc</kbd> Select Tool</div>
            <div><kbd className="px-1.5 py-0.5 bg-gray-200 rounded">Del</kbd> Delete Selected</div>
            <div><kbd className="px-1.5 py-0.5 bg-gray-200 rounded">Ctrl+G</kbd> Generate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
