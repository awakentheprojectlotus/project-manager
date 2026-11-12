import { useMemo, useState } from 'react';
import { FolderKanban, LayoutGrid, Plus, Search, X } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input, { Select } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import ProjectCard from '../components/projects/ProjectCard';
import { useProjectStore } from '../stores/projectStore';
import { useTaskStore } from '../stores/taskStore';
import { useTeamStore } from '../stores/teamStore';
import { useUiStore } from '../stores/uiStore';
import { PRIORITIES, PROJECT_STATUSES } from '../constants';
import { filterProjects } from '../utils/filters';
import { getWorkspaceStats } from '../utils/analytics';

export default function ProjectsPage() {
  const projects = useProjectStore((s) => s.projects);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const tasks = useTaskStore((s) => s.tasks);
  const members = useTeamStore((s) => s.members);
  const openProjectForm = useUiStore((s) => s.openProjectForm);
  const confirm = useUiStore((s) => s.confirm);
  const pushToast = useUiStore((s) => s.pushToast);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    memberId: 'all',
  });

  const visible = useMemo(
    () =>
      filterProjects(projects, filters).sort((a, b) => {
        const order = { 'in-progress': 0, planning: 1, 'on-hold': 2, completed: 3 };
        const byStatus = (order[a.status] ?? 4) - (order[b.status] ?? 4);
        if (byStatus !== 0) return byStatus;
        return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
      }),
    [projects, filters]
  );

  const stats = getWorkspaceStats(projects, tasks);
  const activeFilters = filters.status !== 'all' || filters.priority !== 'all' || filters.memberId !== 'all' || filters.search;

  const handleDelete = async (project) => {
    const count = tasks.filter((t) => t.projectId === project.id).length;
    const ok = await confirm({
      title: 'Delete this project?',
      description: `'${project.name}' and ${count} associated task${count === 1 ? '' : 's'} will be permanently deleted.`,
      confirmLabel: 'Delete project',
    });
    if (!ok) return;
    deleteProject(project.id);
    pushToast({ type: 'info', title: 'Project deleted', message: `'${project.name}' and its tasks were removed.` });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Portfolio"
        title="Projects"
        description={`${stats.totalProjects} projects · ${stats.activeProjects} active · ${stats.completedProjects} completed`}
      >
        <Button size="sm" icon={Plus} onClick={() => openProjectForm()}>
          New project
        </Button>
      </PageHeader>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-[200px] flex-1">
            <Input
              icon={Search}
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search projects…"
              aria-label="Search projects"
            />
          </div>
          <Select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="min-w-[140px] flex-1 sm:flex-none"
            options={[{ value: 'all', label: 'All statuses' }, ...PROJECT_STATUSES.map((s) => ({ value: s.value, label: s.label }))]}
            aria-label="Filter by status"
          />
          <Select
            value={filters.priority}
            onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
            className="min-w-[135px] flex-1 sm:flex-none"
            options={[{ value: 'all', label: 'All priorities' }, ...PRIORITIES.map((p) => ({ value: p.value, label: p.label }))]}
            aria-label="Filter by priority"
          />
          <Select
            value={filters.memberId}
            onChange={(e) => setFilters((f) => ({ ...f, memberId: e.target.value }))}
            className="min-w-[150px] flex-1 sm:flex-none"
            options={[
              { value: 'all', label: 'All members' },
              ...members.map((m) => ({ value: m.id, label: m.name })),
            ]}
            aria-label="Filter by member"
          />
          {activeFilters && (
            <Button
              variant="ghost"
              size="sm"
              icon={X}
              onClick={() => setFilters({ search: '', status: 'all', priority: 'all', memberId: 'all' })}
            >
              Clear
            </Button>
          )}
          <span className="ml-auto text-[11px] text-muted">
            {visible.length} {visible.length === 1 ? 'project' : 'projects'}
          </span>
        </div>
      </Card>

      {visible.length === 0 ? (
        <EmptyState
          icon={activeFilters ? Search : LayoutGrid}
          title={activeFilters ? 'No projects match your filters' : 'No projects yet'}
          description={
            activeFilters
              ? 'Try clearing the filters or searching for something else.'
              : 'Create your first project to start organizing tasks and teammates.'
          }
          action={
            activeFilters ? (
              <Button
                variant="secondary"
                size="sm"
                icon={X}
                onClick={() => setFilters({ search: '', status: 'all', priority: 'all', memberId: 'all' })}
              >
                Clear filters
              </Button>
            ) : (
              <Button size="sm" icon={Plus} onClick={() => openProjectForm()}>
                Create project
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              tasks={tasks}
              members={members}
              onEdit={openProjectForm}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-xl border border-edge bg-surface px-4 py-2.5 text-[11px] text-muted">
        <FolderKanban className="h-3.5 w-3.5" />
        Projects group tasks, teammates and maintenance areas. Use the status dots to spot what needs attention.
      </div>
    </div>
  );
}
