'use client';

import { useEffect, useState } from 'react';
import { getTeluguDeathMantra, getTeluguSoulMantra } from '@/lib/spiritual-texts';
import Image from 'next/image';

interface SplashScreenProps {
  onSplashComplete: () => void;
}

export default function SplashScreen({ onSplashComplete }: SplashScreenProps) {
  const [rotation, setRotation] = useState(0);
  const [currentMantra, setCurrentMantra] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 2) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Set initial mantra
    const mantras = [
      getTeluguDeathMantra(),
      getTeluguSoulMantra(),
      "నైనం ఛిన్దన్తి శస్త్రాణి నైనం దహతి పావకః",
      "న జాయతే మ్రియతే వా కదాచిన్నాయం భూత్వా భవితా వా న భూయః",
      "జాతస్య హి ధ్రువో మృత్యుర్ధ్రువం జన్మ మృతస్య చ",
      "అవినాశి తు వద్ధి నైనం నిత్యం యః అజః శాశ్వతోఽయం పురాణో",
    ];
    setCurrentMantra(mantras[Math.floor(Math.random() * mantras.length)]);
  }, []);

  useEffect(() => {
    // Progress timer for 5-7 seconds
    const duration = 6000; // 6 seconds
    const startTime = Date.now();
    
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        clearInterval(progressInterval);
        setTimeout(() => {
          onSplashComplete();
        }, 500); // Small delay before completing
      }
    }, 50);

    return () => clearInterval(progressInterval);
  }, [onSplashComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-red-50">
      {/* Background spiritual elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 text-8xl text-orange-600 animate-pulse">ॐ</div>
        <div className="absolute top-20 right-20 text-6xl text-red-600 animate-pulse" style={{ animationDelay: '1s' }}>卍</div>
        <div className="absolute bottom-20 left-20 text-7xl text-amber-600 animate-pulse" style={{ animationDelay: '2s' }}>🔥</div>
        <div className="absolute bottom-10 right-10 text-5xl text-orange-700 animate-pulse" style={{ animationDelay: '3s' }}>𑀰𑀺𑀪𑁆𑀢</div>
      </div>

      <div className="relative z-10 flex flex-col items-center space-y-8 max-w-md mx-auto px-4">
        {/* Rotating Wheel */}
        <div className="relative">
          <div 
            className="w-32 h-32 transition-transform duration-100 ease-linear"
            style={{
              transform: `rotate(${rotation}deg)`
            }}
          >
            <Image
              src="/wheel.png"
              alt="Sacred Wheel"
              width={128}
              height={128}
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'w-full h-full rounded-full border-4 border-amber-600 border-t-amber-800 animate-spin';
                fallback.style.background = 'conic-gradient(from 0deg, #d97706, #92400e, #d97706)';
                target.parentNode?.appendChild(fallback);
              }}
            />
          </div>
          
          {/* Om symbol overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl text-amber-600 opacity-80">ॐ</div>
          </div>
        </div>

        {/* Sacred Mantra */}
        <div className="text-center space-y-4">
          <div className="text-3xl text-amber-500 animate-pulse">ॐ</div>
          <div className="text-lg text-telugu text-amber-700 font-medium leading-relaxed">
            {currentMantra}
          </div>
        </div>

        {/* App Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-orange-900">
            ॐ Cremation Management System ॐ
          </h1>
          <p className="text-sm text-orange-700">
            Rotary Charitable Trust
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs space-y-2">
          <div className="flex justify-between text-xs text-orange-600">
            <span>Initializing System</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-orange-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-orange-500 to-amber-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Loading Messages */}
        <div className="text-center space-y-1">
          <div className="text-sm text-orange-800 font-medium">
            {progress < 25 && "Connecting to sacred services..."}
            {progress >= 25 && progress < 50 && "Loading spiritual components..."}
            {progress >= 50 && progress < 75 && "Preparing management system..."}
            {progress >= 75 && progress < 100 && "Almost ready..."}
            {progress >= 100 && "Welcome"}
          </div>
        </div>

        {/* Animated dots */}
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