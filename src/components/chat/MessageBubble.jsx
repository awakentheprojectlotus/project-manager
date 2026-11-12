import { memo } from 'react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { AlertCircle, Check, CheckCircle2, Info, Sparkles, X } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { useProjectStore } from '../../stores/projectStore';
import { useTaskStore } from '../../stores/taskStore';
import { useTeamStore } from '../../stores/teamStore';
import { describeActions } from '../../services/aiActions';

function RichText({ content }) {
  return (
    <div className="space-y-1 text-[13px] leading-relaxed">
      {content.split('\n').map((line, index) => {
        if (!line.trim()) return <div key={index} className="h-1" />;
        const bullet = /^\s*•\s+/.test(line);
        const text = line.replace(/^\s*•\s+/, '');
        const parts = text
          .split(/(\*\*[^*]+\*\*)/g)
          .filter(Boolean)
          .map((part, i) =>
            part.startsWith('**') && part.endsWith('**') ? (
              <strong key={i} className="font-semibold text-ink">
                {part.slice(2, -2)}
              </strong>
            ) : (
              <span key={i}>{part}</span>
            )
          );
        if (bullet) {
          return (
            <p key={index} className="flex gap-2">
              <span className="mt-[3px] text-brand-500">•</span>
              <span className="min-w-0">{parts}</span>
            </p>
          );
        }
        return <p key={index}>{parts}</p>;
      })}
    </div>
  );
}

function MessageBubble({ message }) {
  const confirmPending = useChatStore((s) => s.confirmPending);
  const cancelPending = useChatStore((s) => s.cancelPending);
  const projects = useProjectStore((s) => s.projects);
  const tasks = useTaskStore((s) => s.tasks);
  const members = useTeamStore((s) => s.members);

  const isUser = message.role === 'user';
  const pending = message.pendingActions?.length
    ? describeActions(message.pendingActions, { projects, tasks, members })
    : [];

  return (
    <div className={clsx('flex w-full gap-2.5', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-sm">
          <Sparkles className="h-4 w-4" />
        </span>
      )}

      <div className={clsx('min-w-0 max-w-[86%] sm:max-w-[78%]', isUser && 'flex flex-col items-end')}>
        <div
          className={clsx(
            'rounded-2xl px-3.5 py-2.5',
            isUser
              ? 'rounded-br-md bg-brand-600 text-white shadow-sm'
              : 'rounded-bl-md border border-edge bg-surface text-ink shadow-sm'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{message.content}</p>
          ) : (
            <RichText content={message.content} />
          )}

          {message.notice && (
            <p
              className={clsx(
                'mt-2 flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-[10.5px] leading-relaxed',
                isUser
                  ? 'bg-white/10 text-white/80'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
              )}
            >
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              {message.notice}
            </p>
          )}

          {message.validationErrors?.length > 0 && (
            <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-rose-50 px-2 py-1.5 text-[10.5px] leading-relaxed text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              {message.validationErrors.join(' · ')}
            </p>
          )}
        </div>

        {pending.length > 0 && (
          <div className="mt-2 w-full overflow-hidden rounded-xl border border-brand-200 bg-brand-50/50 dark:border-brand-500/30 dark:bg-brand-500/[0.06]">
            <p className="border-b border-brand-200/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand-700 dark:border-brand-500/20 dark:text-brand-300">
              Confirmation required
            </p>
            <ul className="space-y-1 px-3 py-2">
              {pending.map((description, index) => (
                <li key={index} className="flex items-start gap-1.5 text-[11.5px] text-ink">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-brand-500" />
                  {description}
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-end gap-1.5 border-t border-brand-200/70 px-2.5 py-1.5 dark:border-brand-500/20">
              <button
                type="button"
                onClick={() => cancelPending(message.id)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-muted transition hover:bg-surface hover:text-ink"
              >
                <X className="h-3 w-3" />
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmPending(message.id)}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-brand-700"
              >
                <Check className="h-3 w-3" />
                Confirm & apply
              </button>
            </div>
          </div>
        )}

        {message.executedActions?.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {message.executedActions.map((description, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20"
              >
                <CheckCircle2 className="h-2.5 w-2.5" />
                {description}
              </span>
            ))}
          </div>
        )}

        <div className={clsx('mt-1 flex items-center gap-1.5 px-0.5 text-[10px] text-muted', isUser && 'justify-end')}>
          <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
          {!isUser && message.engine && (
            <>
              <span className="text-muted/40">·</span>
              <span
                className={clsx(
                  'rounded px-1 py-px font-medium',
                  message.engine === 'gemini'
                    ? 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300'
                    : 'bg-elevated text-muted'
                )}
              >
                {message.engine === 'gemini' ? 'Gemini' : 'Local engine'}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(MessageBubble);
