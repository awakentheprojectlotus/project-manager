import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import CommandPalette from './CommandPalette';
import GlobalModals from '../shared/GlobalModals';
import Toaster from '../ui/Toaster';
import ConfirmHost from '../ui/ConfirmDialog';
import { useUiStore } from '../../stores/uiStore';
import { useSyncStore } from '../../stores/syncStore';
import { useDeadlineNotifications } from '../../hooks/useDeadlineNotifications';
import { isFirebaseConfigured } from '../../services/firebase';
import { retryWorkspaceSync } from '../../services/workspaceSync';

export default function AppLayout() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileNav = useUiStore((s) => s.setMobileNav);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const syncStatus = useSyncStore((s) => s.status);
  const syncError = useSyncStore((s) => s.error);
  const location = useLocation();

  useDeadlineNotifications();

  useEffect(() => {
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname, setMobileNav]);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setCommandOpen]);

  useEffect(() => {
    const onOnline = () => {
      if (useSyncStore.getState().status === 'error') retryWorkspaceSync();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  const footerStatus = !isFirebaseConfigured
    ? 'Data stored locally in this browser'
    : syncStatus === 'error'
      ? 'Firestore sync error — data is cached locally'
      : syncStatus === 'syncing'
        ? 'Saving to Firestore…'
        : syncStatus === 'connecting'
          ? 'Connecting to Firestore…'
          : 'Cached locally · Synced to Firestore';

  return (
    <div className="min-h-screen bg-canvas">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <Sidebar />
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMobileNav(false)}
            aria-hidden="true"
          />
          <div className="relative h-full w-[280px] animate-slide-in-left">
            <Sidebar mobile />
          </div>
        </div>
      )}

      <div
        className={clsx(
          'flex min-h-screen flex-col transition-[padding] duration-200',
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-[260px]'
        )}
      >
        <Topbar />

        {isFirebaseConfigured && syncStatus === 'error' && (
          <div className="border-b border-rose-200 bg-rose-50/90 dark:border-rose-500/20 dark:bg-rose-500/10">
            <div className="mx-auto flex max-w-[1560px] flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2 text-[11px] text-rose-700 dark:text-rose-300 sm:px-6 lg:px-8">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span className="font-semibold">Firestore not connected.</span>
              <span className="min-w-0 flex-1 basis-full leading-relaxed sm:basis-auto">
                {syncError || 'Your data is currently cached locally.'}
              </span>
              <button
                type="button"
                onClick={retryWorkspaceSync}
                className="inline-flex items-center gap-1 rounded-lg bg-white/70 px-2 py-1 text-[10.5px] font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20 transition hover:bg-white dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-400/30"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
              <Link
                to="/settings"
                className="rounded-lg px-2 py-1 text-[10.5px] font-medium underline-offset-2 hover:underline"
              >
                Fix in Settings
              </Link>
            </div>
          </div>
        )}

        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1560px] px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
        <footer className="border-t border-edge px-4 py-4 text-center text-[11px] text-muted sm:px-6 lg:px-8">
          Pulse Project Workspace · {footerStatus}
        </footer>
      </div>

      <CommandPalette />
      <GlobalModals />
      <ConfirmHost />
      <Toaster />
    </div>
  );
}
