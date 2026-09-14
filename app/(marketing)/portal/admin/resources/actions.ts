'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentPortalUser } from '@/lib/portal-auth';
import { prisma } from '@/lib/db';
import { storePdfUpload } from '@/lib/uploads';

export type ResourceActionState = { error?: string; ok?: string };

const CATEGORIES = new Set(['ARTICLE', 'REGULATION', 'GOVT_LETTER', 'CIRCULAR', 'PRESENTATION', 'OTHER']);

async function requireAdmin() {
  const user = await getCurrentPortalUser();
  if (!user || user.role !== 'ADMIN' || user.isTest) throw new Error('Admin access is required.');
  return user;
}

export async function createResource(_previous: ResourceActionState, formData: FormData): Promise<ResourceActionState> {
  const user = await requireAdmin();
  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const requestedCategory = String(formData.get('category') || 'OTHER');
  const category = CATEGORIES.has(requestedCategory) ? requestedCategory : 'OTHER';

  if (title.length < 3) return { error: 'Enter a title with at least three characters.' };
  if (description.length > 800) return { error: 'Keep the description below 800 characters.' };

  const upload = await storePdfUpload(formData.get('file') as File | null, user.email);
  if (!upload.ok) return { error: upload.error };

  try {
    await prisma.publication.create({
      data: {
        title,
        description: description || null,
        category: category as never,
        fileId: upload.fileId,
        isPublished: true,
      },
    });
  } catch (error) {
    await prisma.storedFile.delete({ where: { id: upload.fileId } }).catch(() => {});
    throw error;
  }

  revalidatePath('/resources');
  revalidatePath('/portal/admin/resources');
  return { ok: `“${title}” is now public.` };
}

export async function toggleResource(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') || '');
  const item = await prisma.publication.findUnique({ where: { id }, select: { isPublished: true } });
  if (!item) return;
  await prisma.publication.update({ where: { id }, data: { isPublished: !item.isPublished } });
  revalidatePath('/resources');
  revalidatePath('/portal/admin/resources');
}

export async function deleteResource(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') || '');
  const item = await prisma.publication.findUnique({ where: { id }, select: { fileId: true } });
  if (!item) return;
  await prisma.publication.delete({ where: { id } });
  await prisma.storedFile.delete({ where: { id: item.fileId } }).catch(() => {});
  revalidatePath('/resources');
  revalidatePath('/portal/admin/resources');
}
