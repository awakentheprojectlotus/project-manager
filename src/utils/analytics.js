import { differenceInCalendarDays, startOfWeek, addWeeks, format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { daysUntil, parseDate, todayISO } from './date';
import { clamp, percent } from './helpers';

export const getProjectTasks = (projectId, tasks) => tasks.filter((t) => t.projectId === projectId);

export const getProjectProgress = (project, tasks) => {
  const projectTasks = getProjectTasks(project.id, tasks);
  if (!projectTasks.length) return project.status === 'completed' ? 100 : 0;
  const done = projectTasks.filter((t) => t.status === 'completed').length;
  return percent(done, projectTasks.length);
};

export const getTaskCounts = (tasks) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const overdue = tasks.filter((t) => t.status !== 'completed' && daysUntil(t.dueDate) < 0).length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
  const inReview = tasks.filter((t) => t.status === 'in-review').length;
  const todo = tasks.filter((t) => t.status === 'todo').length;
  return {
    total,
    completed,
    open: total - completed,
    overdue,
    inProgress,
    inReview,
    todo,
    completionRate: percent(completed, total),
  };
};

export const getWorkspaceStats = (projects, tasks) => {
  const taskCounts = getTaskCounts(tasks);
  const active = projects.filter((p) => p.status === 'in-progress').length;
  const completed = projects.filter((p) => p.status === 'completed').length;
  const planning = projects.filter((p) => p.status === 'planning').length;
  const onHold = projects.filter((p) => p.status === 'on-hold').length;
  return {
    totalProjects: projects.length,
    activeProjects: active,
    completedProjects: completed,
    planningProjects: planning,
    onHoldProjects: onHold,
    pendingTasks: taskCounts.open,
    overdueTasks: taskCounts.overdue,
    completedTasks: taskCounts.completed,
    totalTasks: taskCounts.total,
    completionRate: taskCounts.completionRate,
    projectCompletionRate: projects.length
      ? Math.round(projects.reduce((sum, p) => sum + getProjectProgress(p, tasks), 0) / projects.length)
      : 0,
  };
};

export const getOverdueTasks = (tasks) =>
  tasks
    .filter((t) => t.status !== 'completed' && daysUntil(t.dueDate) < 0)
    .sort((a, b) => (daysUntil(a.dueDate) ?? 0) - (daysUntil(b.dueDate) ?? 0));

export const getTasksDueWithin = (tasks, days = 7, includeOverdue = false) =>
  tasks
    .filter((t) => {
      if (t.status === 'completed' || !t.dueDate) return false;
      const diff = daysUntil(t.dueDate);
      if (includeOverdue) return diff <= days;
      return diff >= 0 && diff <= days;
    })
    .sort((a, b) => (daysUntil(a.dueDate) ?? 0) - (daysUntil(b.dueDate) ?? 0));

export const getUpcomingDeadlines = (tasks, days = 14) =>
  getTasksDueWithin(tasks, days, false).slice(0, 8);

export const getUrgentTasks = (tasks) =>
  tasks
    .filter((t) => t.status !== 'completed' && ['urgent', 'high'].includes(t.priority))
    .sort((a, b) => {
      if (a.priority === b.priority) return (daysUntil(a.dueDate) ?? 999) - (daysUntil(b.dueDate) ?? 999);
      return a.priority === 'urgent' ? -1 : 1;
    });

export const getMemberStats = (member, tasks) => {
  const assigned = tasks.filter((t) => t.assigneeId === member.id);
  const counts = getTaskCounts(assigned);
  const estimatedHours = counts.open * 8;
  return {
    member,
    assigned,
    ...counts,
    estimatedHours,
    utilization: clamp(Math.round((estimatedHours / (member.capacity || 40)) * 100), 0, 160),
  };
};

export const getWorkload = (members, tasks) =>
  members
    .map((m) => getMemberStats(m, tasks))
    .sort((a, b) => b.open - a.open);

export const getAtRiskProjects = (projects, tasks) => {
  const today = new Date();
  return projects
    .filter((p) => p.status !== 'completed')
    .map((project) => {
      const projectTasks = getProjectTasks(project.id, tasks);
      const progress = getProjectProgress(project, tasks);
      const overdueCount = getOverdueTasks(projectTasks).length;
      const daysLeft = daysUntil(project.dueDate);
      const start = parseDate(project.startDate);
      const due = parseDate(project.dueDate);
      let expected = 0;
      if (start && due) {
        const total = differenceInCalendarDays(due, start);
        const elapsed = differenceInCalendarDays(today, start);
        expected = total > 0 ? clamp(Math.round((elapsed / total) * 100), 0, 100) : 100;
      }
      const slippage = expected - progress;
      const reasons = [];
      if (overdueCount > 0) reasons.push(`${overdueCount} overdue ${overdueCount === 1 ? 'task' : 'tasks'}`);
      if (daysLeft !== null && daysLeft < 0) reasons.push('past due date');
      else if (daysLeft !== null && daysLeft <= 5) reasons.push(`due in ${daysLeft}d`);
      if (slippage >= 20) reasons.push(`${slippage}% behind expected progress`);

      let risk = 'low';
      if (overdueCount > 0 || (daysLeft !== null && daysLeft < 0) || slippage >= 35) risk = 'high';
      else if ((daysLeft !== null && daysLeft <= 5 && progress < 85) || slippage >= 15) risk = 'medium';

      return {
        project,
        progress,
        expected,
        overdueCount,
        daysLeft,
        risk,
        reasons,
        openTasks: projectTasks.filter((t) => t.status !== 'completed').length,
      };
    })
    .filter((item) => item.risk !== 'low')
    .sort((a, b) => (a.risk === b.risk ? b.overdueCount - a.overdueCount : a.risk === 'high' ? -1 : 1));
};

export const getCompletionTrend = (tasks, weeks = 8) => {
  const now = new Date();
  const buckets = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const start = startOfWeek(addWeeks(now, -i), { weekStartsOn: 1 });
    const end = endOfDay(addWeeks(start, 1));
    buckets.push({
      label: format(start, 'MMM d'),
      range: { start: startOfDay(start), end },
      completed: 0,
      created: 0,
    });
  }
  tasks.forEach((task) => {
    const created = parseDate(task.createdAt);
    const completed = parseDate(task.completedAt);
    buckets.forEach((bucket) => {
      if (created && isWithinInterval(created, bucket.range)) bucket.created += 1;
      if (completed && isWithinInterval(completed, bucket.range)) bucket.completed += 1;
    });
  });
  return buckets.map(({ range, ...rest }) => rest);
};

export const getStatusDistribution = (tasks) => {
  const counts = getTaskCounts(tasks);
  return [
    { name: 'To Do', value: counts.todo, key: 'todo' },
    { name: 'In Progress', value: counts.inProgress, key: 'in-progress' },
    { name: 'In Review', value: counts.inReview, key: 'in-review' },
    { name: 'Completed', value: counts.completed, key: 'completed' },
  ];
};

export const getPriorityDistribution = (tasks) => {
  const open = tasks.filter((t) => t.status !== 'completed');
  return ['urgent', 'high', 'medium', 'low'].map((key) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    key,
    value: open.filter((t) => t.priority === key).length,
  }));
};

export const getWeeklyThroughput = (tasks, weeks = 6) => getCompletionTrend(tasks, weeks);

export const getDueToday = (tasks) =>
  tasks.filter((t) => t.status !== 'completed' && t.dueDate === todayISO());

export const getProjectsSummary = (projects, tasks) =>
  projects.map((project) => {
    const projectTasks = getProjectTasks(project.id, tasks);
    const counts = getTaskCounts(projectTasks);
    return {
      project,
      tasks: projectTasks,
      progress: getProjectProgress(project, tasks),
      counts,
      overdue: counts.overdue,
    };
  });
