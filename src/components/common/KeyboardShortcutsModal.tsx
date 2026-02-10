import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { KEYBOARD_SHORTCUTS } from '../../utils/constants';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const MODAL_EASE = [0.16, 1, 0.3, 1] as const;

export default function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: MODAL_EASE }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-socc-surface border border-socc-border/40 rounded-2xl shadow-[var(--socc-modal-shadow)] w-full max-w-sm overflow-hidden">
              {/* Gradient accent */}
              <div className="h-[2px] bg-gradient-to-r from-transparent via-socc-cyan/50 to-transparent" />

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-socc-border/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-socc-cyan/10 flex items-center justify-center">
                    <Keyboard className="w-3.5 h-3.5 text-socc-cyan" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-200">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-socc-hover/80 text-gray-500 hover:text-gray-300 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Shortcuts list */}
              <div className="p-5 space-y-2">
                {KEYBOARD_SHORTCUTS.map(({ key, description }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{description}</span>
                    <kbd className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 text-[11px] font-mono font-semibold text-gray-300 bg-socc-bg/80 border border-socc-border/40 rounded-md shadow-[0_1px_0_0_rgba(30,41,59,0.8)]">
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-socc-border/20 text-[10px] text-gray-600">
                Press <kbd className="px-1.5 py-0.5 bg-socc-bg/80 border border-socc-border/40 rounded-md text-gray-400 shadow-[0_1px_0_0_rgba(30,41,59,0.8)]">?</kbd> anytime to toggle this panel
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
