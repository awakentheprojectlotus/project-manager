import { Copy, ExternalLink, FolderOpen, Link2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useTeamStore } from '../../stores/teamStore';
import { useUiStore } from '../../stores/uiStore';
import { getDriveTypeLabel, parseDriveLink } from '../../services/fileService';
import { formatDate } from '../../utils/date';
import { DriveIcon, getFileTypeLabel, getKindMeta } from './FileCard';

export default function FilePreviewModal({ file, onClose }) {
  const members = useTeamStore((s) => s.members);
  const pushToast = useUiStore((s) => s.pushToast);

  if (!file) return null;

  const drive = parseDriveLink(file.url);
  const previewUrl = file.previewUrl || drive?.previewUrl || null;
  const isFolder = file.kind === 'folder' || drive?.isFolder;
  const kind = getKindMeta(file.kind);
  const KindIcon = kind.icon;
  const addedBy = members.find((m) => m.id === file.addedBy);
  const typeLabel = getFileTypeLabel(file) || getDriveTypeLabel(drive);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(file.url);
      pushToast({ type: 'success', title: 'Link copied', duration: 2000 });
    } catch {
      pushToast({ type: 'error', title: 'Could not copy link' });
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={file.name}
      description={`${typeLabel} · Google Drive`}
      icon={KindIcon}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <Button variant="ghost" size="sm" icon={Copy} onClick={copyLink}>
            Copy link
          </Button>
          <a
            href={file.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-3.5 text-[13px] font-medium text-white shadow-sm transition hover:bg-brand-700"
          >
            Open in Google Drive
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      }
    >
      <div className="space-y-4">
        {isFolder ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-edge bg-canvas/50 px-6 py-12 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
              <FolderOpen className="h-6 w-6" />
            </span>
            <p className="mt-3 text-sm font-medium text-ink">Google Drive folder</p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">
              Folders can’t be previewed here. Open it in Google Drive to browse the files inside.
            </p>
          </div>
        ) : previewUrl ? (
          <>
            <div className="overflow-hidden rounded-xl border border-edge bg-canvas/60">
              <iframe
                src={previewUrl}
                title={`Preview of ${file.name}`}
                className="h-[52vh] w-full"
                allow="autoplay; fullscreen"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-[10.5px] leading-relaxed text-muted">
              Preview is provided by Google Drive. If it stays blank, the file may not be shared for viewing — use
              “Open in Google Drive”.
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-edge bg-canvas/50 px-6 py-12 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-elevated text-muted">
              <Link2 className="h-6 w-6" />
            </span>
            <p className="mt-3 text-sm font-medium text-ink">No preview available</p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">
              Open this link in Google Drive to view its contents.
            </p>
          </div>
        )}

        <dl className="grid grid-cols-2 gap-3 rounded-xl border border-edge bg-canvas/40 p-3.5 sm:grid-cols-4">
          {[
            ['Type', typeLabel || 'Drive link'],
            ['Source', 'Google Drive'],
            ['Added', file.createdAt ? formatDate(file.createdAt, 'MMM d, yyyy') : '—'],
            ['Added by', addedBy?.name || 'Team member'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[9.5px] uppercase tracking-wider text-muted">{label}</dt>
              <dd className="mt-0.5 truncate text-[11.5px] font-medium text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <DriveIcon className="h-3 w-3" />
            Stored as a link in Google Drive
          </span>
          <span className="text-muted/40">·</span>
          <span>No file was uploaded to Pulse</span>
        </div>
      </div>
    </Modal>
  );
}
