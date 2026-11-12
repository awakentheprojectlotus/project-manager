import { useEffect, useState } from 'react';
import { Check, FolderKanban } from 'lucide-react';
import clsx from 'clsx';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input, { Field, Select, Textarea } from '../ui/Input';
import Avatar from '../ui/Avatar';
import { useUiStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import { useTeamStore } from '../../stores/teamStore';
import { PRIORITIES, PROJECT_STATUSES } from '../../constants';
import { daysFromToday, todayISO } from '../../utils/date';

export default function ProjectFormModal() {
  const { open, project } = useUiStore((s) => s.projectForm);
  const closeProjectForm = useUiStore((s) => s.closeProjectForm);
  const pushToast = useUiStore((s) => s.pushToast);
  const members = useTeamStore((s) => s.members);
  const createProject = useProjectStore((s) => s.createProject);
  const updateProject = useProjectStore((s) => s.updateProject);

  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    startDate: todayISO(),
    dueDate: daysFromToday(14),
    memberIds: [],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (project) {
      setForm({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'planning',
        priority: project.priority || 'medium',
        startDate: project.startDate || todayISO(),
        dueDate: project.dueDate || daysFromToday(14),
        memberIds: project.memberIds || [],
      });
    } else {
      setForm({
        name: '',
        description: '',
        status: 'planning',
        priority: 'medium',
        startDate: todayISO(),
        dueDate: daysFromToday(14),
        memberIds: [],
      });
    }
  }, [open, project]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleMember = (id) =>
    set(
      'memberIds',
      form.memberIds.includes(id) ? form.memberIds.filter((m) => m !== id) : [...form.memberIds, id]
    );

  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('A project name is required.');
      return;
    }
    if (form.startDate && form.dueDate && form.dueDate < form.startDate) {
      setError('The due date cannot be earlier than the start date.');
      return;
    }
    const payload = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
    };
    if (project) {
      updateProject(project.id, payload);
      pushToast({ type: 'success', title: 'Project updated', message: `'${payload.name}' was saved.` });
    } else {
      createProject(payload);
      pushToast({ type: 'success', title: 'Project created', message: `'${payload.name}' is ready for planning.` });
    }
    closeProjectForm();
  };

  return (
    <Modal
      open={open}
      onClose={closeProjectForm}
      title={project ? 'Edit project' : 'Create project'}
      description={project ? 'Update scope, dates and the team.' : 'Set up a new project in your workspace.'}
      icon={FolderKanban}
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={closeProjectForm}>
            Cancel
          </Button>
          <Button size="sm" type="submit" form="project-form">
            {project ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={submit} className="space-y-4">
        <Field label="Project name" required error={error}>
          <Input
            autoFocus
            value={form.name}
            onChange={(e) => {
              set('name', e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g. Padma"
          />
        </Field>

        <Field label="Description">
          <Textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="What is this campaign about, and what does success look like?"
            rows={3}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              options={PROJECT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            />
          </Field>
          <Field label="Priority">
            <Select
              value={form.priority}
              onChange={(e) => set('priority', e.target.value)}
              options={PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
            />
          </Field>
          <Field label="Start date">
            <Input type="date" value={form.startDate || ''} onChange={(e) => set('startDate', e.target.value)} />
          </Field>
          <Field label="Due date">
            <Input type="date" value={form.dueDate || ''} onChange={(e) => set('dueDate', e.target.value)} />
          </Field>
        </div>

        <Field label={`Team members${form.memberIds.length ? ` (${form.memberIds.length})` : ''}`}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {members.map((member) => {
              const selected = form.memberIds.includes(member.id);
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleMember(member.id)}
                  className={clsx(
                    'flex items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition',
                    selected
                      ? 'border-brand-300 bg-brand-50/70 dark:border-brand-500/40 dark:bg-brand-500/10'
                      : 'border-edge bg-surface hover:bg-canvas'
                  )}
                >
                  <Avatar member={member} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">{member.name}</span>
                    <span className="block truncate text-[11px] text-muted">{member.role}</span>
                  </span>
                  <span
                    className={clsx(
                      'grid h-5 w-5 shrink-0 place-items-center rounded-md border',
                      selected
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-edge bg-surface text-transparent'
                    )}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                </button>
              );
            })}
          </div>
        </Field>
      </form>
    </Modal>
  );
}
