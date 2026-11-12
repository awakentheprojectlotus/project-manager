import { daysUntil, todayISO } from './date';

const CATEGORY_PATTERNS = [
  {
    category: 'bug',
    pattern: /\b(bug|fix|error|crash|defect|regression|hotfix|qa|broken)\b/i,
  },
  {
    category: 'playstore',
    pattern: /\b(play\s?store|google play|apk|store listing|publish(ed)?|upload(ed)?)\b/i,
  },
  {
    category: 'windows',
    pattern: /\b(windows|window|desktop|win32|\.exe|installer)\b/i,
  },
  {
    category: 'android',
    pattern: /\b(android|kotlin|mobile app|react native)\b/i,
  },
  {
    category: 'documentation',
    pattern: /\b(docs?|documentation|readme|guide|wiki|manual|changelog|spec)\b/i,
  },
  {
    category: 'github',
    pattern: /\b(github|git|repo|repository|pull request|merge|commit|branch)\b/i,
  },
  {
    category: 'vercel',
    pattern: /\b(vercel|deploy|deployment|production build)\b/i,
  },
  {
    category: 'firmware',
    pattern: /\b(firmware|bios|microcode|ota|device update)\b/i,
  },
  {
    category: 'packaging',
    pattern: /\b(packaging|package|unboxing|retail box)\b/i,
  },
  {
    category: 'carframe',
    pattern: /\b(car\s?frame|carframe|chassis|vehicle mount)\b/i,
  },
  {
    category: 'shopping',
    pattern: /\b(shopping list|shopping|grocery|procurement|purchase order)\b/i,
  },
  {
    category: 'event',
    pattern: /\b(event|launch|festival|meetup|webinar|workshop|ceremony)\b/i,
  },
];

export const getTaskCategory = (task) => {
  if (typeof task?.category === 'string' && task.category.trim()) {
    return task.category;
  }
  const text = `${task?.title || ''} ${task?.description || ''}`;
  for (const { category, pattern } of CATEGORY_PATTERNS) {
    if (pattern.test(text)) return category;
  }
  return 'social';
};

export const getCategoryStatus = (tasks, category, { dueSoonDays = 2 } = {}) => {
  const categoryTasks = tasks.filter((task) => getTaskCategory(task) === category);
  const total = categoryTasks.length;
  const completedTasks = categoryTasks.filter((task) => task.status === 'completed');
  const openTasks = categoryTasks.filter((task) => task.status !== 'completed');
  const completed = completedTasks.length;
  const open = openTasks.length;
  const overdueTasks = openTasks.filter((task) => {
    const diff = daysUntil(task.dueDate);
    return diff !== null && diff < 0;
  });
  const dueSoonTasks = openTasks.filter((task) => {
    const diff = daysUntil(task.dueDate);
    return diff !== null && diff >= 0 && diff <= dueSoonDays;
  });
  const datedOpen = openTasks
    .filter((task) => task.dueDate)
    .sort((a, b) => (daysUntil(a.dueDate) ?? 9999) - (daysUntil(b.dueDate) ?? 9999));

  let tone = 'success';
  let statusLabel = 'No tasks';
  if (total > 0) {
    if (open === 0) {
      tone = 'success';
      statusLabel = 'All done';
    } else if (overdueTasks.length > 0) {
      tone = 'danger';
      statusLabel = 'Overdue';
    } else if (dueSoonTasks.length > 0) {
      tone = 'danger';
      statusLabel = 'Due soon';
    } else {
      tone = 'warning';
      statusLabel = 'In progress';
    }
  }

  const today = todayISO();
  const todaysTasks = categoryTasks.filter((task) => task.dueDate === today);
  const dailyPost =
    category === 'social'
      ? {
          dueToday: todaysTasks.length,
          postedToday: todaysTasks.some((task) => task.status === 'completed'),
          hasPostToday: todaysTasks.length > 0,
        }
      : null;

  return {
    category,
    tasks: categoryTasks,
    total,
    completed,
    open,
    overdue: overdueTasks.length,
    dueSoon: dueSoonTasks.length,
    nextDue: datedOpen[0]?.dueDate || null,
    nextDueTask: datedOpen[0] || null,
    tone,
    statusLabel,
    dailyPost,
  };
};
