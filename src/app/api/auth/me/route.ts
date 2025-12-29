import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { userService } from '@/lib/services';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                 request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify token with multiple approaches
    let decoded: any;
    try {
      // Approach 1: Use Buffer-based secret
      const secretBuffer = getSecretBuffer();
      decoded = jwt.verify(token, secretBuffer);
      console.log('Token verified using Buffer secret');
    } catch (error) {
      console.warn('Buffer verification failed, trying string approach:', error);
      try {
        // Approach 2: Use string secret with explicit algorithm
        const secretString = getJwtSecret();
        decoded = jwt.verify(token, secretString, { algorithms: ['HS256'] });
        console.log('Token verified using string secret');
      } catch (error2) {
        console.error('All verification approaches failed:', error2);
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
    }
    
    const phoneNumber = decoded.phoneNumber;

    // Get user from database
    const user = await userService.getUserByPhoneNumber(phoneNumber);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        email: user.email,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode
      }
    });

  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}