import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { SlideInCart } from './SlideInCart';

interface MainLayoutProps {
  children: ReactNode;
  onSearch?: (query: string) => void;
  clearSearch?: () => void;
}

export function MainLayout({ children, onSearch, clearSearch }: MainLayoutProps) {
  // Provide default no-op handlers if not provided
  const handleSearch = onSearch || (() => {});
  const handleClearSearch = clearSearch || (() => {});

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f0eb' }}>
      <Header onSearch={handleSearch} clearSearch={handleClearSearch} />
      <main>
        {children}
      </main>
      <Footer />
      <SlideInCart />
    </div>
  );
}