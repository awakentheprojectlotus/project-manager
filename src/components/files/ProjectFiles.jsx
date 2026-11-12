import { useMemo, useState } from 'react';
import { Paperclip, Plus } from 'lucide-react';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import FileCard from './FileCard';
import FilePreviewModal from './FilePreviewModal';
import { useFileStore } from '../../stores/fileStore';
import { useUiStore } from '../../stores/uiStore';

export default function ProjectFiles({ project, files, onAdd }) {
  const removeFile = useFileStore((s) => s.removeFile);
  const confirm = useUiStore((s) => s.confirm);
  const pushToast = useUiStore((s) => s.pushToast);
  const [preview, setPreview] = useState(null);

  const sorted = useMemo(
    () => [...files].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [files]
  );

  const handleDelete = async (file) => {
    const ok = await confirm({
      title: 'Remove this Drive link?',
      description: `'${file.name}' will be detached from ${project.name}. The file in Google Drive is not affected.`,
      confirmLabel: 'Remove link',
    });
    if (!ok) return;
    removeFile(file.id);
    pushToast({ type: 'info', title: 'Drive link removed', message: `'${file.name}' was detached from the project.` });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Paperclip className="h-4 w-4 text-muted" />
            Files & assets
          </h2>
          <p className="mt-0.5 text-[11.5px] text-muted">
            Google Drive links connected to {project.name}. Add a title and link — previews load when available.
          </p>
        </div>
        <Button size="sm" icon={Plus} onClick={onAdd}>
          Add Drive link
        </Button>
      </div>

      {files.length === 0 ? (
        <EmptyState
          icon={Paperclip}
          title="No Drive links yet"
          description="Paste a Google Drive file, folder, Doc, Sheet or Slides link so everything for this project is one click away."
          action={
            <Button size="sm" icon={Plus} onClick={onAdd}>
              Add your first link
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((file) => (
            <FileCard key={file.id} file={file} onOpen={setPreview} onDelete={handleDelete} />
          ))}
          <button
            type="button"
            onClick={onAdd}
            className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-edge bg-surface/40 px-4 text-center transition hover:border-brand-300 hover:bg-brand-50/30 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/[0.04]"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-elevated text-muted">
              <Plus className="h-5 w-5" />
            </span>
            <span className="mt-2 text-[12.5px] font-medium text-ink">Add a Drive link</span>
            <span className="mt-0.5 text-[10.5px] text-muted">File, folder or Google Doc</span>
          </button>
        </div>
      )}

      <FilePreviewModal file={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
