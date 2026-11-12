import { Link } from 'react-router-dom';
import { Activity, CheckSquare, FolderKanban, Paperclip, Users, Sparkles } from 'lucide-react';
import Card, { CardHeader } from '../ui/Card';
import Avatar from '../ui/Avatar';
import EmptyState from '../ui/EmptyState';
import { timeAgo } from '../../utils/date';

const TYPE_ICON = {
  task: CheckSquare,
  project: FolderKanban,
  member: Users,
  file: Paperclip,
};

export default function ActivityFeed({ entries, members, projects }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Recent activity"
        subtitle="What changed across the workspace"
        icon={Activity}
        action={
          <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-medium text-muted">
            Live
          </span>
        }
      />
      <div className="flex-1 px-5 pb-5 pt-3">
        {entries.length === 0 ? (
          <EmptyState compact icon={Sparkles} title="No activity yet" description="Create a project or task to get started." />
        ) : (
          <ul className="space-y-3">
            {entries.slice(0, 6).map((entry) => {
              const actor = members.find((m) => m.id === entry.actorId);
              const project = projects.find((p) => p.id === entry.projectId);
              const Icon = TYPE_ICON[entry.type] || Activity;
              const content = (
                <>
                  <span className="relative shrink-0">
                    {actor ? (
                      <Avatar member={actor} size="sm" />
                    ) : (
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-elevated text-muted">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border border-surface bg-surface text-muted">
                      <Icon className="h-2.5 w-2.5" />
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] leading-snug text-ink">{entry.message}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-muted">
                      <span>{timeAgo(entry.createdAt)}</span>
                      {project && (
                        <>
                          <span className="text-muted/50">·</span>
                          <span className="truncate">{project.name}</span>
                        </>
                      )}
                    </span>
                  </span>
                </>
              );
              return (
                <li key={entry.id}>
                  {project ? (
                    <Link to={`/projects/${project.id}`} className="flex items-start gap-2.5 rounded-lg transition hover:bg-canvas/60">
                      {content}
                    </Link>
                  ) : (
                    <div className="flex items-start gap-2.5">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
