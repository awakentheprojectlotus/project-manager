import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seedData } from './activityStore';
import { useActivityStore } from './activityStore';
import { useUiStore } from './uiStore';
import { uid } from '../utils/helpers';
import { normalizeUrl } from '../utils/links';
import { parseAmount, parseQuantity } from '../utils/currency';

const normalizeRequirement = (data) => ({
  projectId: data.projectId,
  type: data.type === 'hardware' ? 'hardware' : 'software',
  name: String(data.name || 'Untitled item').trim(),
  price: parseAmount(data.price),
  quantity: parseQuantity(data.quantity),
  shop: String(data.shop || '').trim(),
  link: data.link ? normalizeUrl(data.link) || '' : '',
  notes: String(data.notes || '').trim(),
});

export const useRequirementStore = create(
  persist(
    (set, get) => ({
      requirements: seedData.requirements || [],

      addRequirement: (data) => {
        const now = new Date().toISOString();
        const requirement = {
          id: uid('req'),
          ...normalizeRequirement(data),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ requirements: [requirement, ...state.requirements] }));
        useActivityStore.getState().log({
          type: 'project',
          message: `Requirement '${requirement.name}' was added`,
          actorId: useUiStore.getState().currentUserId,
          projectId: requirement.projectId,
        });
        return requirement;
      },

      addMany: (projectId, items) => {
        const now = new Date().toISOString();
        const created = items.map((item) => ({
          id: uid('req'),
          ...normalizeRequirement({ ...item, projectId }),
          createdAt: now,
          updatedAt: now,
        }));
        if (!created.length) return [];
        set((state) => ({ requirements: [...created, ...state.requirements] }));
        useActivityStore.getState().log({
          type: 'project',
          message: `${created.length} requirement${created.length === 1 ? '' : 's'} imported`,
          actorId: useUiStore.getState().currentUserId,
          projectId,
        });
        return created;
      },

      updateRequirement: (id, changes) => {
        const previous = get().requirements.find((item) => item.id === id);
        if (!previous) return null;
        const updated = {
          ...previous,
          ...normalizeRequirement({ ...previous, ...changes }),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          requirements: state.requirements.map((item) => (item.id === id ? updated : item)),
        }));
        useActivityStore.getState().log({
          type: 'project',
          message: `Requirement '${updated.name}' was updated`,
          actorId: useUiStore.getState().currentUserId,
          projectId: updated.projectId,
        });
        return updated;
      },

      removeRequirement: (id) => {
        const requirement = get().requirements.find((item) => item.id === id);
        if (!requirement) return;
        set((state) => ({
          requirements: state.requirements.filter((item) => item.id !== id),
        }));
        useActivityStore.getState().log({
          type: 'project',
          message: `Requirement '${requirement.name}' was removed`,
          actorId: useUiStore.getState().currentUserId,
          projectId: requirement.projectId,
        });
      },

      deleteByProject: (projectId) =>
        set((state) => ({
          requirements: state.requirements.filter((item) => item.projectId !== projectId),
        })),

      reset: (requirements) =>
        set({ requirements: Array.isArray(requirements) ? requirements : [] }),
    }),
    { name: 'pulse-requirements', version: 1 }
  )
);
