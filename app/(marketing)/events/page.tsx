import { ComingSoon } from '@/components/marketing/ComingSoon';

export const metadata = { title: 'Events' };

export default function Page() {
  return (
    <ComingSoon
      title="Events"
      phase="Phase 4"
      blurb="Conferences, technical sessions and training programmes — with online registration — will be listed here."
    />
  );
}
