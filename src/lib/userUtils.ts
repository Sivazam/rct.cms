import { DecodedToken } from '@/lib/auth';

/**
 * Standardized user identification utilities
 * This ensures consistent user identification across all services
 */

export interface UserIdentifier {
  phoneNumber: string;
  userId: string; // For consistency, we use phoneNumber as userId
  isAuthenticated: boolean;
}

/**
 * Get consistent user identifier from authenticated user
 * This standardizes the user identification across the application
 */
export function getUserIdentifier(authUser: DecodedToken | null): UserIdentifier {
  if (!authUser || !authUser.phoneNumber) {
    return {
      phoneNumber: '',
      userId: '',
      isAuthenticated: false
    };
  }

  // We use phoneNumber as the consistent userId across the system
  return {
    phoneNumber: authUser.phoneNumber,
    userId: authUser.phoneNumber, // Use phoneNumber as userId for consistency
    isAuthenticated: true
  };
}

/**
 * Get user identifier for guest users
 */
export function getGuestUserIdentifier(phoneNumber?: string): UserIdentifier {
  const guestId = phoneNumber || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    phoneNumber: guestId,
    userId: guestId, // Use phone number or generated ID as userId
    isAuthenticated: false
  };
}

/**
 * Validate if a userId matches the expected format
 */
export function isValidUserId(userId: string): boolean {
  if (!userId) return false;
  
  // Valid phone number format (starts with + and contains digits)
  if (userId.startsWith('+') && /^\+\d+$/.test(userId)) {
    return true;
  }
  
  // Valid guest ID format
  if (userId.startsWith('guest_')) {
    return true;
  }
  
  return false;
}

/**
 * Extract phone number from various user identifier formats
 */
export function extractPhoneNumber(userId: string): string {
  if (!userId) return '';
  
  // If it's already a phone number, return as-is
  if (userId.startsWith('+') && /^\+\d+$/.test(userId)) {
    return userId;
  }
  
  // If it's a guest ID with phone number format, extract the phone part
  const guestPhoneMatch = userId.match(/^guest_\d+_(\+\d+)$/);
  if (guestPhoneMatch) {
    return guestPhoneMatch[1];
  }
  
  return userId; // Fallback to original userId
}

/**
 * Standardize user ID for database operations
 * This ensures we always use the same format for storing and querying user data
 */
export function standardizeUserId(userId: string): string {
  if (!userId) return '';
  
  // If it's a phone number, ensure it's in the correct format
  if (userId.startsWith('+') && /^\+\d+$/.test(userId)) {
    return userId;
  }
  
  // If it's a guest ID, extract and return the phone number if available
  const phoneNumber = extractPhoneNumber(userId);
  if (phoneNumber && phoneNumber.startsWith('+')) {
    return phoneNumber;
  }
  
  return userId; // Fallback to original userId
}