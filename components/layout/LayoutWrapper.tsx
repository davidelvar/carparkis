'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Check if we're in admin or operator section (they have their own layouts)
  const isAdminOrOperator = pathname.includes('/admin') || pathname.includes('/operator');

  if (isAdminOrOperator) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
