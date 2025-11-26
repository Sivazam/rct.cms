import { NextRequest, NextResponse } from 'next/server';
import { updateEntry, getEntryById } from '@/lib/firestore';
import { formatDate } from '@/lib/date-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      entryId, 
      months, 
      amount,
      paymentMethod, 
      operatorId, 
      operatorName 
    } = body;

    // Validate required fields
    if (!entryId || !months || !paymentMethod || !operatorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate payment method
    if (!['cash', 'upi'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Validate months
    if (months < 1 || months > 12) {
      return NextResponse.json(
        { error: 'Months must be between 1 and 12' },
        { status: 400 }
      );
    }

    // Get entry details for SMS and customer information
    const entry = await getEntryById(entryId);
    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Calculate amount and new expiry date
    // Renewal fee is ₹300 per locker per month
    const numberOfLockers = entry.numberOfLockers || 1; // Default to 1 for backward compatibility
    const renewalAmount = amount || (300 * months * numberOfLockers);
    const newExpiryDate = new Date(Date.now() + (months * 30 * 24 * 60 * 60 * 1000));

    // Create renewal record
    const renewalRecord = {
      date: new Date(),
      months: months,
      amount: renewalAmount,
      method: paymentMethod,
      operatorId: operatorId,
      newExpiryDate: newExpiryDate,
      otpUsed: 'no_otp_required' // No OTP verification needed
    };

    // Update entry with renewal
    const updateData: any = {
      expiryDate: newExpiryDate,
      renewals: [renewalRecord],
      payments: [{
        amount: renewalAmount,
        date: new Date(),
        type: 'renewal',
        method: paymentMethod,
        months: months
      }]
    };

    await updateEntry(entryId, updateData);

    // SMS notifications are now handled by the frontend components using SMSService
    // The frontend will send SMS to both admin and customer via Firebase Functions
    // No SMS sending needed here to avoid duplication

    return NextResponse.json({ 
      success: true, 
      renewalId: `ren_${Date.now()}`,
      newExpiryDate: newExpiryDate.toISOString(),
      amount: renewalAmount,
      message: 'Renewal processed successfully' 
    });
  } catch (error: any) {
    console.error('Error processing renewal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process renewal' },
      { status: 500 }
    );
  }
}