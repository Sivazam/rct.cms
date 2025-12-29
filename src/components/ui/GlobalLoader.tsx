'use client';

import { useEffect, useState } from 'react';

interface GlobalLoaderProps {
  isLoading: boolean;
}

export function GlobalLoader({ isLoading }: GlobalLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [showLoader, setShowLoader] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Initializing spiritual experience...');

  useEffect(() => {
    if (isLoading) {
      setShowLoader(true);
      setProgress(0);
      setLoadingMessage('Preparing your spiritual journey...');
      
      // Simulate progress animation
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          const newProgress = prev + Math.random() * 10;
          
          // Update message based on progress
          if (newProgress > 75) {
            setLoadingMessage('Welcome to your spiritual sanctuary...');
          } else if (newProgress > 50) {
            setLoadingMessage('Discovering authentic products...');
          } else if (newProgress > 25) {
            setLoadingMessage('Loading sacred items...');
          }
          
          return newProgress;
        });
      }, 200);

      return () => clearInterval(interval);
    } else {
      // Complete progress when loading finishes
      setProgress(100);
      setLoadingMessage('Ready to explore...');
      setTimeout(() => {
        setShowLoader(false);
        setProgress(0);
        setLoadingMessage('Initializing spiritual experience...');
      }, 300);
    }
  }, [isLoading]);

  if (!showLoader) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: 'rgba(156,86,26,255)' }}>
      <div className="text-center">
        {/* OM Logo Placeholder */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <img 
                  src="/logo-original.png" 
                  alt="Sanathan Rudraksha Logo" 
                  className="w-full h-full object-cover rounded-full"
                />
          </div>
        </div>

        {/* Fluid Progress Bar */}
        <div className="w-80 mx-auto">
          <div className="relative h-2 bg-white/20 rounded-full overflow-hidden">
            {/* Fluid animation */}
            <div 
              className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-300 ease-out"
              style={{ 
                width: `${progress}%`,
                boxShadow: '0 0 20px rgba(255,255,255,0.5)'
              }}
            />
            {/* Wave effect */}
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full animate-pulse"
              style={{ 
                width: `${progress}%`,
                animationDuration: '2s'
              }}
            />
          </div>
          
          {/* Progress percentage */}
          <div className="mt-4">
            <span className="text-white text-sm font-medium">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Loading text */}
        <div className="mt-6">
          <p className="text-white/80 text-sm animate-pulse">
            {loadingMessage}
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-8 left-8 w-16 h-16 opacity-20">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-white/30 to-white/10 animate-pulse"></div>
        </div>
        <div className="absolute top-20 right-12 w-12 h-12 opacity-20">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-white/20 to-white/5 animate-pulse" style={{ animationDelay: '0.75s' }}></div>
        </div>
        <div className="absolute bottom-16 left-16 w-20 h-20 opacity-20">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-white/15 to-transparent animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>
        <div className="absolute bottom-12 right-8 w-14 h-14 opacity-20">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-white/25 to-white/10 animate-pulse" style={{ animationDelay: '2.25s' }}></div>
        </div>
      </div>
    </div>
  );
}