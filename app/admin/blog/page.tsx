import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/admin-auth';
import { createBlogPost, toggleBlogPost, deleteBlogPost } from '../actions';
import { ActionForm, Field, TextareaField, PublishToggle } from '../ui';
import { RowActions } from '../RowActions';

export const dynamic = 'force-dynamic';

export default async function AdminBlog() {
  if (!isAdmin()) redirect('/admin');
  const posts = await prisma.blogPost.findMany({ orderBy: { publishedAt: 'desc' } });

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold">Blog</h1>

      <section className="mb-10 rounded-lg border border-stone-200 bg-white p-6">
        <h2 className="mb-4 font-semibold">Write a post</h2>
        <ActionForm action={createBlogPost} submitLabel="Save post">
          <Field label="Title" name="title" required />
          <Field label="Author (optional)" name="author" placeholder="e.g. AMSMA Secretariat" />
          <TextareaField
            label="Summary (optional)"
            name="excerpt"
            rows={2}
            hint="One or two lines shown on the blog listing."
          />
          <TextareaField
            label="Body"
            name="body"
            rows={12}
            required
            hint="Plain text. Leave a blank line between paragraphs."
          />
          <Field label="Cover image (optional)" name="cover" type="file" accept="image/*" />
          <PublishToggle defaultChecked={false} />
        </ActionForm>
      </section>

      <h2 className="mb-3 font-semibold">{posts.length} post{posts.length === 1 ? '' : 's'}</h2>
      {posts.length === 0 ? (
        <p className="text-sm text-stone-600">Nothing written yet.</p>
      ) : (
        <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
          {posts.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-[240px] flex-1">
                <a href={`/blog/${p.slug}`} className="font-medium underline underline-offset-2">
                  {p.title}
                </a>
                <p className="text-xs text-stone-500">
                  {p.author ? `${p.author} · ` : ''}
                  {p.publishedAt.toLocaleDateString('en-IN')}
                </p>
              </div>
              <span className={'rounded px-2 py-0.5 text-xs ' + (p.isPublished ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-600')}>
                {p.isPublished ? 'Published' : 'Draft'}
              </span>
              <RowActions
                id={p.id}
                toggleAction={toggleBlogPost}
                deleteAction={deleteBlogPost}
                toggleLabel={p.isPublished ? 'Unpublish' : 'Publish'}
                confirmText={`Delete "${p.title}"? This cannot be undone.`}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
