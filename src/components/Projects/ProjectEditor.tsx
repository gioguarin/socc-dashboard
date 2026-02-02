import { useState, useEffect, useRef } from 'react';
import { Save, X } from 'lucide-react';
import type { Project, ProjectStatus } from '../../types';

interface ProjectEditorProps {
  project: Project | null;
  onSave: (name: string, description: string, status: ProjectStatus, deadline: string | null) => void;
  onCancel: () => void;
}

/** Inline editor for creating / editing a project. */
export function ProjectEditor({ project, onSave, onCancel }: ProjectEditorProps) {
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'active');
  const [deadline, setDeadline] = useState(project?.deadline?.split('T')[0] ?? '');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), description.trim(), status, deadline || null);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 bg-socc-surface/60 rounded-lg border border-socc-border/40">
      <input
        ref={nameRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Project name *"
        className="bg-socc-card/60 border border-socc-border/40 rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-socc-cyan/50 focus:outline-none"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        rows={3}
        className="bg-socc-card/60 border border-socc-border/40 rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-socc-cyan/50 focus:outline-none resize-y"
      />
      <div className="flex items-center gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          className="bg-socc-card/60 border border-socc-border/40 rounded-md px-3 py-2 text-sm text-gray-200 focus:border-socc-cyan/50 focus:outline-none"
        >
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="bg-socc-card/60 border border-socc-border/40 rounded-md px-3 py-2 text-sm text-gray-200 focus:border-socc-cyan/50 focus:outline-none"
        />
      </div>
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
          disabled={!name.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-socc-cyan/15 text-socc-cyan hover:bg-socc-cyan/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Save className="w-3.5 h-3.5" />
          {project ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
