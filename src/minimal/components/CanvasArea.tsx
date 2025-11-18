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
  const isPanningRef = useRef(false);
  const lastPosXRef = useRef(0);
  const lastPosYRef = useRef(0);

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

    // Add zoom on mouse wheel
    canvas.on('mouse:wheel', (opt: any) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;

      // Limit zoom range
      if (zoom > 5) zoom = 5;
      if (zoom < 0.5) zoom = 0.5;

      // Zoom to point
      canvas.zoomToPoint(new fabric.Point(opt.e.offsetX, opt.e.offsetY), zoom);

      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Pan with space + drag or middle mouse button
    canvas.on('mouse:down', (opt: any) => {
      const evt = opt.e;

      // Middle mouse button or space + left mouse
      if (evt.button === 1 || (evt.button === 0 && evt.shiftKey)) {
        isPanningRef.current = true;
        canvas.selection = false;
        canvas.defaultCursor = 'grabbing';
        lastPosXRef.current = evt.clientX;
        lastPosYRef.current = evt.clientY;
      }
    });

    canvas.on('mouse:move', (opt: any) => {
      if (isPanningRef.current) {
        const evt = opt.e;
        const vpt = canvas.viewportTransform;

        if (vpt) {
          vpt[4] += evt.clientX - lastPosXRef.current;
          vpt[5] += evt.clientY - lastPosYRef.current;
          canvas.requestRenderAll();
        }

        lastPosXRef.current = evt.clientX;
        lastPosYRef.current = evt.clientY;
      }
    });

    canvas.on('mouse:up', () => {
      if (isPanningRef.current) {
        canvas.defaultCursor = 'default';
        isPanningRef.current = false;
      }
    });

    // Store reference
    fabricCanvasRef.current = canvas;
    onCanvasReady(canvas);

    // Event listeners for clicks (not when panning)
    canvas.on('mouse:down', (e: any) => {
      if (!isPanningRef.current) {
        onCanvasClick(e);
      }
    });

    // Cleanup
    return () => {
      canvas.dispose();
    };
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center bg-background p-8">
      <div className="bg-canvas rounded-lg shadow-lg overflow-hidden relative">
        <canvas ref={canvasRef} />

        {/* Zoom/Pan hint */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg shadow px-3 py-2 text-xs text-text-light">
          <div className="font-semibold mb-1 text-text">Canvas Controls:</div>
          <div><span className="text-text">Mouse Wheel</span> - Zoom</div>
          <div><span className="text-text">Shift+Drag</span> - Pan</div>
        </div>
      </div>
    </div>
  );
}
