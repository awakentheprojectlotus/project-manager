import { useState } from 'react';
import clsx from 'clsx';
import { Plus } from 'lucide-react';
import { TASK_STATUSES } from '../../constants';
import TaskCard from './TaskCard';
import { useUiStore } from '../../stores/uiStore';
import { useTaskStore } from '../../stores/taskStore';

export default function KanbanBoard({ tasks, projects, members, onEdit, onDelete, defaultProjectId = '' }) {
  const updateTaskStatus = useTaskStore((s) => s.updateTaskStatus);
  const openTaskForm = useUiStore((s) => s.openTaskForm);
  const pushToast = useUiStore((s) => s.pushToast);
  const [dragOver, setDragOver] = useState(null);
  const [draggingId, setDraggingId] = useState(null);

  const handleDrop = (event, status) => {
    event.preventDefault();
    setDragOver(null);
    setDraggingId(null);
    const taskId = event.dataTransfer.getData('text/plain') || draggingId;
    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === status) return;
    updateTaskStatus(taskId, status);
    pushToast({
      type: 'success',
      title: 'Task moved',
      message: `'${task.title}' moved to ${TASK_STATUSES.find((s) => s.value === status)?.label}.`,
      duration: 2500,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {TASK_STATUSES.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.value);
        return (
          <section
            key={column.value}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(column.value);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setDragOver(null);
            }}
            onDrop={(event) => handleDrop(event, column.value)}
            className={clsx(
              'flex flex-col rounded-2xl border bg-canvas/60 p-2 transition-colors',
              dragOver === column.value
                ? 'border-brand-400 bg-brand-50/60 dark:border-brand-500/50 dark:bg-brand-500/[0.06]'
                : 'border-edge'
            )}
          >
            <header className="flex items-center gap-2 px-2 py-1.5">
              <span className={clsx('h-2 w-2 rounded-full', column.dot)} />
              <h3 className="text-[12px] font-semibold text-ink">{column.label}</h3>
              <span className="rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-muted ring-1 ring-inset ring-edge">
                {columnTasks.length}
              </span>
              <button
                type="button"
                onClick={() => openTaskForm(null, { status: column.value, projectId: defaultProjectId || '' })}
                className="ml-auto grid h-6 w-6 place-items-center rounded-md text-muted transition hover:bg-surface hover:text-ink"
                aria-label={`Add task to ${column.label}`}
                title={`Add task to ${column.label}`}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </header>

            <div className="flex flex-1 flex-col gap-2 pt-1">
              {columnTasks.map((task) => (
                <div key={task.id} onDragStart={() => setDraggingId(task.id)}>
                  <TaskCard
                    task={task}
                    project={projects.find((p) => p.id === task.projectId)}
                    assignee={members.find((m) => m.id === task.assigneeId)}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              ))}

              {columnTasks.length === 0 && (
                <button
                  type="button"
                  onClick={() => openTaskForm(null, { status: column.value, projectId: defaultProjectId || '' })}
                  className="flex min-h-[96px] flex-col items-center justify-center rounded-xl border border-dashed border-edge/80 px-3 py-5 text-center transition hover:border-brand-300 hover:bg-surface/70"
                >
                  <Plus className="h-4 w-4 text-muted" />
                  <span className="mt-1 text-[11px] font-medium text-muted">Add a task</span>
                </button>
              )}

              {columnTasks.length > 0 && (
                <button
                  type="button"
                  onClick={() => openTaskForm(null, { status: column.value, projectId: defaultProjectId || '' })}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-muted transition hover:bg-surface hover:text-ink"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add task
                </button>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
