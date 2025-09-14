'use client';

import { useLoading } from '@/contexts/LoadingContext';
import NavigationLoading from './navigation-loading';

export default function PageTransitionLoader() {
  const { isLoading, loadingMessage } = useLoading();

  if (!isLoading) return null;

  return (
    <NavigationLoading 
      message={loadingMessage}
    />
  );
}