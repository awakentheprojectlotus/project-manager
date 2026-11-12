import { useState } from 'react';
import clsx from 'clsx';
import { Plus, RotateCcw, Settings2, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input, { Field } from '../ui/Input';
import Badge from '../ui/Badge';
import { useProjectCategoryStore } from '../../stores/projectCategoryStore';
import { useStatusLinkStore } from '../../stores/statusLinkStore';
import { useUiStore } from '../../stores/uiStore';
import { TASK_CATEGORIES } from '../../constants';
import { CATEGORY_ICON_OPTIONS } from '../../constants/categoryIcons';
import { getCategoryStatus } from '../../utils/categories';
import { getProjectCategories } from '../../utils/projectCategories';

export default function ManageCategoriesModal({ project, tasks, onClose }) {
  const config = useProjectCategoryStore((s) => s.config?.[project.id]);
  const addCategory = useProjectCategoryStore((s) => s.addCategory);
  const removeCategory = useProjectCategoryStore((s) => s.removeCategory);
  const restoreCategory = useProjectCategoryStore((s) => s.restoreCategory);
  const removeLink = useStatusLinkStore((s) => s.removeLink);
  const confirm = useUiStore((s) => s.confirm);
  const pushToast = useUiStore((s) => s.pushToast);

  const [label, setLabel] = useState('');
  const [iconKey, setIconKey] = useState('star');
  const [error, setError] = useState('');

  const categories = getProjectCategories(config);
  const hiddenDefaults = TASK_CATEGORIES.filter((category) =>
    (config?.hidden || []).includes(category.value)
  );
  const countFor = (value) => getCategoryStatus(tasks, value).total;

  const submit = () => {
    if (!label.trim()) {
      setError('Give the status card a name.');
      return;
    }
    const created = addCategory(project.id, { label, icon: iconKey });
    if (!created) {
      setError('A status card with that name already exists.');
      return;
    }
    setLabel('');
    setIconKey('star');
    setError('');
    pushToast({
      type: 'success',
      title: 'Status card added',
      message: `'${created.label}' is now part of ${project.name}.`,
    });
  };

  const handleRemove = async (category) => {
    const count = countFor(category.value);
    const ok = await confirm({
      title: 'Remove status card?',
      description: count
        ? `'${category.label}' has ${count} task${count === 1 ? '' : 's'}. The card will be removed from this project, but its tasks stay in the task views.`
        : `'${category.label}' will be removed from this project.`,
      confirmLabel: 'Remove card',
    });
    if (!ok) return;
    removeCategory(project.id, category.value);
    removeLink(project.id, category.value);
    pushToast({
      type: 'info',
      title: 'Status card removed',
      message: `'${category.label}' was removed from ${project.name}.`,
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Manage status cards"
      description={`Choose which maintenance cards appear on ${project.name}.`}
      icon={Settings2}
      size="lg"
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-edge bg-canvas/50 p-3">
          <p className="text-[12px] font-semibold text-ink">Add a custom status card</p>
          <p className="mt-0.5 text-[10.5px] text-muted">
            Choose a name and an icon. Custom cards are only added to this project.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="flex-1">
              <Field label="Card name" error={error}>
                <Input
                  value={label}
                  onChange={(event) => {
                    setLabel(event.target.value);
                    if (error) setError('');
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      submit();
                    }
                  }}
                  placeholder="e.g. SEO, Warranty, Localization…"
                  maxLength={60}
                />
              </Field>
            </div>
            <Button size="sm" icon={Plus} className="mt-1 sm:mt-5" onClick={submit}>
              Add card
            </Button>
          </div>

          <div className="mt-3">
            <p className="label-base">Icon</p>
            <div className="scrollbar-thin grid max-h-[150px] grid-cols-8 gap-1.5 overflow-y-auto sm:grid-cols-10">
              {CATEGORY_ICON_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.key}
                    type="button"
                    title={option.label}
                    onClick={() => setIconKey(option.key)}
                    className={clsx(
                      'grid h-8 w-8 place-items-center rounded-lg border transition',
                      iconKey === option.key
                        ? 'border-brand-400 bg-brand-50 text-brand-700 ring-1 ring-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300'
                        : 'border-edge bg-surface text-muted hover:text-ink'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Cards in this project
            </p>
            <Badge tone="neutral" size="sm">
              {categories.length}
            </Badge>
          </div>
          {categories.length === 0 ? (
            <p className="rounded-xl border border-dashed border-edge px-3 py-4 text-center text-[11px] text-muted">
              No status cards yet. Add one above.
            </p>
          ) : (
            <ul className="divide-y divide-edge rounded-xl border border-edge">
              {categories.map((category) => {
                const Icon = category.icon;
                const count = countFor(category.value);
                return (
                  <li key={category.value} className="flex items-center gap-2.5 px-3 py-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-900 text-white dark:bg-slate-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[12px] font-medium text-ink">
                          {category.label}
                        </span>
                        {category.custom && (
                          <span className="rounded bg-elevated px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-muted">
                            Custom
                          </span>
                        )}
                      </span>
                      <span className="block text-[10px] text-muted">
                        {count} task{count === 1 ? '' : 's'}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(category)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                      title={`Remove ${category.label}`}
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {hiddenDefaults.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
              Hidden defaults
            </p>
            <ul className="divide-y divide-edge rounded-xl border border-edge">
              {hiddenDefaults.map((category) => {
                const Icon = category.icon;
                const count = countFor(category.value);
                return (
                  <li key={category.value} className="flex items-center gap-2.5 px-3 py-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-elevated text-muted">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-medium text-ink">
                        {category.label}
                      </span>
                      <span className="block text-[10px] text-muted">
                        {count} task{count === 1 ? '' : 's'}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        restoreCategory(project.id, category.value);
                        pushToast({
                          type: 'success',
                          title: 'Status card restored',
                          message: `'${category.label}' is back on ${project.name}.`,
                        });
                      }}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-medium text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
