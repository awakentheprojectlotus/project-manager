import {
  BookOpen,
  Bug,
  Car,
  Cpu,
  Github,
  LayoutDashboard,
  ListChecks,
  FolderKanban,
  Users,
  CalendarDays,
  BarChart3,
  Sparkles,
  Settings,
  Share2,
  Smartphone,
  Monitor,
  Package,
  ShoppingCart,
  Triangle,
  UploadCloud,
} from 'lucide-react';

export const APP_NAME = 'Pulse';

export const TEAM_AUTH_EMAILS = {
  tm_kaung: 'kms@gmail.com',
  tm_yan: 'yanaungmoe@gmail.com',
  tm_shine: 'shinethetaung@gmail.com',
  tm_antt: 'antthein@gmail.com',
};

export const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/tasks', label: 'My Tasks', icon: ListChecks },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/team', label: 'Team Members', icon: Users },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
  { to: '/assistant', label: 'AI Assistant', icon: Sparkles, badge: 'AI' },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const PROJECT_STATUSES = [
  {
    value: 'planning',
    label: 'Planning',
    badge: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20',
    dot: 'bg-sky-500',
    hex: '#0ea5e9',
  },
  {
    value: 'in-progress',
    label: 'In Progress',
    badge:
      'bg-brand-50 text-brand-700 ring-brand-600/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20',
    dot: 'bg-brand-500',
    hex: '#6366f1',
  },
  {
    value: 'on-hold',
    label: 'On Hold',
    badge:
      'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
    dot: 'bg-amber-500',
    hex: '#f59e0b',
  },
  {
    value: 'completed',
    label: 'Completed',
    badge:
      'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20',
    dot: 'bg-emerald-500',
    hex: '#10b981',
  },
];

export const TASK_STATUSES = [
  {
    value: 'todo',
    label: 'To Do',
    badge: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/20',
    dot: 'bg-slate-400',
    hex: '#94a3b8',
  },
  {
    value: 'in-progress',
    label: 'In Progress',
    badge:
      'bg-brand-50 text-brand-700 ring-brand-600/20 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-400/20',
    dot: 'bg-brand-500',
    hex: '#6366f1',
  },
  {
    value: 'in-review',
    label: 'In Review',
    badge:
      'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/20',
    dot: 'bg-violet-500',
    hex: '#8b5cf6',
  },
  {
    value: 'completed',
    label: 'Completed',
    badge:
      'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20',
    dot: 'bg-emerald-500',
    hex: '#10b981',
  },
];

export const PRIORITIES = [
  {
    value: 'low',
    label: 'Low',
    badge: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/20',
    dot: 'bg-slate-400',
    hex: '#94a3b8',
    rank: 1,
  },
  {
    value: 'medium',
    label: 'Medium',
    badge: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20',
    dot: 'bg-sky-500',
    hex: '#0ea5e9',
    rank: 2,
  },
  {
    value: 'high',
    label: 'High',
    badge:
      'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
    dot: 'bg-amber-500',
    hex: '#f59e0b',
    rank: 3,
  },
  {
    value: 'urgent',
    label: 'Urgent',
    badge: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20',
    dot: 'bg-rose-500',
    hex: '#f43f5e',
    rank: 4,
  },
];

const toMap = (list) => list.reduce((acc, item) => ({ ...acc, [item.value]: item }), {});

export const PROJECT_STATUS_MAP = toMap(PROJECT_STATUSES);
export const TASK_STATUS_MAP = toMap(TASK_STATUSES);
export const PRIORITY_MAP = toMap(PRIORITIES);

export const TASK_STATUS_VALUES = TASK_STATUSES.map((s) => s.value);
export const PROJECT_STATUS_VALUES = PROJECT_STATUSES.map((s) => s.value);
export const PRIORITY_VALUES = PRIORITIES.map((s) => s.value);

export const PROJECT_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#0ea5e9',
  '#f43f5e',
  '#14b8a6',
];

export const AVATAR_PALETTE = [
  { bg: 'bg-brand-100 dark:bg-brand-500/20', text: 'text-brand-700 dark:text-brand-300' },
  { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300' },
  { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300' },
  { bg: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-700 dark:text-rose-300' },
  { bg: 'bg-sky-100 dark:bg-sky-500/20', text: 'text-sky-700 dark:text-sky-300' },
  { bg: 'bg-violet-100 dark:bg-violet-500/20', text: 'text-violet-700 dark:text-violet-300' },
  { bg: 'bg-teal-100 dark:bg-teal-500/20', text: 'text-teal-700 dark:text-teal-300' },
];

export const DUE_FILTERS = [
  { value: 'all', label: 'Any date' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Due today' },
  { value: 'week', label: 'Next 7 days' },
  { value: 'month', label: 'Next 30 days' },
  { value: 'none', label: 'No due date' },
];

export const SORT_OPTIONS = [
  { value: 'priority', label: 'Priority' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'createdAt', label: 'Newest' },
  { value: 'title', label: 'Title' },
];

export const AI_SUGGESTIONS = [
  'Which projects are behind schedule?',
  'What tasks are due this week?',
  'Who has the most assigned tasks?',
  'Show me all urgent tasks',
  'What is the completion rate of Padma?',
  'Create a task called Design March campaign for Padma',
  'Mark the monthly performance report task as completed',
  'Move all overdue tasks to In Review',
];

export const SPEECH_LANGUAGES = [
  { value: 'en-US', label: 'English (United States)' },
  { value: 'en-GB', label: 'English (United Kingdom)' },
  { value: 'my-MM', label: 'Burmese' },
  { value: 'th-TH', label: 'Thai' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'ko-KR', label: 'Korean' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'fr-FR', label: 'French' },
  { value: 'es-ES', label: 'Spanish' },
];

export const TASK_CATEGORIES = [
  {
    value: 'social',
    label: 'Social Media',
    hint: '1 post / day',
    icon: Share2,
    iconClass: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
  },
  {
    value: 'bug',
    label: 'Bug',
    icon: Bug,
    iconClass: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  },
  {
    value: 'event',
    label: 'Event',
    icon: CalendarDays,
    iconClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  },
  {
    value: 'playstore',
    label: 'PlayStore Uploaded',
    icon: UploadCloud,
    iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  },
  {
    value: 'windows',
    label: 'Windows Version',
    icon: Monitor,
    iconClass: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
  },
  {
    value: 'android',
    label: 'Android Version',
    icon: Smartphone,
    iconClass: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  },
  {
    value: 'documentation',
    label: 'Documentation',
    icon: BookOpen,
    iconClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
  },
  {
    value: 'github',
    label: 'GitHub',
    icon: Github,
    iconClass: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300',
  },
  {
    value: 'vercel',
    label: 'Vercel',
    icon: Triangle,
    iconClass: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-300',
  },
  {
    value: 'firmware',
    label: 'Firmware',
    icon: Cpu,
    iconClass: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400',
  },
  {
    value: 'packaging',
    label: 'Packaging',
    icon: Package,
    iconClass: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
  },
  {
    value: 'carframe',
    label: 'CarFrame',
    icon: Car,
    iconClass: 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400',
  },
  {
    value: 'shopping',
    label: 'Shopping List',
    icon: ShoppingCart,
    iconClass: 'bg-lime-50 text-lime-600 dark:bg-lime-500/10 dark:text-lime-400',
  },
];

export const TASK_CATEGORY_MAP = TASK_CATEGORIES.reduce(
  (acc, category) => ({ ...acc, [category.value]: category }),
  {}
);

export const TASK_CATEGORY_VALUES = TASK_CATEGORIES.map((category) => category.value);
