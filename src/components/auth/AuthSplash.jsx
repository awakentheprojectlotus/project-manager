import { Activity, Loader2 } from 'lucide-react';

export default function AuthSplash({ message = 'Loading…', description, actions }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-canvas px-6">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl" />
      <div className="relative flex flex-col items-center text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-float">
          <Activity className="h-6 w-6" strokeWidth={2.4} />
        </span>
        <p className="mt-4 text-lg font-bold tracking-tight text-ink">Pulse</p>
        <div className="mt-6 flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
          {message}
        </div>
        {description && <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted">{description}</p>}
        {actions && <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
