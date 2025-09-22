'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import NavigationLoading from '@/components/ui/navigation-loading';
import SplashScreen from '@/components/ui/splash-screen-complex';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    console.log('Home page: useEffect triggered', {
      user: user ? { email: user.email, role: user.role, isActive: user.isActive } : null,
      loading
    });

    if (!loading && !showSplash) {
      if (user) {
        // Admin users should always have access, operators need approval
        const shouldHaveAccess = user.role === 'admin' || user.isActive;
        
        console.log('Main page routing:', {
          user: user.email,
          role: user.role,
          isActive: user.isActive,
          shouldHaveAccess,
          destination: shouldHaveAccess ? '/dashboard' : '/pending-approval'
        });
        
        if (shouldHaveAccess) {
          console.log('Home page: Redirecting to /dashboard');
          router.push('/dashboard');
        } else {
          console.log('Home page: Redirecting to /pending-approval');
          router.push('/pending-approval');
        }
      } else {
        console.log('Home page: No user found, redirecting to /login');
        router.push('/login');
      }
    }
  }, [user, loading, router, showSplash]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onSplashComplete={handleSplashComplete} />;
  }

  if (loading) {
    return (
      <NavigationLoading 
        message="Connecting to Cremation Management System..."
      />
    );
  }

  return (
    <NavigationLoading 
      message="Loading Cremation Management System..."
    />
  );
}