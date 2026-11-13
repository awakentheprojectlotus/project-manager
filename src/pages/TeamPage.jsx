import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ListChecks,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import clsx from 'clsx';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import Avatar from '../components/ui/Avatar';
import ProgressBar from '../components/ui/ProgressBar';
import Dropdown from '../components/ui/Dropdown';
import { useTeamStore } from '../stores/teamStore';
import { useTaskStore } from '../stores/taskStore';
import { useProjectStore } from '../stores/projectStore';
import { useUiStore } from '../stores/uiStore';
import { getWorkload, getWorkspaceStats } from '../utils/analytics';
import { normalize } from '../utils/match';
import { TASK_STATUS_MAP, PRIORITY_MAP } from '../constants';
import { dueMeta } from '../utils/date';
import { sendTelegramReminder } from '../services/telegramService';

export default function TeamPage() {
  const members = useTeamStore((s) => s.members);
  const removeMember = useTeamStore((s) => s.removeMember);
  const tasks = useTaskStore((s) => s.tasks);
  const projects = useProjectStore((s) => s.projects);
  const openMemberForm = useUiStore((s) => s.openMemberForm);
  const openMemberDetail = useUiStore((s) => s.openMemberDetail);
  const confirm = useUiStore((s) => s.confirm);
  const pushToast = useUiStore((s) => s.pushToast);

  const [search, setSearch] = useState('');
  const [sendingId, setSendingId] = useState(null);
  const workload = useMemo(() => getWorkload(members, tasks), [members, tasks]);
  const stats = getWorkspaceStats(projects, tasks);
  const visible = workload.filter((w) => !search || normalize(`${w.member.name} ${w.member.role}`).includes(normalize(search)));
  const avgUtilization = workload.length
    ? Math.round(workload.reduce((sum, w) => sum + w.utilization, 0) / workload.length)
    : 0;

  const handleRemove = async (member) => {
    const assigned = tasks.filter((t) => t.assigneeId === member.id).length;
    const ok = await confirm({
      title: 'Remove team member?',
      description: `${member.name} will be removed${assigned ? ` and ${assigned} assigned task${assigned === 1 ? '' : 's'} will be unassigned` : ''}.`,
      confirmLabel: 'Remove member',
    });
    if (!ok) return;
    removeMember(member.id);
    pushToast({ type: 'info', title: 'Member removed', message: `${member.name} was removed from the team.` });
  };

  const sendReminder = async (entry) => {
    const { member } = entry;

    if (!member.telegramChatId) {
      pushToast({
        type: 'info',
        title: 'Telegram not linked',
        message: 'Add a Telegram chat ID to this member first, then send the reminder.',
      });
      openMemberForm(member);
      return;
    }

    const openTasks = (entry.assigned || [])
      .filter((task) => task.status !== 'completed')
      .sort((a, b) => {
        const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        return aDue - bDue;
      });

    if (!openTasks.length) {
      pushToast({
        type: 'info',
        title: 'No open tasks',
        message: `${member.name} is all caught up — nothing to remind them about.`,
      });
      return;
    }

    setSendingId(member.id);
    try {
      await sendTelegramReminder({
        chatId: member.telegramChatId,
        memberName: member.name,
        tasks: openTasks.slice(0, 20).map((task) => ({
          title: task.title,
          project: projects.find((project) => project.id === task.projectId)?.name || '',
          status: TASK_STATUS_MAP[task.status]?.label || task.status,
          priority: PRIORITY_MAP[task.priority]?.label || task.priority,
          due: task.dueDate ? dueMeta(task.dueDate).label : '',
        })),
      });
      pushToast({
        type: 'success',
        title: 'Reminder sent',
        message: `Telegram reminder sent to ${member.name}.`,
      });
    } catch (error) {
      const message =
        error.code === 'NOT_CONFIGURED'
          ? 'Add TELEGRAM_BOT_TOKEN to .env and restart the server to enable reminders.'
          : error.code === 'CHAT_NOT_FOUND'
            ? 'Telegram could not find this chat. Ask the member to start the bot, then check the chat ID.'
            : error.code === 'INVALID_TOKEN'
              ? 'The Telegram bot token is invalid. Update TELEGRAM_BOT_TOKEN.'
              : error.code === 'BOT_BLOCKED'
                ? 'The member has blocked the Telegram bot.'
                : error.message;
      pushToast({ type: 'error', title: 'Reminder failed', message });
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="People"
        title="Team Members"
        description="See who is on the team, what they're working on, and how loaded they are."
      >
        <Button size="sm" icon={Plus} onClick={() => openMemberForm()}>
          Add member
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Team members', value: members.length, icon: Users, tone: 'text-brand-600 dark:text-brand-400' },
          { label: 'Open tasks', value: stats.pendingTasks, icon: ListChecks, tone: 'text-sky-600 dark:text-sky-400' },
          { label: 'Overdue tasks', value: stats.overdueTasks, icon: AlertTriangle, tone: 'text-rose-600 dark:text-rose-400' },
          { label: 'Avg. utilization', value: `${avgUtilization}%`, icon: Briefcase, tone: 'text-amber-600 dark:text-amber-400' },
        ].map((item) => (
          <Card key={item.label} className="flex items-center gap-3 p-3.5">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-elevated ${item.tone}`}>
              <item.icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-lg font-bold leading-none text-ink">{item.value}</p>
              <p className="mt-1 text-[11px] text-muted">{item.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <Input
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or role…"
            aria-label="Search team"
          />
        </div>
        <span className="self-center text-[11px] text-muted">
          {visible.length} of {members.length} members
        </span>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title={search ? 'No teammates match your search' : 'No team members yet'}
          description={
            search
              ? 'Try a different name or role.'
              : 'Add your teammates to assign tasks and track workload.'
          }
          action={
            !search && (
              <Button size="sm" icon={Plus} onClick={() => openMemberForm()}>
                Add member
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((entry) => {
            const { member } = entry;
            const overloaded = entry.utilization > 100;
            return (
              <Card key={member.id} className="group p-4 transition hover:border-brand-200 hover:shadow-card dark:hover:border-brand-500/30">
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openMemberDetail(member.id)}
                    className="flex min-w-0 items-center gap-3 text-left"
                  >
                    <Avatar member={member} size="lg" showStatus />
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-semibold text-ink">{member.name}</span>
                      <span className="block truncate text-[11.5px] text-muted">{member.role}</span>
                      <span
                        className={clsx(
                          'mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                          member.status === 'away'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                        )}
                      >
                        <span className={clsx('h-1.5 w-1.5 rounded-full', member.status === 'away' ? 'bg-amber-500' : 'bg-emerald-500')} />
                        {member.status === 'away' ? 'Away' : 'Active'}
                      </span>
                    </span>
                  </button>
                  <Dropdown
                    trigger={
                      <span className="grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:bg-elevated">
                        <MoreHorizontal className="h-4 w-4" />
                      </span>
                    }
                    items={[
                      { label: 'View profile', icon: UserRound, onClick: () => openMemberDetail(member.id) },
                      { label: 'Edit member', icon: Pencil, onClick: () => openMemberForm(member) },
                      { separator: true },
                      { label: 'Remove member', icon: Trash2, danger: true, onClick: () => handleRemove(member) },
                    ]}
                  />
                </div>

                {member.email && (
                  <p className="mt-3 flex items-center gap-1.5 truncate text-[11px] text-muted">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </p>
                )}

                <p className="mt-1.5 flex items-center gap-1.5 truncate text-[11px] text-muted">
                  <Send className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {member.telegramChatId || 'Telegram not linked'}
                  </span>
                </p>

                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  <div className="rounded-lg bg-canvas/60 px-2 py-1.5 text-center">
                    <p className="text-sm font-bold text-ink">{entry.open}</p>
                    <p className="text-[10px] text-muted">Open</p>
                  </div>
                  <div className="rounded-lg bg-canvas/60 px-2 py-1.5 text-center">
                    <p className="text-sm font-bold text-ink">{entry.completed}</p>
                    <p className="text-[10px] text-muted">Done</p>
                  </div>
                  <div className="rounded-lg bg-canvas/60 px-2 py-1.5 text-center">
                    <p className={clsx('text-sm font-bold', entry.overdue ? 'text-rose-600 dark:text-rose-400' : 'text-ink')}>
                      {entry.overdue}
                    </p>
                    <p className="text-[10px] text-muted">Overdue</p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[10px]">
                    <span className="text-muted">Workload</span>
                    <span className={clsx('font-medium', overloaded ? 'text-rose-600 dark:text-rose-400' : 'text-muted')}>
                      {entry.utilization}% · ~{entry.estimatedHours}h
                    </span>
                  </div>
                  <ProgressBar
                    value={Math.min(entry.utilization, 100)}
                    size="sm"
                    color={entry.utilization > 100 ? '#f43f5e' : entry.utilization > 80 ? '#f59e0b' : '#6366f1'}
                  />
                </div>

                <div className="mt-3 space-y-1.5">
                  <Button
                    variant="subtle"
                    size="sm"
                    icon={Send}
                    className="w-full"
                    loading={sendingId === member.id}
                    onClick={() => sendReminder(entry)}
                  >
                    Send reminder
                  </Button>
                  <button
                    type="button"
                    onClick={() => openMemberDetail(member.id)}
                    className="w-full rounded-lg border border-edge py-1.5 text-[11px] font-medium text-muted transition hover:border-brand-200 hover:bg-brand-50/40 hover:text-brand-700 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/5 dark:hover:text-brand-300"
                  >
                    View workload & tasks
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
