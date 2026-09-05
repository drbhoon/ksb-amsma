'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { checkPassword, startSession, endSession, isAdmin, adminConfigured } from '@/lib/admin-auth';
import { storeUpload, slugify } from '@/lib/uploads';

export type ActionState = { error?: string; ok?: string };

/**
 * Every mutating action re-checks the session itself. Relying on the page that
 * rendered the form having checked is not enough - actions are callable
 * directly, so the guard belongs next to the write, not next to the button.
 */
function assertAdmin() {
  if (!isAdmin()) throw new Error('Not authorised');
}

// ---------- session ----------

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!adminConfigured()) {
    return { error: 'Admin login is not configured on this deployment. ADMIN_PASSWORD_HASH and SESSION_SECRET must both be set.' };
  }
  const password = String(formData.get('password') || '');
  if (!password) return { error: 'Enter the admin password.' };

  if (!checkPassword(password)) {
    // Deliberately vague: naming which part was wrong helps an attacker.
    return { error: 'That password was not accepted.' };
  }
  startSession();
  redirect('/admin');
}

export async function logoutAction() {
  endSession();
  redirect('/admin');
}

// ---------- publications ----------

export async function createPublication(_prev: ActionState, formData: FormData): Promise<ActionState> {
  assertAdmin();

  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const category = String(formData.get('category') || 'OTHER');

  if (title.length < 3) return { error: 'Give the document a title of at least 3 characters.' };

  const upload = await storeUpload(formData.get('file') as File | null, 'admin');
  if (!upload.ok) return { error: upload.error };

  await prisma.publication.create({
    data: {
      title,
      description: description || null,
      category: category as never,
      fileId: upload.fileId,
      isPublished: formData.get('isPublished') === 'on',
    },
  });

  revalidatePath('/admin/publications');
  revalidatePath('/publications');
  return { ok: `"${title}" published.` };
}

export async function deletePublication(formData: FormData) {
  assertAdmin();
  const id = String(formData.get('id'));
  const pub = await prisma.publication.findUnique({ where: { id }, select: { fileId: true } });
  await prisma.publication.delete({ where: { id } });
  // Publication.fileId is Restrict, so the row must go before its file can.
  if (pub) await prisma.storedFile.delete({ where: { id: pub.fileId } }).catch(() => {});
  revalidatePath('/admin/publications');
  revalidatePath('/publications');
}

export async function togglePublication(formData: FormData) {
  assertAdmin();
  const id = String(formData.get('id'));
  const pub = await prisma.publication.findUnique({ where: { id }, select: { isPublished: true } });
  if (!pub) return;
  await prisma.publication.update({ where: { id }, data: { isPublished: !pub.isPublished } });
  revalidatePath('/admin/publications');
  revalidatePath('/publications');
}

// ---------- blog ----------

export async function createBlogPost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  assertAdmin();

  const title = String(formData.get('title') || '').trim();
  const body = String(formData.get('body') || '').trim();
  const excerpt = String(formData.get('excerpt') || '').trim();
  const author = String(formData.get('author') || '').trim();

  if (title.length < 3) return { error: 'Give the post a title of at least 3 characters.' };
  if (body.length < 20) return { error: 'The post body is too short to publish.' };

  // A cover image is optional; a bad one should not lose the whole post.
  let coverImageId: string | null = null;
  const cover = formData.get('cover') as File | null;
  if (cover && cover.size > 0) {
    const upload = await storeUpload(cover, 'admin');
    if (!upload.ok) return { error: `Cover image: ${upload.error}` };
    coverImageId = upload.fileId;
  }

  // Slugs are unique; suffix on collision rather than failing the save.
  let slug = slugify(title);
  if (await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  await prisma.blogPost.create({
    data: {
      slug,
      title,
      body,
      excerpt: excerpt || null,
      author: author || null,
      coverImageId,
      isPublished: formData.get('isPublished') === 'on',
    },
  });

  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  return { ok: `"${title}" saved.` };
}

export async function toggleBlogPost(formData: FormData) {
  assertAdmin();
  const id = String(formData.get('id'));
  const post = await prisma.blogPost.findUnique({ where: { id }, select: { isPublished: true } });
  if (!post) return;
  await prisma.blogPost.update({ where: { id }, data: { isPublished: !post.isPublished } });
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
}

export async function deleteBlogPost(formData: FormData) {
  assertAdmin();
  const id = String(formData.get('id'));
  const post = await prisma.blogPost.findUnique({ where: { id }, select: { coverImageId: true } });
  await prisma.blogPost.delete({ where: { id } });
  if (post?.coverImageId) await prisma.storedFile.delete({ where: { id: post.coverImageId } }).catch(() => {});
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
}

// ---------- events ----------

export async function createEvent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  assertAdmin();

  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const location = String(formData.get('location') || '').trim();
  const startRaw = String(formData.get('startDate') || '');
  const endRaw = String(formData.get('endDate') || '');

  if (title.length < 3) return { error: 'Give the event a title of at least 3 characters.' };
  if (!location) return { error: 'Enter where the event takes place.' };
  if (!startRaw) return { error: 'Enter the start date.' };

  const startDate = new Date(startRaw);
  const endDate = endRaw ? new Date(endRaw) : startDate;
  if (Number.isNaN(startDate.getTime())) return { error: 'The start date is not a valid date.' };
  if (endDate < startDate) return { error: 'The end date falls before the start date.' };

  let attachmentId: string | null = null;
  const doc = formData.get('attachment') as File | null;
  if (doc && doc.size > 0) {
    const upload = await storeUpload(doc, 'admin');
    if (!upload.ok) return { error: `Attachment: ${upload.error}` };
    attachmentId = upload.fileId;
  }

  let slug = slugify(title);
  if (await prisma.event.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  await prisma.event.create({
    data: {
      slug,
      title,
      description: description || title,
      location,
      startDate,
      endDate,
      attachmentId,
      isPublic: formData.get('isPublished') === 'on',
    },
  });

  revalidatePath('/admin/events');
  revalidatePath('/events');
  return { ok: `"${title}" saved.` };
}

export async function toggleEvent(formData: FormData) {
  assertAdmin();
  const id = String(formData.get('id'));
  const ev = await prisma.event.findUnique({ where: { id }, select: { isPublic: true } });
  if (!ev) return;
  await prisma.event.update({ where: { id }, data: { isPublic: !ev.isPublic } });
  revalidatePath('/admin/events');
  revalidatePath('/events');
}

export async function deleteEvent(formData: FormData) {
  assertAdmin();
  const id = String(formData.get('id'));
  const ev = await prisma.event.findUnique({ where: { id }, select: { attachmentId: true } });
  await prisma.event.delete({ where: { id } });
  if (ev?.attachmentId) await prisma.storedFile.delete({ where: { id: ev.attachmentId } }).catch(() => {});
  revalidatePath('/admin/events');
  revalidatePath('/events');
}
