import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  AlertTriangle,
  BellOff,
  CheckCircle2,
  Clock,
  FolderSync,
  UserPlus,
  Check,
} from 'lucide-react';
import { useNotificationStore } from '../../stores/notificationStore';
import { timeAgo } from '../../utils/date';

const ICON_MAP = {
  overdue: { icon: AlertTriangle, className: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' },
  deadline: { icon: Clock, className: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
  assignment: { icon: UserPlus, className: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' },
  completed: {
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  },
  status: { icon: FolderSync, className: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400' },
};

export default function NotificationPanel({ onClose }) {
  const navigate = useNavigate();
  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="absolute right-0 top-12 z-50 w-[min(92vw,380px)] origin-top-right animate-scale-in overflow-hidden rounded-2xl border border-edge bg-elevated shadow-pop">
      <div className="flex items-center justify-between gap-2 border-b border-edge px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-ink">Notifications</h3>
          {unread > 0 && (
            <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{unread}</span>
          )}
        </div>
        <button
          type="button"
          onClick={markAllRead}
          disabled={!unread}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-muted transition hover:bg-canvas hover:text-ink disabled:opacity-50"
        >
          <Check className="h-3 w-3" />
          Mark all read
        </button>
      </div>

      <div className="scrollbar-thin max-h-[420px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <BellOff className="h-6 w-6 text-muted" />
            <p className="mt-2 text-sm font-medium text-ink">You're all caught up</p>
            <p className="mt-0.5 text-xs text-muted">New assignments and deadlines appear here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-edge">
            {notifications.map((notification) => {
              const meta = ICON_MAP[notification.type] || ICON_MAP.status;
              const Icon = meta.icon;
              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => {
                      markRead(notification.id);
                      if (notification.link) navigate(notification.link);
                      onClose();
                    }}
                    className={clsx(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-canvas/70',
                      !notification.read && 'bg-brand-50/40 dark:bg-brand-500/[0.04]'
                    )}
                  >
                    <span className={clsx('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg', meta.className)}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className={clsx('text-[13px] leading-snug text-ink', !notification.read && 'font-semibold')}>
                          {notification.title}
                        </span>
                        {!notification.read && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
                      </span>
                      <span className="mt-0.5 block line-clamp-2 text-xs leading-relaxed text-muted">
                        {notification.message}
                      </span>
                      <span className="mt-1 block text-[10px] text-muted/80">{timeAgo(notification.createdAt)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
