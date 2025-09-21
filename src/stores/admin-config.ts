import { create } from 'zustand';

interface AdminConfigState {
  // Admin mobile number configuration
  adminMobile: string;
  
  // Actions
  setAdminMobile: (mobile: string) => void;
  
  // Reset to default
  resetToDefault: () => void;
}

// Default admin mobile number - can be updated through settings
const DEFAULT_ADMIN_MOBILE = '+919014882779';

export const useAdminConfigStore = create<AdminConfigState>((set) => ({
  adminMobile: DEFAULT_ADMIN_MOBILE,
  
  setAdminMobile: (mobile: string) => {
    // Basic validation for mobile number format
    if (mobile && typeof mobile === 'string') {
      // Remove any spaces, dashes, or other formatting characters
      const cleanedMobile = mobile.replace(/[\s\-\(\)]/g, '');
      
      // Ensure it starts with + and has reasonable length
      if (cleanedMobile.startsWith('+') && cleanedMobile.length >= 10) {
        set({ adminMobile: cleanedMobile });
        console.log('✅ Admin mobile number updated to:', cleanedMobile);
      } else {
        console.error('❌ Invalid admin mobile number format:', mobile);
      }
    } else {
      console.error('❌ Invalid admin mobile number value:', mobile);
    }
  },
  
  resetToDefault: () => {
    set({ adminMobile: DEFAULT_ADMIN_MOBILE });
    console.log('🔄 Admin mobile number reset to default:', DEFAULT_ADMIN_MOBILE);
  }
}));

// Export a hook for easy access to the admin mobile number
export const useAdminMobile = () => {
  const adminMobile = useAdminConfigStore((state) => state.adminMobile);
  return adminMobile;
};

// Export a hook for updating the admin mobile number
export const useSetAdminMobile = () => {
  const setAdminMobile = useAdminConfigStore((state) => state.setAdminMobile);
  return setAdminMobile;
};