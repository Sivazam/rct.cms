import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function GET() {
  try {
    console.log('Test payment API called');
    
    // Razorpay Configuration
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_RHpVquZ5e0nUkX';
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'C0qZuu2HhC7cLYUKBxlKI2at';
    
    console.log('Testing Razorpay connection with key:', RAZORPAY_KEY_ID);
    
    // Create Razorpay instance
    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    // Test creating a small order
    const options = {
      amount: 100, // ₹1.00 in paise
      currency: 'INR',
      receipt: `test_order_${Date.now()}`,
      payment_capture: 1,
    };

    console.log('Creating test Razorpay order...');
    
    const razorpayOrder = await razorpay.orders.create(options);
    
    console.log('Test Razorpay order created successfully:', razorpayOrder.id);

    return NextResponse.json({
      success: true,
      message: 'Razorpay connection successful',
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('Test Razorpay connection failed:', error);
    console.error('Error details:', {
      name: (error as any).name,
      message: (error as any).message,
      stack: (error as any).stack,
      code: (error as any).code,
      statusCode: (error as any).statusCode
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Razorpay connection failed', 
        details: (error as any).message,
        keyUsed: process.env.RAZORPAY_KEY_ID
      },
      { status: 500 }
    );
  }
}