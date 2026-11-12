import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { CheckCircle2, Circle, ExternalLink, Link2, Plus, Sparkles, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge, { PriorityBadge, StatusBadge } from '../ui/Badge';
import Avatar from '../ui/Avatar';
import EmptyState from '../ui/EmptyState';
import Input from '../ui/Input';
import { useUiStore } from '../../stores/uiStore';
import { useTaskStore } from '../../stores/taskStore';
import { useTeamStore } from '../../stores/teamStore';
import { useStatusLinkStore } from '../../stores/statusLinkStore';
import { TASK_CATEGORY_MAP } from '../../constants';
import { getCategoryStatus } from '../../utils/categories';
import { daysUntil, dueMeta, formatDate, todayISO } from '../../utils/date';
import { normalizeStatusLink } from '../../utils/links';

const BADGE_TONES = {
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  empty: 'neutral',
};

export default function CategoryTasksModal({ category, categoryMeta, project, tasks, onClose }) {
  const openTaskForm = useUiStore((s) => s.openTaskForm);
  const currentUserId = useUiStore((s) => s.currentUserId);
  const pushToast = useUiStore((s) => s.pushToast);
  const updateTaskStatus = useTaskStore((s) => s.updateTaskStatus);
  const members = useTeamStore((s) => s.members);
  const link = useStatusLinkStore((s) =>
    category ? s.links?.[project.id]?.[category]?.url || '' : ''
  );
  const setLink = useStatusLinkStore((s) => s.setLink);
  const removeLink = useStatusLinkStore((s) => s.removeLink);

  const [linkDraft, setLinkDraft] = useState(link);
  const [linkError, setLinkError] = useState('');

  useEffect(() => {
    setLinkDraft(link);
    setLinkError('');
  }, [link, category]);

  const meta = categoryMeta || TASK_CATEGORY_MAP[category];
  const status = useMemo(
    () => (category ? getCategoryStatus(tasks, category) : null),
    [tasks, category]
  );
  const sortedTasks = useMemo(() => {
    if (!status) return [];
    return [...status.tasks].sort((a, b) => {
      const doneA = a.status === 'completed' ? 1 : 0;
      const doneB = b.status === 'completed' ? 1 : 0;
      if (doneA !== doneB) return doneA - doneB;
      return (daysUntil(a.dueDate) ?? 9999) - (daysUntil(b.dueDate) ?? 9999);
    });
  }, [status]);

  if (!meta || !status) return null;

  const openAdd = (overrides = {}) => {
    onClose();
    openTaskForm(null, { projectId: project.id, category, ...overrides });
  };

  const addDailyPost = () =>
    openAdd({
      title: `Daily social post — ${formatDate(todayISO(), 'MMM d')}`,
      dueDate: todayISO(),
      assigneeId: currentUserId,
      priority: 'medium',
      status: 'todo',
    });

  const Icon = meta.icon;

  const saveLink = () => {
    const normalized = normalizeStatusLink(linkDraft);
    if (!normalized) {
      setLinkError('Enter a valid http(s) link.');
      return;
    }
    if (!setLink(project.id, category, normalized)) {
      setLinkError('Could not save that link.');
      return;
    }
    setLinkDraft(normalized);
    setLinkError('');
    pushToast({
      type: 'success',
      title: 'Status link saved',
      message: 'A Link button is now shown on this status card.',
    });
  };

  const clearLink = () => {
    removeLink(project.id, category);
    setLinkDraft('');
    setLinkError('');
    pushToast({ type: 'info', title: 'Status link removed' });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={meta.label}
      description={`${project.name} · ${status.statusLabel}`}
      icon={Icon}
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <Badge tone={BADGE_TONES[status.tone]}>
            {status.completed}/{status.total || 0} done
          </Badge>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" icon={Plus} onClick={() => openAdd()}>
              Add task
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-canvas px-2.5 py-1 text-[10.5px] font-medium text-ink ring-1 ring-inset ring-edge">
            {status.open} open
          </span>
          <span className="rounded-full bg-canvas px-2.5 py-1 text-[10.5px] font-medium text-ink ring-1 ring-inset ring-edge">
            {status.completed} completed
          </span>
          {status.overdue > 0 && (
            <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10.5px] font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300">
              {status.overdue} overdue
            </span>
          )}
          {status.dueSoon > 0 && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10.5px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300">
              {status.dueSoon} due soon
            </span>
          )}
        </div>

        {category === 'social' && (
          <div className="flex flex-col gap-2 rounded-xl border border-edge bg-canvas/50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-[11.5px] font-semibold text-ink">Daily social post</p>
                <p className="text-[10.5px] text-muted">
                  {status.dailyPost?.postedToday
                    ? "Today's post is logged."
                    : status.dailyPost?.hasPostToday
                      ? "Today's post is due — not completed yet."
                      : 'No post logged for today yet.'}
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" icon={Plus} onClick={addDailyPost}>
              {status.dailyPost?.postedToday ? 'Add another post' : "Log today's post"}
            </Button>
          </div>
        )}

        <div className="rounded-xl border border-edge bg-canvas/50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink">
                <Link2 className="h-3.5 w-3.5 text-muted" />
                Status link
              </p>
              <p className="mt-0.5 text-[10px] text-muted">
                Add a URL to show a Link button on this status card.
              </p>
            </div>
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-[10px] font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                Open
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              <Input
                value={linkDraft}
                onChange={(event) => {
                  setLinkDraft(event.target.value);
                  if (linkError) setLinkError('');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    saveLink();
                  }
                }}
                placeholder="https://docs.google.com/…"
                aria-label="Status link"
              />
              {linkError && (
                <p className="mt-1 text-[10px] text-rose-600 dark:text-rose-400">{linkError}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button size="sm" onClick={saveLink} disabled={!linkDraft.trim()}>
                Save link
              </Button>
              {link && (
                <Button variant="ghost" size="sm" icon={Trash2} onClick={clearLink}>
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        {sortedTasks.length === 0 ? (
          <EmptyState
            compact
            icon={Icon}
            title={`No ${meta.label.toLowerCase()} tasks`}
            description="Add a task to start tracking this status."
            action={
              <Button size="sm" icon={Plus} onClick={() => openAdd()}>
                Add task
              </Button>
            }
          />
        ) : (
          <ul className="space-y-1.5">
            {sortedTasks.map((task) => {
              const completed = task.status === 'completed';
              const assignee = members.find((member) => member.id === task.assigneeId);
              const due = dueMeta(task.dueDate, completed);
              return (
                <li
                  key={task.id}
                  className="flex items-center gap-2.5 rounded-xl border border-edge bg-surface px-2.5 py-2.5 transition hover:border-brand-200 dark:hover:border-brand-500/30"
                >
                  <button
                    type="button"
                    onClick={() =>
                      updateTaskStatus(task.id, completed ? 'todo' : 'completed')
                    }
                    className={clsx(
                      'grid h-5 w-5 shrink-0 place-items-center rounded-full transition',
                      completed
                        ? 'text-emerald-500 hover:text-emerald-600'
                        : 'text-muted hover:text-brand-600'
                    )}
                    aria-label={completed ? `Mark ${task.title} as open` : `Complete ${task.title}`}
                    title={completed ? 'Mark as open' : 'Mark as complete'}
                  >
                    {completed ? (
                      <CheckCircle2 className="h-[18px] w-[18px]" />
                    ) : (
                      <Circle className="h-[18px] w-[18px]" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      openTaskForm(task);
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span
                      className={clsx(
                        'block truncate text-[12.5px] font-medium text-ink',
                        completed && 'text-muted line-through decoration-muted/40'
                      )}
                    >
                      {task.title}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted">
                      <span
                        className={clsx(
                          due.tone === 'danger' && 'font-medium text-rose-600 dark:text-rose-400',
                          due.tone === 'warning' && 'font-medium text-amber-600 dark:text-amber-400'
                        )}
                      >
                        {due.label}
                      </span>
                      {assignee && (
                        <span className="inline-flex items-center gap-1">
                          <Avatar member={assignee} size="xs" />
                          <span className="max-w-[110px] truncate">{assignee.name}</span>
                        </span>
                      )}
                    </span>
                  </button>

                  <PriorityBadge priority={task.priority} size="sm" showLabel={false} />
                  <StatusBadge status={task.status} size="sm" />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
