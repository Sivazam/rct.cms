import { NextRequest, NextResponse } from 'next/server';
import { partialDispatch, getEntryById } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      entryId, 
      lockerNumber, 
      potsToDispatch,
      dispatchReason,
      paymentMethod,
      paymentAmount,
      operatorId 
    } = body;

    // Validate required fields
    if (!entryId || !lockerNumber || !potsToDispatch || !operatorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate pots to dispatch
    if (potsToDispatch < 1) {
      return NextResponse.json(
        { error: 'Must dispatch at least 1 pot' },
        { status: 400 }
      );
    }

    // Validate locker number
    if (lockerNumber < 1) {
      return NextResponse.json(
        { error: 'Invalid locker number' },
        { status: 400 }
      );
    }

    // Get entry details to validate
    const entry = await getEntryById(entryId);
    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Check if entry is active
    if (entry.status !== 'active') {
      return NextResponse.json(
        { error: 'Entry is not active' },
        { status: 400 }
      );
    }

    // Validate payment method if provided
    if (paymentMethod && !['cash', 'upi'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Process partial dispatch
    const result = await partialDispatch(entryId, {
      lockerNumber,
      potsToDispatch,
      dispatchReason,
      paymentMethod,
      paymentAmount,
      dispatchedBy: operatorId
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Partial dispatch processed successfully',
      totalRemainingPots: result.totalRemainingPots,
      lockerStatus: result.lockerStatus
    });
  } catch (error: any) {
    console.error('Error processing partial dispatch:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process partial dispatch' },
      { status: 500 }
    );
  }
}