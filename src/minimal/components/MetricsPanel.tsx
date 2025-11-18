import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardContent, CardTitle } from './ui/Card';
import { formatMeters, formatArea } from '../lib/utils';
import type { Metrics } from '../types';

interface MetricsPanelProps {
  metrics: Metrics | null;
  isVisible: boolean;
}

export function MetricsPanel({ metrics, isVisible }: MetricsPanelProps) {
  return (
    <AnimatePresence>
      {isVisible && metrics && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute top-20 right-6 w-72 z-10"
        >
          <Card>
            <CardHeader>
              <CardTitle>Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <MetricRow
                  label="Room Area"
                  value={formatArea(metrics.roomArea)}
                  icon="📐"
                />
                <MetricRow
                  label="Heated Area"
                  value={formatArea(metrics.heatedArea)}
                  icon="🔥"
                  highlight
                />
                <MetricRow
                  label="Loop Length"
                  value={formatMeters(metrics.loopLength)}
                  icon="📏"
                />
                <MetricRow
                  label="Pipe Density"
                  value={`${metrics.pipeDensity.toFixed(2)} m/m²`}
                  icon="📊"
                />
                <MetricRow
                  label="Coverage"
                  value={`${metrics.coverage.toFixed(1)}%`}
                  icon="✅"
                />
                {metrics.heatOutput && (
                  <MetricRow
                    label="Heat Output"
                    value={`${metrics.heatOutput.toFixed(0)} W`}
                    icon="💨"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface MetricRowProps {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}

function MetricRow({ label, value, icon, highlight }: MetricRowProps) {
  return (
    <div
      className={`flex items-center justify-between p-2 rounded ${
        highlight ? 'bg-accent/10' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-text-light">{label}</span>
      </div>
      <span className={`font-semibold ${highlight ? 'text-accent' : 'text-text'}`}>
        {value}
      </span>
    </div>
  );
}
