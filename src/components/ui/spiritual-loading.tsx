'use client';

import { useEffect, useState } from 'react';

interface SpiritualLoadingProps {
  message?: string;
  mantra?: string;
  showOm?: boolean;
}

export default function SpiritualLoading({ 
  message = "Preparing sacred space...", 
  mantra = "ॐ भूर्भुवः स्वः",
  showOm = true 
}: SpiritualLoadingProps) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 2) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-red-50">
      {/* Background spiritual patterns */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl text-orange-600">ॐ</div>
        <div className="absolute top-20 right-20 text-4xl text-red-600">𑀰𑀺𑀪𑁆𑀢</div>
        <div className="absolute bottom-20 left-20 text-5xl text-amber-600">卍</div>
        <div className="absolute bottom-10 right-10 text-3xl text-orange-700">🔥</div>
      </div>

      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Rotating Wheel */}
        <div className="relative">
          <div 
            className="w-32 h-32 rounded-full border-8 border-orange-600 border-t-transparent animate-spin"
            style={{
              animation: 'spin 2s linear infinite',
              background: `conic-gradient(from ${rotation}deg, #ea580c, #dc2626, #f59e0b, #ea580c)`
            }}
          >
            {/* Inner decorative elements */}
            <div className="absolute inset-4 rounded-full border-4 border-amber-500"></div>
            <div className="absolute inset-8 rounded-full border-2 border-red-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-2xl text-orange-800 font-bold">ॐ</div>
            </div>
          </div>
          
          {/* Spokes */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-16 h-1 bg-orange-700 origin-left"
              style={{
                transform: `translateY(-50%) rotate(${i * 45}deg)`,
                transformOrigin: '0 50%'
              }}
            />
          ))}
        </div>

        {/* Sacred Text */}
        {showOm && (
          <div className="text-center space-y-4">
            <div className="text-6xl text-orange-600 animate-pulse">ॐ</div>
            <div className="text-xl text-sanskrit text-orange-700 font-medium">
              {mantra}
            </div>
          </div>
        )}

        {/* Loading Message */}
        <div className="text-center space-y-2">
          <div className="text-lg text-orange-800 font-medium">{message}</div>
          <div className="text-sm text-orange-600 italic">
            "The soul is neither born, and nor does it die" - Bhagavad Gita 2.20
          </div>
        </div>

        {/* Animated dots */}
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .text-sanskrit {
          font-family: 'Noto Sans Devanagari', serif;
        }
      `}</style>
    </div>
  );
}