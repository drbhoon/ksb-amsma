import { prisma } from '@/lib/db';
import { formatBytes } from '@/lib/uploads';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Publications',
  description: 'Articles, regulations, government letters and circulars published by AMSMA.',
};

const CATEGORY_LABELS: Record<string, string> = {
  ARTICLE: 'Article',
  REGULATION: 'Regulation',
  GOVT_LETTER: 'Government letter',
  CIRCULAR: 'Circular',
  PRESENTATION: 'Presentation',
  OTHER: 'Document',
};

export default async function PublicationsPage() {
  const items = await prisma.publication.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    include: { file: { select: { id: true, sizeBytes: true, mimeType: true } } },
  });

  return (
    <>
      <header className="ll-page-hero">
        <div className="ll-page-hero-inner">
          <p className="ll-eyebrow">Resources</p>
          <h1 className="ll-title">Publications.</h1>
          <p className="ll-lede">
            Articles, regulations, government letters and circulars of relevance to the
            aggregate and M sand industry.
          </p>
        </div>
      </header>

      <section className="ll-section ll-alt">
        <div className="ll-section-inner" data-reveal>
          {items.length === 0 ? (
            <p className="ll-prose">
              No documents have been published yet. Material will appear here as the
              Secretariat releases it.
            </p>
          ) : (
            <ul className="ll-doc-list">
              {items.map((p) => (
                <li key={p.id} className="ll-doc">
                  <div>
                    <p className="ll-kicker">
                      {CATEGORY_LABELS[p.category] ?? 'Document'} ·{' '}
                      {p.publishedAt.toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                    <h2 className="ll-heading">
                      <a href={`/api/files/${p.file.id}`}>{p.title}</a>
                    </h2>
                    {p.description && <p className="ll-prose">{p.description}</p>}
                  </div>
                  <a className="ll-button ll-button-solid" href={`/api/files/${p.file.id}`}>
                    Open · {formatBytes(p.file.sizeBytes)}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
