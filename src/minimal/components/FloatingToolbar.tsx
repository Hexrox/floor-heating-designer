import React from 'react';
import { Square, Circle, MapPin, Zap, Grid } from 'lucide-react';
import { Button } from './ui/Button';
import type { Tool, LayoutPattern } from '../types';
import { motion } from 'framer-motion';

interface FloatingToolbarProps {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  onGenerate: () => void;
  hasRoom: boolean;
  layoutPattern: LayoutPattern;
  onPatternChange: (pattern: LayoutPattern) => void;
  isGenerating: boolean;
  snapToGrid: boolean;
  onSnapToGridChange: (snap: boolean) => void;
}

export function FloatingToolbar({
  currentTool,
  onToolChange,
  onGenerate,
  hasRoom,
  layoutPattern,
  onPatternChange,
  isGenerating,
  snapToGrid,
  onSnapToGridChange,
}: FloatingToolbarProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
    >
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 px-4 py-3 flex items-center gap-3">
        <Button
          variant={currentTool === 'draw-room' ? 'primary' : 'secondary'}
          size="md"
          onClick={() => onToolChange('draw-room')}
          title="Draw Room (R)"
        >
          <Square className="w-5 h-5" />
          Draw Room
        </Button>

        <Button
          variant={currentTool === 'add-obstacle' ? 'primary' : 'secondary'}
          size="md"
          onClick={() => onToolChange('add-obstacle')}
          disabled={!hasRoom}
          title="Add Obstacle (O)"
        >
          <Circle className="w-5 h-5" />
          Obstacle
        </Button>

        <Button
          variant={currentTool === 'set-entry' ? 'primary' : 'secondary'}
          size="md"
          onClick={() => onToolChange('set-entry')}
          disabled={!hasRoom}
          title="Set Entry Point (E)"
        >
          <MapPin className="w-5 h-5" />
          Entry
        </Button>

        <div className="w-px h-8 bg-gray-300" />

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-light">Pattern</label>
          <select
            value={layoutPattern}
            onChange={(e) => onPatternChange(e.target.value as LayoutPattern)}
            className="px-2 py-1 text-sm border border-gray-300 rounded bg-white"
            disabled={!hasRoom}
          >
            <option value="spiral">Spiral</option>
            <option value="meander">Meander</option>
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer" title="Snap objects to grid">
          <input
            type="checkbox"
            checked={snapToGrid}
            onChange={(e) => onSnapToGridChange(e.target.checked)}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <Grid className="w-4 h-4 text-text-light" />
          <span className="text-sm text-text">Snap to Grid</span>
        </label>

        <Button
          variant="primary"
          size="md"
          onClick={onGenerate}
          disabled={!hasRoom || isGenerating}
          className="min-w-[120px]"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Generate
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
