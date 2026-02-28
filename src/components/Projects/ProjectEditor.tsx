import { useState, useEffect, useRef } from 'react';
import { Save, X } from 'lucide-react';
import type { TodoItem } from '../../types';

interface TodoEditorProps {
  todo: TodoItem | null;
  onSave: (title: string, description: string) => void;
  onCancel: () => void;
}

/** Inline editor for creating / editing a todo item. */
export function TodoEditor({ todo, onSave, onCancel }: TodoEditorProps) {
  const [title, setTitle] = useState(todo?.title ?? '');
  const [description, setDescription] = useState(todo?.description ?? '');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title.trim(), description.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 bg-socc-surface/60 rounded-lg border border-socc-border/40">
      <input
        ref={titleRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done? *"
        className="bg-socc-card/60 border border-socc-border/40 rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-socc-cyan/50 focus:outline-none"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className="bg-socc-card/60 border border-socc-border/40 rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-socc-cyan/50 focus:outline-none resize-y"
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
          disabled={!title.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-socc-cyan/15 text-socc-cyan hover:bg-socc-cyan/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Save className="w-3.5 h-3.5" />
          {todo ? 'Update' : 'Add'}
        </button>
      </div>
    </form>
  );
}
