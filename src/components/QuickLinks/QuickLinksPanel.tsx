import { useState } from 'react';
import { Link2, Plus, Trash2, GripVertical, ExternalLink, X, Save } from 'lucide-react';
import type { QuickLink } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const DEFAULT_LINKS: QuickLink[] = [
  { id: 'ql-1', name: 'CISA KEV', url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog', icon: '🛡️' },
  { id: 'ql-2', name: 'NVD', url: 'https://nvd.nist.gov/', icon: '📋' },
  { id: 'ql-3', name: 'Akamai Status', url: 'https://www.akamaistatus.com/', icon: '☁️' },
  { id: 'ql-4', name: 'VirusTotal', url: 'https://www.virustotal.com/', icon: '🔬' },
  { id: 'ql-5', name: 'Shodan', url: 'https://www.shodan.io/', icon: '🔍' },
  { id: 'ql-6', name: 'MITRE ATT&CK', url: 'https://attack.mitre.org/', icon: '⚔️' },
  { id: 'ql-7', name: 'GreyNoise', url: 'https://viz.greynoise.io/', icon: '📡' },
  { id: 'ql-8', name: 'AbuseIPDB', url: 'https://www.abuseipdb.com/', icon: '🚫' },
  { id: 'ql-9', name: 'URLhaus', url: 'https://urlhaus.abuse.ch/', icon: '🔗' },
  { id: 'ql-10', name: 'Have I Been Pwned', url: 'https://haveibeenpwned.com/', icon: '🔐' },
];

/** Configurable quick-links widget for frequently-used security tools. */
export function QuickLinksPanel({ compact = false }: { compact?: boolean }) {
  const [links, setLinks] = useLocalStorage<QuickLink[]>('socc-quick-links', DEFAULT_LINKS);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newIcon, setNewIcon] = useState('🔗');
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const addLink = () => {
    if (!newName.trim() || !newUrl.trim()) return;
    const url = newUrl.startsWith('http') ? newUrl.trim() : `https://${newUrl.trim()}`;
    setLinks((prev) => [...prev, { id: `ql-${Date.now()}`, name: newName.trim(), url, icon: newIcon || '🔗' }]);
    setNewName('');
    setNewUrl('');
    setNewIcon('🔗');
    setAdding(false);
  };

  const removeLink = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setLinks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  const displayLinks = compact ? links.slice(0, 8) : links;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-socc-border/30">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-socc-cyan" />
          <h3 className="text-xs font-semibold text-gray-200">Quick Links</h3>
        </div>
        <div className="flex items-center gap-1">
          {!compact && (
            <button
              onClick={() => setEditing((v) => !v)}
              className={`px-2 py-0.5 rounded-md text-[10px] transition-colors ${editing ? 'bg-socc-cyan/15 text-socc-cyan' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {editing ? 'Done' : 'Edit'}
            </button>
          )}
          {!compact && (
            <button
              onClick={() => setAdding((v) => !v)}
              className="p-1 rounded-md text-gray-500 hover:text-socc-cyan hover:bg-socc-cyan/10 transition-colors"
              title="Add link"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 scrollbar-thin">
        {/* Add form */}
        {adding && (
          <div className="flex flex-col gap-2 p-3 mb-3 bg-socc-surface/60 rounded-lg border border-socc-border/40">
            <div className="flex gap-2">
              <input
                type="text"
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                className="w-10 text-center bg-socc-card/60 border border-socc-border/40 rounded-md px-1 py-1.5 text-sm focus:border-socc-cyan/50 focus:outline-none"
                title="Emoji icon"
              />
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Link name"
                className="flex-1 bg-socc-card/60 border border-socc-border/40 rounded-md px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:border-socc-cyan/50 focus:outline-none"
              />
            </div>
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://..."
              className="bg-socc-card/60 border border-socc-border/40 rounded-md px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:border-socc-cyan/50 focus:outline-none"
            />
            <div className="flex justify-end gap-1.5">
              <button onClick={() => setAdding(false)} className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-400 hover:text-gray-200">
                <X className="w-3 h-3" />Cancel
              </button>
              <button onClick={addLink} disabled={!newName.trim() || !newUrl.trim()} className="flex items-center gap-1 px-2 py-1 text-[10px] bg-socc-cyan/15 text-socc-cyan rounded-md disabled:opacity-40">
                <Save className="w-3 h-3" />Add
              </button>
            </div>
          </div>
        )}

        {/* Link grid */}
        <div className={compact ? 'grid grid-cols-2 gap-1.5' : 'space-y-1'}>
          {displayLinks.map((link, idx) => (
            <div
              key={link.id}
              draggable={editing}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`group flex items-center gap-2 rounded-md transition-colors ${
                editing
                  ? 'px-2 py-1.5 bg-socc-card/40 border border-socc-border/30 cursor-grab active:cursor-grabbing'
                  : compact
                  ? 'px-2.5 py-2 bg-socc-card/40 border border-socc-border/20 hover:border-socc-border/40 hover:bg-socc-hover/30'
                  : 'px-3 py-2 hover:bg-socc-hover/30'
              } ${dragIdx === idx ? 'opacity-50' : ''}`}
            >
              {editing && <GripVertical className="w-3 h-3 text-gray-600 shrink-0" />}
              <span className="text-sm shrink-0">{link.icon}</span>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-xs text-gray-300 hover:text-socc-cyan transition-colors truncate"
                onClick={(e) => editing && e.preventDefault()}
              >
                {link.name}
              </a>
              {!editing && !compact && (
                <ExternalLink className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              )}
              {editing && (
                <button onClick={() => removeLink(link.id)} className="p-0.5 text-gray-600 hover:text-socc-red transition-colors shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {compact && links.length > 8 && (
          <p className="text-[9px] text-gray-600 text-center mt-2">+{links.length - 8} more</p>
        )}
      </div>
    </div>
  );
}
