import { prisma } from '@/lib/db';
import { formatBytes } from '@/lib/uploads';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Resources',
  description: 'Public documents, regulations, circulars and technical resources from AMSMA.',
};

const CATEGORY_LABELS: Record<string, string> = {
  ARTICLE: 'Article',
  REGULATION: 'Regulation',
  GOVT_LETTER: 'Government letter',
  CIRCULAR: 'Circular',
  PRESENTATION: 'Presentation',
  OTHER: 'Document',
};

export default async function ResourcesPage() {
  const items = await prisma.publication.findMany({
    where: { isPublished: true, file: { mimeType: 'application/pdf' } },
    orderBy: { publishedAt: 'desc' },
    include: { file: { select: { id: true, sizeBytes: true } } },
  });

  return (
    <>
      <header className="ll-page-hero">
        <div className="ll-page-hero-inner">
          <p className="ll-eyebrow">Knowledge library</p>
          <h1 className="ll-title">Resources.</h1>
          <p className="ll-lede">
            Access AMSMA publications, industry guidance, government letters, regulations and circulars.
          </p>
        </div>
      </header>

      <section className="ll-section ll-alt">
        <div className="ll-section-inner" data-reveal>
          {items.length === 0 ? (
            <div className="membership-card max-w-3xl p-7 sm:p-9">
              <p className="ll-kicker">Document library</p>
              <h2 className="ll-heading mt-2">Resources will appear here.</h2>
              <p className="ll-prose mt-3">
                The Secretariat will publish approved public documents in this library.
              </p>
            </div>
          ) : (
            <ul className="ll-doc-list">
              {items.map((item) => (
                <li key={item.id} className="ll-doc">
                  <div>
                    <p className="ll-kicker">
                      {CATEGORY_LABELS[item.category] ?? 'Document'} ·{' '}
                      {item.publishedAt.toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                    <h2 className="ll-heading">
                      <a href={`/api/files/${item.file.id}`} target="_blank" rel="noopener noreferrer">
                        {item.title}
                      </a>
                    </h2>
                    {item.description && <p className="ll-prose">{item.description}</p>}
                  </div>
                  <a
                    className="ll-button ll-button-solid"
                    href={`/api/files/${item.file.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open PDF · {formatBytes(item.file.sizeBytes)}
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
