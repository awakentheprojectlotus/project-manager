import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seedData } from './activityStore';
import { uid } from '../utils/helpers';

const toastTimers = new Map();

export const useUiStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      sidebarCollapsed: false,
      mobileNavOpen: false,
      commandOpen: false,
      notificationsOpen: false,
      currentUserId: seedData.currentUserId,
      prefs: {
        defaultTaskView: 'kanban',
        notifyDeadlines: true,
        notifyAssignments: true,
        notifyOverdue: true,
        notifyStatus: true,
        ttsEnabled: true,
        voiceAutoSend: true,
        speechLang: 'en-US',
        ttsVoiceURI: '',
        ttsRate: 1,
        currency: 'USD',
        density: 'comfortable',
        weekStartsOn: 1,
      },
      toasts: [],
      confirmDialog: null,
      taskForm: { open: false, task: null, defaults: {} },
      projectForm: { open: false, project: null },
      memberForm: { open: false, member: null },
      memberDetail: { open: false, memberId: null },

      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileNav: (open) => set({ mobileNavOpen: open }),
      setCommandOpen: (open) => set({ commandOpen: open }),
      setNotificationsOpen: (open) => set({ notificationsOpen: open }),
      setCurrentUser: (id) => set({ currentUserId: id }),
      updatePrefs: (patch) => set((s) => ({ prefs: { ...s.prefs, ...patch } })),

      pushToast: ({ type = 'success', title, message = '', duration = 4000 }) => {
        const id = uid('toast');
        set((s) => ({ toasts: [...s.toasts, { id, type, title, message }] }));
        const timer = setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
          toastTimers.delete(id);
        }, duration);
        toastTimers.set(id, timer);
        return id;
      },
      dismissToast: (id) => {
        const timer = toastTimers.get(id);
        if (timer) clearTimeout(timer);
        toastTimers.delete(id);
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      },

      confirm: (options) =>
        new Promise((resolve) => {
          set({
            confirmDialog: {
              title: 'Are you sure?',
              description: '',
              confirmLabel: 'Confirm',
              cancelLabel: 'Cancel',
              tone: 'danger',
              ...options,
              resolve,
            },
          });
        }),
      resolveConfirm: (value) => {
        const dialog = get().confirmDialog;
        if (dialog?.resolve) dialog.resolve(value);
        set({ confirmDialog: null });
      },

      openTaskForm: (task = null, defaults = {}) =>
        set({ taskForm: { open: true, task, defaults } }),
      closeTaskForm: () => set({ taskForm: { open: false, task: null, defaults: {} } }),
      openProjectForm: (project = null) => set({ projectForm: { open: true, project } }),
      closeProjectForm: () => set({ projectForm: { open: false, project: null } }),
      openMemberForm: (member = null) => set({ memberForm: { open: true, member } }),
      closeMemberForm: () => set({ memberForm: { open: false, member: null } }),
      openMemberDetail: (memberId) => set({ memberDetail: { open: true, memberId } }),
      closeMemberDetail: () => set({ memberDetail: { open: false, memberId: null } }),
    }),
    {
      name: 'pulse-ui',
      version: 2,
      migrate: (persisted, version) =>
        version < 2
          ? { ...(persisted || {}), currentUserId: seedData.currentUserId }
          : persisted,
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        currentUserId: state.currentUserId,
        prefs: state.prefs,
      }),
    }
  )
);

export const getCurrentUser = () => {
  const state = useUiStore.getState();
  return state.currentUserId;
};
