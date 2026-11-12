import clsx from 'clsx';
import { clamp } from '../../utils/helpers';

const HEIGHTS = { sm: 'h-1', md: 'h-1.5', lg: 'h-2.5' };

export default function ProgressBar({ value = 0, color = '#6366f1', size = 'md', className, trackClassName }) {
  const safe = clamp(Math.round(value), 0, 100);
  return (
    <div
      role="progressbar"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
      className={clsx(
        'w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800',
        HEIGHTS[size],
        trackClassName,
        className
      )}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${safe}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function ProgressRing({ value = 0, size = 44, stroke = 4, color = '#6366f1', label }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamp(value, 0, 100) / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-slate-200 dark:stroke-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute text-[10px] font-semibold text-ink">{label ?? `${Math.round(value)}%`}</span>
    </div>
  );
}
