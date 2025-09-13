'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import WheelLoading from '@/components/ui/wheel-loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'operator';
  requireActive?: boolean;
  fallback?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  requireActive = true,
  fallback = '/login' 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      console.log('ProtectedRoute: Checking access', {
        user: user ? {
          uid: user.uid,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          displayName: user.displayName
        } : null,
        requiredRole,
        requireActive,
        fallback
      });

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
          isActive: user.isActive,
          requireActive
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
      <WheelLoading 
        message="Verifying access..."
        showMantra={true}
        size="lg"
      />
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