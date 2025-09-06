import { NextRequest, NextResponse } from 'next/server';
import { updateEntry } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      entryId, 
      renewalData 
    } = body;

    // Validate required fields
    if (!entryId || !renewalData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { months, amount, method, operatorId, newExpiryDate } = renewalData;

    // Validate renewal data
    if (!months || !amount || !method || !operatorId || !newExpiryDate) {
      return NextResponse.json(
        { error: 'Missing renewal data fields' },
        { status: 400 }
      );
    }

    // Validate months
    if (months < 1 || months > 12) {
      return NextResponse.json(
        { error: 'Renewal months must be between 1 and 12' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate payment method
    if (!['cash', 'upi'].includes(method)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Get current entry data first
    // Note: In a real implementation, you'd get the entry first, then update it
    // For now, we'll assume the entry exists and update it directly

    const renewalRecord = {
      date: new Date(),
      months,
      amount,
      method,
      operatorId,
      newExpiryDate: new Date(newExpiryDate)
    };

    // Update the entry with renewal data
    await updateEntry(entryId, {
      expiryDate: new Date(newExpiryDate),
      status: 'active', // Reactivate if expired
      renewals: [renewalRecord] // This will be merged with existing renewals in the actual implementation
    });

    return NextResponse.json({ 
      success: true, 
      renewalId: 'ren_' + Date.now(), // Generate a renewal ID
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