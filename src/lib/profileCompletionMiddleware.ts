import { useState, useEffect } from 'react';
import { isUserAuthenticated, getCurrentUser } from '@/lib/auth';
import { userService } from '@/lib/services';

export interface UserProfile {
  id?: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  addresses?: any[];
  orderIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Check if user profile is complete (has name and email)
 * @returns Promise<boolean> - true if profile is complete, false otherwise
 */
export async function isProfileComplete(): Promise<boolean> {
  try {
    if (!isUserAuthenticated()) {
      return false;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      return false;
    }

    const userData = await userService.getUserByPhoneNumber(currentUser.phoneNumber);
    if (!userData) {
      return false;
    }

    // Profile is complete if both name and email are present
    return !!(userData.name && userData.email);
  } catch (error) {
    console.error('Error checking profile completion:', error);
    return false;
  }
}

/**
 * Get current user profile data
 * @returns Promise<UserProfile | null> - user profile data or null if not found
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    if (!isUserAuthenticated()) {
      return null;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      return null;
    }

    return await userService.getUserByPhoneNumber(currentUser.phoneNumber);
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Check if user needs to complete profile and redirect if necessary
 * @param redirectPath - path to redirect to if profile is incomplete (default: '/auth/complete-profile')
 * @returns Promise<boolean> - true if redirect is needed, false otherwise
 */
export async function checkProfileCompletionAndRedirect(redirectPath: string = '/auth/complete-profile'): Promise<boolean> {
  try {
    if (typeof window === 'undefined') {
      // Server-side, skip redirect
      return false;
    }

    const isComplete = await isProfileComplete();
    
    if (!isComplete) {
      // Get current path to avoid redirect loops
      const currentPath = window.location.pathname;
      
      // Don't redirect if already on the profile completion page or auth pages
      const excludedPaths = ['/auth/login', '/auth/verify', '/auth/complete-profile'];
      if (!excludedPaths.includes(currentPath)) {
        // Store current path for redirect after profile completion
        sessionStorage.setItem('redirectUrl', currentPath);
        window.location.href = redirectPath;
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking profile completion:', error);
    return false;
  }
}

/**
 * Hook for checking profile completion in client components
 * @returns Object containing profile completion status and user data
 */
export function useProfileCompletion() {
  const [isComplete, setIsComplete] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        setLoading(true);
        const profile = await getCurrentUserProfile();
        setUserProfile(profile);
        
        if (profile) {
          const complete = !!(profile.name && profile.email);
          setIsComplete(complete);
        } else {
          setIsComplete(false);
        }
      } catch (error) {
        console.error('Error checking profile completion:', error);
        setIsComplete(false);
      } finally {
        setLoading(false);
      }
    };

    checkProfile();
  }, []);

  return {
    isProfileComplete: isComplete,
    userProfile,
    loading
  };
}