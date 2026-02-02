import { useState, useMemo } from 'react';
import { Plus, StickyNote, Search } from 'lucide-react';
import type { ShiftNote } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NoteEditor } from './NoteEditor';
import { NoteCard } from './NoteCard';

function generateId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Full-page shift notes panel with create/edit/delete and Markdown rendering. */
export function ShiftNotes() {
  const [notes, setNotes] = useLocalStorage<ShiftNote[]>('socc-shift-notes', []);
  const [editing, setEditing] = useState<ShiftNote | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const sorted = [...notes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (!q) return sorted;
    return sorted.filter(
      (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q),
    );
  }, [notes, search]);

  const handleSave = (title: string, content: string) => {
    if (editing) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editing.id
            ? { ...n, title, content, updatedAt: new Date().toISOString() }
            : n,
        ),
      );
      setEditing(null);
    } else {
      const now = new Date().toISOString();
      setNotes((prev) => [...prev, { id: generateId(), title, content, createdAt: now, updatedAt: now }]);
      setCreating(false);
    }
  };

  const handleDelete = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-socc-border/30">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-socc-cyan" />
          <h2 className="text-sm font-semibold text-gray-200">Shift Notes</h2>
          <span className="text-[10px] text-gray-500 bg-socc-surface/60 px-1.5 py-0.5 rounded-full">
            {notes.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="pl-8 pr-3 py-1.5 text-xs bg-socc-card/60 border border-socc-border/40 rounded-md text-gray-300 placeholder-gray-500 focus:border-socc-cyan/50 focus:outline-none w-44"
            />
          </div>
          <button
            onClick={() => { setCreating(true); setEditing(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-socc-cyan/15 text-socc-cyan hover:bg-socc-cyan/25 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Note
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-3 scrollbar-thin">
        {/* Editor (create or edit) */}
        {(creating || editing) && (
          <NoteEditor
            note={editing}
            onSave={handleSave}
            onCancel={() => { setCreating(false); setEditing(null); }}
          />
        )}

        {/* Note list */}
        {filtered.length === 0 && !creating && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <StickyNote className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">{search ? 'No matching notes' : 'No shift notes yet'}</p>
            <p className="text-xs text-gray-600 mt-1">
              {search ? 'Try a different search term' : 'Click "New Note" to start documenting your shift'}
            </p>
          </div>
        )}
        {filtered.map((note) => (
          <NoteCard key={note.id} note={note} onEdit={setEditing} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
