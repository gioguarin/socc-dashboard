import { Pencil, Trash2, Calendar, Circle, Pause, CheckCircle2 } from 'lucide-react';
import type { Project, ProjectStatus } from '../../types';
import { formatDate } from '../../utils/formatters';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ProjectStatus) => void;
}

const STATUS_CONFIG: Record<ProjectStatus, { icon: typeof Circle; color: string; bg: string; label: string }> = {
  active: { icon: Circle, color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30', label: 'Active' },
  paused: { icon: Pause, color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30', label: 'Paused' },
  completed: { icon: CheckCircle2, color: 'text-socc-cyan', bg: 'bg-socc-cyan/15 border-socc-cyan/30', label: 'Completed' },
};

const NEXT_STATUS: Record<ProjectStatus, ProjectStatus> = {
  active: 'paused',
  paused: 'completed',
  completed: 'active',
};

/** Single project card with status cycling and inline actions. */
export function ProjectCard({ project, onEdit, onDelete, onStatusChange }: ProjectCardProps) {
  const cfg = STATUS_CONFIG[project.status];
  const Icon = cfg.icon;
  const isOverdue = project.deadline && new Date(project.deadline) < new Date() && project.status !== 'completed';

  return (
    <div className="group bg-socc-card/60 border border-socc-border/40 rounded-lg p-4 hover:border-socc-border/60 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Name + status badge */}
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-sm font-semibold text-gray-200 truncate">{project.name}</h3>
            <button
              onClick={() => onStatusChange(project.id, NEXT_STATUS[project.status])}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${cfg.bg} ${cfg.color} hover:opacity-80`}
              title={`Click to change to ${NEXT_STATUS[project.status]}`}
            >
              <Icon className="w-3 h-3" />
              {cfg.label}
            </button>
          </div>

          {/* Description */}
          {project.description && (
            <p className="text-xs text-gray-400 leading-relaxed mb-2 line-clamp-2">{project.description}</p>
          )}

          {/* Deadline */}
          {project.deadline && (
            <div className={`flex items-center gap-1.5 text-[10px] ${isOverdue ? 'text-socc-red' : 'text-gray-500'}`}>
              <Calendar className="w-3 h-3" />
              <span>
                {isOverdue ? 'Overdue: ' : 'Due: '}
                {formatDate(project.deadline)}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(project)}
            className="p-1.5 rounded-md text-gray-500 hover:text-socc-cyan hover:bg-socc-cyan/10 transition-colors"
            title="Edit project"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(project.id)}
            className="p-1.5 rounded-md text-gray-500 hover:text-socc-red hover:bg-socc-red/10 transition-colors"
            title="Delete project"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
