import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { orderService } from '@/lib/services';

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'YourWebhookSecret';

export async function POST(request: NextRequest) {
  try {
    console.log('Razorpay webhook received');
    
    // Get webhook signature
    const signature = request.headers.get('x-razorpay-signature');
    const body = await request.text();

    if (!signature) {
      console.error('Missing webhook signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const expectedSignature = Razorpay.validateWebhookSignature(
      body,
      signature,
      RAZORPAY_WEBHOOK_SECRET
    );

    if (!expectedSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Parse webhook body
    const webhookData = JSON.parse(body);
    console.log('Webhook event:', webhookData.event);

    // Handle different webhook events
    switch (webhookData.event) {
      case 'payment.captured':
        await handlePaymentCaptured(webhookData.payload.payment.entity);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(webhookData.payload.payment.entity);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${webhookData.event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payment: any) {
  try {
    console.log('Processing payment captured for order:', payment.order_id);
    
    // Update order using Firebase service
    const order = await orderService.getOrderByRazorpayOrderId(payment.order_id);

    if (order && order.status !== 'paid') {
      await orderService.updatePaymentStatus(payment.order_id, {
        razorpayPaymentId: payment.id,
        razorpaySignature: payment.signature || '',
        status: 'paid'
      });
      
      console.log(`Payment captured for order: ${order.id}`);
    } else {
      console.log('Order not found or already paid:', payment.order_id);
    }
  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
}

async function handlePaymentFailed(payment: any) {
  try {
    console.log('Processing payment failed for order:', payment.order_id);
    
    // Update order using Firebase service
    const order = await orderService.getOrderByRazorpayOrderId(payment.order_id);

    if (order && order.status !== 'failed') {
      await orderService.updatePaymentStatus(payment.order_id, {
        razorpayPaymentId: payment.id,
        razorpaySignature: payment.signature || '',
        status: 'failed'
      });
      
      console.log(`Payment failed for order: ${order.id}`);
    } else {
      console.log('Order not found or already failed:', payment.order_id);
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}