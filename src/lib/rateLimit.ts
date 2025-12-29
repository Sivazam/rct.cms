import { NextRequest } from 'next/server';

interface RateLimitData {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitData>();

export async function rateLimit(request: NextRequest): Promise<{ success: boolean; remaining: number }> {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
  
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Clean up old entries
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
  
  // Get or create rate limit data for this IP
  let data = rateLimitStore.get(ip);
  if (!data || data.resetTime < now) {
    data = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(ip, data);
  }
  
  // Check if limit exceeded
  if (data.count >= maxRequests) {
    return {
      success: false,
      remaining: 0,
    };
  }
  
  // Increment count
  data.count++;
  
  return {
    success: true,
    remaining: maxRequests - data.count,
  };
}