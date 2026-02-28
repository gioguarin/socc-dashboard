import { Pencil, Trash2, Circle, Loader, CheckCircle2 } from 'lucide-react';
import type { TodoItem, TodoStatus } from '../../types';

interface TodoCardProps {
  todo: TodoItem;
  onEdit: (todo: TodoItem) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TodoStatus) => void;
}

const STATUS_CONFIG: Record<TodoStatus, { icon: typeof Circle; color: string; bg: string; label: string }> = {
  todo: { icon: Circle, color: 'text-gray-400', bg: 'bg-gray-500/15 border-gray-500/30', label: 'To Do' },
  in_progress: { icon: Loader, color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30', label: 'In Progress' },
  done: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30', label: 'Done' },
};

const NEXT_STATUS: Record<TodoStatus, TodoStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
};

/** Single todo card with status cycling and inline actions. */
export function TodoCard({ todo, onEdit, onDelete, onStatusChange }: TodoCardProps) {
  const cfg = STATUS_CONFIG[todo.status];
  const Icon = cfg.icon;

  return (
    <div className="group bg-socc-card/60 border border-socc-border/40 rounded-lg p-4 hover:border-socc-border/60 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title + status badge */}
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className={`text-sm font-semibold truncate ${todo.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{todo.title}</h3>
            <button
              onClick={() => onStatusChange(todo.id, NEXT_STATUS[todo.status])}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${cfg.bg} ${cfg.color} hover:opacity-80`}
              title={`Click to change to ${NEXT_STATUS[todo.status].replace('_', ' ')}`}
            >
              <Icon className="w-3 h-3" />
              {cfg.label}
            </button>
          </div>

          {/* Description */}
          {todo.description && (
            <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{todo.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(todo)}
            className="p-1.5 rounded-md text-gray-500 hover:text-socc-cyan hover:bg-socc-cyan/10 transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className="p-1.5 rounded-md text-gray-500 hover:text-socc-red hover:bg-socc-red/10 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
