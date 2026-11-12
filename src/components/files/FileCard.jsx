import { useState } from 'react';
import clsx from 'clsx';
import {
  ArrowUpRight,
  Copy,
  ExternalLink,
  Figma,
  File,
  FileCode2,
  FileText,
  FolderOpen,
  Github,
  Image as ImageIcon,
  Link2,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import Card from '../ui/Card';
import Dropdown from '../ui/Dropdown';
import { useUiStore } from '../../stores/uiStore';
import { DRIVE_TYPE_LABELS } from '../../services/fileService';
import { formatDate } from '../../utils/date';

export const DriveIcon = ({ className }) => (
  <svg viewBox="0 0 87.3 78" className={className} aria-hidden="true">
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
    <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9.06 9.06 0 0 0 0 53h27.5z" fill="#00ac47" />
    <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.5c.8-1.4 1.2-2.95 1.2-4.5H59.798l5.852 11.5z" fill="#ea4335" />
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
    <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.6c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
  </svg>
);

const KIND_META = {
  doc: { label: 'Google Doc', icon: FileText, tone: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
  folder: { label: 'Drive folder', icon: FolderOpen, tone: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400' },
  file: { label: 'Drive file', icon: File, tone: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' },
  image: { label: 'Image', icon: ImageIcon, tone: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400' },
  code: { label: 'Code', icon: FileCode2, tone: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400' },
  link: { label: 'Link', icon: Link2, tone: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' },
  other: { label: 'File', icon: File, tone: 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300' },
};

const SOURCE_META = {
  'google-drive': {
    label: 'Google Drive',
    icon: DriveIcon,
    className: 'bg-white/95 text-slate-700 ring-slate-900/5 dark:bg-slate-900/85 dark:text-slate-200',
  },
  github: { label: 'GitHub', icon: Github, className: 'bg-slate-900/90 text-white ring-white/10' },
  figma: {
    label: 'Figma',
    icon: Figma,
    className: 'bg-white/95 text-slate-700 ring-slate-900/5 dark:bg-slate-900/85 dark:text-slate-200',
  },
  notion: {
    label: 'Notion',
    icon: FileText,
    className: 'bg-white/95 text-slate-700 ring-slate-900/5 dark:bg-slate-900/85 dark:text-slate-200',
  },
  link: {
    label: 'Link',
    icon: Link2,
    className: 'bg-white/95 text-slate-700 ring-slate-900/5 dark:bg-slate-900/85 dark:text-slate-200',
  },
};

export const getKindMeta = (kind) => KIND_META[kind] || KIND_META.file;
export const getSourceMeta = (source) => SOURCE_META[source] || SOURCE_META['google-drive'];
export const getFileTypeLabel = (file) =>
  DRIVE_TYPE_LABELS[file?.driveType] || getKindMeta(file?.kind).label;

export function SourceBadge({ source, className }) {
  const meta = getSourceMeta(source);
  const Icon = meta.icon;
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold ring-1 ring-inset backdrop-blur',
        meta.className,
        className
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {meta.label}
    </span>
  );
}

export default function FileCard({ file, onOpen, onDelete }) {
  const pushToast = useUiStore((s) => s.pushToast);
  const [imageState, setImageState] = useState('loading');
  const meta = getKindMeta(file.kind);
  const Icon = meta.icon;
  const typeLabel = getFileTypeLabel(file);
  const previewSrc = file.thumbnailUrl || (file.kind === 'image' ? file.url : null);
  const showImage = previewSrc && imageState !== 'failed';
  const isLoadingPreview = Boolean(previewSrc) && imageState === 'loading';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(file.url);
      pushToast({ type: 'success', title: 'Link copied', message: 'Google Drive link copied.', duration: 2200 });
    } catch {
      pushToast({ type: 'error', title: 'Could not copy', message: 'Your browser blocked clipboard access.' });
    }
  };

  return (
    <Card className="group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card dark:hover:border-brand-500/30">
      <button
        type="button"
        onClick={() => onOpen(file)}
        className="relative block h-32 w-full overflow-hidden bg-canvas/70"
        aria-label={`Preview ${file.name}`}
      >
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <span className={clsx('grid h-11 w-11 place-items-center rounded-xl', meta.tone)}>
            <Icon className="h-5 w-5" />
          </span>
          <span className="text-[9.5px] font-medium text-muted">
            {isLoadingPreview ? 'Loading preview?' : typeLabel}
          </span>
        </span>
        {showImage && (
          <img
            src={previewSrc}
            alt=""
            loading="lazy"
            onLoad={(event) => {
              const img = event.currentTarget;
              if (img.naturalWidth < 80 || img.naturalHeight < 80) setImageState('failed');
              else setImageState('loaded');
            }}
            onError={() => setImageState('failed')}
            className={clsx(
              'absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]',
              imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
            )}
          />
        )}
        <span className="absolute left-2 top-2">
          <SourceBadge source={file.source} />
        </span>
      </button>

      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-start gap-1.5">
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => onOpen(file)}
              className="block w-full truncate text-left text-[12.5px] font-semibold text-ink hover:text-brand-700 dark:hover:text-brand-300"
              title={file.name}
            >
              {file.name}
            </button>
            <p className="mt-0.5 truncate text-[10px] text-muted">
              {typeLabel}
              {file.createdAt ? ` · ${formatDate(file.createdAt, 'MMM d')}` : ''}
            </p>
          </div>
          <Dropdown
            label={`Actions for ${file.name}`}
            trigger={
              <span className="grid h-6 w-6 place-items-center rounded-md text-muted transition hover:bg-elevated">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </span>
            }
            items={[
              { label: 'Preview', icon: ArrowUpRight, onClick: () => onOpen(file) },
              { label: 'Copy link', icon: Copy, onClick: copyLink },
              { separator: true },
              { label: 'Remove link', icon: Trash2, danger: true, onClick: () => onDelete(file) },
            ]}
          />
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
          <span className="inline-flex items-center gap-1 text-[9.5px] uppercase tracking-wider text-muted/80">
            <DriveIcon className="h-2.5 w-2.5" />
            Drive link
          </span>
          <a
            href={file.url}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(event) => event.stopPropagation()}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            Open
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>
    </Card>
  );
}
