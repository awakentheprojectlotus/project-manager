import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSeed } from '../data/seed';
import { uid } from '../utils/helpers';

export const seedData = createSeed();

export const useActivityStore = create(
  persist(
    (set) => ({
      entries: seedData.activity,
      log: ({ type = 'task', message, actorId = null, projectId = null }) =>
        set((state) => ({
          entries: [
            {
              id: uid('act'),
              type,
              message,
              actorId,
              projectId,
              createdAt: new Date().toISOString(),
            },
            ...state.entries,
          ].slice(0, 120),
        })),
      clear: () => set({ entries: [] }),
    }),
    {
      name: 'pulse-activity',
      version: 2,
      migrate: (persisted, version) =>
        version < 2 ? { entries: seedData.activity } : persisted,
    }
  )
);
