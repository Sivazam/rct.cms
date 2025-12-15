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
      // Remove any spaces, dashes, parentheses, or other formatting characters
      let cleanedMobile = mobile.replace(/[\s\-\(\)]/g, '');
      
      // Remove leading + if present to validate core number
      const coreNumber = cleanedMobile.replace(/^\+/, '');
      
      // Ensure we have only digits
      const digitsOnly = coreNumber.replace(/\D/g, '');
      
      // More flexible validation - accept 10-12 digit numbers
      if (digitsOnly.length >= 10 && digitsOnly.length <= 12) {
        // Re-add + if it was there originally, otherwise add it
        if (cleanedMobile.startsWith('+')) {
          set({ adminMobile: cleanedMobile });
        } else {
          set({ adminMobile: `+${digitsOnly}` });
        }
        console.log('✅ Admin mobile number updated to:', cleanedMobile);
      } else {
        console.error('❌ Invalid admin mobile number format:', mobile);
        console.error('❌ Must be 10-12 digits, got:', digitsOnly.length);
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
  console.log('🔍 [STORE DEBUG] useAdminMobile called, returning:', adminMobile);
  console.log('🔍 [STORE DEBUG] useAdminMobile type:', typeof adminMobile);
  return adminMobile;
};

// Export a hook for updating the admin mobile number
export const useSetAdminMobile = () => {
  const setAdminMobile = useAdminConfigStore((state) => state.setAdminMobile);
  return setAdminMobile;
};