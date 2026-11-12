import { TASK_CATEGORIES } from '../constants';
import { getCategoryIcon } from '../constants/categoryIcons';

export const getProjectCategories = (configForProject) => {
  const hidden = new Set(configForProject?.hidden || []);
  const defaults = TASK_CATEGORIES.filter((category) => !hidden.has(category.value)).map(
    (category) => ({ ...category, custom: false })
  );
  const custom = (configForProject?.custom || []).map((category) => ({
    value: category.value,
    label: category.label,
    icon: getCategoryIcon(category.icon),
    iconKey: category.icon,
    iconClass: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300',
    hint: '',
    custom: true,
  }));
  return [...defaults, ...custom];
};

export const getProjectCategoryMeta = (configForProject, value) =>
  getProjectCategories(configForProject).find((category) => category.value === value) || null;
