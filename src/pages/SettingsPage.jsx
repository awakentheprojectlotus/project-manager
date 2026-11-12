import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bot,
  Check,
  Cloud,
  CloudOff,
  Copy,
  Database,
  Download,
  ExternalLink,
  HardDrive,
  KeyRound,
  Lock,
  LogOut,
  Moon,
  Pencil,
  RefreshCw,
  RotateCcw,
  Sun,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react';
import clsx from 'clsx';
import PageHeader from '../components/ui/PageHeader';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { Select, Switch } from '../components/ui/Input';
import { useUiStore } from '../stores/uiStore';
import { useTeamStore } from '../stores/teamStore';
import { useProjectStore } from '../stores/projectStore';
import { useTaskStore } from '../stores/taskStore';
import { useSyncStore } from '../stores/syncStore';
import { useAuthStore } from '../stores/authStore';
import { isFirebaseConfigured, firebaseProjectId } from '../services/firebase';
import { flushWorkspaceSync, pushWorkspaceToFirestore } from '../services/workspaceSync';
import { exportWorkspace, getAiHealth, importWorkspace } from '../services/apiService';
import { resetDemoData, clearWorkspace } from '../utils/resetWorkspace';
import { formatDate, timeAgo, todayISO } from '../utils/date';

const FIRESTORE_RULES = "rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /workspaces/main {\n      allow read, write: if request.auth != null;\n    }\n    match /{document=**} {\n      allow read, write: if false;\n    }\n  }\n}";

const storageUsage = () => {
  try {
    let bytes = 0;
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('pulse-')) bytes += key.length + (localStorage.getItem(key)?.length || 0);
    });
    return bytes > 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  } catch {
    return '—';
  }
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const prefs = useUiStore((s) => s.prefs);
  const updatePrefs = useUiStore((s) => s.updatePrefs);
  const currentUserId = useUiStore((s) => s.currentUserId);
  const openMemberForm = useUiStore((s) => s.openMemberForm);
  const confirm = useUiStore((s) => s.confirm);
  const pushToast = useUiStore((s) => s.pushToast);
  const members = useTeamStore((s) => s.members);
  const projects = useProjectStore((s) => s.projects);
  const tasks = useTaskStore((s) => s.tasks);

  const authUser = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const authBusy = useAuthStore((s) => s.busy);
  const syncStatus = useSyncStore((s) => s.status);
  const syncError = useSyncStore((s) => s.error);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);

  const [health, setHealth] = useState({ configured: false, model: null });
  const [checking, setChecking] = useState(true);
  const [pushing, setPushing] = useState(false);
  const fileRef = useRef(null);
  const user = members.find((m) => m.id === currentUserId);

  const checkHealth = async () => {
    setChecking(true);
    setHealth(await getAiHealth());
    setChecking(false);
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleExport = async () => {
    const data = await exportWorkspace();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pulse-workspace-${todayISO()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    pushToast({ type: 'success', title: 'Backup exported', message: 'Your workspace JSON has been downloaded.' });
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const ok = await confirm({
        title: 'Import this backup?',
        description: 'This replaces all current projects, tasks and members with the contents of the file.',
        confirmLabel: 'Import workspace',
      });
      if (!ok) return;
      await importWorkspace(payload);
      pushToast({ type: 'success', title: 'Workspace imported', message: 'Your data has been restored.' });
    } catch (err) {
      pushToast({ type: 'error', title: 'Import failed', message: err.message || 'The file could not be read.' });
    }
  };

  const handleSyncNow = async () => {
    await flushWorkspaceSync();
    pushToast({ type: 'success', title: 'Sync requested', message: 'Your latest workspace changes are saved to Firestore.' });
  };

  const handleSignOut = async () => {
    await signOut();
    pushToast({ type: 'info', title: 'Signed out', message: 'Your workspace is locked.' });
    navigate('/auth');
  };

  const copyFirestoreRules = async () => {
    try {
      await navigator.clipboard.writeText(FIRESTORE_RULES);
      pushToast({
        type: 'success',
        title: 'Rules copied',
        message: 'Paste them in Firebase Console → Firestore Database → Rules, then publish.',
      });
    } catch {
      pushToast({ type: 'error', title: 'Could not copy rules' });
    }
  };

  const handlePushLocal = async () => {    const ok = await confirm({
      title: 'Push local data to Firestore?',
      description:
        'This replaces the shared Firestore workspace with the projects, tasks, team and Drive links currently stored in this browser.',
      confirmLabel: 'Push to Firestore',
    });
    if (!ok) return;
    setPushing(true);
    try {
      await pushWorkspaceToFirestore();
      pushToast({
        type: 'success',
        title: 'Saved to Firestore',
        message: 'Your local workspace is now stored in Firestore.',
      });
    } catch (err) {
      pushToast({
        type: 'error',
        title: 'Could not save to Firestore',
        message: err.message || 'Firestore did not accept the write.',
      });
    } finally {
      setPushing(false);
    }
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Reset to demo workspace?',
      description: 'All current projects, tasks and members will be replaced with the sample workspace.',
      confirmLabel: 'Reset workspace',
    });
    if (!ok) return;
    resetDemoData();
    pushToast({ type: 'success', title: 'Demo workspace restored', message: 'Sample projects, tasks and people are back.' });
  };

  const handleClear = async () => {
    const ok = await confirm({
      title: 'Delete all workspace data?',
      description: 'Every project, task, team member and chat message will be permanently removed from this browser.',
      confirmLabel: 'Delete everything',
    });
    if (!ok) return;
    clearWorkspace();
    pushToast({ type: 'info', title: 'Workspace cleared', message: 'You are starting from a blank slate.' });
    navigate('/');
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Manage your profile, workspace behavior, AI connection and local data."
      />

      <Card>
        <CardHeader title="Profile" subtitle="Your identity inside the workspace" icon={UserRound} />
        <div className="grid gap-5 px-5 pb-5 pt-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <Avatar member={user} size="xl" showStatus />
            <div className="min-w-0">
              <p className="text-base font-semibold text-ink">{user?.name || 'No profile selected'}</p>
              <p className="text-sm text-muted">{user?.role || '—'}</p>
              <p className="mt-0.5 truncate text-xs text-muted">{user?.email || 'No email on file'}</p>
              <p className="mt-2 text-[11px] text-muted">
                {user?.joinedAt ? `Member since ${formatDate(user.joinedAt, 'MMM yyyy')}` : 'Workspace member'}
              </p>
              <Button
                variant="secondary"
                size="sm"
                icon={Pencil}
                className="mt-3"
                onClick={() => user && openMemberForm(user)}
                disabled={!user}
              >
                Edit profile
              </Button>
            </div>
          </div>

          <div>
            <p className="label-base">Appearance</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'light', label: 'Light', icon: Sun, preview: 'bg-[#f7f8fb]' },
                { value: 'dark', label: 'Dark', icon: Moon, preview: 'bg-[#0d1220]' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={clsx(
                    'flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition',
                    theme === option.value
                      ? 'border-brand-400 ring-2 ring-brand-500/15'
                      : 'border-edge hover:border-brand-200 dark:hover:border-brand-500/30'
                  )}
                >
                  <span className={clsx('grid h-9 w-9 place-items-center rounded-lg border border-edge', option.preview)}>
                    <option.icon className={clsx('h-4 w-4', option.value === 'dark' ? 'text-slate-300' : 'text-slate-600')} />
                  </span>
                  <span className="flex-1 text-[12.5px] font-medium text-ink">{option.label}</span>
                  {theme === option.value && <Check className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted">Theme preference is saved to this browser.</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Firebase sync"
          subtitle="Signed-in Firestore workspace"
          icon={Cloud}
          action={
            <span
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset',
                !isFirebaseConfigured
                  ? 'bg-elevated text-muted ring-edge'
                  : syncStatus === 'error'
                    ? 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300'
                    : syncStatus === 'syncing' || syncStatus === 'connecting'
                      ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300'
                      : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300'
              )}
            >
              <span
                className={clsx(
                  'h-1.5 w-1.5 rounded-full',
                  !isFirebaseConfigured
                    ? 'bg-slate-400'
                    : syncStatus === 'error'
                      ? 'bg-rose-500'
                      : syncStatus === 'syncing' || syncStatus === 'connecting'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                )}
              />
              {!isFirebaseConfigured
                ? 'Local mode'
                : syncStatus === 'error'
                  ? 'Sync issue'
                  : syncStatus === 'syncing'
                    ? 'Saving?'
                    : syncStatus === 'connecting'
                      ? 'Connecting?'
                      : 'Synced'}
            </span>
          }
        />

        <div className="px-5 pb-5 pt-4">
          {isFirebaseConfigured ? (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-sm font-bold text-white">
                    {(authUser?.displayName || authUser?.email || '?').slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {authUser?.displayName || 'Signed in'}
                    </p>
                    <p className="truncate text-[11px] text-muted">{authUser?.email}</p>
                    <p className="mt-0.5 text-[10px] text-muted">
                      Email/password · {firebaseProjectId} · workspaces/main
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Upload}
                    onClick={handlePushLocal}
                    loading={pushing}
                  >
                    Push local data
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={RefreshCw}
                    onClick={handleSyncNow}
                    loading={syncStatus === 'syncing'}
                  >
                    Sync now
                  </Button>
                  <Button
                    variant="danger-ghost"
                    size="sm"
                    icon={LogOut}
                    onClick={handleSignOut}
                    disabled={authBusy}
                  >
                    Sign out
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2.5 text-[10.5px] leading-relaxed text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Any email/password account that can sign in can read and edit this shared workspace. Create
                  accounts in Firebase Authentication or from the sign-in screen.
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-1 border-t border-edge pt-3 text-[10.5px] text-muted">
                <span className="flex items-center gap-1.5">
                  {syncStatus === 'error' ? (
                    <CloudOff className="h-3 w-3 text-rose-500" />
                  ) : (
                    <Cloud className="h-3 w-3 text-emerald-500" />
                  )}
                  {syncStatus === 'syncing'
                    ? 'Saving your latest changes to Firestore?'
                    : syncStatus === 'connecting'
                      ? 'Connecting to your Firestore workspace?'
                      : syncStatus === 'error'
                        ? syncError || 'Could not reach Firestore.'
                        : 'All changes saved' + (lastSyncedAt ? ' ? ' + timeAgo(lastSyncedAt) : '')}
                </span>
                <span className="text-[10px] text-muted/80">
                  Changes sync automatically between open tabs and devices. If your data only exists in this
                  browser, use “Push local data”.
                </span>
              </div>

              <details className="mt-3 rounded-xl border border-edge bg-canvas/40 px-3 py-2">
                <summary className="cursor-pointer text-[11px] font-medium text-ink">
                  Firestore setup help
                </summary>
                <div className="mt-2 space-y-2 text-[10.5px] leading-relaxed text-muted">
                  <p>1. Create a Firestore database in the Firebase console for this project.</p>
                  <a
                    href={'https://console.firebase.google.com/project/' + firebaseProjectId + '/firestore/rules'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Open Firestore rules in Firebase Console
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p>2. Open Firestore → Rules, paste these (they require sign-in), then Publish:</p>
                    <button
                      type="button"
                      onClick={copyFirestoreRules}
                      className="inline-flex items-center gap-1 rounded-md border border-edge bg-surface px-1.5 py-0.5 text-[9.5px] font-medium text-ink hover:bg-canvas"
                    >
                      <Copy className="h-2.5 w-2.5" />
                      Copy
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded-lg bg-slate-950 p-2.5 text-[9.5px] leading-relaxed text-emerald-300">{FIRESTORE_RULES}</pre>
                  <p>Or deploy with the CLI:</p>
                  <code className="block rounded-lg bg-canvas px-2 py-1.5 text-[9.5px] text-ink">
                    firebase deploy --only firestore:rules
                  </code>
                  <p className="text-[9.5px] text-muted/80">
                    If the CLI asks you to authenticate: <span className="font-mono">firebase login --reauth</span>
                  </p>
                  {syncError && (
                    <p className="rounded-lg bg-rose-50 px-2 py-1.5 text-[10px] text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                      Last error: {syncError}
                    </p>
                  )}
                </div>
              </details>
            </>
          ) : (
            <div>
              <p className="text-sm font-semibold text-ink">Running locally</p>
              <p className="mt-1 max-w-lg text-[11.5px] leading-relaxed text-muted">
                Projects and tasks are stored in LocalStorage. Add Firebase web credentials to{' '}
                <span className="font-medium text-ink">.env</span> or{' '}
                <span className="font-medium text-ink">.env.local</span> to enable email/password sign-in and
                store data in Firestore.
              </p>
              <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted">
                {['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID'].map((key) => (
                  <li key={key} className="font-mono text-[9.5px] text-ink/70">
                    {key}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Workspace preferences" subtitle="Defaults and notifications" icon={Database} />
          <div className="px-5 pb-4 pt-4">
            <p className="label-base">Default task view</p>
            <Select
              value={prefs.defaultTaskView}
              onChange={(e) => updatePrefs({ defaultTaskView: e.target.value })}
              options={[
                { value: 'kanban', label: 'Kanban board' },
                { value: 'list', label: 'List view' },
                { value: 'calendar', label: 'Calendar view' },
              ]}
            />
            <div className="mt-4 divide-y divide-edge">
              <Switch
                label="Deadline reminders"
                description="Notify when project deadlines are close."
                checked={prefs.notifyDeadlines !== false}
                onChange={(value) => updatePrefs({ notifyDeadlines: value })}
              />
              <Switch
                label="Task assignments"
                description="Notify when work is assigned to someone."
                checked={prefs.notifyAssignments !== false}
                onChange={(value) => updatePrefs({ notifyAssignments: value })}
              />
              <Switch
                label="Overdue alerts"
                description="Notify about tasks past their deadline."
                checked={prefs.notifyOverdue !== false}
                onChange={(value) => updatePrefs({ notifyOverdue: value })}
              />
              <Switch
                label="Status changes"
                description="Notify when projects or tasks change status."
                checked={prefs.notifyStatus !== false}
                onChange={(value) => updatePrefs({ notifyStatus: value })}
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="AI integration"
            subtitle="Gemini proxy and assistant engine"
            icon={Bot}
            action={
              <button
                type="button"
                onClick={checkHealth}
                className="grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:bg-elevated hover:text-ink"
                aria-label="Recheck AI connection"
              >
                <RefreshCw className={clsx('h-3.5 w-3.5', checking && 'animate-spin')} />
              </button>
            }
          />
          <div className="px-5 pb-5 pt-4">
            <div className="flex items-center gap-2.5 rounded-xl border border-edge bg-canvas/50 px-3 py-2.5">
              <span className={clsx('h-2.5 w-2.5 shrink-0 rounded-full', health.configured ? 'bg-emerald-500' : 'bg-amber-500')} />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-medium text-ink">
                  {checking ? 'Checking connection…' : health.configured ? 'Gemini configured' : 'Local engine active'}
                </p>
                <p className="text-[10.5px] text-muted">
                  {health.configured
                    ? `Model: ${health.model || 'gemini-2.0-flash'} · proxied server-side`
                    : 'Add an API key to .env to enable Gemini'}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-canvas/60 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink">
                <KeyRound className="h-3 w-3" />
                Server-side configuration
              </p>
              <code className="mt-2 block rounded-lg bg-slate-950 px-2.5 py-2 text-[10.5px] leading-relaxed text-emerald-300">
                GEMINI_API_KEY=your_key_here
                <br />
                GEMINI_MODEL=gemini-3.8-flash
              </code>
              <p className="mt-2 text-[10.5px] leading-relaxed text-muted">
                Place these in <span className="font-medium text-ink">.env</span> at the project root and restart
                <span className="font-medium text-ink"> npm run dev</span>. The browser only calls your local proxy at
                <span className="font-medium text-ink"> /api/ai</span>.
              </p>
            </div>

            <p className="mt-3 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-muted">
              <Lock className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
              No API key is stored in the frontend bundle or LocalStorage. All modifications are schema-validated before
              they reach the Zustand stores.
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Data & storage"
          subtitle="Your workspace lives in this browser"
          icon={HardDrive}
          action={
            <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-medium text-muted">
              {storageUsage()} used
            </span>
          }
        />
        <div className="grid gap-5 px-5 pb-5 pt-4 sm:grid-cols-2">
          <div>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['Projects', projects.length],
                ['Tasks', tasks.length],
                ['Members', members.length],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-edge bg-canvas/50 px-3 py-2.5">
                  <p className="text-lg font-bold leading-none text-ink">{value}</p>
                  <p className="mt-1 text-[10.5px] text-muted">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              Data persists automatically in LocalStorage under the <span className="font-medium text-ink">pulse-*</span> keys.
              Refreshing the browser keeps your projects, tasks, people and chat history.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" icon={Download} onClick={handleExport}>
                Export JSON
              </Button>
              <Button variant="secondary" size="sm" icon={Upload} onClick={() => fileRef.current?.click()}>
                Import backup
              </Button>
              <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
              <Button variant="secondary" size="sm" icon={RotateCcw} onClick={handleReset}>
                Reset demo data
              </Button>
            </div>
            <div className="mt-1 rounded-xl border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-500/20 dark:bg-rose-500/[0.06]">
              <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">Danger zone</p>
              <p className="mt-0.5 text-[10.5px] leading-relaxed text-rose-600/90 dark:text-rose-300/80">
                Permanently delete every project, task and member from this browser.
              </p>
              <Button variant="danger" size="sm" icon={Trash2} className="mt-2" onClick={handleClear}>
                Clear workspace
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
