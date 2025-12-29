import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const envVars = {
      RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ? '***' + process.env.RAZORPAY_KEY_ID.slice(-4) : 'NOT_SET',
      RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ? '***' + process.env.RAZORPAY_KEY_SECRET.slice(-4) : 'NOT_SET',
      JWT_SECRET: process.env.JWT_SECRET ? '***' + process.env.JWT_SECRET.slice(-4) : 'NOT_SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT_SET',
    };

    return NextResponse.json({
      success: true,
      message: 'Payment debug endpoint',
      environment: envVars,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { success: false, error: 'Debug endpoint failed' },
      { status: 500 }
    );
  }
}