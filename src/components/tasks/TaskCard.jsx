import clsx from 'clsx';
import { CalendarDays, CheckSquare2, GripVertical, Pencil, Trash2 } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Dropdown from '../ui/Dropdown';
import { PriorityBadge } from '../ui/Badge';
import { dueMeta } from '../../utils/date';

const PRIORITY_STRIPE = {
  urgent: 'bg-rose-500',
  high: 'bg-amber-500',
  medium: 'bg-sky-500',
  low: 'bg-slate-300 dark:bg-slate-600',
};

export default function TaskCard({ task, project, assignee, onEdit, onDelete, draggable = true }) {
  const due = dueMeta(task.dueDate, task.status === 'completed');
  const subtaskDone = task.subtasks?.filter((s) => s.done).length || 0;
  const subtaskTotal = task.subtasks?.length || 0;

  return (
    <div
      draggable={draggable}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', task.id);
        event.dataTransfer.effectAllowed = 'move';
      }}
      onClick={() => onEdit?.(task)}
      className={clsx(
        'group relative w-full cursor-grab overflow-hidden rounded-xl border border-edge bg-surface p-3 text-left shadow-sm transition hover:border-brand-300 hover:shadow-card active:cursor-grabbing',
        task.status === 'completed' && 'opacity-80'
      )}
    >
      <span className={clsx('absolute inset-y-0 left-0 w-[3px]', PRIORITY_STRIPE[task.priority])} />

      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p
            className={clsx(
              'text-[13px] font-medium leading-snug text-ink',
              task.status === 'completed' && 'line-through decoration-muted/40'
            )}
          >
            {task.title}
          </p>
          {project && (
            <span className="mt-1 flex items-center gap-1.5 text-[10.5px] text-muted">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: project.color }} />
              <span className="truncate">{project.name}</span>
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <GripVertical className="h-3.5 w-3.5 text-muted/40 opacity-0 transition group-hover:opacity-100" />
          <Dropdown
            trigger={<span className="grid h-6 w-6 place-items-center rounded-md text-muted hover:bg-elevated"><Pencil className="h-3 w-3" /></span>}
            buttonClassName="rounded-md"
            items={[
              { label: 'Edit task', icon: Pencil, onClick: () => onEdit?.(task) },
              { separator: true },
              { label: 'Delete task', icon: Trash2, danger: true, onClick: () => onDelete?.(task) },
            ]}
          />
        </div>
      </div>

      {subtaskTotal > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-[10.5px] text-muted">
          <CheckSquare2 className="h-3 w-3" />
          <span>
            {subtaskDone}/{subtaskTotal} subtasks
          </span>
          <span className="ml-1 h-1 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <span
              className="block h-full rounded-full bg-brand-500"
              style={{ width: `${(subtaskDone / subtaskTotal) * 100}%` }}
            />
          </span>
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span
          className={clsx(
            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium',
            due.tone === 'danger'
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
              : due.tone === 'warning'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                : 'text-muted'
          )}
        >
          <CalendarDays className="h-2.5 w-2.5" />
          {due.label}
        </span>
        <div className="flex items-center gap-1.5">
          <PriorityBadge priority={task.priority} size="sm" showLabel={false} />
          {assignee ? (
            <Avatar member={assignee} size="xs" title={assignee.name} />
          ) : (
            <span className="grid h-6 w-6 place-items-center rounded-full border border-dashed border-edge text-[9px] text-muted">
              ?
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
