import { Paperclip, Plus, ArrowUpRight, ExternalLink } from 'lucide-react';
import Card, { CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { getFileTypeLabel, getKindMeta, SourceBadge } from './FileCard';
import { formatDate } from '../../utils/date';

export default function ProjectFilesCard({ files, onAdd, onOpenAll }) {
  const recent = [...files]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 4);

  return (
    <Card>
      <CardHeader
        title="Files & assets"
        subtitle={`${files.length} Drive ${files.length === 1 ? 'link' : 'links'}`}
        icon={Paperclip}
        action={
          <Button variant="subtle" size="xs" icon={Plus} onClick={onAdd}>
            Add
          </Button>
        }
      />
      <div className="px-5 pb-4 pt-3">
        {files.length === 0 ? (
          <EmptyState
            compact
            icon={Paperclip}
            title="No Drive links yet"
            description="Add a Google Drive link so briefs, designs and docs live with this project."
            action={
              <button
                type="button"
                onClick={onAdd}
                className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                Add the first link
              </button>
            }
          />
        ) : (
          <>
            <ul className="space-y-1">
              {recent.map((file) => {
                const meta = getKindMeta(file.kind);
                const Icon = meta.icon;
                return (
                  <li key={file.id}>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group flex items-center gap-2.5 rounded-xl px-2 py-2 transition hover:bg-canvas/70"
                    >
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${meta.tone}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium text-ink group-hover:text-brand-700 dark:group-hover:text-brand-300">
                          {file.name}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted">
                          <SourceBadge source={file.source} />
                          <span className="truncate">
                            {getFileTypeLabel(file)}
                            {file.createdAt ? ` · ${formatDate(file.createdAt, 'MMM d')}` : ''}
                          </span>
                        </span>
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted/60 transition group-hover:text-brand-500" />
                    </a>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={onOpenAll}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              View all files
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </>
        )}
      </div>
    </Card>
  );
}
