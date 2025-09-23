'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useEffect, useState } from 'react';

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({ 
  children, 
  attribute = "class", 
  defaultTheme = "light", 
  enableSystem = true,
  disableTransitionOnChange = true 
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if it's after 4 PM and set dark theme automatically
    const checkTimeAndSetTheme = () => {
      const now = new Date();
      const hours = now.getHours();
      
      // After 4 PM (16:00) and before 6 AM (06:00)
      if (hours >= 16 || hours < 6) {
        const currentTheme = localStorage.getItem('theme') || 
                          document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        
        // Only set to dark if not already dark and user hasn't manually set to light
        if (currentTheme !== 'dark' && !localStorage.getItem('manual-theme')) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        }
      }
    };

    // Check immediately
    checkTimeAndSetTheme();
    
    // Check every minute to handle time changes
    const interval = setInterval(checkTimeAndSetTheme, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle manual theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      const theme = localStorage.getItem('theme');
      if (theme) {
        localStorage.setItem('manual-theme', 'true');
      }
    };

    window.addEventListener('storage', handleThemeChange);
    return () => window.removeEventListener('storage', handleThemeChange);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
    >
      {children}
    </NextThemesProvider>
  );
}