import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seedData } from './activityStore';
import { useActivityStore } from './activityStore';
import { useNotificationStore } from './notificationStore';
import { useTaskStore } from './taskStore';
import { useFileStore } from './fileStore';
import { useStatusLinkStore } from './statusLinkStore';
import { useProjectCategoryStore } from './projectCategoryStore';
import { useRequirementStore } from './requirementStore';
import { useUiStore } from './uiStore';
import { uid } from '../utils/helpers';
import { PROJECT_COLORS, PROJECT_STATUS_MAP } from '../constants';
import { todayISO, daysFromToday } from '../utils/date';

const makeKey = (name, existing) => {
  const words = (name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  let base = words.map((w) => w[0]).join('').toUpperCase().slice(0, 4);
  if (base.length < 2) base = (name || 'PRJ').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 4);
  if (!base) base = 'PRJ';
  let key = base;
  let i = 2;
  while (existing.some((p) => p.key === key)) {
    key = `${base}${i}`;
    i += 1;
  }
  return key;
};

export const useProjectStore = create(
  persist(
    (set, get) => ({
      projects: seedData.projects,

      createProject: (data) => {
        const existing = get().projects;
        const name = (data.name || 'New Project').trim();
        const project = {
          id: uid('prj'),
          key: makeKey(name, existing),
          name,
          description: data.description?.trim() || '',
          status: data.status || 'planning',
          priority: data.priority || 'medium',
          startDate: data.startDate || todayISO(),
          dueDate: data.dueDate || daysFromToday(14),
          memberIds: Array.isArray(data.memberIds) ? data.memberIds : [],
          color: data.color || PROJECT_COLORS[existing.length % PROJECT_COLORS.length],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({ projects: [project, ...existing] });
        useActivityStore.getState().log({
          type: 'project',
          message: `Project '${project.name}' was created`,
          actorId: useUiStore.getState().currentUserId,
          projectId: project.id,
        });
        useNotificationStore.getState().push({
          type: 'status',
          title: 'New project created',
          message: `'${project.name}' was added to the workspace.`,
          link: `/projects/${project.id}`,
        });
        return project;
      },

      updateProject: (id, changes) => {
        const prev = get().projects.find((p) => p.id === id);
        if (!prev) return null;
        const updated = { ...prev, ...changes, updatedAt: new Date().toISOString() };
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? updated : p)),
        }));

        const actorId = useUiStore.getState().currentUserId;
        if (prev.status !== updated.status) {
          useActivityStore.getState().log({
            type: 'project',
            message: `'${updated.name}' moved to ${PROJECT_STATUS_MAP[updated.status]?.label || updated.status}`,
            actorId,
            projectId: updated.id,
          });
          useNotificationStore.getState().push({
            type: 'status',
            title: 'Project status updated',
            message: `'${updated.name}' is now ${PROJECT_STATUS_MAP[updated.status]?.label || updated.status}.`,
            link: `/projects/${updated.id}`,
          });
        } else if (prev.dueDate !== updated.dueDate) {
          useActivityStore.getState().log({
            type: 'project',
            message: `'${updated.name}' deadline changed to ${updated.dueDate || 'none'}`,
            actorId,
            projectId: updated.id,
          });
        } else if (prev.priority !== updated.priority) {
          useActivityStore.getState().log({
            type: 'project',
            message: `'${updated.name}' priority changed to ${updated.priority}`,
            actorId,
            projectId: updated.id,
          });
        }
        return updated;
      },

      addMemberToProject: (projectId, memberId) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project || project.memberIds.includes(memberId)) return;
        get().updateProject(projectId, { memberIds: [...project.memberIds, memberId] });
      },

      removeMemberFromProject: (projectId, memberId) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) return;
        get().updateProject(projectId, {
          memberIds: project.memberIds.filter((id) => id !== memberId),
        });
      },

      deleteProject: (id) => {
        const project = get().projects.find((p) => p.id === id);
        if (!project) return;
        set({ projects: get().projects.filter((p) => p.id !== id) });
        useTaskStore.getState().deleteTasksByProject(id);
        useFileStore.getState().deleteFilesByProject(id);
        useStatusLinkStore.getState().deleteLinksByProject(id);
        useProjectCategoryStore.getState().deleteByProject(id);
        useRequirementStore.getState().deleteByProject(id);
        useActivityStore.getState().log({
          type: 'project',
          message: `Project '${project.name}' was deleted`,
          actorId: useUiStore.getState().currentUserId,
          projectId: null,
        });
      },

      reset: (projects) => set({ projects }),
    }),
    {
      name: 'pulse-projects',
      version: 2,
      migrate: (persisted, version) =>
        version < 2 ? { projects: seedData.projects } : persisted,
    }
  )
);
