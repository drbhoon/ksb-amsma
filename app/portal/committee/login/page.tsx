import { redirect } from 'next/navigation';
import { getCurrentPortalUser, safePortalReturnPath } from '@/lib/portal-auth';
import { PortalLoginScreen } from '@/components/portal/PortalLoginScreen';

export const metadata = { title: 'Committee Login' };

export default async function CommitteeLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const query = await searchParams;
  const user = await getCurrentPortalUser();
  if (user) redirect(user.isTest ? '/portal/test' : user.role === 'ADMIN' ? '/portal/admin' : '/portal');
  return <PortalLoginScreen portalType="COMMITTEE" nextPath={safePortalReturnPath(query.next || '/portal')} />;
}
