// app/ui/hr_dashboard/footer/FooterWithOffset.jsx
'use client';
import { usePathname } from 'next/navigation';
import Footer from './footer';

export default function FooterWithOffset() {
  const pathname = usePathname();
  const hasRightbar = pathname === '/hr_dashboard';  // adjust if needed
  return <Footer offsetRight={hasRightbar} />;
}
