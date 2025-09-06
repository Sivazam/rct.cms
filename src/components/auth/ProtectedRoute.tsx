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
        console.log('ProtectedRoute: No user found, redirecting to:', fallback);
        router.push(fallback);
        return;
      }

      // Check if user is active (if required) - exempt admin users
      // Admin users should always have access regardless of isActive status
      if (requireActive && !user.isActive && user.role !== 'admin') {
        console.log('ProtectedRoute: User not active and not admin, redirecting to /pending-approval', {
          user: user.email,
          role: user.role,
          isActive: user.isActive
        });
        router.push('/pending-approval');
        return;
      }

      // Check role requirements
      if (requiredRole && user.role !== requiredRole) {
        console.log('ProtectedRoute: User role mismatch, redirecting to /unauthorized', {
          user: user.email,
          userRole: user.role,
          requiredRole
        });
        router.push('/unauthorized');
        return;
      }

      console.log('ProtectedRoute: Access granted', {
        user: user.email,
        role: user.role,
        isActive: user.isActive,
        requiredRole
      });
    }
  }, [user, loading, requiredRole, requireActive, fallback, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || (requireActive && !user.isActive && user.role !== 'admin') || (requiredRole && user.role !== requiredRole)) {
    // Admin users are exempt from isActive check
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