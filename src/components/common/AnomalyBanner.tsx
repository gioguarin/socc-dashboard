/**
 * Anomaly alert banner — shown at the top of panels when
 * unusual volume spikes are detected by the backend.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import type { AnomalyInfo } from '../../hooks/useApiWithAnomaly';

interface AnomalyBannerProps {
  anomaly: AnomalyInfo | null;
}

export function AnomalyBanner({ anomaly }: AnomalyBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!anomaly?.detected || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="border-b border-amber-500/20"
      >
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-2 border-l-amber-400">
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium">{anomaly.message}</span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded hover:bg-amber-500/10 text-amber-500/60 hover:text-amber-400 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
