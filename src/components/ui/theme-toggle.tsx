'use client';

import { Moon, Sun, LampDesk } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    // Mark that user manually changed the theme
    localStorage.setItem('manual-theme', 'true');
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-saffron-900 dark:to-red-900 shadow-lg hover:shadow-xl transition-all duration-300 group border-2 border-orange-300 dark:border-red-700 overflow-hidden"
      aria-label="Toggle theme"
    >
      {/* Background pattern with spiritual design */}
      <div className="absolute inset-0 opacity-20 dark:opacity-30">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0iI2RlODg0MCIvPgo8Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIxLjUiIGZpbGw9IiNkZTg4NDAiLz4KPGNpcmNsZSBjeD0iMzAiIGN5PSIxMCIgcj0iMS41IiBmaWxsPSIjZGU4ODQwIi8+CjxjaXJjbGUgY3g9IjEwIiBjeT0iMzAiIHI9IjEuNSIgZmlsbD0iI2RlODg0MCIvPgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiIGZpbGw9IiNkZTg4NDAiLz4KPC9zdmc+')] bg-repeat bg-[length:20px_20px]" />
      </div>
      
      {/* Light mode icon */}
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 transform ${
        theme === 'light' 
          ? 'opacity-100 scale-100 rotate-0 z-10' 
          : 'opacity-0 scale-75 -rotate-90 z-0'
      }`}>
        <Sun className="h-5 w-5 text-orange-600" />
      </div>
      
      {/* Dark mode icon */}
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 transform ${
        theme === 'dark' 
          ? 'opacity-100 scale-100 rotate-0 z-10' 
          : 'opacity-0 scale-75 rotate-90 z-0'
      }`}>
        <Moon className="h-5 w-5 text-saffron-200" />
      </div>
      
  
      
      {/* Animated ring */}
      <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-orange-400 dark:group-hover:border-red-500 transition-all duration-300" />
      
      {/* Glow effect */}
      <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
        theme === 'light' 
          ? 'shadow-[0_0_10px_rgba(251,146,60,0.3)]' 
          : 'shadow-[0_0_10px_rgba(220,38,38,0.3)]'
      }`} />
    </button>
  );
}