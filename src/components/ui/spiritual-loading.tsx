'use client';

import { useEffect, useState } from 'react';
import { getTeluguDeathMantra, getTeluguSoulMantra } from '@/lib/spiritual-texts';
import Image from 'next/image';

interface SpiritualLoadingProps {
  message?: string;
  showOm?: boolean;
  teluguOnly?: boolean;
  useWheel?: boolean;
}

export default function SpiritualLoading({ 
  message = "Loading...", 
  showOm = true,
  teluguOnly = false,
  useWheel = false
}: SpiritualLoadingProps) {
  const [rotation, setRotation] = useState(0);
  const [currentMantra, setCurrentMantra] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 2) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (teluguOnly) {
      // Use death and rebirth related mantras for cremation system
      const mantras = [
        getTeluguDeathMantra(),
        getTeluguSoulMantra(),
        "నైనం ఛిన్దన్తి శస్త్రాణి నైనం దహతి పావకః", // The soul can never be cut to pieces by any weapon
        "న జాయతే మ్రియతే వా కదాచిన్నాయం భూత్వా భవితా వా న భూయః", // The soul is never born, nor does it die
        "జాతస్య హి ధ్రువో మృత్యుర్ధ్రువం జన్మ మృతస్య చ", // For one who has taken birth, death is certain
        "అవినాశి తు వద్ధి నైనం నిత్యం యః అజః శాశ్వతోఽయం పురాణో", // Know that which pervades the entire body is indestructible
        "తస్మాద్వేధి మహాబాహో నైవం శోచితుమర్హసి", // Therefore, one should not lament for that which is inevitable
      ];
      setCurrentMantra(mantras[Math.floor(Math.random() * mantras.length)]);
    }
  }, [teluguOnly]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50">
      {/* Subtle background element */}
      <div className="absolute inset-0 opacity-3">
        <div className="absolute top-20 right-20 text-8xl text-amber-200">ॐ</div>
      </div>

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
                src="/wheel.png"
                alt="Sacred Wheel"
                width={96}
                height={96}
                className="w-full h-full object-contain"
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

        {/* Death/Rebirth Sacred Text */}
        {showOm && currentMantra && (
          <div className="text-center space-y-2 max-w-md">
            <div className="text-2xl text-amber-400">ॐ</div>
            <div className="text-sm text-telugu text-amber-600 leading-relaxed">
              {currentMantra}
            </div>
          </div>
        )}

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
        .text-telugu {
          font-family: 'Noto Sans Telugu', serif;
        }
      `}</style>
    </div>
  );
}