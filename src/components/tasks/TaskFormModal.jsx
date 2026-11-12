import { useEffect, useMemo, useState } from 'react';
import { CheckSquare, Plus, Trash2, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input, { Field, Select, Textarea } from '../ui/Input';
import { useUiStore } from '../../stores/uiStore';
import { useTaskStore } from '../../stores/taskStore';
import { useProjectStore } from '../../stores/projectStore';
import { useTeamStore } from '../../stores/teamStore';
import { PRIORITIES, TASK_CATEGORIES, TASK_CATEGORY_MAP, TASK_STATUSES } from '../../constants';
import { useProjectCategoryStore } from '../../stores/projectCategoryStore';
import { getProjectCategories } from '../../utils/projectCategories';
import { getTaskCategory } from '../../utils/categories';
import { uid } from '../../utils/helpers';

const emptyForm = {
  title: '',
  description: '',
  projectId: '',
  assigneeId: '',
  category: 'social',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
  subtasks: [],
};

export default function TaskFormModal() {
  const { open, task, defaults } = useUiStore((s) => s.taskForm);
  const closeTaskForm = useUiStore((s) => s.closeTaskForm);
  const confirm = useUiStore((s) => s.confirm);
  const pushToast = useUiStore((s) => s.pushToast);
  const projects = useProjectStore((s) => s.projects);
  const members = useTeamStore((s) => s.members);
  const createTask = useTaskStore((s) => s.createTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const categoryConfig = useProjectCategoryStore((s) => s.config);

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [draftSubtask, setDraftSubtask] = useState('');

  const categoryOptions = useMemo(() => {
    const base = form.projectId
      ? getProjectCategories(categoryConfig[form.projectId])
      : TASK_CATEGORIES;
    if (!form.category || base.some((category) => category.value === form.category)) {
      return base;
    }
    return [
      ...base,
      {
        value: form.category,
        label: TASK_CATEGORY_MAP[form.category]?.label || form.category,
        icon: null,
      },
    ];
  }, [categoryConfig, form.projectId, form.category]);

  useEffect(() => {
    if (!open) return;
    setError('');
    setDraftSubtask('');
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        projectId: task.projectId || '',
        assigneeId: task.assigneeId || '',
        category: task.category || getTaskCategory(task),
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        dueDate: task.dueDate || '',
        subtasks: (task.subtasks || []).map((s) => ({ ...s })),
      });
    } else {
      const projectId = defaults.projectId || '';
      const base = projectId
        ? getProjectCategories(categoryConfig[projectId])
        : TASK_CATEGORIES;
      const chosen =
        defaults.category && base.some((category) => category.value === defaults.category)
          ? defaults.category
          : base[0]?.value || 'social';
      setForm({ ...emptyForm, ...defaults, projectId, category: chosen });
    }
  }, [open, task, defaults, categoryConfig]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const addSubtask = () => {
    if (!draftSubtask.trim()) return;
    set('subtasks', [...form.subtasks, { id: uid('sub'), title: draftSubtask.trim(), done: false }]);
    setDraftSubtask('');
  };

  const submit = (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('Give the task a title so your team knows what to do.');
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description,
      projectId: form.projectId || null,
      assigneeId: form.assigneeId || null,
      category: form.category || null,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
      subtasks: form.subtasks,
    };
    if (task) {
      updateTask(task.id, payload);
      pushToast({ type: 'success', title: 'Task updated', message: `'${payload.title}' was saved.` });
    } else {
      createTask(payload);
      pushToast({ type: 'success', title: 'Task created', message: `'${payload.title}' was added to your board.` });
    }
    closeTaskForm();
  };

  const handleDelete = async () => {
    if (!task) return;
    const ok = await confirm({
      title: 'Delete this task?',
      description: `'${task.title}' will be permanently removed from the workspace.`,
      confirmLabel: 'Delete task',
    });
    if (!ok) return;
    deleteTask(task.id);
    pushToast({ type: 'info', title: 'Task deleted', message: `'${task.title}' was removed.` });
    closeTaskForm();
  };

  return (
    <Modal
      open={open}
      onClose={closeTaskForm}
      title={task ? 'Edit task' : 'Create task'}
      description={task ? 'Update details, ownership and status.' : 'Add a task and keep work moving.'}
      icon={CheckSquare}
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <div>
            {task && (
              <Button variant="danger-ghost" size="sm" icon={Trash2} onClick={handleDelete}>
                Delete
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={closeTaskForm}>
              Cancel
            </Button>
            <Button size="sm" type="submit" form="task-form">
              {task ? 'Save changes' : 'Create task'}
            </Button>
          </div>
        </div>
      }
    >
      <form id="task-form" onSubmit={submit} className="space-y-4">
        <Field label="Title" required error={error}>
          <Input
            autoFocus
            value={form.title}
            onChange={(e) => {
              set('title', e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g. Draft March content calendar"
          />
        </Field>

        <Field label="Description">
          <Textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Add context, acceptance criteria or links…"
            rows={3}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Project">
            <Select
              value={form.projectId}
              onChange={(e) => {
                const nextProjectId = e.target.value;
                const nextCategories = nextProjectId
                  ? getProjectCategories(categoryConfig[nextProjectId])
                  : TASK_CATEGORIES;
                setForm((prev) => ({
                  ...prev,
                  projectId: nextProjectId,
                  category: nextCategories.some((category) => category.value === prev.category)
                    ? prev.category
                    : nextCategories[0]?.value || '',
                }));
              }}
              options={[
                { value: '', label: 'No project' },
                ...projects.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </Field>
          <Field label="Assignee">
            <Select
              value={form.assigneeId}
              onChange={(e) => set('assigneeId', e.target.value)}
              options={[
                { value: '', label: 'Unassigned' },
                ...members.map((m) => ({ value: m.id, label: `${m.name} · ${m.role}` })),
              ]}
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              options={TASK_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            />
          </Field>
          <Field label="Category">
            <Select
              value={form.category || ''}
              onChange={(e) => set('category', e.target.value)}
              options={categoryOptions.map((category) => ({
                value: category.value,
                label: category.label,
              }))}
            />
          </Field>
          <Field label="Priority">
            <Select
              value={form.priority}
              onChange={(e) => set('priority', e.target.value)}
              options={PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
            />
          </Field>
          <Field label="Due date" className="sm:col-span-2">
            <Input type="date" value={form.dueDate || ''} onChange={(e) => set('dueDate', e.target.value)} />
          </Field>
        </div>

        <Field label={`Subtasks${form.subtasks.length ? ` (${form.subtasks.length})` : ''}`}>
          <div className="space-y-2">
            {form.subtasks.map((subtask, index) => (
              <div
                key={subtask.id}
                className="flex items-center gap-2 rounded-xl border border-edge bg-canvas/40 px-2.5 py-1.5"
              >
                <input
                  type="checkbox"
                  checked={subtask.done}
                  onChange={(e) =>
                    set(
                      'subtasks',
                      form.subtasks.map((s, i) => (i === index ? { ...s, done: e.target.checked } : s))
                    )
                  }
                  className="h-4 w-4 accent-brand-600"
                />
                <input
                  value={subtask.title}
                  onChange={(e) =>
                    set(
                      'subtasks',
                      form.subtasks.map((s, i) => (i === index ? { ...s, title: e.target.value } : s))
                    )
                  }
                  className="flex-1 bg-transparent text-sm text-ink outline-none"
                />
                <button
                  type="button"
                  onClick={() => set('subtasks', form.subtasks.filter((_, i) => i !== index))}
                  className="grid h-6 w-6 place-items-center rounded-md text-muted hover:bg-elevated hover:text-rose-500"
                  aria-label="Remove subtask"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Input
                value={draftSubtask}
                onChange={(e) => setDraftSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
                placeholder="Add a subtask and press Enter"
              />
              <Button variant="secondary" size="md" icon={Plus} onClick={addSubtask}>
                Add
              </Button>
            </div>
          </div>
        </Field>
      </form>
    </Modal>
  );
}
