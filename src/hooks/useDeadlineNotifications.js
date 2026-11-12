import { useEffect } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useUiStore } from '../stores/uiStore';
import { getOverdueTasks, getTasksDueWithin } from '../utils/analytics';
import { todayISO } from '../utils/date';

const STORAGE_KEY = 'pulse-deadline-sync';

export const useDeadlineNotifications = () => {
  const tasks = useTaskStore((s) => s.tasks);

  useEffect(() => {
    if (!tasks.length) return;
    const today = todayISO();
    try {
      if (localStorage.getItem(STORAGE_KEY) === today) return;
    } catch {
      // storage unavailable — still show the in-session notices
    }

    const prefs = useUiStore.getState().prefs;
    const notifications = useNotificationStore.getState();
    const overdue = getOverdueTasks(tasks);
    const dueSoon = getTasksDueWithin(tasks, 3);

    if (prefs.notifyOverdue && overdue.length) {
      notifications.push({
        type: 'overdue',
        title: `${overdue.length} ${overdue.length === 1 ? 'task is' : 'tasks are'} overdue`,
        message: `Starting with "${overdue[0].title}". Review and reschedule to keep the plan realistic.`,
        link: '/tasks',
      });
    }
    if (prefs.notifyDeadlines && dueSoon.length) {
      notifications.push({
        type: 'deadline',
        title: `${dueSoon.length} ${dueSoon.length === 1 ? 'task is' : 'tasks are'} due within 3 days`,
        message: `Next up: "${dueSoon[0].title}". Make sure an owner is actively working on it.`,
        link: '/calendar',
      });
    }

    try {
      localStorage.setItem(STORAGE_KEY, today);
    } catch {
      // ignore
    }
  }, [tasks]);
};
