import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as fabric from 'fabric';
import { toast, Toaster } from 'sonner';
import { Grid, Trash2, Loader2 } from 'lucide-react';
import { TopBar } from './TopBar';
import { CanvasArea } from './CanvasArea';
import { FloatingToolbar } from './FloatingToolbar';
import { MetricsPanel } from './MetricsPanel';
import { RoomDimensionEditor } from './RoomDimensionEditor';
import { EdgeZonesEditor } from './EdgeZonesEditor';
import type {
  DesignerState,
  Tool,
  Room,
  Obstacle,
  EntryPoint,
  LayoutPattern,
  Metrics,
  EdgeZoneConfig,
} from '../types';
import { CONSTANTS } from '../types';
import {
  createRoomRect,
  createObstacleRect,
  createEntryPoint,
  createEdgeZone,
  createLoopPath,
  createDimensionLabel,
  createDirectionArrow,
  pixelsToMeters,
  metersToPixels,
  pointToMeters,
  pointToPixels,
} from '../lib/canvas-utils';
import { generateId, snapPointToGrid, isPointInRect } from '../lib/utils';
import { detectEdgeZones, getEdgeZoneRects } from '../algorithms/edgeZoneDetector';
import { generateSpiralLoop } from '../algorithms/spiralGenerator';
import { generateMeanderLoop } from '../algorithms/meanderGenerator';
import { Button } from './ui/Button';

export function MinimalDesigner() {
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const [state, setState] = useState<DesignerState>({
    currentTool: 'draw-room',
    room: null,
    obstacles: [],
    entryPoint: null,
    edgeZones: [],
    edgeZoneConfig: {
      top: 'window',
      right: 'external-wall',
      bottom: 'window',
      left: 'door',
    },
    heatingLoop: null,
    layoutPattern: 'spiral',
    isGenerating: false,
    metrics: null,
    snapToGrid: true,
  });

  const [history, setHistory] = useState<DesignerState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showDimensionEditor, setShowDimensionEditor] = useState(false);
  const [showEdgeZonesEditor, setShowEdgeZonesEditor] = useState(false);

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

    // Draw room dimension labels
    const topLabel = createDimensionLabel(`${width.toFixed(1)}m`, x + width / 2, y - 0.3);
    (topLabel as any).roomObject = true;
    canvas.add(topLabel);

    const leftLabel = createDimensionLabel(`${height.toFixed(1)}m`, x - 0.4, y + height / 2);
    (leftLabel as any).roomObject = true;
    canvas.add(leftLabel);

    // Detect and draw edge zones using current config
    const edgeZones = detectEdgeZones(room, prevState.edgeZoneConfig);
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

    // Apply snap to grid if enabled
    const snappedPoint = prevState.snapToGrid
      ? snapPointToGrid(point, CONSTANTS.GRID_SIZE)
      : point;

    // Validate obstacle is inside room bounds
    const room = prevState.room;
    const size = CONSTANTS.DEFAULT_OBSTACLE_SIZE;
    const halfSize = size / 2;

    const isInside = isPointInRect(
      snappedPoint,
      { x: room.position.x + halfSize, y: room.position.y + halfSize },
      room.width - size,
      room.height - size
    );

    if (!isInside) {
      toast.error('Obstacle must be inside the room');
      return prevState;
    }

    const obstacle: Obstacle = {
      id: generateId(),
      position: snappedPoint,
      width: size,
      height: size,
    };

    const obstacleRect = createObstacleRect(snappedPoint.x, snappedPoint.y, size, size);
    (obstacleRect as any).obstacleId = obstacle.id;
    obstacle.fabricObject = obstacleRect;

    canvas.add(obstacleRect);
    canvas.renderAll();

    toast.success(prevState.snapToGrid ? 'Obstacle added (snapped to grid)' : 'Obstacle added - drag to move');

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

    // Remove old loop and arrows
    if (state.heatingLoop?.fabricObjects) {
      canvas.remove(...state.heatingLoop.fabricObjects);
    }

    // Simulate async generation (visual feedback)
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      // Generate loop based on selected pattern
      const loop = state.layoutPattern === 'spiral'
        ? generateSpiralLoop(state.room, state.entryPoint, state.obstacles, state.edgeZones)
        : generateMeanderLoop(state.room, state.entryPoint, state.obstacles, state.edgeZones);

      // Draw loop
      const loopPath = createLoopPath(loop.path);
      canvas.add(loopPath);
      canvas.sendObjectToBack(loopPath);

      // Add direction arrows every ~2 meters
      const arrowObjects: fabric.Object[] = [loopPath];
      for (let i = 1; i < loop.path.length - 1; i += 20) {
        // Every 20 points ≈ 2m at 10cm spacing
        const arrow = createDirectionArrow(loop.path[i], loop.path[i + 1]);
        (arrow as any).loopArrow = true;
        canvas.add(arrow);
        arrowObjects.push(arrow);
      }

      loop.fabricObjects = arrowObjects;

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

      toast.success(`${state.layoutPattern} loop generated: ${loop.length.toFixed(1)}m`, {
        description: `Coverage: ${coverage.toFixed(1)}%`,
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate loop');
      setState((prev) => ({ ...prev, isGenerating: false }));
    }
  }, [state.room, state.entryPoint, state.obstacles, state.edgeZones, state.heatingLoop, state.layoutPattern]);

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

  // Edit room dimensions
  const handleEditDimensions = useCallback((width: number, height: number) => {
    if (!canvasRef.current || !state.room) return;

    const canvas = canvasRef.current;
    const oldRoom = state.room;

    // Keep room centered at same position (adjust by difference)
    const deltaW = (width - oldRoom.width) / 2;
    const deltaH = (height - oldRoom.height) / 2;

    const newRoom: Room = {
      width,
      height,
      position: {
        x: oldRoom.position.x - deltaW,
        y: oldRoom.position.y - deltaH,
      },
    };

    // Clear and redraw room
    canvas.remove(...canvas.getObjects().filter((obj: any) => obj.roomObject));

    const roomRect = createRoomRect(newRoom.position.x, newRoom.position.y, width, height);
    (roomRect as any).roomObject = true;
    canvas.add(roomRect);

    // Draw dimension labels
    const topLabel = createDimensionLabel(
      `${width.toFixed(1)}m`,
      newRoom.position.x + width / 2,
      newRoom.position.y - 0.3
    );
    (topLabel as any).roomObject = true;
    canvas.add(topLabel);

    const leftLabel = createDimensionLabel(
      `${height.toFixed(1)}m`,
      newRoom.position.x - 0.4,
      newRoom.position.y + height / 2
    );
    (leftLabel as any).roomObject = true;
    canvas.add(leftLabel);

    // Redraw edge zones
    const edgeZones = detectEdgeZones(newRoom, state.edgeZoneConfig);
    const zoneRects = getEdgeZoneRects(newRoom, edgeZones);

    for (const rect of zoneRects) {
      const zoneObj = createEdgeZone(rect.x, rect.y, rect.width, rect.height);
      (zoneObj as any).roomObject = true;
      canvas.add(zoneObj);
    }

    canvas.renderAll();

    setState((prev) => ({
      ...prev,
      room: newRoom,
      edgeZones,
      heatingLoop: null,
      metrics: null,
    }));

    toast.success(`Room resized to ${width}m × ${height}m`);
  }, [state.room, state.edgeZoneConfig]);

  // Update edge zones configuration
  const handleEdgeZonesConfig = useCallback((config: EdgeZoneConfig) => {
    if (!canvasRef.current || !state.room) return;

    const canvas = canvasRef.current;

    // Remove old edge zones
    const objects = canvas.getObjects();
    objects.forEach((obj: any) => {
      if (obj.roomObject && obj.type !== 'rect' && obj.type !== 'text') {
        canvas.remove(obj);
      }
    });

    // Regenerate edge zones with new config
    const edgeZones = detectEdgeZones(state.room, config);
    const zoneRects = getEdgeZoneRects(state.room, edgeZones);

    for (const rect of zoneRects) {
      const zoneObj = createEdgeZone(rect.x, rect.y, rect.width, rect.height);
      (zoneObj as any).roomObject = true;
      canvas.add(zoneObj);
    }

    canvas.renderAll();

    setState((prev) => ({
      ...prev,
      edgeZones,
      edgeZoneConfig: config,
      heatingLoop: null,
      metrics: null,
    }));

    toast.success('Edge zones updated');
  }, [state.room]);

  // Clear all
  const handleClearAll = useCallback(() => {
    if (!canvasRef.current) return;

    const confirmed = window.confirm(
      'Clear everything? This will remove the room, obstacles, and heating loop. This cannot be undone.'
    );

    if (confirmed) {
      const canvas = canvasRef.current;
      canvas.getObjects().forEach((obj) => {
        if ((obj as any).roomObject || (obj as any).obstacleId || (obj as any).entryObject) {
          canvas.remove(obj);
        }
      });

      // Remove loop objects
      if (state.heatingLoop?.fabricObjects) {
        canvas.remove(...state.heatingLoop.fabricObjects);
      }

      canvas.renderAll();

      setState((prev) => ({
        ...prev,
        room: null,
        obstacles: [],
        entryPoint: null,
        edgeZones: [],
        heatingLoop: null,
        metrics: null,
      }));

      toast.success('Canvas cleared');
    }
  }, [state.heatingLoop]);

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
        case 'd':
          if (state.room) {
            setShowDimensionEditor(true);
            toast.info('Edit room dimensions');
          }
          break;
        case 'z':
          if (state.room) {
            setShowEdgeZonesEditor(true);
            toast.info('Configure edge zones');
          }
          break;
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleClearAll();
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
        onClearAll={handleClearAll}
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
          snapToGrid={state.snapToGrid}
          onSnapToGridChange={(snap) => {
            setState((prev) => ({ ...prev, snapToGrid: snap }));
            toast.info(snap ? 'Snap to grid enabled' : 'Snap to grid disabled');
          }}
        />

        <MetricsPanel metrics={state.metrics} isVisible={state.metrics !== null} />

        {/* Keyboard shortcuts help */}
        <div className="absolute bottom-20 left-6 bg-white/90 backdrop-blur rounded-lg shadow-lg px-4 py-3 text-xs text-text-light">
          <div className="font-semibold mb-2 text-text">Keyboard Shortcuts:</div>
          <div className="space-y-1">
            <div><kbd className="px-1.5 py-0.5 bg-gray-200 rounded">R</kbd> Draw Room</div>
            <div><kbd className="px-1.5 py-0.5 bg-gray-200 rounded">O</kbd> Add Obstacle</div>
            <div><kbd className="px-1.5 py-0.5 bg-gray-200 rounded">E</kbd> Set Entry</div>
            <div><kbd className="px-1.5 py-0.5 bg-gray-200 rounded">D</kbd> Edit Dimensions</div>
            <div><kbd className="px-1.5 py-0.5 bg-gray-200 rounded">Z</kbd> Edge Zones</div>
            <div><kbd className="px-1.5 py-0.5 bg-gray-200 rounded">Esc</kbd> Select Tool</div>
            <div><kbd className="px-1.5 py-0.5 bg-gray-200 rounded">Del</kbd> Delete Selected</div>
            <div><kbd className="px-1.5 py-0.5 bg-gray-200 rounded">Ctrl+G</kbd> Generate</div>
            <div><kbd className="px-1.5 py-0.5 bg-gray-200 rounded">Ctrl+C</kbd> Clear All</div>
          </div>
        </div>

        {/* Room dimension editor */}
        {showDimensionEditor && state.room && (
          <RoomDimensionEditor
            currentWidth={state.room.width}
            currentHeight={state.room.height}
            onApply={handleEditDimensions}
            onClose={() => setShowDimensionEditor(false)}
          />
        )}

        {/* Edge zones editor */}
        {showEdgeZonesEditor && state.room && (
          <EdgeZonesEditor
            currentConfig={state.edgeZoneConfig}
            onApply={handleEdgeZonesConfig}
            onClose={() => setShowEdgeZonesEditor(false)}
          />
        )}

        {/* Loading overlay */}
        {state.isGenerating && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-40 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl px-8 py-6 flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="text-lg font-semibold text-text">Generating heating loop...</div>
              <div className="text-sm text-text-light">This may take a moment</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
