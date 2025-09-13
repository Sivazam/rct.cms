'use client';

import { useEffect, useState } from 'react';
import { getTeluguDeathMantra, getTeluguSoulMantra } from '@/lib/spiritual-texts';
import Image from 'next/image';

interface WheelLoadingProps {
  message?: string;
  showMantra?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function WheelLoading({ 
  message = "Loading...", 
  showMantra = true,
  size = 'md'
}: WheelLoadingProps) {
  const [rotation, setRotation] = useState(0);
  const [currentMantra, setCurrentMantra] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 2) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showMantra) {
      // Alternate between death and soul mantras
      const mantras = [
        getTeluguDeathMantra(),
        getTeluguSoulMantra(),
        "నైనం ఛిన్దన్తి శస్త్రాణి నైనం దహతి పావకః", // The soul can never be cut to pieces by any weapon
        "న జాయతే మ్రియతే వా కదాచిన్నాయం భూత్వా భవితా వా న భూయః", // The soul is never born, nor does it die
        "జాతస్య హి ధ్రువో మృత్యుర్ధ్రువం జన్మ మృతస్య చ", // For one who has taken birth, death is certain
        "అవినాశి తు వద్ధి నైనం నిత్యం యః అజః శాశ్వతోఽయం పురాణో", // Know that which pervades the entire body is indestructible
      ];
      setCurrentMantra(mantras[Math.floor(Math.random() * mantras.length)]);
    }
  }, [showMantra]);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return {
        wheel: 'w-16 h-16',
        text: 'text-sm',
        mantra: 'text-sm'
      };
      case 'lg': return {
        wheel: 'w-32 h-32',
        text: 'text-lg',
        mantra: 'text-lg'
      };
      default: return {
        wheel: 'w-24 h-24',
        text: 'text-base',
        mantra: 'text-base'
      };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50">
      {/* Subtle background element */}
      <div className="absolute inset-0 opacity-3">
        <div className="absolute top-20 right-20 text-8xl text-amber-200">ॐ</div>
      </div>

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
              src="/wheel.png"
              alt="Sacred Wheel"
              width={size === 'lg' ? 128 : size === 'sm' ? 64 : 96}
              height={size === 'lg' ? 128 : size === 'sm' ? 64 : 96}
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback to a simple wheel if image not found
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'w-full h-full rounded-full border-4 border-amber-600 border-t-amber-800 animate-spin';
                fallback.style.background = 'conic-gradient(from 0deg, #d97706, #92400e, #d97706)';
                target.parentNode?.appendChild(fallback);
              }}
            />
          </div>
        </div>

        {/* Death/Rebirth Mantra */}
        {showMantra && currentMantra && (
          <div className="text-center space-y-2 max-w-md">
            <div className="text-2xl text-amber-400">ॐ</div>
            <div className={`${sizeClasses.mantra} text-telugu text-amber-700 font-medium leading-relaxed`}>
              {currentMantra}
            </div>
          </div>
        )}

        {/* Loading Message */}
        <div className="text-center space-y-2">
          <div className={`${sizeClasses.text} text-amber-800 font-medium`}>
            {message}
          </div>
        </div>

        {/* Simple animated dots */}
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>

      <style jsx>{`
        .text-telugu {
          font-family: 'Noto Sans Telugu', serif;
        }
      `}</style>
    </div>
  );
}