import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export default function EmptyState({ icon: Icon, title, description, action, className, compact = false }) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-edge bg-surface/50 px-6 text-center',
        compact ? 'py-10' : 'py-16',
        className
      )}
    >
      {Icon && (
        <span className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-elevated text-muted">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ className }) {
  return <Loader2 className={clsx('h-4 w-4 animate-spin text-brand-500', className)} />;
}

export function LoadingState({ label = 'Loading workspace…', className }) {
  return (
    <div className={clsx('flex flex-col items-center justify-center gap-3 py-16', className)}>
      <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={clsx('animate-pulse rounded-lg bg-slate-200/70 dark:bg-slate-800/70', className)} />;
}
