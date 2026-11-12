import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seedData } from './activityStore';
import { useActivityStore } from './activityStore';
import { useUiStore } from './uiStore';
import { TASK_CATEGORY_MAP } from '../constants';
import { uid } from '../utils/helpers';

const normalizeConfig = (config) => ({
  hidden: Array.isArray(config?.hidden) ? config.hidden : [],
  custom: Array.isArray(config?.custom) ? config.custom : [],
});

const labelFor = (value) => TASK_CATEGORY_MAP[value]?.label || value;

export const useProjectCategoryStore = create(
  persist(
    (set, get) => ({
      config: seedData.projectCategories || {},

      addCategory: (projectId, { label, icon }) => {
        const name = String(label || '').trim();
        if (!name) return null;
        const projectConfig = normalizeConfig(get().config[projectId]);
        const allLabels = [
          ...projectConfig.custom.map((category) => category.label.toLowerCase()),
          ...Object.values(TASK_CATEGORY_MAP).map((category) => category.label.toLowerCase()),
        ];
        if (allLabels.includes(name.toLowerCase())) return null;

        const category = {
          value: `custom_${uid('cat')}`,
          label: name,
          icon: icon || 'star',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          config: {
            ...state.config,
            [projectId]: {
              ...normalizeConfig(state.config[projectId]),
              custom: [...normalizeConfig(state.config[projectId]).custom, category],
            },
          },
        }));
        useActivityStore.getState().log({
          type: 'project',
          message: `Status card '${name}' was added`,
          actorId: useUiStore.getState().currentUserId,
          projectId,
        });
        return category;
      },

      removeCategory: (projectId, value) => {
        const projectConfig = normalizeConfig(get().config[projectId]);
        const isDefault = Boolean(TASK_CATEGORY_MAP[value]);
        if (isDefault) {
          if (projectConfig.hidden.includes(value)) return;
          set((state) => ({
            config: {
              ...state.config,
              [projectId]: {
                ...normalizeConfig(state.config[projectId]),
                hidden: [...normalizeConfig(state.config[projectId]).hidden, value],
              },
            },
          }));
        } else {
          set((state) => ({
            config: {
              ...state.config,
              [projectId]: {
                ...normalizeConfig(state.config[projectId]),
                custom: normalizeConfig(state.config[projectId]).custom.filter(
                  (category) => category.value !== value
                ),
              },
            },
          }));
        }
        useActivityStore.getState().log({
          type: 'project',
          message: `Status card '${isDefault ? labelFor(value) : value}' was removed`,
          actorId: useUiStore.getState().currentUserId,
          projectId,
        });
      },

      restoreCategory: (projectId, value) => {
        set((state) => ({
          config: {
            ...state.config,
            [projectId]: {
              ...normalizeConfig(state.config[projectId]),
              hidden: normalizeConfig(state.config[projectId]).hidden.filter(
                (hidden) => hidden !== value
              ),
            },
          },
        }));
        useActivityStore.getState().log({
          type: 'project',
          message: `Status card '${labelFor(value)}' was restored`,
          actorId: useUiStore.getState().currentUserId,
          projectId,
        });
      },

      deleteByProject: (projectId) =>
        set((state) => {
          const config = { ...state.config };
          delete config[projectId];
          return { config };
        }),

      reset: (config) => set({ config: config && typeof config === 'object' ? config : {} }),
    }),
    { name: 'pulse-project-categories', version: 1 }
  )
);
