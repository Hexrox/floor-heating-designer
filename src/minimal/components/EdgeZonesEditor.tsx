import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardContent, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { X, Check, Info } from 'lucide-react';
import type { EdgeZoneConfig, WallType } from '../types';
import { getEdgeZoneDepth } from '../types';

interface EdgeZonesEditorProps {
  currentConfig: EdgeZoneConfig;
  onApply: (config: EdgeZoneConfig) => void;
  onClose: () => void;
}

export function EdgeZonesEditor({
  currentConfig,
  onApply,
  onClose,
}: EdgeZonesEditorProps) {
  const [config, setConfig] = useState<EdgeZoneConfig>(currentConfig);

  const handleApply = () => {
    onApply(config);
    onClose();
  };

  const wallOptions: Array<{ value: WallType; label: string; description: string }> = [
    { value: 'window', label: '🪟 Window', description: '100cm edge zone' },
    { value: 'external-wall', label: '🧱 External Wall', description: '60cm edge zone' },
    { value: 'door', label: '🚪 Door', description: '70cm edge zone' },
    { value: 'internal-wall', label: '🏠 Internal Wall', description: '30cm edge zone' },
  ];

  const WallSelector = ({ side, label }: { side: keyof EdgeZoneConfig; label: string }) => (
    <div>
      <label className="block text-sm font-medium text-text mb-2">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        {wallOptions.map((option) => {
          const isSelected = config[side] === option.value;
          const depth = getEdgeZoneDepth(option.value);

          return (
            <button
              key={option.value}
              onClick={() => setConfig((prev) => ({ ...prev, [side]: option.value }))}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">{option.label}</div>
              <div className="text-xs text-text-light mt-1">
                {depth * 100}cm zone
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

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
          className="max-h-[90vh] overflow-y-auto"
        >
          <Card className="w-[600px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Configure Edge Zones</CardTitle>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">About Edge Zones</p>
                  <p className="text-blue-700">
                    Edge zones have closer pipe spacing (10cm) for better heat distribution.
                    Different wall types require different zone depths based on heat loss.
                  </p>
                </div>
              </div>

              {/* Wall selectors */}
              <WallSelector side="top" label="Top Wall" />
              <WallSelector side="right" label="Right Wall" />
              <WallSelector side="bottom" label="Bottom Wall" />
              <WallSelector side="left" label="Left Wall" />

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleApply}>
                  <Check className="w-4 h-4" />
                  Apply Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
