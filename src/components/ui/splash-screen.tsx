'use client';

import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onSplashComplete: () => void;
}

export default function SplashScreen({ onSplashComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [appLoaded, setAppLoaded] = useState(false);

  useEffect(() => {
    const duration = 7000; // Changed from 10000 to 7000 (7 seconds)
    const startTime = Date.now();
    
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        clearInterval(progressInterval);
        if (appLoaded) {
          setTimeout(() => {
            onSplashComplete();
          }, 500);
        }
      }
    }, 100);

    return () => clearInterval(progressInterval);
  }, [appLoaded, onSplashComplete]);

  useEffect(() => {
    const loadCheck = setTimeout(() => {
      setAppLoaded(true);
    }, 3000);

    return () => clearTimeout(loadCheck);
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="relative w-full h-full bg-gradient-to-br from-orange-900 via-amber-900 to-red-900">
        {/* Black Tint Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-60" />
        
        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="relative z-10 flex flex-col items-center space-y-8">
            {/* Logo */}
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 transition-transform duration-100 ease-linear animate-spin" style={{
                animation: 'spin 8s linear infinite' // Changed from default to 8s for slower rotation
              }}>
                <img
                  src="/logo.webp"
                  alt="Logo"
                  width={160}
                  height={160}
                  className="w-full h-full object-contain rounded-[8px] drop-shadow-2xl"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </div>

            {/* Loading Bar */}
            <div className="w-72 max-w-full">
              <div className="relative">
                {/* Background track */}
                <div className="w-full h-2 bg-gray-600 rounded-full overflow-hidden">
                  {/* Progress fill */}
                  <div 
                    className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              
              {/* Progress percentage */}
              <div className="text-center mt-2">
                <span className="text-white text-sm font-medium">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          </div>

          {/* Build by Harte Labs - Bottom */}
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="text-white/80 text-sm font-light tracking-wide">
              Build by Harte Labs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}