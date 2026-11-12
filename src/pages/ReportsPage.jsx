import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  FolderKanban,
  ListChecks,
  TrendingUp,
  Users,
} from 'lucide-react';
import clsx from 'clsx';
import PageHeader from '../components/ui/PageHeader';
import Card, { CardHeader } from '../components/ui/Card';
import StatCard from '../components/dashboard/StatCard';
import Tabs from '../components/ui/Tabs';
import ProgressBar from '../components/ui/ProgressBar';
import Avatar from '../components/ui/Avatar';
import { PriorityBadge, StatusBadge } from '../components/ui/Badge';
import { PriorityChart, StatusDonut, TaskCompletionChart, WorkloadChart } from '../components/dashboard/Charts';
import { useProjectStore } from '../stores/projectStore';
import { useTaskStore } from '../stores/taskStore';
import { useTeamStore } from '../stores/teamStore';
import {
  getCompletionTrend,
  getPriorityDistribution,
  getProjectsSummary,
  getStatusDistribution,
  getWorkload,
  getWorkspaceStats,
} from '../utils/analytics';
import { daysUntil, formatDate } from '../utils/date';

export default function ReportsPage() {
  const projects = useProjectStore((s) => s.projects);
  const tasks = useTaskStore((s) => s.tasks);
  const members = useTeamStore((s) => s.members);
  const [range, setRange] = useState('8');

  const stats = getWorkspaceStats(projects, tasks);
  const ranges = useMemo(() => parseInt(range, 10), [range]);
  const trend = useMemo(() => getCompletionTrend(tasks, ranges), [tasks, ranges]);
  const statusData = getStatusDistribution(tasks);
  const priorityData = getPriorityDistribution(tasks);
  const workload = getWorkload(members, tasks);
  const projectsSummary = getProjectsSummary(projects, tasks).sort((a, b) => {
    const order = { 'in-progress': 0, planning: 1, 'on-hold': 2, completed: 3 };
    return (order[a.project.status] ?? 4) - (order[b.project.status] ?? 4);
  });
  const avgProgress = projects.length
    ? Math.round(projectsSummary.reduce((sum, p) => sum + p.progress, 0) / projects.length)
    : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Insights"
        title="Reports & Analytics"
        description="Understand throughput, workload and project health across the workspace."
      >
        <Tabs
          tabs={[
            { value: '4', label: '4 weeks' },
            { value: '8', label: '8 weeks' },
            { value: '12', label: '12 weeks' },
          ]}
          value={range}
          onChange={setRange}
        />
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Task completion" value={`${stats.completionRate}%`} icon={TrendingUp} tone="brand" hint="All tasks" />
        <StatCard label="Avg. project progress" value={`${avgProgress}%`} icon={FolderKanban} tone="violet" hint={`${projects.length} projects`} />
        <StatCard label="Completed tasks" value={stats.completedTasks} icon={CheckCircle2} tone="emerald" hint={`of ${stats.totalTasks}`} />
        <StatCard label="Overdue tasks" value={stats.overdueTasks} icon={AlertTriangle} tone="rose" hint={stats.overdueTasks ? 'Action needed' : 'All clear'} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader
            title="Throughput"
            subtitle={`Created vs completed over the last ${range} weeks`}
            icon={BarChart3}
            action={
              <div className="flex items-center gap-3 text-[11px] text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-brand-500" />
                  Completed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  Created
                </span>
              </div>
            }
          />
          <div className="px-5 pb-3 pt-4">
            <TaskCompletionChart data={trend} />
          </div>
          <div className="border-t border-edge px-5 py-2.5 text-[11px] text-muted">
            {trend.reduce((sum, w) => sum + w.completed, 0)} completed · {trend.reduce((sum, w) => sum + w.created, 0)} created
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader title="Status distribution" subtitle="Where work currently sits" icon={ListChecks} />
          <div className="px-5 pb-5 pt-3">
            <StatusDonut data={statusData} total={tasks.length} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader
            title="Project health"
            subtitle="Progress, overdue work and deadlines"
            icon={FolderKanban}
            action={
              <Link to="/projects" className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:underline dark:text-brand-400">
                Projects
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-y border-edge bg-canvas/50">
                  <th className="table-head px-5 py-2">Project</th>
                  <th className="table-head px-3 py-2">Status</th>
                  <th className="table-head px-3 py-2">Tasks</th>
                  <th className="table-head px-3 py-2">Overdue</th>
                  <th className="table-head px-3 py-2">Progress</th>
                  <th className="table-head px-5 py-2">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {projectsSummary.map(({ project, progress, counts }) => {
                  const diff = daysUntil(project.dueDate);
                  return (
                    <tr key={project.id} className="transition hover:bg-canvas/40">
                      <td className="px-5 py-2.5">
                        <Link to={`/projects/${project.id}`} className="flex items-center gap-2">
                          <span
                            className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[9px] font-bold text-white"
                            style={{ backgroundColor: project.color }}
                          >
                            {project.key.slice(0, 2)}
                          </span>
                          <span className="max-w-[170px] truncate text-[12.5px] font-medium text-ink hover:text-brand-700 dark:hover:text-brand-300">
                            {project.name}
                          </span>
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={project.status} kind="project" size="sm" />
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted">
                        {counts.completed}/{counts.total}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={clsx('text-xs', counts.overdue ? 'font-medium text-rose-600 dark:text-rose-400' : 'text-muted')}>
                          {counts.overdue}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex min-w-[110px] items-center gap-2">
                          <ProgressBar value={progress} color={project.color} size="sm" className="w-20" />
                          <span className="text-[11px] font-medium text-ink">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        <span
                          className={clsx(
                            'text-[11px]',
                            diff !== null && diff < 0 ? 'font-medium text-rose-600 dark:text-rose-400' : 'text-muted'
                          )}
                        >
                          {formatDate(project.dueDate, 'MMM d')}
                          {diff !== null && diff < 0 ? ` · ${Math.abs(diff)}d late` : ''}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader title="Open tasks by priority" subtitle="Current workload mix" icon={AlertTriangle} />
          <div className="px-4 pb-4 pt-4">
            <PriorityChart data={priorityData} />
          </div>
          <div className="border-t border-edge px-5 py-2.5 text-[11px] text-muted">
            {priorityData.find((p) => p.key === 'urgent')?.value || 0} urgent tasks remain open
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader title="Team performance" subtitle="Assigned work and completion" icon={Users} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-y border-edge bg-canvas/50">
                  <th className="table-head px-5 py-2">Member</th>
                  <th className="table-head px-3 py-2">Open</th>
                  <th className="table-head px-3 py-2">Done</th>
                  <th className="table-head px-3 py-2">Overdue</th>
                  <th className="table-head px-5 py-2">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {workload.map((entry) => (
                  <tr key={entry.member.id} className="transition hover:bg-canvas/40">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar member={entry.member} size="xs" />
                        <div className="min-w-0">
                          <p className="max-w-[150px] truncate text-[12.5px] font-medium text-ink">{entry.member.name}</p>
                          <p className="max-w-[150px] truncate text-[10px] text-muted">{entry.member.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-medium text-ink">{entry.open}</td>
                    <td className="px-3 py-2.5 text-xs text-muted">{entry.completed}</td>
                    <td className={clsx('px-3 py-2.5 text-xs', entry.overdue ? 'font-medium text-rose-600 dark:text-rose-400' : 'text-muted')}>
                      {entry.overdue}
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex min-w-[120px] items-center gap-2">
                        <ProgressBar
                          value={Math.min(entry.utilization, 100)}
                          size="sm"
                          color={entry.utilization > 100 ? '#f43f5e' : entry.utilization > 80 ? '#f59e0b' : '#10b981'}
                          className="w-16"
                        />
                        <span className="text-[11px] text-muted">{entry.utilization}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader title="Workload balance" subtitle="Open tasks per member" icon={Users} />
          <div className="px-3 pb-4 pt-4">
            <WorkloadChart data={workload} />
          </div>
          <div className="border-t border-edge px-5 py-2.5 text-[11px] text-muted">
            {workload.filter((w) => w.utilization > 100).length} overallocated member(s)
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-edge bg-surface px-4 py-2.5 text-[11px] text-muted">
        <BarChart3 className="h-3.5 w-3.5" />
        Metrics update automatically from the shared workspace state. Utilization estimates 8h per open task against weekly capacity.
      </div>
    </div>
  );
}
