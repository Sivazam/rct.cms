import { NextRequest, NextResponse } from 'next/server';
import { getCustomerByMobile } from '@/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mobile = searchParams.get('mobile');

    if (!mobile) {
      return NextResponse.json(
        { error: 'Mobile number is required' },
        { status: 400 }
      );
    }

    const customer = await getCustomerByMobile(mobile.trim());
    
    return NextResponse.json({ customer });
  } catch (error: any) {
    console.error('Error searching customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search customer' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, mobile, city, additionalDetails, createdBy, locationId } = body;

    // Validate required fields
    if (!name || !mobile || !city || !createdBy || !locationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Import here to avoid server-side issues with Firebase
    const { addCustomer } = await import('@/lib/firestore');
    
    const customerId = await addCustomer({
      name,
      mobile,
      city,
      additionalDetails,
      createdBy,
      locationId
    });

    return NextResponse.json({ 
      success: true, 
      customerId,
      message: 'Customer created successfully' 
    });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create customer' },
      { status: 500 }
    );
  }
}