'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'operator';
  requireActive?: boolean;
  fallback?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requireActive = true,
  fallback = '/login' 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(fallback);
        return;
      }

      // Check if user is active (if required)
      if (requireActive && !user.isActive) {
        router.push('/pending-approval');
        return;
      }

      // Check role requirements
      if (requiredRole && user.role !== requiredRole) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [user, loading, requiredRole, requireActive, fallback, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || (requireActive && !user.isActive) || (requiredRole && user.role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
}

// Higher-order component for page-level protection
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: { requiredRole?: 'admin' | 'operator'; requireActive?: boolean; fallback?: string } = {}
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}