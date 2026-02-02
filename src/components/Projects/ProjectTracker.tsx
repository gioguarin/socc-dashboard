import { useState, useMemo } from 'react';
import { Plus, FolderKanban } from 'lucide-react';
import type { Project, ProjectStatus } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ProjectCard } from './ProjectCard';
import { ProjectEditor } from './ProjectEditor';

function generateId(): string {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj-default-1',
    name: 'Laser Rat Labs',
    status: 'active',
    description: 'Hardware hacking and RF experimentation lab projects.',
    deadline: null,
    createdAt: '2026-01-15T12:00:00.000Z',
    updatedAt: '2026-01-15T12:00:00.000Z',
  },
  {
    id: 'proj-default-2',
    name: 'DEF CON 561',
    status: 'active',
    description: 'South Florida DEF CON group — meetups, talks, and CTF prep.',
    deadline: null,
    createdAt: '2026-01-15T12:00:00.000Z',
    updatedAt: '2026-01-15T12:00:00.000Z',
  },
  {
    id: 'proj-default-3',
    name: 'Science Fair',
    status: 'active',
    description: 'Annual science fair project planning and coordination.',
    deadline: null,
    createdAt: '2026-01-15T12:00:00.000Z',
    updatedAt: '2026-01-15T12:00:00.000Z',
  },
];

const STATUS_ORDER: ProjectStatus[] = ['active', 'paused', 'completed'];
const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: '🟢 Active',
  paused: '⏸️ Paused',
  completed: '✅ Completed',
};

/** Full-page project tracker with kanban-style status grouping. */
export function ProjectTracker() {
  const [projects, setProjects] = useLocalStorage<Project[]>('socc-projects', DEFAULT_PROJECTS);
  const [editing, setEditing] = useState<Project | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const grouped = useMemo(() => {
    const groups: Record<ProjectStatus, Project[]> = { active: [], paused: [], completed: [] };
    for (const p of projects) {
      groups[p.status].push(p);
    }
    return groups;
  }, [projects]);

  const handleSave = (name: string, description: string, status: ProjectStatus, deadline: string | null) => {
    const now = new Date().toISOString();
    if (editing) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === editing.id ? { ...p, name, description, status, deadline, updatedAt: now } : p,
        ),
      );
      setEditing(null);
    } else {
      setProjects((prev) => [
        ...prev,
        { id: generateId(), name, description, status, deadline, createdAt: now, updatedAt: now },
      ]);
      setCreating(false);
    }
  };

  const handleDelete = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleStatusChange = (id: string, status: ProjectStatus) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p)),
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-socc-border/30">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-socc-cyan" />
          <h2 className="text-sm font-semibold text-gray-200">Projects</h2>
          <span className="text-[10px] text-gray-500 bg-socc-surface/60 px-1.5 py-0.5 rounded-full">
            {projects.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-socc-card/60 rounded-md border border-socc-border/40 overflow-hidden">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1 text-[10px] font-medium transition-colors ${viewMode === 'kanban' ? 'bg-socc-cyan/15 text-socc-cyan' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 text-[10px] font-medium transition-colors ${viewMode === 'list' ? 'bg-socc-cyan/15 text-socc-cyan' : 'text-gray-500 hover:text-gray-300'}`}
            >
              List
            </button>
          </div>
          <button
            onClick={() => { setCreating(true); setEditing(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-socc-cyan/15 text-socc-cyan hover:bg-socc-cyan/25 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Project
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 scrollbar-thin">
        {/* Editor */}
        {(creating || editing) && (
          <div className="mb-4">
            <ProjectEditor
              project={editing}
              onSave={handleSave}
              onCancel={() => { setCreating(false); setEditing(null); }}
            />
          </div>
        )}

        {viewMode === 'kanban' ? (
          <KanbanView
            grouped={grouped}
            onEdit={setEditing}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <ListView
            projects={projects}
            onEdit={setEditing}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>
    </div>
  );
}

/* ── Sub-views (kept below 200 lines each) ── */

interface ViewProps {
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ProjectStatus) => void;
}

function KanbanView({ grouped, onEdit, onDelete, onStatusChange }: ViewProps & { grouped: Record<ProjectStatus, Project[]> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {STATUS_ORDER.map((status) => (
        <div key={status} className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1 mb-1">
            <span className="text-xs font-semibold text-gray-400">{STATUS_LABELS[status]}</span>
            <span className="text-[10px] text-gray-600">{grouped[status].length}</span>
          </div>
          {grouped[status].map((p) => (
            <ProjectCard key={p.id} project={p} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />
          ))}
          {grouped[status].length === 0 && (
            <div className="text-center text-[10px] text-gray-600 py-8 border border-dashed border-socc-border/30 rounded-lg">
              No {status} projects
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ListView({ projects, onEdit, onDelete, onStatusChange }: ViewProps & { projects: Project[] }) {
  const sorted = [...projects].sort((a, b) => {
    const order = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    if (order !== 0) return order;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="space-y-2">
      {sorted.map((p) => (
        <ProjectCard key={p.id} project={p} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />
      ))}
    </div>
  );
}
