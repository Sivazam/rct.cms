import { NextRequest, NextResponse } from 'next/server';
import { addEntry } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      customerId, 
      customerName, 
      customerMobile, 
      customerCity,
      deceasedPersonName,
      numberOfLockers, 
      potsPerLocker,
      locationId, 
      operatorId, 
      paymentMethod 
    } = body;

    // Validate required fields
    if (!customerId || !customerName || !customerMobile || !numberOfLockers || !potsPerLocker ||
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

    // Validate number of lockers and pots per locker
    if (numberOfLockers < 1 || numberOfLockers > 10) {
      return NextResponse.json(
        { error: 'Number of lockers must be between 1 and 10' },
        { status: 400 }
      );
    }

    if (potsPerLocker < 1 || potsPerLocker > 50) {
      return NextResponse.json(
        { error: 'Pots per locker must be between 1 and 50' },
        { status: 400 }
      );
    }

    const entryId = await addEntry({
      customerId,
      customerName,
      customerMobile,
      customerCity,
      deceasedPersonName,
      numberOfLockers,
      potsPerLocker,
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