import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
  if (!post) return { title: 'Not found' };
  return { title: post.title, description: post.excerpt ?? undefined };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug },
    include: { coverImage: { select: { id: true } } },
  });

  // Drafts stay invisible to the public even if the URL is known.
  if (!post || !post.isPublished) notFound();

  return (
    <>
      <header className="ll-page-hero">
        <div className="ll-page-hero-inner">
          <p className="ll-eyebrow">
            {post.author ? `${post.author} · ` : ''}
            {post.publishedAt.toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
          <h1 className="ll-title">{post.title}</h1>
          {post.excerpt && <p className="ll-lede">{post.excerpt}</p>}
        </div>
      </header>

      <section className="ll-section ll-alt">
        <div className="ll-section-inner" data-reveal>
          {post.coverImage && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={`/api/files/${post.coverImage.id}`}
              alt=""
              className="ll-post-cover"
              loading="lazy"
            />
          )}
          <div className="ll-prose ll-post-body">
            {/* Body is plain text from the admin form. Split on blank lines so
                paragraphs render, and never inject HTML - React escapes it. */}
            {post.body.split(/\n\s*\n/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <div className="ll-button-row">
            <Link className="ll-button" href="/blog">All posts</Link>
          </div>
        </div>
      </section>
    </>
  );
}
