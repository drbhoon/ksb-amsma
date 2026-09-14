import { redirect } from 'next/navigation';
import { getCurrentPortalUser } from '@/lib/portal-auth';
import { prisma } from '@/lib/db';
import { formatBytes } from '@/lib/uploads';
import { LogoutButton } from '@/components/portal/LogoutButton';
import { AdminPortalNav } from '@/components/portal/AdminPortalNav';
import { ResourceUploadForm } from '@/components/portal/ResourceUploadForm';
import { ResourceActions } from '@/components/portal/ResourceActions';
import { deleteResource, toggleResource } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Resource Documents' };

export default async function AdminResourcesPage() {
  const user = await getCurrentPortalUser();
  if (!user) redirect('/portal/admin/login?next=/portal/admin/resources');
  if (user.role !== 'ADMIN') redirect('/portal');
  if (user.isTest) redirect('/portal/test');

  const items = await prisma.publication.findMany({
    orderBy: { publishedAt: 'desc' },
    include: { file: { select: { id: true, filename: true, sizeBytes: true } } },
  });

  return (
    <div className="membership-surface min-h-screen py-10 md:py-14">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-300 pb-6">
          <div>
            <p className="membership-kicker !text-[#96501f]">Access controlled</p>
            <h1 className="mt-2 text-3xl font-bold">AMSMA admin dashboard</h1>
            <p className="mt-2 text-stone-600">Signed in as {user.name}</p>
          </div>
          <LogoutButton />
        </div>
        <AdminPortalNav current="resources" />

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
          <ResourceUploadForm />
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="membership-kicker !text-[#96501f]">Document library</p>
                <h2 className="mt-2 text-2xl font-bold text-[#273d33]">{items.length} uploaded {items.length === 1 ? 'document' : 'documents'}</h2>
              </div>
              <a href="/resources" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#96501f] hover:underline">View public page</a>
            </div>
            {items.length === 0 ? (
              <div className="membership-card p-7 text-stone-600">No resource documents have been uploaded.</div>
            ) : (
              <div className="grid gap-3">
                {items.map((item) => (
                  <article key={item.id} className="membership-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-[.08em] text-[#96501f]">{item.category.replaceAll('_', ' ')}</p>
                        <h3 className="mt-1 font-bold text-[#273d33]">{item.title}</h3>
                        <p className="mt-1 break-words text-xs text-stone-500">{item.file.filename} · {formatBytes(item.file.sizeBytes)}</p>
                      </div>
                      <span className={item.isPublished ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800' : 'rounded-full bg-stone-200 px-3 py-1 text-xs font-bold text-stone-600'}>
                        {item.isPublished ? 'Public' : 'Hidden'}
                      </span>
                    </div>
                    {item.description && <p className="mt-3 text-sm leading-relaxed text-stone-600">{item.description}</p>}
                    <div className="mt-4">
                      <a href={`/api/files/${item.file.id}`} target="_blank" rel="noopener noreferrer" className="text-[#96501f] hover:underline">Open PDF</a>
                    </div>
                    <ResourceActions
                      id={item.id}
                      title={item.title}
                      isPublished={item.isPublished}
                      toggleAction={toggleResource}
                      deleteAction={deleteResource}
                    />
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
