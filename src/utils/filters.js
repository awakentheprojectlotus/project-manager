import { PRIORITY_MAP } from '../constants';
import { daysUntil } from './date';
import { normalize } from './match';

const matchSearch = (text, search) => {
  if (!search) return true;
  return normalize(text).includes(normalize(search));
};

export const filterTasks = (
  tasks,
  { search = '', projectId = 'all', status = 'all', priority = 'all', assigneeId = 'all', due = 'all', memberIds = null } = {}
) =>
  tasks.filter((task) => {
    if (projectId !== 'all' && task.projectId !== projectId) return false;
    if (status !== 'all' && task.status !== status) return false;
    if (priority !== 'all' && task.priority !== priority) return false;
    if (assigneeId !== 'all' && task.assigneeId !== assigneeId) return false;
    if (memberIds && !memberIds.includes(task.assigneeId)) return false;
    if (search && !matchSearch(`${task.title} ${task.description}`, search)) return false;

    if (due !== 'all') {
      if (task.status === 'completed' && due !== 'none') return false;
      const diff = daysUntil(task.dueDate);
      if (due === 'overdue' && !(diff !== null && diff < 0)) return false;
      if (due === 'today' && diff !== 0) return false;
      if (due === 'week' && !(diff !== null && diff >= 0 && diff <= 7)) return false;
      if (due === 'month' && !(diff !== null && diff >= 0 && diff <= 30)) return false;
      if (due === 'none' && task.dueDate) return false;
    }
    return true;
  });

export const sortTasks = (tasks, sort = 'priority') => {
  const copy = [...tasks];
  if (sort === 'priority') {
    copy.sort((a, b) => {
      const rank = (PRIORITY_MAP[b.priority]?.rank || 0) - (PRIORITY_MAP[a.priority]?.rank || 0);
      if (rank !== 0) return rank;
      const da = daysUntil(a.dueDate);
      const db = daysUntil(b.dueDate);
      return (da ?? 9999) - (db ?? 9999);
    });
  } else if (sort === 'dueDate') {
    copy.sort((a, b) => (daysUntil(a.dueDate) ?? 9999) - (daysUntil(b.dueDate) ?? 9999));
  } else if (sort === 'createdAt') {
    copy.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } else if (sort === 'title') {
    copy.sort((a, b) => a.title.localeCompare(b.title));
  }
  return copy;
};

export const filterProjects = (projects, { search = '', status = 'all', priority = 'all', memberId = 'all' } = {}) =>
  projects.filter((project) => {
    if (status !== 'all' && project.status !== status) return false;
    if (priority !== 'all' && project.priority !== priority) return false;
    if (memberId !== 'all' && !project.memberIds.includes(memberId)) return false;
    if (search && !matchSearch(`${project.name} ${project.key} ${project.description}`, search)) return false;
    return true;
  });

export const countActiveFilters = (filters) =>
  Object.entries(filters).filter(
    ([key, value]) =>
      !['search', 'sort'].includes(key) &&
      value !== 'all' &&
      value !== '' &&
      value !== null &&
      value !== undefined
  ).length;
