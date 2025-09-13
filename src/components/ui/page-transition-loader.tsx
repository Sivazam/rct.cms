'use client';

import { useEffect, useState } from 'react';
import { getTeluguDeathMantra } from '@/lib/spiritual-texts';
import SpiritualLoading from './spiritual-loading';
import { useLoading } from '@/contexts/LoadingContext';

export default function PageTransitionLoader() {
  const { isLoading, loadingMessage } = useLoading();
  const [currentMantra, setCurrentMantra] = useState('');

  useEffect(() => {
    if (isLoading) {
      setCurrentMantra(getTeluguDeathMantra());
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
      <SpiritualLoading 
        message={loadingMessage}
        mantra={currentMantra}
        showOm={true}
        teluguOnly={true}
        useWheel={true}
      />
    </div>
  );
}