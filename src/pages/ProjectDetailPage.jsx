import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import Tabs from '../components/ui/Tabs';
import Avatar, { AvatarGroup } from '../components/ui/Avatar';
import ProgressBar from '../components/ui/ProgressBar';
import EmptyState from '../components/ui/EmptyState';
import { PriorityBadge, StatusBadge } from '../components/ui/Badge';
import FilterBar from '../components/tasks/FilterBar';
import KanbanBoard from '../components/tasks/KanbanBoard';
import TaskListView from '../components/tasks/TaskListView';
import TaskCalendarView from '../components/tasks/TaskCalendarView';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import ProjectFiles from '../components/files/ProjectFiles';
import ProjectFilesCard from '../components/files/ProjectFilesCard';
import FileFormModal from '../components/files/FileFormModal';
import { useProjectStore } from '../stores/projectStore';
import { useTaskStore } from '../stores/taskStore';
import { useTeamStore } from '../stores/teamStore';
import { useUiStore } from '../stores/uiStore';
import { useActivityStore } from '../stores/activityStore';
import { useFileStore } from '../stores/fileStore';
import { filterTasks, sortTasks } from '../utils/filters';
import { getProjectProgress, getProjectTasks, getTaskCounts } from '../utils/analytics';
import { dueMeta, formatDate } from '../utils/date';

const defaultFilters = {
  search: '',
  status: 'all',
  priority: 'all',
  assigneeId: 'all',
  due: 'all',
  sort: 'priority',
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const projects = useProjectStore((s) => s.projects);
  const updateProject = useProjectStore((s) => s.updateProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const tasks = useTaskStore((s) => s.tasks);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const members = useTeamStore((s) => s.members);
  const activity = useActivityStore((s) => s.entries);
  const allFiles = useFileStore((s) => s.files);
  const openProjectForm = useUiStore((s) => s.openProjectForm);
  const openTaskForm = useUiStore((s) => s.openTaskForm);
  const openMemberDetail = useUiStore((s) => s.openMemberDetail);
  const confirm = useUiStore((s) => s.confirm);
  const pushToast = useUiStore((s) => s.pushToast);

  const [tab, setTab] = useState('overview');
  const [view, setView] = useState('kanban');
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);

  useEffect(() => {
    setTab('overview');
    setFilters(defaultFilters);
    setFileModalOpen(false);
  }, [id]);

  const project = projects.find((p) => p.id === id);
  const projectTasks = useMemo(() => (project ? getProjectTasks(project.id, tasks) : []), [project, tasks]);
  const visibleTasks = useMemo(
    () => sortTasks(filterTasks(projectTasks, filters), filters.sort),
    [projectTasks, filters]
  );
  const projectFiles = useMemo(
    () => (project ? allFiles.filter((file) => file.projectId === project.id) : []),
    [allFiles, project]
  );

  if (!project) {
    return (
      <div className="space-y-5">
        <PageHeader title="Project not found" description="This project may have been deleted.">
          <Button size="sm" icon={ArrowLeft} onClick={() => navigate('/projects')}>
            Back to projects
          </Button>
        </PageHeader>
        <EmptyState icon={FolderKanban} title="We couldn't find that project" description="It may have been removed from the workspace." />
      </div>
    );
  }

  const progress = getProjectProgress(project, tasks);
  const counts = getTaskCounts(projectTasks);
  const projectMembers = project.memberIds.map((mid) => members.find((m) => m.id === mid)).filter(Boolean);
  const projectActivity = activity.filter((a) => a.projectId === project.id);
  const upcoming = [...projectTasks]
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0))
    .slice(0, 5);
  const due = dueMeta(project.dueDate);

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete this project?',
      description: `'${project.name}' and ${projectTasks.length} associated task${projectTasks.length === 1 ? '' : 's'} will be permanently deleted.`,
      confirmLabel: 'Delete project',
    });
    if (!ok) return;
    deleteProject(project.id);
    pushToast({ type: 'info', title: 'Project deleted', message: `'${project.name}' was removed.` });
    navigate('/projects');
  };

  const handleDeleteTask = async (task) => {
    const ok = await confirm({
      title: 'Delete this task?',
      description: `'${task.title}' will be permanently removed.`,
      confirmLabel: 'Delete task',
    });
    if (!ok) return;
    deleteTask(task.id);
    pushToast({ type: 'info', title: 'Task deleted', message: `'${task.title}' was removed.` });
  };

  const changeStatus = (status) => {
    updateProject(project.id, { status });
    pushToast({ type: 'success', title: 'Status updated', message: `'${project.name}' status changed.` });
  };

  return (
    <div className="space-y-5">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All projects
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-sm font-bold text-white shadow-sm"
            style={{ backgroundColor: project.color }}
          >
            {project.key.slice(0, 3)}
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">{project.name}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
              {project.description || 'No description yet.'}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={project.status} kind="project" />
              <PriorityBadge priority={project.priority} />
              <span className="inline-flex items-center gap-1 rounded-full bg-elevated px-2.5 py-1 text-[11px] text-muted ring-1 ring-inset ring-edge">
                <CalendarDays className="h-3 w-3" />
                {formatDate(project.startDate, 'MMM d')} → {formatDate(project.dueDate, 'MMM d, yyyy')}
              </span>
              {projectMembers.length > 0 && <AvatarGroup members={projectMembers} max={5} size="xs" />}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" icon={Pencil} onClick={() => openProjectForm(project)}>
            Edit
          </Button>
          <Button variant="danger-ghost" size="sm" icon={Trash2} onClick={handleDelete}>
            Delete
          </Button>
          <Button size="sm" icon={Plus} onClick={() => openTaskForm(null, { projectId: project.id })}>
            New task
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted">Overall progress</span>
            <span className="text-sm font-bold text-ink">{progress}%</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <span>
              {counts.completed}/{counts.total} tasks done
            </span>
            <span className="text-muted/40">·</span>
            <select
              value={project.status}
              onChange={(e) => changeStatus(e.target.value)}
              className="rounded-lg border border-edge bg-surface px-2 py-1 text-[11px] text-ink outline-none"
              aria-label="Change project status"
            >
              {['planning', 'in-progress', 'on-hold', 'completed'].map((status) => (
                <option key={status} value={status}>
                  {status
                    .split('-')
                    .map((s) => s[0].toUpperCase() + s.slice(1))
                    .join(' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
        <ProgressBar value={progress} color={project.color} size="lg" className="mt-2.5" />
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Open tasks', value: counts.open, icon: ListChecks, tone: 'text-brand-600 dark:text-brand-400' },
          { label: 'Completed', value: counts.completed, icon: CheckCircle2, tone: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Overdue', value: counts.overdue, icon: Clock, tone: 'text-rose-600 dark:text-rose-400' },
          { label: 'Team members', value: projectMembers.length, icon: Users, tone: 'text-violet-600 dark:text-violet-400' },
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

      <Tabs
        tabs={[
          { value: 'overview', label: 'Overview', icon: LayoutDashboard },
          { value: 'tasks', label: 'Tasks', icon: ListChecks, count: projectTasks.length },
          { value: 'files', label: 'Files', icon: Paperclip, count: projectFiles.length },
          { value: 'team', label: 'Team', icon: Users, count: projectMembers.length },
          { value: 'activity', label: 'Activity', icon: Clock },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader title="Next up" subtitle="Open tasks ordered by deadline" icon={ListChecks} />
              <div className="px-5 pb-4 pt-3">
                {upcoming.length === 0 ? (
                  <EmptyState compact icon={CheckCircle2} title="All caught up" description="No open tasks in this project." />
                ) : (
                  <ul className="space-y-1.5">
                    {upcoming.map((task) => {
                      const meta = dueMeta(task.dueDate);
                      const assignee = members.find((m) => m.id === task.assigneeId);
                      return (
                        <li key={task.id}>
                          <button
                            type="button"
                            onClick={() => openTaskForm(task)}
                            className="flex w-full items-center gap-3 rounded-xl border border-edge px-3 py-2.5 text-left transition hover:border-brand-200 hover:bg-brand-50/30 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/5"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-medium text-ink">{task.title}</span>
                              <span className={`mt-0.5 block text-[11px] ${meta.tone === 'danger' ? 'text-rose-500' : 'text-muted'}`}>
                                {meta.label}
                              </span>
                            </span>
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
            </Card>

            <ProjectFilesCard
              files={projectFiles}
              onAdd={() => setFileModalOpen(true)}
              onOpenAll={() => setTab('files')}
            />

            <Card>
              <CardHeader title="Project details" subtitle="Scope and timeline" icon={FolderKanban} />
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 px-5 pb-5 pt-3 text-sm sm:grid-cols-2">
                {[
                  ['Project key', project.key],
                  ['Status', <StatusBadge key="s" status={project.status} kind="project" size="sm" />],
                  ['Start date', formatDate(project.startDate)],
                  ['Due date', `${formatDate(project.dueDate)}${due.diff !== null && due.diff < 0 ? ' (overdue)' : ''}`],
                  ['Priority', <PriorityBadge key="p" priority={project.priority} size="sm" />],
                  ['Created', formatDate(project.createdAt, 'MMM d, yyyy')],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[11px] uppercase tracking-wider text-muted">{label}</dt>
                    <dd className="mt-0.5 text-[13px] font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Team"
              subtitle="Members with access to this project"
              icon={Users}
              action={
                <button
                  type="button"
                  onClick={() => openProjectForm(project)}
                  className="text-[11px] font-medium text-brand-600 hover:underline dark:text-brand-400"
                >
                  Manage
                </button>
              }
            />
            <div className="px-5 pb-5 pt-3">
              {projectMembers.length === 0 ? (
                <EmptyState
                  compact
                  icon={UserPlus}
                  title="No members assigned"
                  description="Add teammates from project settings."
                  action={
                    <Button size="sm" variant="secondary" icon={UserPlus} onClick={() => openProjectForm(project)}>
                      Add members
                    </Button>
                  }
                />
              ) : (
                <ul className="space-y-1">
                  {projectMembers.map((member) => {
                    const memberTasks = projectTasks.filter((t) => t.assigneeId === member.id);
                    const memberOpen = memberTasks.filter((t) => t.status !== 'completed').length;
                    return (
                      <li key={member.id}>
                        <button
                          type="button"
                          onClick={() => openMemberDetail(member.id)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-2 text-left transition hover:bg-canvas/70"
                        >
                          <Avatar member={member} size="sm" showStatus />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12.5px] font-medium text-ink">{member.name}</span>
                            <span className="block truncate text-[10.5px] text-muted">{member.role}</span>
                          </span>
                          <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-medium text-muted">
                            {memberOpen} open
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>
        </div>
      )}

      {tab === 'tasks' && (
        <div className="space-y-4">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            projects={projects}
            members={members}
            showProject={false}
            view={view}
            onViewChange={setView}
            onClear={() => setFilters(defaultFilters)}
            resultCount={visibleTasks.length}
          />
          {view === 'kanban' && (
            <KanbanBoard
              tasks={visibleTasks}
              projects={projects}
              members={members}
              onEdit={openTaskForm}
              onDelete={handleDeleteTask}
              defaultProjectId={project.id}
            />
          )}
          {view === 'list' && (
            <TaskListView
              tasks={visibleTasks}
              projects={projects}
              members={members}
              onEdit={openTaskForm}
              onDelete={handleDeleteTask}
              showProject={false}
              emptyTitle="No tasks in this project"
              emptyDescription="Create a task to start tracking progress."
            />
          )}
          {view === 'calendar' && (
            <TaskCalendarView
              tasks={visibleTasks}
              projects={projects}
              members={members}
              onEdit={openTaskForm}
              defaultProjectId={project.id}
            />
          )}
        </div>
      )}

      {tab === 'team' && (
        <Card>
          <CardHeader
            title={`Team · ${projectMembers.length} members`}
            subtitle="Project-specific workload"
            icon={Users}
            action={
              <Button size="sm" variant="secondary" icon={Pencil} onClick={() => openProjectForm(project)}>
                Manage members
              </Button>
            }
          />
          <div className="px-5 pb-5 pt-3">
            {projectMembers.length === 0 ? (
              <EmptyState icon={UserPlus} title="No members yet" description="Add teammates so you can assign work." />
            ) : (
              <ul className="divide-y divide-edge">
                {projectMembers.map((member) => {
                  const memberTasks = projectTasks.filter((t) => t.assigneeId === member.id);
                  const memberCounts = getTaskCounts(memberTasks);
                  const utilization = Math.min(
                    Math.round(((memberCounts.open * 8) / (member.capacity || 40)) * 100),
                    100
                  );
                  return (
                    <li key={member.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={() => openMemberDetail(member.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <Avatar member={member} size="md" showStatus />
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium text-ink">{member.name}</span>
                          <span className="block truncate text-[11px] text-muted">{member.role}</span>
                        </span>
                      </button>
                      <div className="flex items-center gap-4 text-[11px] text-muted">
                        <span>
                          <span className="font-semibold text-ink">{memberCounts.open}</span> open
                        </span>
                        <span>
                          <span className="font-semibold text-ink">{memberCounts.completed}</span> done
                        </span>
                        <span className={memberCounts.overdue ? 'text-rose-500' : ''}>
                          <span className="font-semibold">{memberCounts.overdue}</span> overdue
                        </span>
                      </div>
                      <div className="w-full sm:w-40">
                        <div className="mb-1 flex justify-between text-[10px] text-muted">
                          <span>Utilization</span>
                          <span>{utilization}%</span>
                        </div>
                        <ProgressBar value={utilization} size="sm" color={utilization > 85 ? '#f59e0b' : project.color} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
      )}

      {tab === 'files' && (
        <ProjectFiles project={project} files={projectFiles} onAdd={() => setFileModalOpen(true)} />
      )}

      {tab === 'activity' && (
        <ActivityFeed entries={projectActivity} members={members} projects={projects} />
      )}

      <FileFormModal
        open={fileModalOpen}
        onClose={() => setFileModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
      />
    </div>
  );
}
