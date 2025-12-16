import { NextRequest, NextResponse } from 'next/server';
import { partialDispatch, getEntryById } from '@/lib/firestore';
import SMSService from '@/lib/sms-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      entryId, 
      lockerNumber, 
      potsToDispatch,
      dispatchReason,
      handoverPersonName,
      handoverPersonMobile,
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
      handoverPersonName,
      handoverPersonMobile,
      paymentMethod,
      paymentAmount,
      dispatchedBy: operatorId
    });

    // Send SMS notifications if this is not the last pot
    if (result.totalRemainingPots > 0) {
      try {
        const smsService = SMSService.getInstance();
        const dispatchDate = new Date().toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });

        // Get admin mobile number from store or use default
        const adminMobile = '+919014882779'; // Fallback, should come from store

        // Send SMS to customer
        const customerSMSResult = await smsService.sendPartialDispatchConfirmationCustomer(
          entry.customerMobile,
          entry.deceasedPersonName || entry.customerName, // Use deceased person name, fallback to customer name
          potsToDispatch,
          entry.totalPots || 0, // Total pots stored when entry made
          dispatchDate,
          handoverPersonName || 'N/A',
          handoverPersonMobile || 'N/A',
          adminMobile,
          entry.locationName || 'N/A',
          entryId,
          entry.customerId,
          entry.locationId,
          operatorId
        );

        // Send SMS to admin
        const adminSMSResult = await smsService.sendPartialDispatchNotificationAdmin(
          adminMobile,
          entry.deceasedPersonName || entry.customerName, // Use deceased person name, fallback to customer name
          potsToDispatch,
          entry.totalPots || 0, // Total pots stored when entry made
          entry.locationName || 'N/A',
          entryId,
          entry.customerId,
          entry.locationId,
          operatorId
        );

        console.log('Partial dispatch SMS sent:', {
          customerSMS: customerSMSResult.success,
          adminSMS: adminSMSResult.success,
          totalRemainingPots: result.totalRemainingPots
        });

      } catch (smsError) {
        console.error('Error sending partial dispatch SMS:', smsError);
        // Don't fail the dispatch if SMS fails
      }
    } else {
      // This is the last pot - full dispatch SMS should be handled elsewhere
      console.log('Last pot dispatched - full dispatch SMS should be triggered');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Partial dispatch processed successfully',
      totalRemainingPots: result.totalRemainingPots,
      lockerStatus: result.lockerStatus,
      smsSent: result.totalRemainingPots > 0 ? 'partial' : 'full'
    });
  } catch (error: any) {
    console.error('Error processing partial dispatch:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process partial dispatch' },
      { status: 500 }
    );
  }
}