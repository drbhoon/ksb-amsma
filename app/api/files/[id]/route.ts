import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Serve an uploaded document.
 *
 * Every reference to a stored file goes through this route, so if the bytes
 * ever move to object storage only this file changes.
 *
 * PDFs and images render inline; everything else downloads, so a .docx does not
 * dump binary into the browser window.
 */
const INLINE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const file = await prisma.storedFile.findUnique({ where: { id: params.id } });
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const disposition = INLINE_TYPES.includes(file.mimeType) ? 'inline' : 'attachment';
  // Quote the filename and strip quotes/newlines so a crafted name cannot
  // inject extra header directives.
  const safeName = file.filename.replace(/["\r\n]/g, '');

  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      'Content-Type': file.mimeType,
      'Content-Length': String(file.sizeBytes),
      'Content-Disposition': `${disposition}; filename="${safeName}"`,
      // Immutable: the id is content-addressed by row, never reused.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
