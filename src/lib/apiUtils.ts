import { NextRequest, NextResponse } from 'next/server';

// API response wrapper
export class APIResponse {
  static success(
    data: any,
    message: string = 'Success',
    status: number = 200
  ) {
    return NextResponse.json(
      { success: true, message, data },
      { status }
    );
  }

  static error(
    message: string,
    status: number = 500,
    details?: any
  ) {
    return NextResponse.json(
      { success: false, message, details },
      { status }
    );
  }

  static validationError(errors: Record<string, string>) {
    return NextResponse.json(
      { success: false, message: 'Validation failed', errors },
      { status: 400 }
    );
  }

  static notFound(message: string = 'Resource not found') {
    return NextResponse.json(
      { success: false, message },
      { status: 404 }
    );
  }

  static unauthorized(message: string = 'Unauthorized') {
    return NextResponse.json(
      { success: false, message },
      { status: 401 }
    );
  }

  static forbidden(message: string = 'Forbidden') {
    return NextResponse.json(
      { success: false, message },
      { status: 403 }
    );
  }
}

// Error handler for API routes
export function handleAPIError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof Error) {
    switch (error.name) {
      case 'ValidationError':
        return APIResponse.validationError({ general: error.message });
      case 'AuthenticationError':
        return APIResponse.unauthorized(error.message);
      case 'AuthorizationError':
        return APIResponse.forbidden(error.message);
      case 'NotFoundError':
        return APIResponse.notFound(error.message);
      case 'DatabaseError':
        return APIResponse.error('Database operation failed');
      default:
        return APIResponse.error('Internal server error');
    }
  }

  return APIResponse.error('Unknown error occurred');
}

// Request validation middleware
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: any
): Promise<{ success: true; data: T } | { success: false; error: NextResponse }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err: any) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      
      return {
        success: false,
        error: APIResponse.validationError(errors)
      };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: APIResponse.error('Invalid request body')
    };
  }
}

// Rate limiting middleware
export class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
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
      this.requests.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (data.count >= this.maxRequests) {
      return false;
    }

    data.count++;
    return true;
  }

  getHeaders(key: string): Record<string, string> {
    const data = this.requests.get(key);
    const remaining = data ? Math.max(0, this.maxRequests - data.count) : this.maxRequests;
    const resetTime = data ? Math.ceil((data.resetTime - Date.now()) / 1000) : 60;

    return {
      'X-RateLimit-Limit': this.maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': resetTime.toString(),
    };
  }
}

// Create rate limiter instance
export const apiRateLimiter = new RateLimiter(60000, 100); // 100 requests per minute

// Rate limiting middleware
export function withRateLimit(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    if (!apiRateLimiter.isAllowed(ip)) {
      return APIResponse.error('Too many requests', 429);
    }

    const response = await handler(request);
    
    // Add rate limit headers
    const headers = apiRateLimiter.getHeaders(ip);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

import jwt from 'jsonwebtoken';

// JWT secret handling with error prevention
const getJwtSecret = (): string => {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    if (typeof secret !== 'string') {
      console.error('JWT_SECRET is not a string, using fallback');
      return 'your-secret-key';
    }
    return secret;
  } catch (error) {
    console.error('Error accessing JWT_SECRET:', error);
    return 'your-secret-key';
  }
};

// Buffer-based secret handling to avoid instanceof issues
const getSecretBuffer = (): Buffer => {
  const secret = getJwtSecret();
  try {
    return Buffer.from(secret);
  } catch (error) {
    console.error('Error creating buffer from secret:', error);
    return Buffer.from('your-secret-key');
  }
};

// Authentication middleware
export async function withAuth(
  request: NextRequest,
  handler: (userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return APIResponse.unauthorized('Authentication token required');
    }

    try {
      // Try multiple verification approaches
      let decoded: any;
      try {
        const secretBuffer = getSecretBuffer();
        decoded = jwt.verify(token, secretBuffer);
        console.log('API Utils: Token verified using Buffer secret');
      } catch (error) {
        console.warn('API Utils: Buffer verification failed, trying string approach');
        const secretString = getJwtSecret();
        decoded = jwt.verify(token, secretString, { algorithms: ['HS256'] });
        console.log('API Utils: Token verified using string secret');
      }
      return await handler(decoded.phoneNumber);
    } catch (error) {
      return APIResponse.unauthorized('Invalid or expired token');
    }
  } catch (error) {
    return handleAPIError(error);
  }
}

// Admin authentication middleware
export async function withAdminAuth(
  request: NextRequest,
  handler: (userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(request, async (userId) => {
    // Add admin role check here
    // For now, we'll assume all authenticated users are admins
    // In a real app, you would check user roles in the database
    return await handler(userId);
  });
}

// Logging middleware
export function withLogging(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const start = Date.now();
    const method = request.method;
    const url = request.url;
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

    console.log(`[${new Date().toISOString()}] ${method} ${url} - IP: ${ip}`);

    try {
      const response = await handler(request);
      const duration = Date.now() - start;
      
      console.log(`[${new Date().toISOString()}] ${method} ${url} - ${response.status} - ${duration}ms`);
      
      return response;
    } catch (error) {
      const duration = Date.now() - start;
      
      console.error(`[${new Date().toISOString()}] ${method} ${url} - Error - ${duration}ms`, error);
      
      return handleAPIError(error);
    }
  };
}

// CORS middleware
export function withCORS(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const response = await handler(request);
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;
  };
}

// Security headers middleware
export function withSecurityHeaders(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const response = await handler(request);
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    return response;
  };
}

// Compose multiple middlewares
export function compose(
  ...middlewares: ((handler: (req: NextRequest) => Promise<NextResponse>) => (req: NextRequest) => Promise<NextResponse>)[]
) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}