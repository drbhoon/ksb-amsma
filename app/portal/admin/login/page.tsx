import { redirect } from 'next/navigation';
import { getCurrentPortalUser, safePortalReturnPath } from '@/lib/portal-auth';
import { PortalLoginScreen } from '@/components/portal/PortalLoginScreen';
import { getReviewLoginIdentity } from '@/lib/portal-login';

export const metadata = { title: 'Admin Login' };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const query = await searchParams;
  const user = await getCurrentPortalUser();
  if (user) redirect(user.isTest ? '/portal/test' : user.role === 'ADMIN' ? '/portal/admin' : '/portal');
  const nextPath = safePortalReturnPath(query.next || '/portal/admin');
  const assignedReview = await getReviewLoginIdentity(nextPath, 'ADMIN');
  return <PortalLoginScreen portalType="ADMIN" nextPath={nextPath} assignedReview={assignedReview} />;
}
