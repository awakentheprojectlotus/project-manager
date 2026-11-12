import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import clsx from 'clsx';
import { Briefcase, CheckCircle2, Clock, Pencil, Trash2, UserRound } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import ProgressBar from '../ui/ProgressBar';
import { StatusBadge, PriorityBadge } from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import { useUiStore } from '../../stores/uiStore';
import { useTeamStore } from '../../stores/teamStore';
import { useTaskStore } from '../../stores/taskStore';
import { useProjectStore } from '../../stores/projectStore';
import { getMemberStats } from '../../utils/analytics';
import { dueMeta } from '../../utils/date';

export default function MemberDetailModal() {
  const { open, memberId } = useUiStore((s) => s.memberDetail);
  const closeMemberDetail = useUiStore((s) => s.closeMemberDetail);
  const openMemberForm = useUiStore((s) => s.openMemberForm);
  const openTaskForm = useUiStore((s) => s.openTaskForm);
  const confirm = useUiStore((s) => s.confirm);
  const pushToast = useUiStore((s) => s.pushToast);
  const members = useTeamStore((s) => s.members);
  const removeMember = useTeamStore((s) => s.removeMember);
  const tasks = useTaskStore((s) => s.tasks);
  const projects = useProjectStore((s) => s.projects);
  const navigate = useNavigate();

  const member = members.find((m) => m.id === memberId);
  const stats = useMemo(() => (member ? getMemberStats(member, tasks) : null), [member, tasks]);

  if (!member || !stats) return null;

  const openTasks = stats.assigned
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
  const completedTasks = stats.assigned.filter((t) => t.status === 'completed');

  const handleRemove = async () => {
    const ok = await confirm({
      title: 'Remove team member?',
      description: `${member.name} will be removed and ${stats.open} open tasks will be unassigned.`,
      confirmLabel: 'Remove member',
    });
    if (!ok) return;
    removeMember(member.id);
    pushToast({ type: 'info', title: 'Member removed', message: `${member.name} was removed from the team.` });
    closeMemberDetail();
  };

  return (
    <Modal open={open} onClose={closeMemberDetail} size="lg" title="Team member" icon={UserRound}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar member={member} size="xl" showStatus />
            <div>
              <h3 className="text-lg font-semibold text-ink">{member.name}</h3>
              <p className="text-sm text-muted">{member.role}</p>
              <p className="mt-0.5 text-xs text-muted">{member.email || 'No email on file'}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-elevated px-2 py-0.5 text-[11px] text-muted ring-1 ring-inset ring-edge">
                  <Briefcase className="h-3 w-3" />
                  {member.capacity}h weekly capacity
                </span>
                <span
                  className={clsx(
                    'rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
                    member.status === 'away'
                      ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300'
                      : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300'
                  )}
                >
                  {member.status === 'away' ? 'Away' : 'Active'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={Pencil} onClick={() => openMemberForm(member)}>
              Edit
            </Button>
            <Button variant="danger-ghost" size="sm" icon={Trash2} onClick={handleRemove}>
              Remove
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: 'Open tasks', value: stats.open, tone: 'text-brand-600 dark:text-brand-400' },
            { label: 'Completed', value: stats.completed, tone: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Overdue', value: stats.overdue, tone: 'text-rose-600 dark:text-rose-400' },
            { label: 'Utilization', value: `${stats.utilization}%`, tone: 'text-ink' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-edge bg-canvas/50 px-3 py-2.5">
              <p className={clsx('text-lg font-bold', item.tone)}>{item.value}</p>
              <p className="text-[11px] text-muted">{item.label}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-ink">
              <Clock className="h-3.5 w-3.5 text-muted" />
              Estimated workload
            </span>
            <span className="text-muted">
              {stats.estimatedHours}h of {member.capacity}h
            </span>
          </div>
          <ProgressBar
            value={Math.min(stats.utilization, 100)}
            color={stats.utilization > 100 ? '#f43f5e' : stats.utilization > 80 ? '#f59e0b' : '#6366f1'}
            size="lg"
          />
          {stats.utilization > 100 && (
            <p className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400">
              Overallocated — consider moving work to a teammate with spare capacity.
            </p>
          )}
        </div>

        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Active tasks ({openTasks.length})
          </h4>
          {openTasks.length === 0 ? (
            <EmptyState compact icon={CheckCircle2} title="No active tasks" description="This teammate is caught up." />
          ) : (
            <ul className="space-y-1.5">
              {openTasks.map((task) => {
                const due = dueMeta(task.dueDate);
                const project = projects.find((p) => p.id === task.projectId);
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => {
                        closeMemberDetail();
                        openTaskForm(task);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl border border-edge bg-surface px-3 py-2.5 text-left transition hover:border-brand-200 hover:bg-brand-50/40 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/5"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-ink">{task.title}</span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                          {project && (
                            <span className="inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: project.color }} />
                              {project.name}
                            </span>
                          )}
                          <span className={due.tone === 'danger' ? 'font-medium text-rose-600 dark:text-rose-400' : ''}>
                            {due.label}
                          </span>
                        </span>
                      </span>
                      <PriorityBadge priority={task.priority} size="sm" />
                      <StatusBadge status={task.status} size="sm" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {completedTasks.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Recently completed ({completedTasks.length})
            </h4>
            <ul className="space-y-1">
              {completedTasks.slice(0, 4).map((task) => (
                <li key={task.id} className="flex items-center gap-2 px-1 text-xs text-muted">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="line-through decoration-edge">{task.title}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                closeMemberDetail();
                navigate('/team');
              }}
              className="mt-2 text-[11px] font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              View full team overview →
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
