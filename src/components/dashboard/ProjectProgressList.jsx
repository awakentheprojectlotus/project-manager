import { Link } from 'react-router-dom';
import { ArrowUpRight, FolderKanban } from 'lucide-react';
import clsx from 'clsx';
import Card, { CardHeader } from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import EmptyState from '../ui/EmptyState';
import { useUiStore } from '../../stores/uiStore';
import { daysUntil } from '../../utils/date';

export default function ProjectProgressList({ projects, tasks, limit = 5 }) {
  const openProjectForm = useUiStore((s) => s.openProjectForm);

  const items = [...projects]
    .filter((p) => p.status !== 'completed')
    .sort((a, b) => (daysUntil(a.dueDate) ?? 9999) - (daysUntil(b.dueDate) ?? 9999))
    .slice(0, limit);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Project progress"
        subtitle="Active work ranked by deadline"
        icon={FolderKanban}
        action={
          <Link
            to="/projects"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            All projects
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        }
      />
      <div className="flex-1 px-5 pb-5 pt-3">
        {items.length === 0 ? (
          <EmptyState
            compact
            icon={FolderKanban}
            title="No active projects"
            description="All projects are complete. Start something new?"
            action={
              <button
                type="button"
                onClick={() => openProjectForm()}
                className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                Create a project
              </button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {items.map((project) => {
              const projectTasks = tasks.filter((t) => t.projectId === project.id);
              const done = projectTasks.filter((t) => t.status === 'completed').length;
              const progress = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;
              const diff = daysUntil(project.dueDate);
              return (
                <li key={project.id}>
                  <Link
                    to={`/projects/${project.id}`}
                    className="group block rounded-xl px-2 py-2 transition hover:bg-canvas/70"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[9px] font-bold text-white"
                        style={{ backgroundColor: project.color }}
                      >
                        {project.key.slice(0, 2)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink group-hover:text-brand-700 dark:group-hover:text-brand-300">
                        {project.name}
                      </span>
                      <span className="text-xs font-semibold text-ink">{progress}%</span>
                    </div>
                    <ProgressBar value={progress} color={project.color} size="sm" className="mt-2" />
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted">
                      <span>
                        {done}/{projectTasks.length} tasks
                      </span>
                      <span
                        className={clsx(
                          diff !== null && diff < 0 && 'font-medium text-rose-600 dark:text-rose-400',
                          diff !== null && diff >= 0 && diff <= 3 && 'font-medium text-amber-600 dark:text-amber-400'
                        )}
                      >
                        {diff === null
                          ? 'No deadline'
                          : diff < 0
                            ? `${Math.abs(diff)}d overdue`
                            : diff === 0
                              ? 'Due today'
                              : `${diff}d left`}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
