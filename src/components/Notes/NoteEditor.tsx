import { useState, useEffect, useRef } from 'react';
import { Save, X } from 'lucide-react';
import type { ShiftNote } from '../../types';

interface NoteEditorProps {
  note: ShiftNote | null;
  onSave: (title: string, content: string) => void;
  onCancel: () => void;
}

/** Inline editor for creating / editing a shift note. */
export function NoteEditor({ note, onSave, onCancel }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSave(title.trim(), content.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 bg-socc-surface/60 rounded-lg border border-socc-border/40">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title (optional)"
        className="bg-socc-card/60 border border-socc-border/40 rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-socc-cyan/50 focus:outline-none"
      />
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your note… (Markdown supported)"
        rows={8}
        className="bg-socc-card/60 border border-socc-border/40 rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-socc-cyan/50 focus:outline-none resize-y font-mono leading-relaxed"
      />
      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-gray-400 hover:text-gray-200 hover:bg-socc-hover transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={!content.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-socc-cyan/15 text-socc-cyan hover:bg-socc-cyan/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Save className="w-3.5 h-3.5" />
          {note ? 'Update' : 'Save'}
        </button>
      </div>
    </form>
  );
}
