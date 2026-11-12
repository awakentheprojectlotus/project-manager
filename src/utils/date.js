import {
  addDays,
  differenceInCalendarDays,
  format,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  endOfMonth,
  endOfWeek,
  subDays,
  isWithinInterval,
} from 'date-fns';

export const todayISO = () => format(new Date(), 'yyyy-MM-dd');

export const toISO = (date) => format(date, 'yyyy-MM-dd');

export const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  try {
    const parsed = parseISO(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
};

export const daysFromToday = (n) => toISO(addDays(startOfDay(new Date()), n));

export const formatDate = (value, pattern = 'MMM d, yyyy') => {
  const date = parseDate(value);
  return date ? format(date, pattern) : '—';
};

export const formatShortDate = (value) => formatDate(value, 'MMM d');

export const formatMonthYear = (date) => format(date, 'MMMM yyyy');

export const daysUntil = (value) => {
  const date = parseDate(value);
  if (!date) return null;
  return differenceInCalendarDays(startOfDay(date), startOfDay(new Date()));
};

export const isOverdueDate = (value) => {
  const diff = daysUntil(value);
  return diff !== null && diff < 0;
};

export const dueMeta = (value, completed = false) => {
  if (!value) return { label: 'No due date', tone: 'muted', diff: null };
  const diff = daysUntil(value);
  if (completed) {
    return { label: formatDate(value, 'MMM d'), tone: 'muted', diff };
  }
  if (diff < 0) {
    return { label: `${Math.abs(diff)}d overdue`, tone: 'danger', diff };
  }
  if (diff === 0) return { label: 'Due today', tone: 'warning', diff };
  if (diff === 1) return { label: 'Due tomorrow', tone: 'warning', diff };
  if (diff <= 7) return { label: `Due in ${diff}d`, tone: 'warning', diff };
  return { label: formatDate(value, 'MMM d'), tone: 'muted', diff };
};

export const timeAgo = (value) => {
  const date = parseDate(value);
  if (!date) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return format(date, 'MMM d');
};

export const isToday = (value) => {
  const date = parseDate(value);
  return date ? isSameDay(date, new Date()) : false;
};

export const isThisWeek = (value) => {
  const date = parseDate(value);
  if (!date) return false;
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date(), { weekStartsOn: 1 });
  return isWithinInterval(startOfDay(date), { start, end });
};

export const isWithinNextDays = (value, days) => {
  const diff = daysUntil(value);
  return diff !== null && diff >= 0 && diff <= days;
};

export const monthMatrix = (cursor) => {
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const days = [];
  let current = start;
  while (current <= end) {
    days.push(current);
    current = addDays(current, 1);
  }
  return days;
};

export const subtractDays = (n) => subDays(new Date(), n);

export const isSameDate = (a, b) => {
  const da = parseDate(a);
  const db = parseDate(b);
  if (!da || !db) return false;
  return isSameDay(da, db);
};
