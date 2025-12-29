import { z } from 'zod';

// Product validation schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Product name too long'),
  slug: z.string().min(1, 'Slug is required').max(200, 'Slug too long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  spiritualMeaning: z.string().min(10, 'Spiritual meaning must be at least 10 characters'),
  deity: z.string().min(1, 'Deity is required'),
  images: z.array(z.string().url('Invalid image URL')).min(1, 'At least one image is required'),
  metadata: z.object({
    origin: z.string().min(1, 'Origin is required'),
    material: z.string().min(1, 'Material is required'),
  }),
  status: z.enum(['active', 'inactive']).optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().min(1, 'Product ID is required'),
});

// Variant validation schemas
export const createVariantSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  label: z.enum(['Regular', 'Medium', 'Ultra', 'Rare'], 'Invalid variant label'),
  price: z.number().min(1, 'Price must be greater than 0'),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU too long'),
  inventory: z.number().min(0, 'Inventory cannot be negative'),
  discount: z.number().min(0, 'Discount cannot be negative').max(100, 'Discount cannot exceed 100%'),
  isDefault: z.boolean().optional(),
});

export const updateVariantSchema = createVariantSchema.partial().extend({
  id: z.string().min(1, 'Variant ID is required'),
});

// Category validation schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name too long'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug too long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  iconUrl: z.string().url('Invalid icon URL'),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().min(1, 'Category ID is required'),
});

// Order validation schemas
export const createOrderSchema = z.object({
  items: z.array(z.object({
    variantId: z.string().min(1, 'Variant ID is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
  })).min(1, 'At least one item is required'),
  shippingAddress: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits')
      .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format'),
    address: z.string().min(10, 'Address is required').max(200, 'Address too long'),
    city: z.string().min(2, 'City is required').max(50, 'City too long'),
    state: z.string().min(2, 'State is required').max(50, 'State too long'),
    pincode: z.string().min(6, 'Pincode must be 6 digits').max(6, 'Pincode must be 6 digits')
      .regex(/^[0-9]+$/, 'Pincode must contain only numbers'),
  }),
});

// User validation schemas
export const updateUserProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format').optional(),
  email: z.string().email('Invalid email address').optional(),
});

// Authentication validation schemas
export const loginSchema = z.object({
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format'),
});

export const verifyOTPSchema = z.object({
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format'),
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits')
    .regex(/^[0-9]+$/, 'OTP must contain only numbers'),
});

// Search validation schemas
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  category: z.string().optional(),
  page: z.number().min(1, 'Page must be at least 1').optional(),
  limit: z.number().min(1, 'Limit must be at least 1').max(50, 'Limit cannot exceed 50').optional(),
});

// Utility functions
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[^\w\s\-]/g, ''); // Keep only alphanumeric, spaces, and hyphens
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[0-9+\-\s()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Error handling utilities
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string = 'Database operation failed') {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Rate limiting utilities
export interface RateLimitData {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private requests: Map<string, RateLimitData> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const data = this.requests.get(key);

    if (!data || now > data.resetTime) {
      // Reset window
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (data.count >= this.maxRequests) {
      return false;
    }

    data.count++;
    return true;
  }

  getRemainingRequests(key: string): number {
    const data = this.requests.get(key);
    if (!data || Date.now() > data.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - data.count);
  }
}