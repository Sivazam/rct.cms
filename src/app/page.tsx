'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SpiritualLoading from '@/components/ui/spiritual-loading';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('Home page: useEffect triggered', {
      user: user ? { email: user.email, role: user.role, isActive: user.isActive } : null,
      loading
    });

    if (!loading) {
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
  }, [user, loading, router]);

  if (loading) {
    return (
      <SpiritualLoading 
        message="Connecting to sacred space..."
        mantra="ॐ शान्ति: शान्ति: शान्ति:"
      />
    );
  }

  return (
    <SpiritualLoading 
      message="Preparing your spiritual journey..."
      mantra="ॐ भूर्भुवः स्वः"
    />
  );
}