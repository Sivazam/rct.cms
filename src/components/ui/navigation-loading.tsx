'use client';

import Image from 'next/image';

interface NavigationLoadingProps {
  message?: string;
}

export default function NavigationLoading({ message = "Loading..." }: NavigationLoadingProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-orange-500">
      <div className="flex flex-col items-center space-y-4">
        {/* Logo Container */}
        <div className="relative">
          {/* Optional: Add a subtle border/bounding effect */}
          <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
          
          <Image
            src="/logo-placeholder.png"
            alt="Logo"
            width={120}
            height={120}
            style={{"border-radius":"8px"}}
            className="relative z-10 w-20 h-20 md:w-24 md:h-24 object-contain drop-shadow-lg"
            priority
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'relative z-10 w-20 h-20 md:w-24 md-h-24 bg-white rounded-full flex items-center justify-center text-orange-500 text-2xl font-bold drop-shadow-lg';
              fallback.textContent = 'CMS';
              target.parentNode?.appendChild(fallback);
            }}
          />
        </div>

        {/* Loading Message */}
        <div className="text-center">
          <p className="text-white/90 text-sm font-medium">
            {message}
          </p>
          
          {/* Simple loading dots */}
          <div className="flex justify-center space-x-1 mt-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}