import { useState, useMemo } from 'react';
import { Plus, ListChecks } from 'lucide-react';
import type { TodoItem, TodoStatus } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { TodoCard } from './ProjectCard';
import { TodoEditor } from './ProjectEditor';

function generateId(): string {
  return `todo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_TODOS: TodoItem[] = [
  {
    id: 'todo-default-1',
    title: 'Kanban todo board',
    description: 'Replace Projects tab with a drag-free Kanban board. Three columns: To Do, In Progress, Done. Status cycles on click. Data stored in localStorage.',
    status: 'done',
    createdAt: '2026-02-25T12:00:00.000Z',
    updatedAt: '2026-02-27T10:00:00.000Z',
  },
  {
    id: 'todo-default-2',
    title: 'Status bar with feed timestamps',
    description: 'Show per-feed item counts, relative timestamps that persist across refreshes, and a build-time deploy timestamp next to SOCC v1.0.',
    status: 'done',
    createdAt: '2026-02-26T12:00:00.000Z',
    updatedAt: '2026-02-27T14:00:00.000Z',
  },
  {
    id: 'todo-default-3',
    title: 'Build & deploy script',
    description: 'Single deploy.sh that builds the React frontend, copies dist to the Spin project, builds the WASM API, and deploys to Fermyon Cloud.',
    status: 'done',
    createdAt: '2026-02-27T09:00:00.000Z',
    updatedAt: '2026-02-27T10:30:00.000Z',
  },
  {
    id: 'todo-default-4',
    title: 'API pagination',
    description: 'Add limit/offset query params to GET /api/threats, /api/news, /api/stocks, and /api/briefings. Return total count in response for frontend paging.',
    status: 'in_progress',
    createdAt: '2026-02-27T12:00:00.000Z',
    updatedAt: '2026-02-27T12:00:00.000Z',
  },
  {
    id: 'todo-default-5',
    title: 'Transactional sync',
    description: 'Wrap the DELETE+INSERT in POST /api/sync with a transaction so partial failures don\'t leave empty tables.',
    status: 'in_progress',
    createdAt: '2026-02-27T12:00:00.000Z',
    updatedAt: '2026-02-27T12:00:00.000Z',
  },
  {
    id: 'todo-default-6',
    title: 'Rate limiting on Spin API',
    description: 'Add basic rate limiting to the Spin API endpoints to prevent abuse. Evaluate Fermyon Cloud options or implement a simple in-memory counter.',
    status: 'todo',
    createdAt: '2026-02-27T12:00:00.000Z',
    updatedAt: '2026-02-27T12:00:00.000Z',
  },
  {
    id: 'todo-default-7',
    title: 'Multi-user auth migration',
    description: 'Migrate personal data (todos, notes, preferences, quick links) from localStorage to server-side per-user storage. Add auth tables and login endpoints.',
    status: 'todo',
    createdAt: '2026-02-27T12:00:00.000Z',
    updatedAt: '2026-02-27T12:00:00.000Z',
  },
  {
    id: 'todo-default-8',
    title: 'Stock detail fields',
    description: 'Populate null placeholder fields (high52w, low52w, marketCap, peRatio, etc.) with real data from the stock data source.',
    status: 'todo',
    createdAt: '2026-02-27T12:00:00.000Z',
    updatedAt: '2026-02-27T12:00:00.000Z',
  },
];

// Bump this when DEFAULT_TODOS changes so returning visitors get the updated list
const TODOS_VERSION = 2;
const TODOS_VERSION_KEY = 'socc-todos-version';

const STATUS_ORDER: TodoStatus[] = ['todo', 'in_progress', 'done'];
const STATUS_LABELS: Record<TodoStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};
const STATUS_COLORS: Record<TodoStatus, string> = {
  todo: 'text-gray-400',
  in_progress: 'text-amber-400',
  done: 'text-green-400',
};

/** Full-page Kanban todo board. */
export function TodoBoard() {
  // Reset to new defaults when version bumps (build-in-public updates)
  const storedVersion = Number(localStorage.getItem(TODOS_VERSION_KEY) || '0');
  if (storedVersion < TODOS_VERSION) {
    localStorage.setItem(TODOS_VERSION_KEY, String(TODOS_VERSION));
    localStorage.removeItem('socc-todos');
  }
  const [todos, setTodos] = useLocalStorage<TodoItem[]>('socc-todos', DEFAULT_TODOS);
  const [editing, setEditing] = useState<TodoItem | null>(null);
  const [creating, setCreating] = useState(false);

  const grouped = useMemo(() => {
    const groups: Record<TodoStatus, TodoItem[]> = { todo: [], in_progress: [], done: [] };
    for (const t of todos) {
      groups[t.status].push(t);
    }
    return groups;
  }, [todos]);

  const handleSave = (title: string, description: string) => {
    const now = new Date().toISOString();
    if (editing) {
      setTodos((prev) =>
        prev.map((t) =>
          t.id === editing.id ? { ...t, title, description, updatedAt: now } : t,
        ),
      );
      setEditing(null);
    } else {
      setTodos((prev) => [
        ...prev,
        { id: generateId(), title, description, status: 'todo', createdAt: now, updatedAt: now },
      ]);
      setCreating(false);
    }
  };

  const handleDelete = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const handleStatusChange = (id: string, status: TodoStatus) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t)),
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-socc-border/30">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-socc-cyan" />
          <h2 className="text-sm font-semibold text-gray-200">Todo</h2>
          <span className="text-[10px] text-gray-500 bg-socc-surface/60 px-1.5 py-0.5 rounded-full">
            {todos.length}
          </span>
        </div>
        <button
          onClick={() => { setCreating(true); setEditing(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-socc-cyan/15 text-socc-cyan hover:bg-socc-cyan/25 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Todo
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 scrollbar-thin">
        {/* Editor */}
        {(creating || editing) && (
          <div className="mb-4">
            <TodoEditor
              todo={editing}
              onSave={handleSave}
              onCancel={() => { setCreating(false); setEditing(null); }}
            />
          </div>
        )}

        {/* Kanban columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUS_ORDER.map((status) => (
            <div key={status} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-1 mb-1">
                <span className={`text-xs font-semibold ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
                <span className="text-[10px] text-gray-600">{grouped[status].length}</span>
              </div>
              {grouped[status].map((t) => (
                <TodoCard key={t.id} todo={t} onEdit={setEditing} onDelete={handleDelete} onStatusChange={handleStatusChange} />
              ))}
              {grouped[status].length === 0 && (
                <div className="text-center text-[10px] text-gray-600 py-8 border border-dashed border-socc-border/30 rounded-lg">
                  No items
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
