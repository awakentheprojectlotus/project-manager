import { useEffect, useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input, { Field } from '../ui/Input';
import { useUiStore } from '../../stores/uiStore';
import { useTeamStore } from '../../stores/teamStore';
import { useTaskStore } from '../../stores/taskStore';

export default function MemberFormModal() {
  const { open, member } = useUiStore((s) => s.memberForm);
  const closeMemberForm = useUiStore((s) => s.closeMemberForm);
  const confirm = useUiStore((s) => s.confirm);
  const pushToast = useUiStore((s) => s.pushToast);
  const addMember = useTeamStore((s) => s.addMember);
  const updateMember = useTeamStore((s) => s.updateMember);
  const removeMember = useTeamStore((s) => s.removeMember);
  const tasks = useTaskStore((s) => s.tasks);

  const [form, setForm] = useState({ name: '', email: '', role: '', capacity: 40, telegramChatId: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm({
      name: member?.name || '',
      email: member?.email || '',
      role: member?.role || '',
      capacity: member?.capacity || 40,
      telegramChatId: member?.telegramChatId || '',
    });
  }, [open, member]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('A name is required.');
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Enter a valid email address or leave it empty.');
      return;
    }
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role.trim() || 'Contributor',
      capacity: Number(form.capacity) || 40,
      telegramChatId: form.telegramChatId.trim(),
    };
    if (member) {
      updateMember(member.id, payload);
      pushToast({ type: 'success', title: 'Member updated', message: `${payload.name}'s profile was saved.` });
    } else {
      addMember(payload);
      pushToast({ type: 'success', title: 'Member added', message: `${payload.name} joined the workspace.` });
    }
    closeMemberForm();
  };

  const handleDelete = async () => {
    if (!member) return;
    const assigned = tasks.filter((t) => t.assigneeId === member.id).length;
    const ok = await confirm({
      title: 'Remove team member?',
      description: `${member.name} will be removed from the workspace${
        assigned ? ` and ${assigned} assigned task${assigned === 1 ? '' : 's'} will be unassigned` : ''
      }.`,
      confirmLabel: 'Remove member',
    });
    if (!ok) return;
    removeMember(member.id);
    pushToast({ type: 'info', title: 'Member removed', message: `${member.name} was removed from the team.` });
    closeMemberForm();
  };

  return (
    <Modal
      open={open}
      onClose={closeMemberForm}
      title={member ? 'Edit team member' : 'Add team member'}
      description={member ? 'Update role, contact details and capacity.' : 'Invite someone to your workspace.'}
      icon={UserPlus}
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <div>
            {member && (
              <Button variant="danger-ghost" size="sm" icon={Trash2} onClick={handleDelete}>
                Remove
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={closeMemberForm}>
              Cancel
            </Button>
            <Button size="sm" type="submit" form="member-form">
              {member ? 'Save changes' : 'Add member'}
            </Button>
          </div>
        </div>
      }
    >
      <form id="member-form" onSubmit={submit} className="space-y-4">
        <Field label="Full name" required error={error}>
          <Input
            autoFocus
            value={form.name}
            onChange={(e) => {
              set('name', e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g. Kaung Moon San"
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="name@company.com"
          />
        </Field>
        <Field label="Telegram chat ID" hint="Optional. The member must start a chat with your Telegram bot first. Use a numeric chat ID (e.g. 123456789) or @username.">
          <Input
            value={form.telegramChatId}
            onChange={(e) => set('telegramChatId', e.target.value)}
            placeholder="123456789 or @username"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role">
            <Input
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              placeholder="e.g. Frontend Engineer"
            />
          </Field>
          <Field label="Weekly capacity (hours)" hint="Used to estimate workload.">
            <Input
              type="number"
              min="1"
              max="80"
              value={form.capacity}
              onChange={(e) => set('capacity', e.target.value)}
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
