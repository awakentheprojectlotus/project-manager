import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seedData } from './activityStore';
import { useUiStore } from './uiStore';
import { uid } from '../utils/helpers';

const PREF_BY_TYPE = {
  assignment: 'notifyAssignments',
  completed: 'notifyStatus',
  status: 'notifyStatus',
  deadline: 'notifyDeadlines',
  overdue: 'notifyOverdue',
};

export const useNotificationStore = create(
  persist(
    (set) => ({
      notifications: seedData.notifications,
      push: ({ type = 'status', title, message, link = null }) => {
        const prefKey = PREF_BY_TYPE[type];
        const prefs = useUiStore.getState().prefs;
        if (prefKey && prefs?.[prefKey] === false) return;
        set((state) => ({
          notifications: [
            {
              id: uid('ntf'),
              type,
              title,
              message,
              link,
              read: false,
              createdAt: new Date().toISOString(),
            },
            ...state.notifications,
          ].slice(0, 60),
        }));
      },
      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
      remove: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clear: () => set({ notifications: [] }),
    }),
    {
      name: 'pulse-notifications',
      version: 2,
      migrate: (persisted, version) =>
        version < 2 ? { notifications: seedData.notifications } : persisted,
    }
  )
);
