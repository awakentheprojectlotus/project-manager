import { useEffect, useState } from 'react';
import { FolderOpen, Link2, Paperclip } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input, { Field } from '../ui/Input';
import { useFileStore } from '../../stores/fileStore';
import { useUiStore } from '../../stores/uiStore';
import { getDriveTypeLabel, parseDriveLink } from '../../services/fileService';
import { DriveIcon } from './FileCard';

export default function FileFormModal({ open, onClose, projectId, projectName }) {
  const addFile = useFileStore((s) => s.addFile);
  const pushToast = useUiStore((s) => s.pushToast);

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [previewState, setPreviewState] = useState('loading');

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setUrl('');
    setError('');
    setPreviewState('loading');
  }, [open]);

  useEffect(() => {
    setPreviewState('loading');
  }, [url]);

  const drive = parseDriveLink(url);
  const isDriveUrl = /drive\.google\.com|docs\.google\.com/i.test(url);
  const canSubmit = title.trim().length > 0 && url.trim().length > 0;

  const submit = (event) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('Give the link a title so your team knows what it is.');
      return;
    }
    if (!url.trim()) {
      setError('Paste a Google Drive link.');
      return;
    }
    if (!drive) {
      setError(
        'That link is not a valid Google Drive link. Paste a Drive file, folder, Docs, Sheets or Slides URL.'
      );
      return;
    }
    addFile({
      projectId,
      name: title.trim(),
      url: drive.url || url.trim(),
      kind: drive.kind,
      driveType: drive.type,
      thumbnailUrl: drive.thumbnailUrl,
      previewUrl: drive.previewUrl,
    });
    pushToast({
      type: 'success',
      title: 'Drive link added',
      message: `'${title.trim()}' is now attached to ${projectName || 'the project'}.`,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a Google Drive link"
      description={`Save a Drive file, folder or Google Doc to ${projectName || 'this project'}.`}
      icon={Paperclip}
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" form="drive-link-form" disabled={!canSubmit}>
            Add link
          </Button>
        </>
      }
    >
      <form id="drive-link-form" onSubmit={submit} className="space-y-4">
        <Field label="Title" required hint="Shown on the project file card.">
          <Input
            autoFocus
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (error) setError('');
            }}
            placeholder="e.g. Padma campaign brief"
            maxLength={140}
          />
        </Field>

        <Field
          label="Google Drive link"
          required
          hint="Works with Drive files, folders, Google Docs, Sheets and Slides."
        >
          <Input
            icon={Link2}
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              if (error) setError('');
            }}
            placeholder="https://drive.google.com/…"
            inputMode="url"
          />
        </Field>

        {url.trim() && !isDriveUrl && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            This does not look like a Google Drive link. Paste a URL from drive.google.com or docs.google.com.
          </p>
        )}

        {drive && (
          <div className="overflow-hidden rounded-xl border border-edge bg-canvas/40">
            {drive.isFolder ? (
              <div className="flex items-center gap-3 p-4">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
                  <FolderOpen className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-ink">Google Drive folder</p>
                  <p className="truncate text-[10.5px] text-muted">Opens in Google Drive</p>
                </div>
              </div>
            ) : (
              <div className="relative h-44 overflow-hidden bg-canvas/80">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-elevated text-muted">
                    <DriveIcon className="h-5 w-5" />
                  </span>
                  {previewState === 'failed' ? (
                    <>
                      <p className="text-[11px] font-medium text-ink">Preview not available</p>
                      <p className="text-[10px] text-muted">The file may not be shared for previewing.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[11px] font-medium text-ink">Loading preview?</p>
                      <p className="text-[10px] text-muted">Fetching the Google Drive thumbnail.</p>
                    </>
                  )}
                </div>
                {previewState !== 'failed' && (
                  <img
                    src={drive.thumbnailUrl}
                    alt="Drive preview"
                    onLoad={(event) => {
                      const img = event.currentTarget;
                      if (img.naturalWidth < 80 || img.naturalHeight < 80) setPreviewState('failed');
                      else setPreviewState('loaded');
                    }}
                    onError={() => setPreviewState('failed')}
                    className={
                      'relative h-full w-full object-cover transition-opacity duration-300 ' +
                      (previewState === 'loaded' ? 'opacity-100' : 'opacity-0')
                    }
                  />
                )}
              </div>
            )}
            <div className="flex items-center gap-2 border-t border-edge px-3 py-2">
              <DriveIcon className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium text-ink">Google Drive</span>
              <span className="ml-auto text-[10px] text-muted">{getDriveTypeLabel(drive)}</span>
            </div>
          </div>
        )}

        <p className="text-[10.5px] leading-relaxed text-muted">
          Make sure the file is shared with your team so the preview loads. Only the link and title are stored —
          no files are uploaded.
        </p>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11.5px] leading-relaxed text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
}
