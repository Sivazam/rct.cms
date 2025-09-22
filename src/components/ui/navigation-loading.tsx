'use client';

import Image from 'next/image';

interface NavigationLoadingProps {
  message?: string;
}

export default function NavigationLoading({ message = "Loading..." }: NavigationLoadingProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary via-primary/80 to-destructive">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('/KB1.webp')] bg-cover bg-center mix-blend-overlay"></div>
      </div>
      
      <div className="flex flex-col items-center space-y-6 relative z-10">
        {/* Logo Container */}
        <div className="relative">
          {/* Animated background circle */}
          <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
          
          {/* Logo or Fallback */}
          <div className="relative z-10 w-24 h-24 bg-white rounded-full flex items-center justify-center drop-shadow-lg">
            <div className="w-20 h-20 transition-transform duration-100 ease-linear animate-spin" style={{
              animation: 'spin 8s linear infinite' // Changed from default to 8s for slower rotation
            }}>
              <Image
                src="/logo.webp"
                alt="Logo"
                width={80}
                height={80}
                className="w-full h-full object-contain"
                priority
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'absolute inset-0 flex items-center justify-center text-orange-600 text-2xl font-bold';
                  fallback.textContent = 'CMS';
                  target.parentNode?.appendChild(fallback);
                }}
              />
            </div>
          </div>
        </div>

        {/* Loading Message */}
        <div className="text-center">
          <p className="text-white/95 text-lg font-medium mb-3">
            {message}
          </p>
          
          {/* Animated loading bar */}
          <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full animate-pulse" style={{ 
              width: '60%',
              animation: 'loading 1.5s ease-in-out infinite'
            }}></div>
          </div>
          
          {/* Loading dots */}
          <div className="flex justify-center space-x-2 mt-4">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
      
      {/* Add custom animation keyframes */}
      <style jsx>{`
        @keyframes loading {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}