import { NextRequest, NextResponse } from 'next/server';
import { updateEntry } from '@/lib/firestore';
import { sendSMS, SMSTemplates } from '@/lib/sms';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      entryId, 
      months, 
      paymentMethod, 
      otpId, 
      operatorId, 
      operatorName 
    } = body;

    // Validate required fields
    if (!entryId || !months || !paymentMethod || !otpId || !operatorId) {
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

    // Calculate amount and new expiry date
    const amount = 300 * months;
    const newExpiryDate = new Date(Date.now() + (months * 30 * 24 * 60 * 60 * 1000));

    // Create renewal record
    const renewalRecord = {
      date: new Date(),
      months: months,
      amount: amount,
      method: paymentMethod,
      operatorId: operatorId,
      newExpiryDate: newExpiryDate,
      otpUsed: otpId
    };

    // Update entry with renewal
    const updateData: any = {
      expiryDate: newExpiryDate,
      renewals: [renewalRecord],
      payments: [{
        amount: amount,
        date: new Date(),
        type: 'renewal',
        method: paymentMethod,
        months: months
      }]
    };

    await updateEntry(entryId, updateData);

    // Send SMS notifications (mock implementation - in real app, get entry details first)
    try {
      // SMS to Admin
      await sendSMS(
        process.env.NEXT_PUBLIC_ADMIN_MOBILE || '+919876543210',
        SMSTemplates.renewalConfirmation(
          operatorName || 'Operator',
          'Customer Name', // This should come from entry data
          months,
          amount,
          entryId
        ),
        entryId
      );

      // SMS to Customer (mock mobile number)
      await sendSMS(
        '+91XXXXXXXXXX', // This should come from entry data
        SMSTemplates.customerRenewalConfirmation(
          entryId,
          newExpiryDate.toLocaleDateString(),
          amount
        ),
        entryId
      );
    } catch (smsError) {
      console.error('Error sending SMS:', smsError);
      // Don't fail the renewal if SMS fails
    }

    return NextResponse.json({ 
      success: true, 
      renewalId: `ren_${Date.now()}`,
      newExpiryDate: newExpiryDate.toISOString(),
      amount: amount,
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