import { redirect } from 'next/navigation';

export default function LegacyAdminPublicationsPage() {
  redirect('/portal/admin/resources');
}
