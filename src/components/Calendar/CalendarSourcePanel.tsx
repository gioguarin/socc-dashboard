/**
 * Panel for managing calendar sources: add ICS URLs, import .ics files, toggle visibility.
 */

import { useState, useRef, useCallback } from 'react';
import { X, Link2, Upload, Trash2, Eye, EyeOff, Globe, FileText, Layers } from 'lucide-react';
import type { CalendarSource } from '../../types';

interface CalendarSourcePanelProps {
  sources: CalendarSource[];
  onAddSource: (name: string, url: string | null, type: CalendarSource['type']) => CalendarSource;
  onRemoveSource: (id: string) => void;
  onToggleSource: (id: string) => void;
  onImportFile: (file: File) => Promise<number>;
  onImportIcsText: (sourceId: string, icsText: string, color: string) => number;
  onClose: () => void;
}

export function CalendarSourcePanel({
  sources,
  onAddSource,
  onRemoveSource,
  onToggleSource,
  onImportFile,
  onClose,
}: CalendarSourcePanelProps) {
  const [mode, setMode] = useState<'list' | 'url' | 'file'>('list');
  const [urlName, setUrlName] = useState('');
  const [urlValue, setUrlValue] = useState('');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddUrl = useCallback(() => {
    if (!urlName.trim() || !urlValue.trim()) return;
    onAddSource(urlName.trim(), urlValue.trim(), 'ics-url');
    setUrlName('');
    setUrlValue('');
    setMessage('Calendar added. Events will sync when the backend proxy is available.');
    setTimeout(() => setMessage(''), 4000);
    setMode('list');
  }, [urlName, urlValue, onAddSource]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    let total = 0;
    for (const file of Array.from(files)) {
      if (file.name.endsWith('.ics')) {
        const count = await onImportFile(file);
        total += count;
      }
    }
    setMessage(`Imported ${total} event${total !== 1 ? 's' : ''}`);
    setTimeout(() => setMessage(''), 4000);
    setMode('list');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [onImportFile]);

  return (
    <div className="border-b border-socc-border/20 bg-socc-surface/40 shrink-0">
      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-socc-cyan" />
            <span className="text-xs font-semibold text-gray-200">Calendar Sources</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-socc-hover/60 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action buttons */}
        {mode === 'list' && (
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setMode('url')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium
                text-gray-400 hover:text-socc-cyan bg-socc-bg/60 border border-socc-border/30
                hover:border-socc-cyan/30 transition-all"
            >
              <Link2 className="w-3 h-3" />
              Add ICS URL
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium
                text-gray-400 hover:text-socc-cyan bg-socc-bg/60 border border-socc-border/30
                hover:border-socc-cyan/30 transition-all"
            >
              <Upload className="w-3 h-3" />
              Import .ics
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".ics"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {/* Add URL form */}
        {mode === 'url' && (
          <div className="space-y-2 mb-3">
            <p className="text-[10px] text-gray-500">
              Add an ICS/iCal URL from Outlook, Google Calendar, or any calendar app.
            </p>
            <input
              type="text"
              value={urlName}
              onChange={(e) => setUrlName(e.target.value)}
              placeholder="Calendar name (e.g. Work Calendar)"
              className="w-full bg-socc-bg/80 border border-socc-border/40 rounded-md px-3 py-1.5 text-xs
                text-gray-200 placeholder-gray-600 focus:border-socc-cyan/50 focus:outline-none"
            />
            <input
              type="url"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://outlook.office365.com/owa/calendar/.../calendar.ics"
              className="w-full bg-socc-bg/80 border border-socc-border/40 rounded-md px-3 py-1.5 text-xs
                text-gray-200 placeholder-gray-600 focus:border-socc-cyan/50 focus:outline-none font-mono"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setMode('list')}
                className="px-3 py-1.5 text-[11px] text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUrl}
                disabled={!urlName.trim() || !urlValue.trim()}
                className="px-4 py-1.5 rounded-lg text-[11px] font-semibold bg-socc-cyan/15 text-socc-cyan
                  border border-socc-cyan/30 hover:bg-socc-cyan/25 disabled:opacity-40 transition-all"
              >
                Add Calendar
              </button>
            </div>
            <div className="text-[10px] text-gray-600 bg-socc-bg/40 rounded-md p-2 border border-socc-border/20">
              <p className="font-medium text-gray-500 mb-1">How to get your calendar URL:</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li><strong>Outlook:</strong> Settings &rarr; Calendar &rarr; Shared calendars &rarr; Publish a calendar &rarr; ICS link</li>
                <li><strong>Google:</strong> Settings &rarr; Calendar settings &rarr; Secret address in iCal format</li>
                <li><strong>Apple:</strong> Calendar app &rarr; Right-click calendar &rarr; Share Calendar &rarr; Copy Link</li>
              </ul>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className="text-[11px] text-socc-cyan bg-socc-cyan/5 border border-socc-cyan/20 rounded-md px-3 py-2 mb-3">
            {message}
          </div>
        )}

        {/* Source list */}
        {sources.length > 0 && (
          <div className="space-y-1">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-socc-card/30 border border-socc-border/20"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: source.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {source.type === 'ics-url' ? (
                      <Globe className="w-3 h-3 text-gray-500 shrink-0" />
                    ) : (
                      <FileText className="w-3 h-3 text-gray-500 shrink-0" />
                    )}
                    <span className="text-xs text-gray-200 font-medium truncate">{source.name}</span>
                  </div>
                  {source.lastSynced && (
                    <p className="text-[9px] text-gray-600 mt-0.5">
                      Synced {new Date(source.lastSynced).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onToggleSource(source.id)}
                  className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                  title={source.enabled ? 'Hide' : 'Show'}
                >
                  {source.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => onRemoveSource(source.id)}
                  className="p-1 text-gray-600 hover:text-red-400 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {sources.length === 0 && mode === 'list' && (
          <p className="text-[11px] text-gray-600 text-center py-2">
            No calendar sources added yet. Add an ICS URL or import a .ics file to get started.
          </p>
        )}
      </div>
    </div>
  );
}
