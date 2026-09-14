import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Events',
  description: 'Meets, technical sessions and gatherings of the Association.',
};

function formatRange(start: Date, end: Date) {
  const d = (x: Date) =>
    x.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  return start.toDateString() === end.toDateString() ? d(start) : `${d(start)} – ${d(end)}`;
}

export default async function EventsPage() {
  const now = new Date();
  const events = await prisma.event.findMany({
    where: { isPublic: true },
    orderBy: { startDate: 'desc' },
    include: { attachment: { select: { id: true, filename: true } } },
  });

  const upcoming = events.filter((e) => e.endDate >= now).reverse();
  const past = events.filter((e) => e.endDate < now);

  return (
    <>
      <header className="ll-page-hero">
        <div className="ll-page-hero-inner">
          <p className="ll-eyebrow">Association</p>
          <h1 className="ll-title">Events.</h1>
          <p className="ll-lede">
            Meets, technical sessions and gatherings that bring the industry together.
          </p>
        </div>
      </header>

      <section className="ll-section ll-alt">
        <div className="ll-section-inner" data-reveal>
          {events.length === 0 ? (
            <p className="ll-prose">No events have been announced yet.</p>
          ) : (
            <>
              {upcoming.length > 0 && (
                <>
                  <p className="ll-kicker">Upcoming</p>
                  <ul className="ll-doc-list">
                    {upcoming.map((e) => (
                      <li key={e.id} className="ll-doc">
                        <div>
                          <p className="ll-kicker">{formatRange(e.startDate, e.endDate)} · {e.location}</p>
                          <h2 className="ll-heading">{e.title}</h2>
                          <p className="ll-prose">{e.description}</p>
                        </div>
                        {e.attachment && (
                          <a className="ll-button ll-button-solid" href={`/api/files/${e.attachment.id}`}>
                            Details
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {past.length > 0 && (
                <>
                  <p className="ll-kicker" style={{ marginTop: '2.5rem' }}>Past</p>
                  <ul className="ll-doc-list">
                    {past.map((e) => (
                      <li key={e.id} className="ll-doc">
                        <div>
                          <p className="ll-kicker">{formatRange(e.startDate, e.endDate)} · {e.location}</p>
                          <h2 className="ll-heading">{e.title}</h2>
                          <p className="ll-prose">{e.description}</p>
                        </div>
                        {e.attachment && (
                          <a className="ll-button" href={`/api/files/${e.attachment.id}`}>Details</a>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
