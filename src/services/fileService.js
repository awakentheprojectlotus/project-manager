const DRIVE_HOST_RE = /(^|\.)(drive|docs)\.google\.com$/i;

export const parseDriveLink = (url = '') => {
  const raw = String(url || '').trim();
  if (!raw) return null;
  const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let parsed;
  try {
    parsed = new URL(normalized);
  } catch {
    return null;
  }
  if (!DRIVE_HOST_RE.test(parsed.hostname) && !/drive\.google\.com|docs\.google\.com/i.test(normalized)) {
    return null;
  }

  const fileMatch = normalized.match(/\/file\/d\/([\w-]{10,})/);
  const docsMatch = normalized.match(/\/(document|spreadsheets|presentation)\/d\/([\w-]{10,})/);
  const folderMatch = normalized.match(/\/drive\/(?:u\/\d+\/)?folders\/([\w-]{10,})/);
  const openMatch = normalized.match(/[?&]id=([\w-]{10,})/);
  const id = docsMatch?.[2] || fileMatch?.[1] || folderMatch?.[1] || openMatch?.[1] || null;
  if (!id) return null;

  const isFolder = Boolean(folderMatch);
  let type = 'file';
  if (isFolder) type = 'folder';
  else if (docsMatch) {
    type =
      docsMatch[1] === 'document'
        ? 'document'
        : docsMatch[1] === 'spreadsheets'
          ? 'spreadsheet'
          : 'presentation';
  }

  const kind = isFolder ? 'folder' : docsMatch ? 'doc' : 'file';
  const previewUrl = isFolder
    ? null
    : docsMatch
      ? `https://docs.google.com/${docsMatch[1]}/d/${id}/preview`
      : `https://drive.google.com/file/d/${id}/preview`;

  return {
    id,
    url: normalized,
    isFolder,
    type,
    kind,
    thumbnailUrl: isFolder ? null : `https://drive.google.com/thumbnail?id=${id}&sz=w1200`,
    previewUrl,
  };
};

export const isValidDriveLink = (url) => Boolean(parseDriveLink(url));

export const DRIVE_TYPE_LABELS = {
  file: 'Drive file',
  folder: 'Drive folder',
  document: 'Google Doc',
  spreadsheet: 'Google Sheet',
  presentation: 'Google Slides',
};

export const getDriveTypeLabel = (drive) =>
  DRIVE_TYPE_LABELS[drive?.type] || (drive?.kind === 'folder' ? 'Drive folder' : 'Drive file');
