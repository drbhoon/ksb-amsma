import Link from 'next/link';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Blog',
  description: 'Notes and announcements from the Aggregate & M sand Manufacturers Association.',
};

export default async function BlogIndex() {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    include: { coverImage: { select: { id: true } } },
  });

  return (
    <>
      <header className="ll-page-hero">
        <div className="ll-page-hero-inner">
          <p className="ll-eyebrow">Association</p>
          <h1 className="ll-title">Blog.</h1>
          <p className="ll-lede">Notes, positions and announcements from the Secretariat.</p>
        </div>
      </header>

      <section className="ll-section ll-alt">
        <div className="ll-section-inner" data-reveal>
          {posts.length === 0 ? (
            <p className="ll-prose">Nothing published yet.</p>
          ) : (
            <ul className="ll-doc-list">
              {posts.map((p) => (
                <li key={p.id} className="ll-doc">
                  <div>
                    <p className="ll-kicker">
                      {p.author ? `${p.author} · ` : ''}
                      {p.publishedAt.toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                    <h2 className="ll-heading">
                      <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                    </h2>
                    {p.excerpt && <p className="ll-prose">{p.excerpt}</p>}
                  </div>
                  <Link className="ll-button" href={`/blog/${p.slug}`}>Read</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
