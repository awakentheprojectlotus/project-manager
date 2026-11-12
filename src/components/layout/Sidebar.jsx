import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  Activity,
  ChevronLeft,
  PanelLeftOpen,
  Sparkles,
  X,
} from 'lucide-react';
import { NAV_ITEMS } from '../../constants';
import { useUiStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import { useTaskStore } from '../../stores/taskStore';
import { useTeamStore } from '../../stores/teamStore';
import { getTaskCounts } from '../../utils/analytics';
import Avatar from '../ui/Avatar';
import ProgressBar from '../ui/ProgressBar';

function Brand({ collapsed, onNavigate }) {
  return (
    <NavLink
      to="/"
      onClick={onNavigate}
      className={clsx('flex items-center gap-2.5 overflow-hidden px-3 py-1', collapsed && 'justify-center px-0')}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-float">
        <Activity className="h-5 w-5" strokeWidth={2.4} />
      </span>
      {!collapsed && (
        <span className="min-w-0">
          <span className="block text-[15px] font-bold leading-tight tracking-tight text-ink">Pulse</span>
          <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
            Workspace
          </span>
        </span>
      )}
    </NavLink>
  );
}

export default function Sidebar({ mobile = false }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setMobileNav = useUiStore((s) => s.setMobileNav);
  const currentUserId = useUiStore((s) => s.currentUserId);
  const projects = useProjectStore((s) => s.projects);
  const tasks = useTaskStore((s) => s.tasks);
  const members = useTeamStore((s) => s.members);

  const isCollapsed = !mobile && collapsed;
  const counts = getTaskCounts(tasks);
  const user = members.find((m) => m.id === currentUserId);
  const overall = counts.completionRate;
  const activeProjects = projects.filter((p) => p.status === 'in-progress').length;

  useEffect(() => {
    if (!mobile) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobile]);

  return (
    <aside
      className={clsx(
        'flex h-full flex-col border-r border-edge bg-surface',
        mobile
          ? 'w-[280px] shadow-pop'
          : clsx('transition-[width] duration-200', isCollapsed ? 'w-[76px]' : 'w-[260px]')
      )}
    >
      <div className={clsx('flex h-16 shrink-0 items-center justify-between', isCollapsed ? 'px-2' : 'px-3')}>
        <Brand collapsed={isCollapsed} onNavigate={mobile ? () => setMobileNav(false) : undefined} />
        {mobile && (
          <button
            type="button"
            onClick={() => setMobileNav(false)}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-elevated hover:text-ink"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className={clsx('scrollbar-thin flex-1 overflow-y-auto px-3 pb-4 pt-2', isCollapsed && 'px-2')}>
        {!isCollapsed && (
          <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Menu
          </p>
        )}
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={mobile ? () => setMobileNav(false) : undefined}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  clsx(
                    'group relative flex items-center gap-3 rounded-xl py-2.5 text-[13px] font-medium transition-colors',
                    isCollapsed ? 'justify-center px-0' : 'px-3',
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                      : 'text-muted hover:bg-elevated hover:text-ink'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-500" />
                    )}
                    <item.icon className={clsx('h-[18px] w-[18px] shrink-0', isActive && 'text-brand-600 dark:text-brand-400')} />
                    {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {!isCollapsed && item.badge && (
                      <span className="rounded-md bg-gradient-to-r from-brand-500 to-violet-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {!isCollapsed && (
        <div className="mx-3 mb-3 rounded-2xl border border-edge bg-canvas/70 p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-ink">Workspace health</p>
            <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400">{overall}%</span>
          </div>
          <ProgressBar value={overall} size="sm" className="mt-2" />
          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            {activeProjects} active {activeProjects === 1 ? 'project' : 'projects'} · {counts.open} open tasks
          </p>
        </div>
      )}

      <div className={clsx('border-t border-edge p-3', isCollapsed && 'px-2')}>
        <NavLink
          to="/assistant"
          onClick={mobile ? () => setMobileNav(false) : undefined}
          title={isCollapsed ? 'AI Assistant' : undefined}
          className={clsx(
            'mb-2 flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-float transition hover:brightness-110',
            isCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
          )}
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          {!isCollapsed && (
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-semibold leading-tight">Ask Pulse AI</span>
              <span className="block text-[10px] text-white/70">Your workspace, understood</span>
            </span>
          )}
        </NavLink>

        <NavLink
          to="/settings"
          onClick={mobile ? () => setMobileNav(false) : undefined}
          title={isCollapsed ? user?.name : undefined}
          className={clsx(
            'flex items-center gap-2.5 rounded-xl py-1.5 transition hover:bg-elevated',
            isCollapsed ? 'justify-center px-0' : 'px-1.5'
          )}
        >
          <Avatar member={user} size="sm" showStatus />
          {!isCollapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-semibold text-ink">{user?.name || 'Workspace user'}</span>
              <span className="block truncate text-[10px] text-muted">{user?.role || 'Member'}</span>
            </span>
          )}
        </NavLink>

        {!mobile && (
          <button
            type="button"
            onClick={toggleSidebar}
            className={clsx(
              'mt-1 flex w-full items-center gap-2.5 rounded-xl px-1.5 py-2 text-[11px] font-medium text-muted transition hover:bg-elevated hover:text-ink',
              isCollapsed && 'justify-center px-0'
            )}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!isCollapsed && 'Collapse menu'}
          </button>
        )}
      </div>
    </aside>
  );
}
