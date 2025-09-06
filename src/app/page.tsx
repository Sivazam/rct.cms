'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4">
      <div className="relative w-24 h-24 md:w-32 md:h-32">
        <img
          src="/logo.svg"
          alt="Z.ai Logo"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  );
}