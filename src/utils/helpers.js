export const uid = (prefix = 'id') => {
  const random =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  return `${prefix}_${random}`;
};

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U';

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const percent = (part, total) => {
  if (!total) return 0;
  return Math.round((part / total) * 100);
};

export const pluralize = (count, singular, plural) =>
  `${count} ${count === 1 ? singular : plural || `${singular}s`}`;

export const getProjectColor = (project) => project?.color || '#6366f1';

export const truncate = (text = '', length = 120) =>
  text.length > length ? `${text.slice(0, length).trim()}…` : text;

export const groupBy = (list, getKey) =>
  list.reduce((acc, item) => {
    const key = getKey(item);
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {});

export const sortByOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

export const hexToRgba = (hex, alpha = 1) => {
  const clean = hex.replace('#', '');
  const value = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
