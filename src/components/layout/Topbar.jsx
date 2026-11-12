import { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  Bell,
  Cloud,
  CloudOff,
  CheckSquare,
  FolderPlus,
  LogOut,
  Menu,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Sun,
  UserPlus,
} from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useTeamStore } from '../../stores/teamStore';
import { useSyncStore } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';
import { isFirebaseConfigured } from '../../services/firebase';
import { useClickOutside } from '../../hooks/useClickOutside';
import NotificationPanel from './NotificationPanel';
import Dropdown from '../ui/Dropdown';
import Avatar from '../ui/Avatar';

const TITLES = {
  '/': 'Overview',
  '/tasks': 'My Tasks',
  '/projects': 'Projects',
  '/team': 'Team Members',
  '/calendar': 'Calendar',
  '/reports': 'Reports & Analytics',
  '/assistant': 'AI Assistant',
  '/settings': 'Settings',
};

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const setMobileNav = useUiStore((s) => s.setMobileNav);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const notificationsOpen = useUiStore((s) => s.notificationsOpen);
  const setNotificationsOpen = useUiStore((s) => s.setNotificationsOpen);
  const openTaskForm = useUiStore((s) => s.openTaskForm);
  const openProjectForm = useUiStore((s) => s.openProjectForm);
  const openMemberForm = useUiStore((s) => s.openMemberForm);
  const currentUserId = useUiStore((s) => s.currentUserId);
  const members = useTeamStore((s) => s.members);
  const notifications = useNotificationStore((s) => s.notifications);
  const syncStatus = useSyncStore((s) => s.status);
  const authUser = useAuthStore((s) => s.user);
  const authBusy = useAuthStore((s) => s.busy);
  const signOut = useAuthStore((s) => s.signOut);
  const pushToast = useUiStore((s) => s.pushToast);
  const panelRef = useRef(null);

  useClickOutside(panelRef, () => setNotificationsOpen(false), notificationsOpen);

  const unread = notifications.filter((n) => !n.read).length;
  const user = members.find((m) => m.id === currentUserId);
  const pageTitle = location.pathname.startsWith('/projects/')
    ? 'Project details'
    : TITLES[location.pathname] || 'Workspace';

  const quickCreate = [
    {
      label: 'New task',
      icon: CheckSquare,
      onClick: () => openTaskForm(null, { assigneeId: currentUserId }),
    },
    { label: 'New project', icon: FolderPlus, onClick: () => openProjectForm() },
    { label: 'Add team member', icon: UserPlus, onClick: () => openMemberForm() },
    { separator: true },
    { label: 'Ask Pulse AI', icon: Sparkles, onClick: () => navigate('/assistant') },
  ];

  const handleSignOut = async () => {
    await signOut();
    pushToast({ type: 'info', title: 'Signed out', message: 'Your workspace is locked.' });
    navigate('/auth');
  };

  const userMenu = [
    ...(isFirebaseConfigured && authUser
      ? [{ label: authUser.email || 'Signed in', disabled: true }, { separator: true }]
      : []),
    { label: 'Settings', icon: Settings, onClick: () => navigate('/settings') },
    { label: 'AI Assistant', icon: Sparkles, onClick: () => navigate('/assistant') },
    { separator: true },
    {
      label: 'Clear notifications',
      icon: Bell,
      onClick: () => useNotificationStore.getState().markAllRead(),
    },
    ...(isFirebaseConfigured
      ? [
          { separator: true },
          {
            label: authBusy ? 'Signing out?' : 'Sign out',
            icon: LogOut,
            danger: true,
            disabled: authBusy,
            onClick: handleSignOut,
          },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-edge bg-surface/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => setMobileNav(true)}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-edge bg-surface text-muted transition hover:text-ink lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>

        <div className="hidden min-w-0 items-center gap-2 lg:flex">
          <span className="text-xs text-muted">Workspace</span>
          <span className="text-xs text-muted/50">/</span>
          <span className="truncate text-sm font-semibold text-ink">{pageTitle}</span>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="group flex h-9 items-center gap-2 rounded-xl border border-edge bg-canvas/60 px-3 text-muted transition hover:border-brand-300 hover:bg-surface hover:text-ink sm:w-64"
            aria-label="Search workspace"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="hidden flex-1 text-left text-[13px] sm:block">Search workspace…</span>
            <kbd className="hidden rounded-md border border-edge bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted sm:block">
              Ctrl K
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-xl border border-edge bg-surface text-muted transition hover:text-ink sm:hidden"
            aria-label="Search workspace"
          >
            <Search className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/assistant')}
            className="hidden h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 px-3 text-[13px] font-medium text-white shadow-float transition hover:brightness-110 md:flex"
          >
            <Sparkles className="h-4 w-4" />
            Ask AI
          </button>

          {isFirebaseConfigured && (
            <button
              type="button"
              onClick={() => navigate('/settings')}
              title={
                syncStatus === 'syncing'
                  ? 'Saving changes to Firestore'
                  : syncStatus === 'error'
                    ? 'Sync issue ? open settings'
                    : 'Workspace synced with Firestore'
              }
              className="hidden h-9 items-center gap-1.5 rounded-xl border border-edge bg-surface px-2.5 text-[10.5px] font-medium text-muted transition hover:text-ink md:flex"
            >
              {syncStatus === 'syncing' ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-brand-500" />
              ) : syncStatus === 'error' ? (
                <CloudOff className="h-3.5 w-3.5 text-amber-500" />
              ) : (
                <Cloud className="h-3.5 w-3.5 text-emerald-500" />
              )}
              {syncStatus === 'syncing' ? 'Saving?' : syncStatus === 'error' ? 'Sync issue' : 'Synced'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="grid h-9 w-9 place-items-center rounded-xl border border-edge bg-surface text-muted transition hover:text-ink"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Dropdown
            trigger={
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm transition hover:bg-brand-700">
                <Plus className="h-[18px] w-[18px]" />
              </span>
            }
            items={quickCreate}
            buttonClassName="rounded-xl"
          />

          <div className="relative" ref={panelRef}>
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative grid h-9 w-9 place-items-center rounded-xl border border-edge bg-surface text-muted transition hover:text-ink"
              aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-surface">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            {notificationsOpen && <NotificationPanel onClose={() => setNotificationsOpen(false)} />}
          </div>

          <Dropdown
            trigger={
              <span className="flex items-center gap-1.5">
                <Avatar member={user} size="sm" showStatus />
                <span className="hidden text-left sm:block">
                  <span className="block max-w-[120px] truncate text-[12px] font-semibold leading-tight text-ink">
                    {user?.name || 'User'}
                  </span>
                  <span className="block text-[10px] leading-tight text-muted">{user?.role || 'Member'}</span>
                </span>
              </span>
            }
            items={userMenu}
            buttonClassName="flex items-center gap-2 rounded-xl border border-edge bg-surface py-1 pl-1 pr-1.5 transition hover:bg-canvas sm:pr-2.5"
          />
        </div>
      </div>
    </header>
  );
}
