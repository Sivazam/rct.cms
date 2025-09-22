'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface SpiritualLoadingProps {
  message?: string;
  useWheel?: boolean;
}

export default function SpiritualLoading({ 
  message = "Loading...", 
  useWheel = false
}: SpiritualLoadingProps) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 1) % 360); // Changed from +2 to +1 for slower rotation
    }, 100); // Keep the interval time the same

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50">
      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Rotating Wheel or Simple Spinner */}
        <div className="relative">
          {useWheel ? (
            <div 
              className="w-24 h-24 transition-transform duration-100 ease-linear"
              style={{
                transform: `rotate(${rotation}deg)`
              }}
            >
              <Image
                src="/logo.webp"
                alt="Loading Wheel"
                width={96}
                height={96}
                className="w-full h-full object-contain rounded-[8px]"
                onError={(e) => {
                  // Fallback to simple spinner if image not found
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'w-16 h-16 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin';
                  target.parentNode?.appendChild(fallback);
                }}
              />
            </div>
          ) : (
            <div 
              className="w-16 h-16 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin"
              style={{
                animation: 'spin 1s linear infinite'
              }}
            />
          )}
        </div>

        {/* Loading Message */}
        <div className="text-center space-y-2">
          <div className="text-base text-amber-800 font-medium">{message}</div>
        </div>

        {/* Simple animated dots */}
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}