import { NextRequest, NextResponse } from 'next/server';
import { addEntry } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      customerId, 
      customerName, 
      customerMobile, 
      numberOfPots, 
      locationId, 
      operatorId, 
      paymentMethod 
    } = body;

    // Validate required fields
    if (!customerId || !customerName || !customerMobile || !numberOfPots || 
        !locationId || !operatorId || !paymentMethod) {
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

    // Validate number of pots
    if (numberOfPots < 1 || numberOfPots > 100) {
      return NextResponse.json(
        { error: 'Number of pots must be between 1 and 100' },
        { status: 400 }
      );
    }

    const entryId = await addEntry({
      customerId,
      customerName,
      customerMobile,
      numberOfPots,
      locationId,
      operatorId,
      paymentMethod
    });

    return NextResponse.json({ 
      success: true, 
      entryId,
      message: 'Entry created successfully' 
    });
  } catch (error: any) {
    console.error('Error creating entry:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create entry' },
      { status: 500 }
    );
  }
}