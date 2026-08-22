import { ComingSoon } from '@/components/marketing/ComingSoon';

export const metadata = { title: 'Annual Report' };

export default function Page() {
  return (
    <ComingSoon
      title="Annual Report"
      phase="Phase 5"
      blurb="Annual reports and audited accounts will be published here once the first financial year of the Association closes."
    />
  );
}
