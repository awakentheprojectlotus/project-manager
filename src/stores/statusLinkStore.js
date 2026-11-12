import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seedData } from './activityStore';
import { useActivityStore } from './activityStore';
import { useUiStore } from './uiStore';
import { TASK_CATEGORY_MAP } from '../constants';
import { normalizeStatusLink } from '../utils/links';

const categoryLabel = (category) => TASK_CATEGORY_MAP[category]?.label || category;

export const useStatusLinkStore = create(
  persist(
    (set, get) => ({
      links: seedData.statusLinks || {},

      setLink: (projectId, category, rawUrl) => {
        const url = normalizeStatusLink(rawUrl);
        if (!url) return false;
        set((state) => ({
          links: {
            ...state.links,
            [projectId]: {
              ...(state.links[projectId] || {}),
              [category]: { url, updatedAt: new Date().toISOString() },
            },
          },
        }));
        useActivityStore.getState().log({
          type: 'project',
          message: `${categoryLabel(category)} link was updated`,
          actorId: useUiStore.getState().currentUserId,
          projectId,
        });
        return true;
      },

      removeLink: (projectId, category) => {
        const existing = get().links?.[projectId]?.[category];
        if (!existing) return;
        set((state) => {
          const projectLinks = { ...(state.links[projectId] || {}) };
          delete projectLinks[category];
          const links = { ...state.links, [projectId]: projectLinks };
          return { links };
        });
        useActivityStore.getState().log({
          type: 'project',
          message: `${categoryLabel(category)} link was removed`,
          actorId: useUiStore.getState().currentUserId,
          projectId,
        });
      },

      deleteLinksByProject: (projectId) =>
        set((state) => {
          const links = { ...state.links };
          delete links[projectId];
          return { links };
        }),

      reset: (links) =>
        set({ links: links && typeof links === 'object' ? links : {} }),
    }),
    { name: 'pulse-status-links', version: 1 }
  )
);
