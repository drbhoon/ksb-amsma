import { ComingSoon } from '@/components/marketing/ComingSoon';

export const metadata = { title: 'Gallery' };

export default function Page() {
  return (
    <ComingSoon
      title="Gallery"
      phase="Phase 5"
      blurb="Photographs from Association events, plant visits and technical sessions will appear here."
    />
  );
}
