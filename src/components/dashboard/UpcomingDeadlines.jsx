import { CalendarClock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import Card, { CardHeader } from '../ui/Card';
import { PriorityBadge } from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import { useUiStore } from '../../stores/uiStore';
import { dueMeta, formatDate } from '../../utils/date';

export default function UpcomingDeadlines({ tasks, projects }) {
  const openTaskForm = useUiStore((s) => s.openTaskForm);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Upcoming deadlines"
        subtitle="Next 14 days"
        icon={CalendarClock}
        action={
          <Link
            to="/calendar"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            Calendar
            <ArrowRight className="h-3 w-3" />
          </Link>
        }
      />
      <div className="flex-1 px-5 pb-5 pt-3">
        {tasks.length === 0 ? (
          <EmptyState
            compact
            icon={CalendarClock}
            title="No deadlines ahead"
            description="The next two weeks are clear."
          />
        ) : (
          <ul className="space-y-1">
            {tasks.slice(0, 6).map((task) => {
              const due = dueMeta(task.dueDate);
              const project = projects.find((p) => p.id === task.projectId);
              const date = new Date(`${task.dueDate}T00:00:00`);
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => openTaskForm(task)}
                    className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-canvas/70"
                  >
                    <span className="flex w-10 shrink-0 flex-col items-center rounded-lg border border-edge bg-canvas/60 py-1">
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-muted">
                        {formatDate(task.dueDate, 'MMM')}
                      </span>
                      <span className="text-sm font-bold leading-none text-ink">{formatDate(task.dueDate, 'd')}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink group-hover:text-brand-700 dark:group-hover:text-brand-300">
                        {task.title}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                        {project && (
                          <>
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: project.color }}
                            />
                            <span className="truncate">{project.name}</span>
                            <span className="text-muted/50">·</span>
                          </>
                        )}
                        <span className={clsx(due.tone === 'danger' && 'font-medium text-rose-600 dark:text-rose-400')}>
                          {due.label}
                        </span>
                      </span>
                    </span>
                    <PriorityBadge priority={task.priority} size="sm" showLabel={false} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
