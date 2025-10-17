import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, getDoc ,addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDate } from '@/lib/date-utils';

export async function POST(request: NextRequest) {
  try {
    const { entryId, operatorId, operatorName, otp, amountPaid, dueAmount, reason, handoverPersonName, handoverPersonMobile, potsToDeliver } = await request.json();

    console.log('Dispatch request received:', { entryId, operatorId, operatorName, amountPaid, dueAmount, reason, handoverPersonName, handoverPersonMobile, potsToDeliver });

    if (!entryId || !operatorId || !operatorName) {
      console.log('Missing required fields:', { entryId, operatorId, operatorName });
      return NextResponse.json(
        { error: 'Entry ID, Operator ID, and Operator Name are required' },
        { status: 400 }
      );
    }

    // Validate pots to deliver
    if (!potsToDeliver || potsToDeliver < 1) {
      return NextResponse.json(
        { error: 'Number of pots to deliver must be at least 1' },
        { status: 400 }
      );
    }

    // Validate handover person information
    if (!handoverPersonName || !handoverPersonName.trim()) {
      return NextResponse.json(
        { error: 'Handover person name is required' },
        { status: 400 }
      );
    }

    if (!handoverPersonMobile || !handoverPersonMobile.trim()) {
      return NextResponse.json(
        { error: 'Handover person mobile number is required' },
        { status: 400 }
      );
    }

    // Validate mobile number format
    if (!/^[6-9]\d{9}$/.test(handoverPersonMobile)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile number starting with 6-9' },
        { status: 400 }
      );
    }

    // Get the entry details
    const entryRef = doc(db, 'entries', entryId);
    const entryDoc = await getDoc(entryRef);

    if (!entryDoc.exists()) {
      console.log('Entry not found for ID:', entryId);
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    const entryData = entryDoc.data();
    const totalPots = entryData.totalPots || entryData.numberOfPots || entryData.pots || 0;
    const potsDelivered = entryData.potsDelivered || 0;
    const remainingPots = totalPots - potsDelivered;
    
    console.log('Entry found:', { 
      id: entryDoc.id, 
      status: entryData.status,
      customerName: entryData.customerName,
      hasCustomerId: !!entryData.customerId,
      hasLocationName: !!entryData.locationName,
      totalPots: totalPots,
      potsDelivered: potsDelivered,
      remainingPots: remainingPots,
      potsToDeliver: potsToDeliver
    });

    // Validate that we have enough remaining pots
    if (potsToDeliver > remainingPots) {
      return NextResponse.json(
        { error: `Cannot deliver ${potsToDeliver} pots. Only ${remainingPots} pots remaining.` },
        { status: 400 }
      );
    }

    if (entryData.status !== 'active') {
      console.log('Entry not active:', entryData.status);
      return NextResponse.json(
        { error: 'Entry is not active and cannot be dispatched' },
        { status: 400 }
      );
    }

    // Create delivery record with payment information
    const deliveryDate = new Date().toISOString();
    const deliveryRecord = {
      entryId,
      customerId: entryData.customerId || '',
      customerName: entryData.customerName || '',
      customerMobile: entryData.customerMobile || '',
      customerCity: entryData.customerCity || '',
      deliveryDate,
      operatorId,
      operatorName,
      locationId: entryData.locationId || '',
      locationName: entryData.locationName || '',
      totalPots: totalPots,
      potsDelivered: potsDelivered,
      potsToDeliver: potsToDeliver, // Number of pots in this delivery
      remainingPotsAfterDelivery: remainingPots - potsToDeliver,
      otpVerified: false, // No OTP verification needed
      smsSent: false, // Will be updated after sending SMS
      entryDate: entryData.entryDate,
      expiryDate: entryData.expiryDate,
      renewalCount: entryData.renewalCount || 0,
      status: remainingPots - potsToDeliver === 0 ? 'completed' : 'partial', // Track if this was final delivery
      // Payment information
      dueAmount: dueAmount || 0,
      amountPaid: amountPaid || 0,
      reason: reason || null,
      paymentType: amountPaid > 0 ? (amountPaid < dueAmount ? 'partial' : 'full') : 'free',
      // Handover person information
      handoverPersonName: handoverPersonName.trim(),
      handoverPersonMobile: handoverPersonMobile.trim(),
      createdAt: serverTimestamp()
    };

    const deliveryDocRef = await addDoc(collection(db, 'deliveries'), deliveryRecord);

    // Add payment record to entry's payments array
    const existingPayments = entryData.payments || [];
    const newPayment = {
      amount: amountPaid || 0,
      dueAmount: dueAmount || 0,
      date: new Date(),
      type: 'delivery',
      method: 'cash', // Default to cash, can be extended
      reason: reason || null,
      operatorId: operatorId,
      operatorName: operatorName
    };

    // Calculate new delivery counts
  const newPotsDelivered = potsDelivered + potsToDeliver;
  const newRemainingPots = totalPots - newPotsDelivered;
  const isFinalDelivery = newRemainingPots === 0;

  // Add delivery transaction to entry's delivery history
  const existingDeliveryHistory = entryData.deliveryHistory || [];
  const newDeliveryTransaction = {
    deliveryId: deliveryDocRef.id,
    potsDelivered: potsToDeliver,
    deliveryDate: deliveryDate,
    operatorId: operatorId,
    operatorName: operatorName,
    handoverPersonName: handoverPersonName.trim(),
    handoverPersonMobile: handoverPersonMobile.trim(),
    amountPaid: amountPaid || 0,
    dueAmount: dueAmount || 0,
    reason: reason || null,
    createdAt: serverTimestamp()
  };

  // Update entry with partial delivery information
  await updateDoc(doc(db, 'entries', entryId), {
    potsDelivered: newPotsDelivered,
    deliveryHistory: [...existingDeliveryHistory, newDeliveryTransaction],
    status: isFinalDelivery ? 'dispatched' : 'active', // Keep active if pots remain
    lastDeliveryDate: deliveryDate,
    lastDeliveryBy: operatorId,
    lastDeliveryAt: serverTimestamp(),
    // Add handover person information to entry (for most recent delivery)
    handoverPersonName: handoverPersonName.trim(),
    handoverPersonMobile: handoverPersonMobile.trim(),
    payments: [...existingPayments, newPayment],
    lastModifiedAt: serverTimestamp()
  });

    // SMS notifications are now handled by the frontend components using SMSService
    // The frontend will send SMS to both admin and customer via Firebase Functions
    // No SMS sending needed here to avoid duplication
    /*
    // The following code is now handled by frontend SMSService:
    // - sendDispatchConfirmationCustomer() for customer SMS
    // - sendDeliveryConfirmationAdmin() for admin SMS
    // Both use Firebase Functions with DLT-compliant Fast2SMS templates
    */

    // Log the delivery
    await addDoc(collection(db, 'deliveryLogs'), {
      entryId,
      operatorId,
      action: isFinalDelivery ? 'final_delivery_completed' : 'partial_delivery_completed',
      deliveryId: deliveryDocRef.id,
      customerMobile: entryData.customerMobile,
      potsDelivered: potsToDeliver,
      totalPotsDelivered: newPotsDelivered,
      remainingPots: newRemainingPots,
      amountPaid: amountPaid || 0,
      dueAmount: dueAmount || 0,
      reason: reason || null,
      smsSent: true, // SMS is handled by frontend, so we assume it will be sent
      timestamp: serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      message: isFinalDelivery ? 'Final delivery completed successfully' : 'Partial delivery completed successfully',
      deliveryId: deliveryDocRef.id,
      deliveryDate,
      entryId: entryId.slice(-6), // Return only last 6 digits for security
      customerName: entryData.customerName,
      customerMobile: entryData.customerMobile.slice(0, -4) + 'XXXX', // Mask mobile number
      potsDelivered: potsToDeliver,
      totalPotsDelivered: newPotsDelivered,
      remainingPots: newRemainingPots,
      isFinalDelivery: isFinalDelivery,
      amountPaid: amountPaid || 0,
      dueAmount: dueAmount || 0,
      smsSent: true // SMS is handled by frontend
    });

  } catch (error) {
    console.error('Detailed error processing dispatch:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    
    // Try to extract more specific error information
    let errorMessage = 'Failed to process dispatch';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error);
    }
    
    console.error('Final error message to return:', errorMessage);
    return NextResponse.json(
      { error: errorMessage, details: error.toString() },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');

    let deliveriesQuery = collection(db, 'deliveries');
    
    // Build query with filters
    const constraints = [];
    
    if (locationId) {
      constraints.push(where('locationId', '==', locationId));
    }
    
    if (startDate) {
      constraints.push(where('deliveryDate', '>=', startDate));
    }
    
    if (endDate) {
      constraints.push(where('deliveryDate', '<=', endDate));
    }

    // Apply constraints if any
    if (constraints.length > 0) {
      deliveriesQuery = query(deliveriesQuery, ...constraints);
    }

    const querySnapshot = await getDocs(deliveriesQuery);
    const deliveries = [];

    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      deliveries.push({
        id: doc.id,
        ...data,
        // Format dates for frontend
        deliveryDate: data.deliveryDate,
        createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
        deliveredAt: data.deliveredAt?.toDate?.().toISOString() || data.deliveredAt
      });
    }

    // Sort by delivery date (newest first) and limit results
    deliveries.sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime());
    const limitedDeliveries = deliveries.slice(0, limit);

    return NextResponse.json({
      success: true,
      deliveries: limitedDeliveries,
      total: deliveries.length,
      returned: limitedDeliveries.length
    });

  } catch (error) {
    console.error('Error fetching deliveries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deliveries' },
      { status: 500 }
    );
  }
}