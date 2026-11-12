import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { CalendarDays, MoreHorizontal, Pencil, Trash2, UserPlus } from 'lucide-react';
import Card from '../ui/Card';
import Dropdown from '../ui/Dropdown';
import { AvatarGroup } from '../ui/Avatar';
import { PriorityBadge, StatusBadge } from '../ui/Badge';
import { daysUntil, formatDate } from '../../utils/date';

export default function ProjectCard({ project, tasks, members, onEdit, onDelete }) {
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const done = projectTasks.filter((t) => t.status === 'completed').length;
  const openTasks = projectTasks.length - done;
  const overdue = projectTasks.filter(
    (t) => t.status !== 'completed' && t.dueDate && daysUntil(t.dueDate) < 0
  ).length;
  const projectMembers = project.memberIds
    .map((id) => members.find((m) => m.id === id))
    .filter(Boolean);
  const diff = daysUntil(project.dueDate);

  return (
    <Card className="group flex flex-col p-4 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop dark:hover:border-brand-500/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[11px] font-bold text-white shadow-sm"
            style={{ backgroundColor: project.color }}
          >
            {project.key.slice(0, 3)}
          </span>
          <div className="min-w-0">
            <Link
              to={`/projects/${project.id}`}
              className="block truncate text-[14px] font-semibold text-ink hover:text-brand-700 dark:hover:text-brand-300"
            >
              {project.name}
            </Link>
            <span className="text-[10.5px] font-medium uppercase tracking-wider text-muted">
              {projectTasks.length} {projectTasks.length === 1 ? 'task' : 'tasks'}
              {overdue > 0 && <span className="text-rose-500"> · {overdue} overdue</span>}
            </span>
          </div>
        </div>
        <Dropdown
          trigger={
            <span className="grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:bg-elevated">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          }
          items={[
            { label: 'Edit project', icon: Pencil, onClick: () => onEdit(project) },
            { separator: true },
            { label: 'Delete project', icon: Trash2, danger: true, onClick: () => onDelete(project) },
          ]}
        />
      </div>

      <p className="mt-3 line-clamp-2 min-h-[32px] text-xs leading-relaxed text-muted">
        {project.description || 'No description yet.'}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <StatusBadge status={project.status} kind="project" size="sm" />
        <PriorityBadge priority={project.priority} size="sm" />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-canvas/60 px-3 py-2.5">
        <div>
          <p className="text-[13px] font-semibold text-ink">
            {openTasks} {openTasks === 1 ? 'task' : 'tasks'} left
          </p>
          <p className="mt-0.5 text-[10.5px] text-muted">
            {done} of {projectTasks.length} completed
          </p>
        </div>
        <span
          className={clsx(
            'inline-flex shrink-0 items-center gap-1 text-[10.5px]',
            diff !== null && diff < 0 && 'font-medium text-rose-600 dark:text-rose-400',
            diff !== null && diff >= 0 && diff <= 3 && 'font-medium text-amber-600 dark:text-amber-400',
            !(diff !== null && diff <= 3) && 'text-muted'
          )}
        >
          <CalendarDays className="h-3 w-3" />
          {project.dueDate ? formatDate(project.dueDate, 'MMM d') : 'No date'}
          {diff !== null && diff < 0 ? ' · late' : ''}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-edge pt-3">
        {projectMembers.length ? (
          <AvatarGroup members={projectMembers} max={4} size="sm" />
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted">
            <UserPlus className="h-3.5 w-3.5" />
            No members
          </span>
        )}
        <Link
          to={`/projects/${project.id}`}
          className="text-[11px] font-medium text-brand-600 opacity-0 transition group-hover:opacity-100 hover:underline dark:text-brand-400"
        >
          Open project →
        </Link>
      </div>
    </Card>
  );
}
