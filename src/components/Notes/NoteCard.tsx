import { Pencil, Trash2, Clock } from 'lucide-react';
import type { ShiftNote } from '../../types';
import { renderMarkdown } from '../../utils/markdown';
import { timeAgo } from '../../utils/formatters';

interface NoteCardProps {
  note: ShiftNote;
  onEdit: (note: ShiftNote) => void;
  onDelete: (id: string) => void;
}

/** Displays a single shift note with rendered Markdown content. */
export function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  return (
    <div className="group bg-socc-card/60 border border-socc-border/40 rounded-lg p-4 hover:border-socc-border/60 transition-colors">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          {note.title && (
            <h3 className="text-sm font-semibold text-gray-200 truncate">{note.title}</h3>
          )}
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
            <Clock className="w-3 h-3" />
            <span>{timeAgo(note.createdAt)}</span>
            {note.updatedAt !== note.createdAt && (
              <span className="text-gray-600">· edited {timeAgo(note.updatedAt)}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(note)}
            className="p-1.5 rounded-md text-gray-500 hover:text-socc-cyan hover:bg-socc-cyan/10 transition-colors"
            title="Edit note"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-1.5 rounded-md text-gray-500 hover:text-socc-red hover:bg-socc-red/10 transition-colors"
            title="Delete note"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Rendered markdown body */}
      <div
        className="shift-note-body text-sm text-gray-300 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
      />
    </div>
  );
}
