import clsx from 'clsx';
import { Cog, ExternalLink } from 'lucide-react';
import { dueMeta } from '../../utils/date';

const TONES = {
  success: {
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  danger: {
    bar: 'bg-rose-500',
    dot: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
  },
  empty: {
    bar: 'bg-slate-300 dark:bg-slate-700',
    dot: 'bg-slate-400',
    text: 'text-muted',
  },
};

export default function CategoryStatusCards({ statuses, categories = [], onOpen, links = {} }) {
  return (
    <div className="grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {statuses.map((status) => {
        const category = categories.find((item) => item.value === status.category);
        if (!category) return null;
        const Icon = category.icon;
        const tone = TONES[status.tone] || TONES.empty;
        const link = links?.[status.category]?.url;

        return (
          <div
            key={status.category}
            role="button"
            tabIndex={0}
            data-category={status.category}
            data-tone={status.tone}
            onClick={() => onOpen(status.category)}
            onKeyDown={(event) => {
              if (event.target !== event.currentTarget) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onOpen(status.category);
              }
            }}
            className="group relative flex h-full min-h-[160px] cursor-pointer overflow-hidden rounded-2xl border border-edge bg-surface text-left shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:hover:border-brand-500/30"
          >
            <span className={clsx('absolute inset-x-0 top-0 z-10 h-[3px]', tone.bar)} />

            <div className="flex w-14 shrink-0 items-center justify-center self-stretch bg-slate-900 text-white dark:bg-slate-700">
              <Icon className="h-9 w-9" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col p-3">
                <p className="min-w-0 text-[11.5px] font-semibold leading-snug text-ink">
                  {category.label}
                </p>
                <div
                  className={clsx(
                    'mt-1 flex items-center justify-end gap-1.5 pr-0.5 text-[10px] font-medium',
                    tone.text
                  )}
                >
                  <Cog
                    aria-hidden="true"
                    className={clsx(
                      'gear-status-icon h-5 w-5 shrink-0',
                      status.tone === 'success' && 'animate-gear-spin',
                      status.tone === 'danger' && 'animate-gear-blink'
                    )}
                  />
                  <span>{status.statusLabel}</span>
                </div>

                <p className="mt-1 text-[9.5px] text-muted">
                  {status.total ? `${status.completed}/${status.total} done` : 'No tasks yet'}
                  {category.hint && <span className="text-muted/60"> · {category.hint}</span>}
                </p>

                <div className="mt-1 flex items-center justify-between gap-1 text-[9.5px] text-muted">
                  <span>{status.total ? `${status.open} open` : 'Click to add'}</span>
                  {status.nextDue && status.open > 0 ? (
                    <span
                      className={
                        status.tone === 'danger'
                          ? 'font-medium text-rose-600 dark:text-rose-400'
                          : ''
                      }
                    >
                      {dueMeta(status.nextDue).label}
                    </span>
                  ) : (
                    <span className="text-muted/60">
                      {status.total && status.open === 0 ? 'Complete' : '—'}
                    </span>
                  )}
                </div>

                {status.dailyPost && (
                  <p
                    className={clsx(
                      'mt-1 text-[9px] font-medium',
                      status.dailyPost.postedToday
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : status.dailyPost.hasPostToday
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-muted/70'
                    )}
                  >
                    {status.dailyPost.postedToday
                      ? "Today's post logged"
                      : status.dailyPost.hasPostToday
                        ? "Today's post pending"
                        : 'No post today'}
                  </p>
                )}

                <div className="mt-auto flex min-h-[30px] items-end">
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer noopener"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                      className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-brand-700"
                      title={link}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Link
                    </a>
                  )}
                </div>
              </div>
          </div>
        );
      })}
    </div>
  );
}
