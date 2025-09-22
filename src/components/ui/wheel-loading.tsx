'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface WheelLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function WheelLoading({ 
  message = "Loading...", 
  size = 'md'
}: WheelLoadingProps) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 1) % 360); // Changed from +2 to +1 for slower rotation
    }, 100); // Changed from 50ms to 100ms for even slower rotation

    return () => clearInterval(interval);
  }, []);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return {
        wheel: 'w-16 h-16',
        text: 'text-sm'
      };
      case 'lg': return {
        wheel: 'w-32 h-32',
        text: 'text-lg'
      };
      default: return {
        wheel: 'w-24 h-24',
        text: 'text-base'
      };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Rotating Wheel */}
        <div className="relative">
          <div 
            className={`${sizeClasses.wheel} transition-transform duration-100 ease-linear`}
            style={{
              transform: `rotate(${rotation}deg)`
            }}
          >
            <Image
              src="/logo.webp"
              alt="Loading Wheel"
              width={size === 'lg' ? 128 : size === 'sm' ? 64 : 96}
              height={size === 'lg' ? 128 : size === 'sm' ? 64 : 96}
              className="w-full h-full object-contain rounded-[8px]"
              onError={(e) => {
                // Fallback to a simple wheel if image not found
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'w-full h-full rounded-full border-4 border-primary border-t-primary animate-spin';
                fallback.style.background = 'conic-gradient(from 0deg, #d97706, #92400e, #d97706)';
                target.parentNode?.appendChild(fallback);
              }}
            />
          </div>
        </div>

        {/* Loading Message */}
        <div className="text-center space-y-2">
          <div className={`${sizeClasses.text} text-foreground font-medium`}>
            {message}
          </div>
        </div>

        {/* Simple animated dots */}
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-background0 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-background0 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-background0 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}