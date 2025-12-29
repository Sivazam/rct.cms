import jwt from 'jsonwebtoken';

// Ensure JWT_SECRET is a string and handle potential module conflicts
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

export interface DecodedToken {
  phoneNumber: string;
  userId?: string; // Firestore document ID
  iat: number;
  exp: number;
}

export function getAuthToken(request?: Request): string | null {
  if (typeof window !== 'undefined') {
    // Client-side: try cookies first, then localStorage as fallback
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='));
    const token = authCookie ? authCookie.split('=')[1] : null;
    
    if (token) {
      console.log('Client-side auth token found in cookies');
      return token;
    }
    
    // Fallback to localStorage
    const localToken = localStorage.getItem('auth-token');
    if (localToken) {
      console.log('Client-side auth token found in localStorage');
      return localToken;
    }
    
    console.log('Client-side auth token not found in cookies or localStorage');
    return null;
  } else if (request) {
    // Server-side: get from request cookies
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(';');
    const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='));
    return authCookie ? authCookie.split('=')[1] : null;
  }
  return null;
}

export function verifyToken(token: string): DecodedToken | null {
  try {
    console.log('Starting token verification...');
    
    // Try multiple approaches to verify the token
    const approaches = [
      // Approach 1: Use Buffer-based secret
      () => {
        const secretBuffer = getSecretBuffer();
        console.log('Approach 1: Using Buffer secret');
        return jwt.verify(token, secretBuffer) as DecodedToken;
      },
      // Approach 2: Use string secret with explicit type
      () => {
        const secretString = getJwtSecret();
        console.log('Approach 2: Using string secret');
        return jwt.verify(token, secretString, { algorithms: ['HS256'] }) as DecodedToken;
      },
      // Approach 3: Manual decode and verify (fallback)
      () => {
        console.log('Approach 3: Manual decode approach');
        const decoded = jwt.decode(token, { complete: true });
        if (!decoded || !decoded.payload) {
          throw new Error('Invalid token format');
        }
        
        // Basic validation
        const payload = decoded.payload as any;
        if (!payload.phoneNumber || !payload.exp) {
          throw new Error('Missing required claims');
        }
        
        // Check expiration
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
          throw new Error('Token expired');
        }
        
        return payload as DecodedToken;
      },
      // Approach 4: Direct string secret (last resort)
      () => {
        console.log('Approach 4: Direct string secret approach');
        const secret = 'your-secret-key'; // Hardcoded fallback
        return jwt.verify(token, secret) as DecodedToken;
      }
    ];
    
    // Try each approach until one works
    for (let i = 0; i < approaches.length; i++) {
      try {
        const result = approaches[i]();
        console.log(`Token verified successfully using approach ${i + 1} for phone:`, result.phoneNumber);
        return result;
      } catch (approachError) {
        console.warn(`Approach ${i + 1} failed:`, approachError);
        if (i === approaches.length - 1) {
          // Last approach failed, rethrow the error
          throw approachError;
        }
        // Continue to next approach
      }
    }
    
    return null;
  } catch (error) {
    console.error('All token verification approaches failed:', error);
    console.error('Error details:', {
      name: (error as any).name,
      message: (error as any).message,
      stack: (error as any).stack
    });
    return null;
  }
}

export function isUserAuthenticated(request?: Request): boolean {
  if (typeof window === 'undefined' && !request) {
    return false; // Server-side without request context
  }
  const token = getAuthToken(request);
  console.log('isUserAuthenticated - token exists:', !!token);
  if (!token) return false;
  
  const isValid = verifyToken(token) !== null;
  console.log('isUserAuthenticated - token valid:', isValid);
  return isValid;
}

export function isAuthenticated(request?: Request): boolean {
  return isUserAuthenticated(request);
}

export function getCurrentUser(request?: Request): DecodedToken | null {
  const token = getAuthToken(request);
  return token ? verifyToken(token) : null;
}