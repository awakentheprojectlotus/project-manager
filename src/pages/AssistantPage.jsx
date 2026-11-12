import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Terminal,
} from 'lucide-react';
import clsx from 'clsx';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import ChatWindow from '../components/chat/ChatWindow';
import { useChatStore } from '../stores/chatStore';
import { useProjectStore } from '../stores/projectStore';
import { useTaskStore } from '../stores/taskStore';
import { useTeamStore } from '../stores/teamStore';
import { getAiHealth } from '../services/apiService';
import { getAtRiskProjects, getTaskCounts, getWorkload, getWorkspaceStats } from '../utils/analytics';

export default function AssistantPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const sendMessage = useChatStore((s) => s.sendMessage);
  const messages = useChatStore((s) => s.messages);
  const projects = useProjectStore((s) => s.projects);
  const tasks = useTaskStore((s) => s.tasks);
  const members = useTeamStore((s) => s.members);

  const [health, setHealth] = useState({ configured: false, model: null, engine: 'local' });
  const [checking, setChecking] = useState(true);
  const promptedRef = useRef(false);

  const refreshHealth = useCallback(async () => {
    setChecking(true);
    const result = await getAiHealth();
    setHealth(result);
    setChecking(false);
  }, []);

  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  useEffect(() => {
    const prompt = location.state?.prompt;
    if (prompt && !promptedRef.current) {
      promptedRef.current = true;
      sendMessage(prompt);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, sendMessage]);

  const stats = getWorkspaceStats(projects, tasks);
  const counts = getTaskCounts(tasks);
  const risks = useMemo(() => getAtRiskProjects(projects, tasks), [projects, tasks]);
  const workload = useMemo(() => getWorkload(members, tasks), [members, tasks]);
  const overloaded = workload.filter((w) => w.utilization > 90 || w.open >= 5);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Intelligence"
        title="AI Assistant"
        description="Ask questions or give instructions. Pulse AI reads the live workspace and applies changes through validated actions."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-[calc(100vh-16rem)] min-h-[540px] xl:h-[calc(100vh-15rem)]">
          <ChatWindow />
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  <Cpu className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[12.5px] font-semibold text-ink">AI connection</p>
                  <p className="text-[10.5px] text-muted">
                    {checking ? 'Checking…' : health.configured ? 'Gemini proxied via server' : 'Local assistant engine'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={refreshHealth}
                className="grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:bg-elevated hover:text-ink"
                aria-label="Recheck AI connection"
                title="Recheck connection"
              >
                <RefreshCw className={clsx('h-3.5 w-3.5', checking && 'animate-spin')} />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-xl border border-edge bg-canvas/50 px-3 py-2">
              <span
                className={clsx(
                  'h-2 w-2 rounded-full',
                  health.configured ? 'bg-emerald-500' : 'bg-amber-500'
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11.5px] font-medium text-ink">
                  {health.configured ? `Gemini · ${health.model || 'gemini-2.0-flash'}` : 'Local deterministic engine'}
                </p>
                <p className="text-[10px] text-muted">
                  {health.configured
                    ? 'Live data is sent through the secure API proxy.'
                    : 'Runs fully in-browser against your workspace data.'}
                </p>
              </div>
            </div>

            {health.configured && (
              <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                Google restricts Gemini by region. If replies come from the local engine, use a system-wide
                VPN/proxy in a supported country or host the API proxy there.
              </p>
            )}

            {!health.configured && (
              <div className="mt-3 rounded-xl bg-canvas/60 p-2.5">
                <p className="flex items-center gap-1.5 text-[10.5px] font-medium text-ink">
                  <Terminal className="h-3 w-3" />
                  Enable Gemini
                </p>
                <code className="mt-1.5 block rounded-lg bg-slate-950 px-2 py-1.5 text-[10px] text-emerald-300">
                  GEMINI_API_KEY=your_key
                </code>
                <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
                  Add it to <span className="font-medium text-ink">.env</span> and restart the dev server. The key never
                  reaches the browser.
                </p>
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
                <Database className="h-3.5 w-3.5 text-muted" />
                Workspace context
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                <span className="h-1 w-1 rounded-full bg-emerald-500" />
                Live
              </span>
            </div>
            <dl className="mt-3 space-y-2 text-[11px]">
              {[
                ['Projects', `${projects.length} (${stats.activeProjects} active)`],
                ['Tasks', `${counts.total} · ${counts.open} open`],
                ['Overdue', `${counts.overdue} task${counts.overdue === 1 ? '' : 's'}`],
                ['Team members', `${members.length}`],
                ['At-risk projects', `${risks.length}`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>

            {risks.length > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-edge pt-2.5">
                {risks.slice(0, 3).map((risk) => (
                  <div key={risk.project.id} className="flex items-center gap-1.5 text-[10.5px]">
                    <AlertTriangle
                      className={clsx(
                        'h-3 w-3 shrink-0',
                        risk.risk === 'high' ? 'text-rose-500' : 'text-amber-500'
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate text-muted">{risk.project.name}</span>
                    <span className="shrink-0 font-medium text-ink">{risk.progress}%</span>
                  </div>
                ))}
              </div>
            )}

            {overloaded.length > 0 && (
              <p className="mt-2.5 border-t border-edge pt-2 text-[10.5px] leading-relaxed text-muted">
                <span className="font-medium text-ink">{overloaded[0].member.name}</span> is at{' '}
                {overloaded[0].utilization}% capacity with {overloaded[0].open} open tasks.
              </p>
            )}
          </Card>

          <Card className="p-4">
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
              <Sparkles className="h-3.5 w-3.5 text-brand-500" />
              What it can do
            </p>
            <ul className="mt-2.5 space-y-2">
              {[
                'Answer questions about deadlines, risk and workload',
                'Create tasks and assign owners',
                'Update project status, priority and deadlines',
                'Move tasks, including bulk overdue cleanups',
                'Recommend priorities based on real data',
              ].map((item) => (
                <li key={item} className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="border-dashed p-4">
            <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Safe by design
            </p>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted">
              The assistant uses a fixed action schema — no code execution. Every change is validated against existing
              project, task and member IDs, and deletions require your confirmation.
            </p>
            <p className="mt-2 flex items-center gap-1 text-[10px] text-muted">
              <Lock className="h-2.5 w-2.5" />
              API key stays server-side · {messages.length} messages in this chat
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
