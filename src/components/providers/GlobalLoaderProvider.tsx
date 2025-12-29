'use client';

import { useEffect, useState } from 'react';
import { globalLoaderManager } from '@/hooks/useGlobalLoader';
import { GlobalLoader } from '@/components/ui/GlobalLoader';

export function GlobalLoaderProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    // Subscribe to global loader state changes
    const unsubscribe = globalLoaderManager.subscribe((state) => {
      // Only show loader for initial app load
      const shouldShowLoader = state.sources.has('initial') && !initialLoadComplete;
      setIsLoading(shouldShowLoader);
    });

    // Show initial loader
    globalLoaderManager.show('initial');
    
    // Don't auto-hide the loader anymore - let homepage control it
    // The homepage will hide it after images are loaded

    return () => {
      unsubscribe();
    };
  }, [initialLoadComplete]);

  return (
    <>
      {children}
      <GlobalLoader isLoading={isLoading} />
    </>
  );
}