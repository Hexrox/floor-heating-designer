import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardContent, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { X, Check } from 'lucide-react';
import { CONSTANTS } from '../types';

interface RoomDimensionEditorProps {
  currentWidth: number;
  currentHeight: number;
  onApply: (width: number, height: number) => void;
  onClose: () => void;
}

export function RoomDimensionEditor({
  currentWidth,
  currentHeight,
  onApply,
  onClose,
}: RoomDimensionEditorProps) {
  const [width, setWidth] = useState(currentWidth.toFixed(1));
  const [height, setHeight] = useState(currentHeight.toFixed(1));
  const [error, setError] = useState('');

  const handleApply = () => {
    const w = parseFloat(width);
    const h = parseFloat(height);

    if (isNaN(w) || isNaN(h)) {
      setError('Please enter valid numbers');
      return;
    }

    if (w < CONSTANTS.MIN_ROOM_SIZE || w > CONSTANTS.MAX_ROOM_SIZE) {
      setError(`Width must be between ${CONSTANTS.MIN_ROOM_SIZE}m and ${CONSTANTS.MAX_ROOM_SIZE}m`);
      return;
    }

    if (h < CONSTANTS.MIN_ROOM_SIZE || h > CONSTANTS.MAX_ROOM_SIZE) {
      setError(`Height must be between ${CONSTANTS.MIN_ROOM_SIZE}m and ${CONSTANTS.MAX_ROOM_SIZE}m`);
      return;
    }

    onApply(w, h);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="w-96">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Room Dimensions</CardTitle>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Width (meters)
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => {
                    setWidth(e.target.value);
                    setError('');
                  }}
                  min={CONSTANTS.MIN_ROOM_SIZE}
                  max={CONSTANTS.MAX_ROOM_SIZE}
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Height (meters)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => {
                    setHeight(e.target.value);
                    setError('');
                  }}
                  min={CONSTANTS.MIN_ROOM_SIZE}
                  max={CONSTANTS.MAX_ROOM_SIZE}
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-danger bg-danger/10 px-3 py-2 rounded"
                >
                  {error}
                </motion.div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleApply}>
                  <Check className="w-4 h-4" />
                  Apply
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
