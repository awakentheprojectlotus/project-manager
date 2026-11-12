import { useMemo, useState } from 'react';
import { addMonths, format, isSameMonth, isToday, startOfMonth, subMonths } from 'date-fns';
import clsx from 'clsx';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { PriorityBadge, StatusBadge } from '../ui/Badge';
import { useUiStore } from '../../stores/uiStore';
import { monthMatrix, formatMonthYear } from '../../utils/date';
import { PRIORITY_MAP } from '../../constants';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TaskCalendarView({ tasks, projects, members, onEdit, defaultProjectId = '' }) {
  const openTaskForm = useUiStore((s) => s.openTaskForm);
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(null);

  const days = useMemo(() => monthMatrix(cursor), [cursor]);
  const tasksByDate = useMemo(() => {
    const map = new Map();
    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const key = task.dueDate.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(task);
    });
    return map;
  }, [tasks]);

  const selectedTasks = selected ? tasksByDate.get(selected) || [] : [];

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted" />
          <h3 className="text-sm font-semibold text-ink">{formatMonthYear(cursor)}</h3>
          <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-medium text-muted">
            {tasks.filter((t) => t.dueDate && isSameMonth(new Date(`${t.dueDate}T00:00:00`), cursor)).length} tasks
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => setCursor(startOfMonth(new Date()))}>
            Today
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => setCursor(subMonths(cursor, 1))} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => setCursor(addMonths(cursor, 1))} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-7 border-b border-edge pb-1.5">
            {WEEKDAYS.map((day) => (
              <div key={day} className="px-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl bg-edge">
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayTasks = tasksByDate.get(key) || [];
              const inMonth = isSameMonth(day, cursor);
              const today = isToday(day);
              const isSelected = selected === key;
              return (
                <div
                  role="button"
                  tabIndex={0}
                  key={key}
                  onClick={() => setSelected(isSelected ? null : key)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelected(isSelected ? null : key);
                    }
                  }}
                  className={clsx(
                    'min-h-[104px] cursor-pointer bg-surface p-1.5 text-left align-top transition hover:bg-canvas/70',
                    !inMonth && 'bg-canvas/50',
                    isSelected && 'bg-brand-50/60 ring-1 ring-inset ring-brand-300 dark:bg-brand-500/10 dark:ring-brand-500/40'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={clsx(
                        'grid h-5 w-5 place-items-center rounded-full text-[11px] font-medium',
                        today
                          ? 'bg-brand-600 text-white'
                          : inMonth
                            ? 'text-ink'
                            : 'text-muted/60'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[9px] font-semibold text-muted">{dayTasks.length}</span>
                    )}
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayTasks.slice(0, 2).map((task) => {
                      const project = projects.find((p) => p.id === task.projectId);
                      return (
                        <button
                          type="button"
                          key={task.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            onEdit(task);
                          }}
                          className={clsx(
                            'flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[10px] font-medium',
                            task.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 line-through dark:bg-emerald-500/10 dark:text-emerald-400'
                              : 'bg-elevated text-ink hover:bg-brand-50 dark:hover:bg-brand-500/10'
                          )}
                          title={task.title}
                        >
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: project?.color || PRIORITY_MAP[task.priority]?.hex }}
                          />
                          <span className="truncate">{task.title}</span>
                        </button>
                      );
                    })}
                    {dayTasks.length > 2 && (
                      <span className="block px-1 text-[9px] font-medium text-muted">
                        +{dayTasks.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selected && (
        <div className="mt-4 rounded-xl border border-edge bg-canvas/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-semibold text-ink">
              {format(new Date(`${selected}T00:00:00`), 'EEEE, MMMM d')}
            </h4>
            <button
              type="button"
              onClick={() => openTaskForm(null, { dueDate: selected, projectId: defaultProjectId || '' })}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              <Plus className="h-3 w-3" />
              Add task
            </button>
          </div>
          {selectedTasks.length === 0 ? (
            <p className="py-2 text-xs text-muted">No tasks due on this day.</p>
          ) : (
            <ul className="space-y-1.5">
              {selectedTasks.map((task) => {
                const assignee = members.find((m) => m.id === task.assigneeId);
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => onEdit(task)}
                      className="flex w-full items-center gap-2 rounded-lg border border-edge bg-surface px-2.5 py-2 text-left transition hover:border-brand-200 dark:hover:border-brand-500/30"
                    >
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">{task.title}</span>
                      <PriorityBadge priority={task.priority} size="sm" showLabel={false} />
                      <StatusBadge status={task.status} size="sm" />
                      {assignee && <Avatar member={assignee} size="xs" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
