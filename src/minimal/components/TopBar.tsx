import React from 'react';
import { Undo2, Redo2, Download, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';

interface TopBarProps {
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onClearAll: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function TopBar({ onUndo, onRedo, onExport, onClearAll, canUndo, canRedo }: TopBarProps) {
  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-text flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          Floor Heating Designer
        </h1>
        <span className="text-sm text-text-light">Minimal Edition</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          title="Clear All (Ctrl+C)"
        >
          <Trash2 className="w-4 h-4" />
          Clear All
        </Button>

        <Button variant="primary" size="sm" onClick={onExport}>
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
