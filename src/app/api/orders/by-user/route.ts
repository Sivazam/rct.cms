import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { orderService } from '@/lib/services';
import { getUserIdentifier, standardizeUserId } from '@/lib/userUtils';

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

export async function GET(request: NextRequest) {
  try {
    console.log('Orders by-user API called');

    // Check authentication (required)
    const token = request.cookies.get('auth-token')?.value;
    let userIdentifier;

    if (token) {
      try {
        // Try multiple verification approaches
        let decoded: any;
        try {
          const secretBuffer = getSecretBuffer();
          decoded = jwt.verify(token, secretBuffer);
          console.log('Orders by-user: Token verified using Buffer secret');
        } catch (error) {
          console.warn('Orders by-user: Buffer verification failed, trying string approach');
          const secretString = getJwtSecret();
          decoded = jwt.verify(token, secretString, { algorithms: ['HS256'] });
          console.log('Orders by-user: Token verified using string secret');
        }

        userIdentifier = getUserIdentifier(decoded);
        console.log('Orders by-user: Authenticated user:', userIdentifier);
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get standardized user ID
    const standardizedUserId = standardizeUserId(userIdentifier.userId);
    console.log('Orders by-user: Fetching orders for userId:', standardizedUserId);

    // Get user orders
    const orders = await orderService.getOrdersByUserId(standardizedUserId);
    console.log('Orders by-user: Found', orders.length, 'orders');

    return NextResponse.json({
      success: true,
      orders,
      total: orders.length
    });
  } catch (error) {
    console.error('Error fetching orders by user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
