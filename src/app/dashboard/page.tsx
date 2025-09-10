'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import WheelLoading from '@/components/ui/wheel-loading';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      console.log('Dashboard page: Routing user based on role', {
        user: user.email,
        role: user.role,
        destination: user.role === 'admin' ? '/dashboard/admin' : '/dashboard/operator'
      });
      
      if (user.role === 'admin') {
        router.push('/dashboard/admin');
      } else if (user.role === 'operator') {
        router.push('/dashboard/operator');
      } else {
        console.log('Dashboard page: Unknown role, redirecting to /unauthorized');
        router.push('/unauthorized');
      }
    }
  }, [user, loading, router]);

  return (
    <WheelLoading 
      message="Redirecting to dashboard..."
      showMantra={true}
      size="lg"
    />
  );
}