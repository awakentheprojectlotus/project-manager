import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

export function Field({ label, htmlFor, hint, error, required, children, className }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="label-base">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

export default function Input({ className, icon: Icon, suffix, id, ...props }) {
  if (!Icon && !suffix) {
    return <input id={id} className={clsx('input-base', className)} {...props} />;
  }
  return (
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      )}
      <input
        id={id}
        className={clsx('input-base', suffix && 'pr-10', className)}
        style={Icon ? { paddingLeft: '2.4rem' } : undefined}
        {...props}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{suffix}</span>
      )}
    </div>
  );
}

export function Textarea({ className, id, rows = 3, ...props }) {
  return <textarea id={id} rows={rows} className={clsx('input-base resize-none', className)} {...props} />;
}

export function Select({ className, children, id, options, placeholder, ...props }) {
  return (
    <div className="relative">
      <select
        id={id}
        className={clsx('input-base appearance-none pr-9', className)}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options
          ? options.map((option) => {
              const value = typeof option === 'string' ? option : option.value;
              const label = typeof option === 'string' ? option : option.label;
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              );
            })
          : children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
    </div>
  );
}

export function Checkbox({ label, className, ...props }) {
  return (
    <label className={clsx('flex cursor-pointer items-center gap-2 text-sm text-ink', className)}>
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-edge accent-brand-600"
        {...props}
      />
      {label}
    </label>
  );
}

export function Switch({ checked, onChange, label, description }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 py-2 text-left"
    >
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
      </span>
      <span
        className={clsx(
          'relative h-6 w-10 shrink-0 rounded-full transition-colors',
          checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-[1.15rem]' : 'translate-x-0.5'
          )}
        />
      </span>
    </button>
  );
}
