import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { otpId, otp } = body;

    // Validate required fields
    if (!otpId || !otp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'OTP must be 6 digits' },
        { status: 400 }
      );
    }

    const isValid = await verifyOTP(otpId, otp);

    return NextResponse.json({ 
      success: true, 
      isValid,
      message: isValid ? 'OTP verified successfully' : 'Invalid OTP' 
    });
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}