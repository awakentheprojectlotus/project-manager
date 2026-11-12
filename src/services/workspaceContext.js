import { useProjectStore } from '../stores/projectStore';
import { useTaskStore } from '../stores/taskStore';
import { useTeamStore } from '../stores/teamStore';
import { useUiStore } from '../stores/uiStore';
import { getAtRiskProjects, getProjectProgress, getProjectTasks, getTaskCounts, getWorkload } from '../utils/analytics';
import { daysUntil, todayISO } from '../utils/date';

export const buildWorkspaceContext = () => {
  const projects = useProjectStore.getState().projects;
  const tasks = useTaskStore.getState().tasks;
  const members = useTeamStore.getState().members;
  const currentUserId = useUiStore.getState().currentUserId;
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const counts = getTaskCounts(tasks);

  return {
    today: todayISO(),
    currentUser: memberMap.get(currentUserId)?.name || 'Unknown',
    counts: {
      projects: projects.length,
      activeProjects: projects.filter((p) => p.status === 'in-progress').length,
      completedProjects: projects.filter((p) => p.status === 'completed').length,
      openTasks: counts.open,
      completedTasks: counts.completed,
      overdueTasks: counts.overdue,
      completionRate: `${counts.completionRate}%`,
    },
    projects: projects.map((p) => {
      const projectTasks = getProjectTasks(p.id, tasks);
      const c = getTaskCounts(projectTasks);
      return {
        id: p.id,
        name: p.name,
        key: p.key,
        status: p.status,
        priority: p.priority,
        startDate: p.startDate,
        dueDate: p.dueDate,
        progress: `${getProjectProgress(p, tasks)}%`,
        openTasks: c.open,
        overdueTasks: c.overdue,
        members: p.memberIds.map((id) => memberMap.get(id)?.name).filter(Boolean),
      };
    }),
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      projectId: t.projectId,
      project: projectMap.get(t.projectId)?.name || null,
      assigneeId: t.assigneeId,
      assignee: memberMap.get(t.assigneeId)?.name || 'Unassigned',
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      overdue: t.status !== 'completed' && daysUntil(t.dueDate) < 0,
      subtasks: t.subtasks?.length
        ? `${t.subtasks.filter((s) => s.done).length}/${t.subtasks.length} done`
        : null,
    })),
    members: getWorkload(members, tasks).map((w) => ({
      id: w.member.id,
      name: w.member.name,
      role: w.member.role,
      openTasks: w.open,
      completedTasks: w.completed,
      overdueTasks: w.overdue,
      utilization: `${w.utilization}%`,
    })),
    atRiskProjects: getAtRiskProjects(projects, tasks).map((r) => ({
      name: r.project.name,
      risk: r.risk,
      reasons: r.reasons,
    })),
  };
};

export const buildContextSummary = () => {
  const context = buildWorkspaceContext();
  return `${context.projects.length} projects · ${context.tasks.length} tasks · ${context.members.length} members`;
};
