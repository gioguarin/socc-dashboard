import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { KEYBOARD_SHORTCUTS } from '../../utils/constants';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-socc-surface border border-socc-border/50 rounded-xl shadow-2xl w-full max-w-sm">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-socc-border/30">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-socc-cyan" />
                  <h2 className="text-sm font-semibold text-gray-200">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-socc-hover text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Shortcuts list */}
              <div className="p-5 space-y-2">
                {KEYBOARD_SHORTCUTS.map(({ key, description }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{description}</span>
                    <kbd className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 text-[11px] font-mono font-medium text-gray-300 bg-socc-card border border-socc-border/50 rounded">
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-socc-border/20 text-[10px] text-gray-600">
                Press <kbd className="px-1 py-0.5 bg-socc-card border border-socc-border/40 rounded text-gray-400">?</kbd> anytime to toggle this panel
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
