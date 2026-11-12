import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { useKeyDown } from '../../hooks/useKeyboard';

const SIZES = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  '2xl': 'sm:max-w-5xl',
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  icon: Icon,
  hideHeader = false,
  bodyClassName,
}) {
  useKeyDown('Escape', onClose, open);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-fade-in bg-slate-950/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
        className={clsx(
          'relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-edge bg-surface shadow-pop animate-scale-in sm:rounded-2xl',
          SIZES[size] || SIZES.md
        )}
      >
        {!hideHeader && (
          <div className="flex items-start justify-between gap-4 border-b border-edge px-5 py-4">
            <div className="flex min-w-0 items-start gap-3">
              {Icon && (
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
              )}
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-ink">{title}</h2>
                {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-elevated hover:text-ink"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className={clsx('scrollbar-thin flex-1 overflow-y-auto px-5 py-5', bodyClassName)}>
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-edge bg-canvas/60 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
