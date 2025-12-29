import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import jwt from 'jsonwebtoken';
import { orderService } from '@/lib/services';

// Razorpay Configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_RHpVquZ5e0nUkX';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'C0qZuu2HhC7cLYUKBxlKI2at';

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

export async function POST(request: NextRequest) {
  try {
    console.log('Payment retry-order API called');

    // Check authentication (required for retry)
    const token = request.cookies.get('auth-token')?.value;
    let userIdentifier;

    if (token) {
      try {
        // Try multiple verification approaches
        let decoded: any;
        try {
          const secretBuffer = getSecretBuffer();
          decoded = jwt.verify(token, secretBuffer);
          console.log('Payment retry: Token verified using Buffer secret');
        } catch (error) {
          console.warn('Payment retry: Buffer verification failed, trying string approach');
          const secretString = getJwtSecret();
          decoded = jwt.verify(token, secretString, { algorithms: ['HS256'] });
          console.log('Payment retry: Token verified using string secret');
        }

        userIdentifier = decoded;
        console.log('Payment retry: Authenticated user:', userIdentifier);
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

    // Get order ID from request body
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      console.error('Missing order ID');
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    console.log('Retrying payment for order:', orderId);

    // Get existing order
    const existingOrder = await orderService.getOrderById(orderId);
    if (!existingOrder) {
      console.error('Order not found:', orderId);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if user can retry this order
    if (existingOrder.paymentStatus !== 'failed') {
      console.error('Order payment status is not failed:', existingOrder.paymentStatus);
      return NextResponse.json(
        { success: false, error: 'Can only retry failed payments' },
        { status: 400 }
      );
    }

    // Check if order is cancelled (can't retry cancelled orders)
    if (existingOrder.status === 'cancelled') {
      console.error('Order is cancelled:', existingOrder.status);
      return NextResponse.json(
        { success: false, error: 'Cannot retry cancelled order' },
        { status: 400 }
      );
    }

    // Check if user owns this order
    if (existingOrder.userId !== userIdentifier.phoneNumber && existingOrder.userId !== userIdentifier.userId) {
      console.error('User does not own this order');
      return NextResponse.json(
        { success: false, error: 'You do not have permission to retry this order' },
        { status: 403 }
      );
    }

    // Create new Razorpay order
    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(existingOrder.total * 100), // Convert to paise
      currency: 'INR',
      receipt: `retry_${Date.now()}_${existingOrder.orderNumber}`,
      payment_capture: 1,
      notes: {
        customer_name: existingOrder.customerInfo.name,
        customer_phone: existingOrder.customerInfo.phone,
        customer_email: existingOrder.customerInfo.email,
        order_type: 'spiritual_products',
        is_retry: 'true',
        original_order_number: existingOrder.orderNumber
      }
    };

    console.log('Creating Razorpay retry order:', {
      ...options,
      key_secret: '***',
      amount: options.amount,
      currency: options.currency,
      receipt: options.receipt
    });

    let razorpayOrder: any;
    try {
      razorpayOrder = await razorpay.orders.create(options);
      console.log('Razorpay retry order created successfully:', razorpayOrder.id);
    } catch (razorpayError) {
      console.error('Razorpay retry order creation failed:', razorpayError);
      throw new Error(`Failed to create Razorpay order: ${(razorpayError as any).message || 'Unknown error'}`);
    }

    // Update order with new Razorpay order ID
    await orderService.updateOrder(orderId, {
      razorpayOrderId: razorpayOrder.id
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: RAZORPAY_KEY_ID,
        dbOrderId: orderId,
        subtotal: existingOrder.subtotal,
        shippingCost: existingOrder.shippingCost,
        total: existingOrder.total
      }
    });
  } catch (error) {
    console.error('Error retrying payment:', error);
    console.error('Error details:', {
      name: (error as any).name,
      message: (error as any).message,
      stack: (error as any).stack,
      code: (error as any).code
    });
    return NextResponse.json(
      { success: false, error: 'Failed to retry payment', details: (error as any).message },
      { status: 500 }
    );
  }
}
