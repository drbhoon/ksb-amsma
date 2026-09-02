import { Header } from '@/components/marketing/Header';
import { Footer } from '@/components/marketing/Footer';
import { MotionInit } from '@/components/marketing/MotionInit';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <MotionInit />
      <main>{children}</main>
      <Footer />
    </>
  );
}
