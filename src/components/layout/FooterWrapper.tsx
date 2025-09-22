'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function FooterWrapper() {
  const pathname = usePathname();
  
  // Don't show footer on login, signup, and other authentication pages
  const noFooterPages = ['/login', '/signup', '/pending-approval', '/forgot-password'];
  const shouldShowFooter = !noFooterPages.includes(pathname);

  return shouldShowFooter ? <Footer /> : null;
}