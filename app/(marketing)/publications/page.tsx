import { ComingSoon } from '@/components/marketing/ComingSoon';

export const metadata = { title: 'Publications' };

export default function Page() {
  return (
    <ComingSoon
      title="Publications"
      phase="Phase 5"
      blurb="Technical papers, policy submissions and industry data published by the Association will be available here."
    />
  );
}
