import { CheckCircle2, Info, AlertCircle, AlertTriangle, X } from 'lucide-react';
import clsx from 'clsx';
import { useUiStore } from '../../stores/uiStore';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const TONES = {
  success: 'text-emerald-500',
  error: 'text-rose-500',
  info: 'text-brand-500',
  warning: 'text-amber-500',
};

export default function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] || CheckCircle2;
        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm animate-slide-in-right items-start gap-3 rounded-xl border border-edge bg-elevated px-4 py-3 shadow-pop"
          >
            <Icon className={clsx('mt-0.5 h-[18px] w-[18px] shrink-0', TONES[toast.type] || TONES.success)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{toast.title}</p>
              {toast.message && <p className="mt-0.5 text-xs leading-relaxed text-muted">{toast.message}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="-mr-1 grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted hover:bg-canvas hover:text-ink"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
