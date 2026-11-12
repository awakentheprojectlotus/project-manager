import clsx from 'clsx';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import Dropdown from '../ui/Dropdown';
import EmptyState from '../ui/EmptyState';
import { PriorityBadge, StatusBadge } from '../ui/Badge';
import { useTaskStore } from '../../stores/taskStore';
import { useUiStore } from '../../stores/uiStore';
import { dueMeta } from '../../utils/date';

export default function TaskListView({
  tasks,
  projects,
  members,
  onEdit,
  onDelete,
  showProject = true,
  emptyTitle = 'No tasks match your filters',
  emptyDescription = 'Adjust the filters or create a new task to get started.',
}) {
  const updateTaskStatus = useTaskStore((s) => s.updateTaskStatus);
  const openTaskForm = useUiStore((s) => s.openTaskForm);

  if (!tasks.length) {
    return (
      <EmptyState
        icon={Plus}
        title={emptyTitle}
        description={emptyDescription}
        action={
          <button
            type="button"
            onClick={() => openTaskForm()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-3.5 w-3.5" />
            New task
          </button>
        }
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="border-b border-edge bg-canvas/50">
              <th className="w-10 px-4 py-2.5" />
              <th className="table-head px-3 py-2.5">Task</th>
              <th className="table-head px-3 py-2.5">Status</th>
              <th className="table-head px-3 py-2.5">Priority</th>
              <th className="table-head px-3 py-2.5">Assignee</th>
              <th className="table-head px-3 py-2.5">Due</th>
              <th className="w-12 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {tasks.map((task) => {
              const project = projects.find((p) => p.id === task.projectId);
              const assignee = members.find((m) => m.id === task.assigneeId);
              const due = dueMeta(task.dueDate, task.status === 'completed');
              const done = task.status === 'completed';
              return (
                <tr key={task.id} className="group transition hover:bg-canvas/40">
                  <td className="px-4 py-2.5 align-middle">
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => updateTaskStatus(task.id, done ? 'todo' : 'completed')}
                      className="h-4 w-4 cursor-pointer rounded border-edge accent-brand-600"
                      aria-label={done ? `Mark ${task.title} as to do` : `Complete ${task.title}`}
                    />
                  </td>
                  <td className="max-w-[340px] px-3 py-2.5">
                    <button type="button" onClick={() => onEdit(task)} className="block max-w-full text-left">
                      <span
                        className={clsx(
                          'block truncate text-[13px] font-medium text-ink',
                          done && 'text-muted line-through decoration-muted/40'
                        )}
                      >
                        {task.title}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                        {showProject && project && (
                          <>
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: project.color }}
                            />
                            <span className="truncate">{project.name}</span>
                          </>
                        )}
                        {task.subtasks?.length > 0 && (
                          <>
                            {showProject && project && <span className="text-muted/50">·</span>}
                            <span>
                              {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length} subtasks
                            </span>
                          </>
                        )}
                      </span>
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={task.status} size="sm" />
                  </td>
                  <td className="px-3 py-2.5">
                    <PriorityBadge priority={task.priority} size="sm" />
                  </td>
                  <td className="px-3 py-2.5">
                    {assignee ? (
                      <span className="flex items-center gap-2">
                        <Avatar member={assignee} size="xs" />
                        <span className="max-w-[120px] truncate text-xs text-ink">{assignee.name}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted">Unassigned</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={clsx(
                        'text-xs',
                        due.tone === 'danger'
                          ? 'font-medium text-rose-600 dark:text-rose-400'
                          : due.tone === 'warning'
                            ? 'font-medium text-amber-600 dark:text-amber-400'
                            : 'text-muted'
                      )}
                    >
                      {due.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <Dropdown
                      trigger={
                        <span className="grid h-7 w-7 place-items-center rounded-lg text-muted opacity-0 transition hover:bg-elevated group-hover:opacity-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </span>
                      }
                      items={[
                        { label: 'Edit task', icon: Pencil, onClick: () => onEdit(task) },
                        { separator: true },
                        { label: 'Delete task', icon: Trash2, danger: true, onClick: () => onDelete(task) },
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
