import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../stores/authStore';
import { isFirebaseConfigured, firebaseProjectId } from '../../services/firebase';
import AuthSplash from './AuthSplash';

function SetupPanel() {
  const navigate = useNavigate();
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-10">
      <div className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="relative w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-float">
              <Activity className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <span className="text-[15px] font-bold tracking-tight text-ink">Pulse</span>
          </Link>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            Demo mode
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-edge bg-surface shadow-card">
          <div className="border-b border-edge bg-canvas/50 px-6 py-5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Firebase not configured
            </div>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-ink">
              Connect Firebase to enable sign-in and cloud sync
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Pulse is running in this browser with LocalStorage. Add your Firebase web app credentials to enable
              email/password sign-in and Firestore storage.
            </p>
          </div>

          <div className="space-y-5 px-6 py-5">
            <div>
              <p className="mb-1.5 text-xs font-semibold text-ink">1. Add credentials to .env</p>
              <pre className="overflow-x-auto rounded-xl bg-slate-950 px-4 py-3 text-[10.5px] leading-relaxed text-emerald-300">
{`VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_APP_ID=...`}
              </pre>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold text-ink">2. In the Firebase Console</p>
              <ul className="space-y-1.5">
                {[
                  'Create a project and add a Web app to copy the SDK config.',
                  'Authentication → Sign-in method → enable Email/Password.',
                  'Create a Firestore database and publish the rules from firestore.rules.',
                ].map((step) => (
                  <li key={step} className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-muted">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
              >
                Continue in demo mode
                <ArrowRight className="h-4 w-4" />
              </button>
              <span className="text-[11px] text-muted">Restart the dev server after editing .env.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const busy = useAuthStore((s) => s.busy);
  const error = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const clearError = useAuthStore((s) => s.clearError);

  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (isFirebaseConfigured && status === 'authenticated' && user) {
      navigate('/', { replace: true });
    }
  }, [status, user, navigate]);

  useEffect(() => {
    setLocalError('');
    setNotice('');
    clearError();
  }, [mode, clearError]);

  if (!isFirebaseConfigured) return <SetupPanel />;

  if (status === 'initializing' || (status === 'authenticated' && user)) {
    return (
      <AuthSplash
        message={status === 'authenticated' ? 'Opening your workspace…' : 'Checking your session…'}
        description="Verifying your Firebase authentication state."
      />
    );
  }

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (localError) setLocalError('');
    if (error) clearError();
  };

  const submit = async (event) => {
    event.preventDefault();
    setNotice('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setLocalError('Enter a valid email address.');
      return;
    }
    if (form.password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'signup') {
      if (!form.name.trim()) {
        setLocalError('Enter your name.');
        return;
      }
      if (form.password !== form.confirm) {
        setLocalError('Passwords do not match.');
        return;
      }
    }
    const ok =
      mode === 'signin'
        ? await signIn(form.email, form.password)
        : await signUp({ name: form.name, email: form.email, password: form.password });
    if (ok) navigate('/', { replace: true });
  };

  const handleReset = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setLocalError('Enter your email above first, then request a reset link.');
      return;
    }
    const ok = await resetPassword(form.email);
    if (ok) setNotice('Password reset email sent. Check your inbox.');
  };

  const displayError = localError || error;

  return (
    <div className="flex min-h-screen bg-canvas">
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-violet-700 p-10 text-white lg:flex xl:w-[48%]">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-96 w-96 rounded-full bg-violet-300/20 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/20 backdrop-blur">
            <Activity className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <div>
            <p className="text-[15px] font-bold leading-tight">Pulse</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/60">Project workspace</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80 ring-1 ring-inset ring-white/15">
            <Sparkles className="h-3 w-3" />
            AI-powered project management
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-balance xl:text-4xl">
            Your campaigns, tasks and team in one calm workspace.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Plan social campaigns, keep deliverables moving and let the built-in assistant handle the busywork —
            protected by Firebase Authentication.
          </p>
          <ul className="mt-7 space-y-3">
            {[
              'Email and password sign-in',
              'Projects, tasks and team synced to Firestore',
              'AI assistant that understands live workspace data',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-[13px] text-white/85">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/15">
                  <CheckCircle2 className="h-3 w-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-[11px] text-white/50">
          <ShieldCheck className="h-3.5 w-3.5" />
          Protected by Firebase Authentication{firebaseProjectId ? ` · ${firebaseProjectId}` : ''}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-float">
              <Activity className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <div>
              <p className="text-[15px] font-bold leading-tight text-ink">Pulse</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Project workspace</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {mode === 'signin'
                ? 'Sign in with your email and password to open the workspace.'
                : 'Use an email and password to join the shared workspace.'}
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-edge bg-elevated p-1">
            {[
              { value: 'signin', label: 'Sign in' },
              { value: 'signup', label: 'Create account' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMode(option.value)}
                className={clsx(
                  'h-8 rounded-lg text-[13px] font-medium transition',
                  mode === option.value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {displayError && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[12px] leading-relaxed text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              {displayError}
            </div>
          )}
          {notice && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[12px] leading-relaxed text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              {notice}
            </div>
          )}

          <form onSubmit={submit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-name" className="label-base">
                  Full name
                </label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="auth-name"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    autoComplete="name"
                    placeholder="Your name"
                    className="input-base pl-9"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="label-base">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="auth-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="input-base pl-9"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="auth-password" className="text-xs font-medium text-muted">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[11px] font-medium text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  placeholder="At least 6 characters"
                  className="input-base pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-elevated hover:text-ink"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-confirm" className="label-base">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="auth-confirm"
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={(e) => set('confirm', e.target.value)}
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    className="input-base pl-9"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60"
            >
              {busy ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <>
                  {mode === 'signin' ? 'Sign in' : 'Create account'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-[10.5px] leading-relaxed text-muted">
            Accounts use Firebase Email/Password authentication. Your workspace data is stored in Firestore and
            available to signed-in team members.
          </p>

          {firebaseProjectId && (
            <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              Firebase project · {firebaseProjectId}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
