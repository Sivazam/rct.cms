'use client';

import { ReactNode } from 'react';
import { Header } from '@/components/store/Header';
import { Footer } from './Footer';

interface AppLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  onSearch?: (query: string) => void;
}

export function AppLayout({ 
  children, 
  showHeader = true, 
  showFooter = true,
  onSearch 
}: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f4f0eb' }}>
      {showHeader && <Header onSearch={onSearch || (() => {})} />}
      <main className="flex-grow">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}