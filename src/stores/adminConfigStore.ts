'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminConfigState {
  // Admin mobile number
  adminMobile: string;
  
  // Actions
  setAdminMobile: (mobile: string) => void;
  resetToDefault: () => void;
  
  // Validation
  isValidAdminMobile: () => boolean;
}

// Default admin mobile number - this should match the Firebase config
const DEFAULT_ADMIN_MOBILE = '+919014882779';

export const useAdminConfigStore = create<AdminConfigState>()(
  persist(
    (set, get) => ({
      adminMobile: DEFAULT_ADMIN_MOBILE,
      
      setAdminMobile: (mobile: string) => {
        set({ adminMobile: mobile });
      },
      
      resetToDefault: () => {
        set({ adminMobile: DEFAULT_ADMIN_MOBILE });
      },
      
      isValidAdminMobile: () => {
        const { adminMobile } = get();
        // Basic validation for Indian mobile numbers
        const mobileRegex = /^\+91[6-9]\d{9}$/;
        return mobileRegex.test(adminMobile);
      },
    }),
    {
      name: 'admin-config-storage',
      // Only persist the admin mobile number
      partialize: (state) => ({ adminMobile: state.adminMobile }),
    }
  )
);

// Hook for easy access
export const useAdminMobile = () => {
  const adminMobile = useAdminConfigStore((state) => state.adminMobile);
  const setAdminMobile = useAdminConfigStore((state) => state.setAdminMobile);
  const isValidAdminMobile = useAdminConfigStore((state) => state.isValidAdminMobile);
  
  return {
    adminMobile,
    setAdminMobile,
    isValidAdminMobile,
  };
};