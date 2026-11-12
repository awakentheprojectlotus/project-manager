import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FolderKanban,
  ListChecks,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import StatCard from '../components/dashboard/StatCard';
import AiSpotlight from '../components/dashboard/AiSpotlight';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import UpcomingDeadlines from '../components/dashboard/UpcomingDeadlines';
import ProjectProgressList from '../components/dashboard/ProjectProgressList';
import { StatusDonut, TaskCompletionChart, WorkloadChart } from '../components/dashboard/Charts';
import ProgressBar from '../components/ui/ProgressBar';
import { useProjectStore } from '../stores/projectStore';
import { useTaskStore } from '../stores/taskStore';
import { useTeamStore } from '../stores/teamStore';
import { useUiStore } from '../stores/uiStore';
import { useActivityStore } from '../stores/activityStore';
import {
  getCompletionTrend,
  getStatusDistribution,
  getTasksDueWithin,
  getWorkload,
  getWorkspaceStats,
} from '../utils/analytics';

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export default function OverviewPage() {
  const projects = useProjectStore((s) => s.projects);
  const tasks = useTaskStore((s) => s.tasks);
  const members = useTeamStore((s) => s.members);
  const activity = useActivityStore((s) => s.entries);
  const currentUserId = useUiStore((s) => s.currentUserId);
  const openTaskForm = useUiStore((s) => s.openTaskForm);
  const openProjectForm = useUiStore((s) => s.openProjectForm);

  const user = members.find((m) => m.id === currentUserId);
  const stats = getWorkspaceStats(projects, tasks);
  const trend = getCompletionTrend(tasks, 8);
  const statusData = getStatusDistribution(tasks);
  const upcoming = getTasksDueWithin(tasks, 14);
  const workload = getWorkload(members, tasks);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Workspace overview"
        title={`${greeting()}, ${user?.name?.split(' ')[0] || 'there'}`}
        description="Here's the pulse of your projects, tasks and team today."
      >
        <Button variant="secondary" size="sm" icon={Plus} onClick={() => openProjectForm()}>
          New project
        </Button>
        <Button size="sm" icon={Plus} onClick={() => openTaskForm(null, { assigneeId: currentUserId })}>
          New task
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total projects"
          value={stats.totalProjects}
          icon={FolderKanban}
          tone="brand"
          hint="All time"
        />
        <StatCard
          label="Active projects"
          value={stats.activeProjects}
          icon={Sparkles}
          tone="violet"
          hint="In progress"
          footer={
            <Link to="/projects" className="text-[11px] font-medium text-brand-600 hover:underline dark:text-brand-400">
              View projects →
            </Link>
          }
        />
        <StatCard
          label="Completed projects"
          value={stats.completedProjects}
          icon={CheckCircle2}
          tone="emerald"
          hint="Delivered"
        />
        <StatCard
          label="Pending tasks"
          value={stats.pendingTasks}
          icon={ListChecks}
          tone="sky"
          hint={`${stats.totalTasks} total`}
          footer={
            <Link to="/tasks" className="text-[11px] font-medium text-brand-600 hover:underline dark:text-brand-400">
              Go to my tasks →
            </Link>
          }
        />
        <StatCard
          label="Overdue tasks"
          value={stats.overdueTasks}
          icon={AlertTriangle}
          tone="rose"
          hint={stats.overdueTasks ? 'Needs attention' : 'On track'}
          footer={
            stats.overdueTasks > 0 ? (
              <Link to="/tasks" className="text-[11px] font-medium text-rose-600 hover:underline dark:text-rose-400">
                Review overdue →
              </Link>
            ) : (
              <span className="text-[11px] text-muted">Nothing is late</span>
            )
          }
        />
        <StatCard
          label="Completion rate"
          value={`${stats.completionRate}%`}
          icon={TrendingUp}
          tone="amber"
          hint="Tasks"
          footer={<ProgressBar value={stats.completionRate} size="sm" color="#f59e0b" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader
            title="Task flow"
            subtitle="Completed vs created over the last 8 weeks"
            icon={TrendingUp}
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
          <div className="px-5 pb-2 pt-4">
            <TaskCompletionChart data={trend} />
          </div>
          <div className="flex items-center justify-between border-t border-edge px-5 py-2.5 text-[11px] text-muted">
            <span>
              {trend.reduce((sum, w) => sum + w.completed, 0)} completed in this period
            </span>
            <Link to="/reports" className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline dark:text-brand-400">
              Full analytics
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>

        <div className="lg:col-span-4">
          <AiSpotlight />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <CardHeader title="Task distribution" subtitle="Current status of all tasks" icon={ListChecks} />
          <div className="px-5 pb-5 pt-3">
            <StatusDonut data={statusData} total={tasks.length} />
          </div>
        </Card>
        <div className="xl:col-span-4">
          <ProjectProgressList projects={projects} tasks={tasks} />
        </div>
        <div className="md:col-span-2 xl:col-span-4">
          <UpcomingDeadlines tasks={upcoming} projects={projects} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ActivityFeed entries={activity} members={members} projects={projects} />
        </div>
        <Card className="lg:col-span-5">
          <CardHeader
            title="Team workload"
            subtitle="Open tasks per member"
            icon={Users}
            action={
              <Link
                to="/team"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                Team
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            }
          />
          <div className="px-3 pb-4 pt-4">
            <WorkloadChart data={workload} />
          </div>
          <div className="border-t border-edge px-5 py-2.5 text-[11px] text-muted">
            {workload.filter((w) => w.utilization > 90).length} member(s) above 90% capacity
          </div>
        </Card>
      </div>
    </div>
  );
}
