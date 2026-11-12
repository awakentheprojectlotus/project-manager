import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seedData } from './activityStore';
import { useActivityStore } from './activityStore';
import { useNotificationStore } from './notificationStore';
import { useUiStore } from './uiStore';
import { uid } from '../utils/helpers';
import { TASK_STATUS_MAP } from '../constants';

const nowIso = () => new Date().toISOString();

const normalizeSubtasks = (subtasks = []) =>
  subtasks
    .filter((s) => (s.title || '').trim())
    .map((s) => ({ id: s.id || uid('sub'), title: s.title.trim(), done: Boolean(s.done) }));

export const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: seedData.tasks,

      createTask: (data) => {
        const status = data.status || 'todo';
        const task = {
          id: uid('tsk'),
          title: (data.title || 'Untitled task').trim(),
          description: data.description?.trim() || '',
          projectId: data.projectId || null,
          assigneeId: data.assigneeId || null,
          category: data.category || null,
          status,
          priority: data.priority || 'medium',
          dueDate: data.dueDate || null,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          completedAt: status === 'completed' ? nowIso() : null,
          order: Date.now(),
          subtasks: normalizeSubtasks(data.subtasks),
        };
        set((state) => ({ tasks: [...state.tasks, task] }));

        useActivityStore.getState().log({
          type: 'task',
          message: `Task '${task.title}' was created`,
          actorId: useUiStore.getState().currentUserId,
          projectId: task.projectId,
        });
        if (task.assigneeId) {
          useNotificationStore.getState().push({
            type: 'assignment',
            title: 'New task assigned',
            message: `'${task.title}' was assigned.`,
            link: '/tasks',
          });
        }
        return task;
      },

      updateTask: (id, changes) => {
        const prev = get().tasks.find((t) => t.id === id);
        if (!prev) return null;
        const patch = { ...changes };
        if ('status' in patch && patch.status !== prev.status) {
          patch.completedAt = patch.status === 'completed' ? nowIso() : null;
        }
        if ('subtasks' in patch) patch.subtasks = normalizeSubtasks(patch.subtasks);
        const updated = { ...prev, ...patch, updatedAt: nowIso() };
        set((state) => ({ tasks: state.tasks.map((t) => (t.id === id ? updated : t)) }));

        const actorId = useUiStore.getState().currentUserId;
        const activity = useActivityStore.getState();
        const notifications = useNotificationStore.getState();

        if (prev.status !== updated.status) {
          activity.log({
            type: 'task',
            message: `Task '${updated.title}' moved to ${TASK_STATUS_MAP[updated.status]?.label || updated.status}`,
            actorId,
            projectId: updated.projectId,
          });
          if (updated.status === 'completed') {
            notifications.push({
              type: 'completed',
              title: 'Task completed',
              message: `'${updated.title}' is done.`,
              link: '/tasks',
            });
          }
        } else if (prev.assigneeId !== updated.assigneeId && updated.assigneeId) {
          notifications.push({
            type: 'assignment',
            title: 'Task reassigned',
            message: `'${updated.title}' was assigned to a new team member.`,
            link: '/tasks',
          });
        } else if (prev.priority !== updated.priority) {
          activity.log({
            type: 'task',
            message: `Task '${updated.title}' priority changed to ${updated.priority}`,
            actorId,
            projectId: updated.projectId,
          });
        }
        return updated;
      },

      updateTasksMany: (ids, changes) => {
        const idSet = new Set(ids);
        const patch = { ...changes };
        const completedAt =
          'status' in patch ? (patch.status === 'completed' ? nowIso() : null) : undefined;
        let count = 0;
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (!idSet.has(task.id)) return task;
            count += 1;
            return {
              ...task,
              ...patch,
              ...(completedAt !== undefined ? { completedAt } : {}),
              updatedAt: nowIso(),
            };
          }),
        }));
        if (!count) return 0;

        useActivityStore.getState().log({
          type: 'task',
          message:
            `${count} ${count === 1 ? 'task was' : 'tasks were'} updated` +
            (patch.status ? ` to ${TASK_STATUS_MAP[patch.status]?.label || patch.status}` : ''),
          actorId: useUiStore.getState().currentUserId,
          projectId: null,
        });
        useNotificationStore.getState().push({
          type: 'status',
          title: 'Bulk task update',
          message: `${count} tasks were updated${patch.status ? ` to ${TASK_STATUS_MAP[patch.status]?.label || patch.status}` : ''}.`,
          link: '/tasks',
        });
        return count;
      },

      assignTask: (id, assigneeId) => get().updateTask(id, { assigneeId: assigneeId || null }),

      updateTaskStatus: (id, status) => get().updateTask(id, { status }),

      toggleSubtask: (taskId, subtaskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;
        const subtasks = task.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, done: !s.done } : s
        );
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, subtasks, updatedAt: nowIso() } : t
          ),
        }));
      },

      addSubtask: (taskId, title) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task || !title.trim()) return;
        const subtasks = [...task.subtasks, { id: uid('sub'), title: title.trim(), done: false }];
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, subtasks, updatedAt: nowIso() } : t
          ),
        }));
      },

      removeSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId), updatedAt: nowIso() }
              : t
          ),
        }));
      },

      deleteTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        set({ tasks: get().tasks.filter((t) => t.id !== id) });
        useActivityStore.getState().log({
          type: 'task',
          message: `Task '${task.title}' was deleted`,
          actorId: useUiStore.getState().currentUserId,
          projectId: task.projectId,
        });
      },

      deleteTasksByProject: (projectId) =>
        set((state) => ({ tasks: state.tasks.filter((t) => t.projectId !== projectId) })),

      unassignMember: (memberId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.assigneeId === memberId ? { ...t, assigneeId: null, updatedAt: nowIso() } : t
          ),
        })),

      reset: (tasks) => set({ tasks }),
    }),
    {
      name: 'pulse-tasks',
      version: 2,
      migrate: (persisted, version) =>
        version < 2 ? { tasks: seedData.tasks } : persisted,
    }
  )
);
