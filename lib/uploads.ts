import { prisma } from '@/lib/db';

/**
 * Accepting an uploaded document.
 *
 * Bounded deliberately: the bytes go into Postgres, so an unbounded upload
 * would let one large file bloat the database and every backup of it.
 */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB

export const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'Word document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word document',
  'application/vnd.ms-excel': 'Excel spreadsheet',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel spreadsheet',
  'application/vnd.ms-powerpoint': 'Presentation',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'Presentation',
  'image/png': 'PNG image',
  'image/jpeg': 'JPEG image',
  'image/webp': 'WebP image',
};

export const ALLOWED_LABEL = 'PDF, Word, Excel, PowerPoint, PNG, JPEG or WebP';

export type UploadResult = { ok: true; fileId: string } | { ok: false; error: string };

export async function storeUpload(file: File | null, uploadedBy?: string): Promise<UploadResult> {
  if (!file || file.size === 0) return { ok: false, error: 'No file was selected.' };

  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return {
      ok: false,
      error: `That file is ${mb} MB, which exceeds the ${MAX_UPLOAD_BYTES / 1024 / 1024} MB limit. Compress the PDF or split it into parts.`,
    };
  }

  if (!ALLOWED_MIME_TYPES[file.type]) {
    return {
      ok: false,
      error: `"${file.type || 'unknown type'}" is not accepted. Upload a ${ALLOWED_LABEL} file.`,
    };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const stored = await prisma.storedFile.create({
    data: {
      filename: file.name.slice(0, 200),
      mimeType: file.type,
      sizeBytes: bytes.length,
      data: bytes,
      uploadedBy,
    },
    select: { id: true },
  });
  return { ok: true, fileId: stored.id };
}

/** Human-readable size for listings. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** URL-safe slug from a title, with a short suffix to avoid collisions. */
export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || 'post';
}
