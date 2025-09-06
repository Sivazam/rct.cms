import { NextRequest, NextResponse } from 'next/server';
import { generateOTP } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mobile, type, entryId } = body;

    // Validate required fields
    if (!mobile || !type || !entryId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['renewal', 'delivery'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be renewal or delivery' },
        { status: 400 }
      );
    }

    // Validate mobile number format
    const mobileRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!mobileRegex.test(mobile)) {
      return NextResponse.json(
        { error: 'Invalid mobile number format' },
        { status: 400 }
      );
    }

    const result = await generateOTP(mobile, type as 'renewal' | 'delivery', entryId);

    return NextResponse.json({ 
      success: true, 
      otpId: result.otpId,
      message: 'OTP generated successfully' 
    });
  } catch (error: any) {
    console.error('Error generating OTP:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate OTP' },
      { status: 500 }
    );
  }
}