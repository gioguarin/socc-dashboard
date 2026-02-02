/**
 * Digest customization panel.
 * Lets users configure what goes into morning briefings.
 * Settings are stored in localStorage (UI only — actual briefing is generated externally).
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coffee, Clock, Star, ToggleLeft, ToggleRight } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const DIGEST_STORAGE_KEY = 'socc-digest-settings';

interface DigestSection {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface DigestConfig {
  sections: DigestSection[];
  prioritySources: string[];
  deliveryTime: string;
}

const DEFAULT_CONFIG: DigestConfig = {
  sections: [
    { id: 'weather', label: 'Weather', description: 'Local weather forecast', enabled: true },
    { id: 'threats', label: 'Threat Intel', description: 'Critical CVEs and CISA KEV alerts', enabled: true },
    { id: 'news', label: 'Industry News', description: 'Vendor news and security updates', enabled: true },
    { id: 'stocks', label: 'Stock Summary', description: 'Tracked vendor stock movements', enabled: true },
    { id: 'calendar', label: 'Calendar', description: 'Today\'s events and deadlines', enabled: true },
    { id: 'projects', label: 'Project Updates', description: 'Active project status', enabled: false },
  ],
  prioritySources: [],
  deliveryTime: '06:30',
};

const AVAILABLE_SOURCES = [
  'Akamai', 'Cloudflare', 'Fastly', 'Zscaler', 'CrowdStrike', 'Palo Alto', 'F5',
  'CISA', 'NVD', 'Hacker News',
];

interface DigestSettingsProps {
  open: boolean;
  onClose: () => void;
}

export function DigestSettings({ open, onClose }: DigestSettingsProps) {
  const [saved, setSaved] = useLocalStorage<DigestConfig>(DIGEST_STORAGE_KEY, DEFAULT_CONFIG);
  const [config, setConfig] = useState<DigestConfig>(saved);

  const toggleSection = useCallback((sectionId: string) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      ),
    }));
  }, []);

  const toggleSource = useCallback((source: string) => {
    setConfig((prev) => {
      const sources = prev.prioritySources.includes(source)
        ? prev.prioritySources.filter((s) => s !== source)
        : [...prev.prioritySources, source];
      return { ...prev, prioritySources: sources };
    });
  }, []);

  const setDeliveryTime = useCallback((time: string) => {
    setConfig((prev) => ({ ...prev, deliveryTime: time }));
  }, []);

  const handleSave = useCallback(() => {
    setSaved(config);
    onClose();
  }, [config, setSaved, onClose]);

  const handleReset = useCallback(() => {
    setConfig({ ...DEFAULT_CONFIG });
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div className="bg-socc-surface border border-socc-border/50 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-socc-border/30">
                <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-socc-cyan" />
                  Morning Briefing Settings
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-socc-hover transition-colors text-gray-400 hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-6">
                {/* Delivery Time */}
                <section>
                  <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    Delivery Time
                  </h3>
                  <input
                    type="time"
                    value={config.deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-socc-bg/80 border border-socc-border/50 rounded-lg
                      text-gray-300 focus:outline-none focus:border-socc-cyan/40 font-mono"
                  />
                  <p className="text-[10px] text-gray-600 mt-1.5">
                    Briefing will be generated and sent via Telegram at this time (ET).
                  </p>
                </section>

                {/* Sections Toggle */}
                <section>
                  <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3 flex items-center gap-1.5">
                    <ToggleLeft className="w-3 h-3" />
                    Briefing Sections
                  </h3>
                  <div className="space-y-2">
                    {config.sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => toggleSection(section.id)}
                        className={`
                          flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-left
                          border transition-all duration-150
                          ${section.enabled
                            ? 'bg-socc-cyan/5 border-socc-cyan/20'
                            : 'bg-socc-bg/30 border-socc-border/20 opacity-60'
                          }
                        `}
                      >
                        <div>
                          <div className="text-xs font-medium text-gray-200">{section.label}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{section.description}</div>
                        </div>
                        {section.enabled ? (
                          <ToggleRight className="w-5 h-5 text-socc-cyan shrink-0" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Priority Sources */}
                <section>
                  <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3 flex items-center gap-1.5">
                    <Star className="w-3 h-3" />
                    Priority Sources
                  </h3>
                  <p className="text-[10px] text-gray-600 mb-2">
                    Highlighted sources will appear first in the briefing.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_SOURCES.map((source) => {
                      const active = config.prioritySources.includes(source);
                      return (
                        <button
                          key={source}
                          onClick={() => toggleSource(source)}
                          className={`
                            px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all
                            ${active
                              ? 'bg-socc-cyan/10 text-socc-cyan border-socc-cyan/30'
                              : 'bg-socc-bg/50 text-gray-500 border-socc-border/30 hover:text-gray-400'
                            }
                          `}
                        >
                          {source}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-socc-border/20">
                  <button
                    onClick={handleReset}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Reset to defaults
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onClose}
                      className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-1.5 rounded-lg text-xs font-medium bg-socc-cyan/10 text-socc-cyan border border-socc-cyan/30 hover:bg-socc-cyan/20 transition-colors"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
