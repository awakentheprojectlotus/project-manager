import clsx from 'clsx';
import Card from '../ui/Card';

const TONES = {
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
};

export default function StatCard({ label, value, icon: Icon, tone = 'brand', hint, footer, className }) {
  return (
    <Card className={clsx('p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <span className={clsx('grid h-9 w-9 place-items-center rounded-xl', TONES[tone])}>
          {Icon && <Icon className="h-[18px] w-[18px]" />}
        </span>
        {hint && <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-medium text-muted">{hint}</span>}
      </div>
      <p className="mt-3 text-2xl font-bold leading-none tracking-tight text-ink">{value}</p>
      <p className="mt-1.5 text-xs font-medium text-muted">{label}</p>
      {footer && <div className="mt-3">{footer}</div>}
    </Card>
  );
}
