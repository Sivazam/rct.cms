import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import jwt from 'jsonwebtoken';
import { orderService } from '@/lib/services';

// Razorpay Configuration
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'C0qZuu2HhC7cLYUKBxlKI2at';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    // Authentication is optional for payment verification
    // The order should already exist in the database from the create-order call

    // Get payment details from request body
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, dbOrderId } = await request.json();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { success: false, error: 'Missing payment details' },
        { status: 400 }
      );
    }

    // Verify signature
    const generatedSignature = Razorpay.validateWebhookSignature(
      `${razorpayOrderId}|${razorpayPaymentId}`,
      razorpaySignature,
      RAZORPAY_KEY_SECRET
    );

    if (!generatedSignature) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Update order status in Firebase
    await orderService.updatePaymentStatus(razorpayOrderId, {
      razorpayPaymentId,
      razorpaySignature,
      status: 'paid'
    });

    // Get the updated order
    const order = await orderService.getOrderByRazorpayOrderId(razorpayOrderId);

    return NextResponse.json({
      success: true,
      data: {
        orderId: order?.id,
        orderNumber: order?.orderNumber,
        razorpayOrderId: order?.razorpayOrderId,
        razorpayPaymentId: order?.razorpayPaymentId,
        status: order?.status,
        paymentStatus: order?.paymentStatus,
        total: order?.total,
        message: 'Payment verified successfully'
      }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}