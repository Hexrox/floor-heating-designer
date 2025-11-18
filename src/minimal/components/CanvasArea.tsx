import React, { useEffect, useRef } from 'react';
import * as fabric from 'fabric';
import { createGrid } from '../lib/canvas-utils';
import { CONSTANTS } from '../types';

interface CanvasAreaProps {
  onCanvasReady: (canvas: fabric.Canvas) => void;
  onCanvasClick: (e: any) => void;
}

export function CanvasArea({ onCanvasReady, onCanvasClick }: CanvasAreaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 1200,
      height: 800,
      backgroundColor: '#FFFFFF',
      selection: false,
    });

    // Add grid
    const grid = createGrid(1200, 800, CONSTANTS.GRID_SIZE);
    canvas.add(grid);
    (grid as any).sendToBack?.();

    // Store reference
    fabricCanvasRef.current = canvas;
    onCanvasReady(canvas);

    // Event listeners
    canvas.on('mouse:down', onCanvasClick);

    // Cleanup
    return () => {
      canvas.dispose();
    };
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center bg-background p-8">
      <div className="bg-canvas rounded-lg shadow-lg overflow-hidden">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
