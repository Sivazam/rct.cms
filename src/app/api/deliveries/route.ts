import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendSMS, SMSTemplates } from '@/lib/sms';
import { formatDate } from '@/lib/date-utils';

export async function POST(request: NextRequest) {
  try {
    const { entryId, operatorId, operatorName, otp, amountPaid, dueAmount, reason } = await request.json();

    if (!entryId || !operatorId || !operatorName || !otp) {
      return NextResponse.json(
        { error: 'Entry ID, Operator ID, Operator Name, and OTP are required' },
        { status: 400 }
      );
    }

    // Verify OTP first
    const otpRef = collection(db, 'otpVerifications');
    const otpQuery = query(
      otpRef, 
      where('entryId', '==', entryId),
      where('purpose', '==', 'delivery'),
      where('isVerified', '==', true),
      where('otp', '==', otp)
    );
    const otpSnapshot = await getDocs(otpQuery);

    if (otpSnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid or unverified OTP. Please verify OTP first.' },
        { status: 400 }
      );
    }

    // Get the entry details
    const entryRef = doc(db, 'entries', entryId);
    const entryDoc = await getDoc(entryRef);

    if (!entryDoc.exists()) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    const entryData = entryDoc.data();

    if (entryData.status !== 'active') {
      return NextResponse.json(
        { error: 'Entry is not active and cannot be dispatched' },
        { status: 400 }
      );
    }

    // Create delivery record with payment information
    const deliveryDate = new Date().toISOString();
    const deliveryRecord = {
      entryId,
      customerId: entryData.customerId,
      customerName: entryData.customerName,
      customerMobile: entryData.customerMobile,
      customerCity: entryData.customerCity,
      deliveryDate,
      operatorId,
      operatorName,
      locationId: entryData.locationId,
      locationName: entryData.locationName,
      pots: entryData.pots,
      otpVerified: true,
      smsSent: false, // Will be updated after sending SMS
      entryDate: entryData.entryDate,
      expiryDate: entryData.expiryDate,
      renewalCount: entryData.renewalCount || 0,
      status: 'dispatched', // Changed from 'delivered' to 'dispatched'
      // Payment information
      dueAmount: dueAmount || 0,
      amountPaid: amountPaid || 0,
      reason: reason || null,
      paymentType: amountPaid > 0 ? (amountPaid < dueAmount ? 'partial' : 'full') : 'free',
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

    // Update entry status to dispatched and add payment
    await updateDoc(doc(db, 'entries', entryId), {
      status: 'dispatched', // Changed from 'delivered' to 'dispatched'
      deliveryDate: deliveryDate,
      deliveredBy: operatorId,
      deliveredAt: serverTimestamp(),
      payments: [...existingPayments, newPayment],
      lastModifiedAt: serverTimestamp()
    });

    // Send confirmation SMS to customer
    const customerMobile = entryData.customerMobile;
    const customerName = entryData.customerName;
    const formattedDate = formatDate(deliveryDate);

    const smsMessage = SMSTemplates.customerDeliveryConfirmation(
      entryId, 
      formattedDate
    );

    // TODO: Replace with actual Fast2SMS integration when credentials are available
    // SMS to customer - currently simulating instead of sending
    console.log('SMS would be sent to customer:', customerMobile);
    console.log('Message:', smsMessage);
    
    // Simulate SMS sending (replace with actual sendSMS call when Fast2SMS is ready)
    const smsResult = { success: true }; // Mock successful result
    /*
    const smsResult = await sendSMS(customerMobile, smsMessage, entryId);
    */

    // Update delivery record with SMS status
    await updateDoc(doc(db, 'deliveries', deliveryDocRef.id), {
      smsSent: smsResult.success,
      smsSentAt: serverTimestamp()
    });

    // Send notification SMS to admin (if configured)
    const adminSmsMessage = SMSTemplates.deliveryConfirmation(
      operatorName,
      customerName,
      entryId,
      formattedDate
    );

    // TODO: Replace with actual Fast2SMS integration when credentials are available
    // SMS to admin - currently simulating instead of sending
    console.log('SMS would be sent to admin:', process.env.NEXT_PUBLIC_ADMIN_MOBILE || '+919876543210');
    console.log('Message:', adminSmsMessage);
    
    // Simulate admin SMS (replace with actual sendSMS call when Fast2SMS is ready)
    /*
    await sendSMS(
      process.env.NEXT_PUBLIC_ADMIN_MOBILE || '+919876543210',
      adminSmsMessage,
      entryId
    );
    */

    // Log the delivery
    await addDoc(collection(db, 'deliveryLogs'), {
      entryId,
      operatorId,
      action: 'dispatch_completed', // Changed from 'delivery_completed'
      deliveryId: deliveryDocRef.id,
      customerMobile,
      amountPaid: amountPaid || 0,
      dueAmount: dueAmount || 0,
      reason: reason || null,
      smsSent: smsResult.success,
      timestamp: serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      message: 'Dispatch processed successfully',
      deliveryId: deliveryDocRef.id,
      deliveryDate,
      entryId: entryId.slice(-6), // Return only last 6 digits for security
      customerName,
      customerMobile: customerMobile.slice(0, -4) + 'XXXX', // Mask mobile number
      amountPaid: amountPaid || 0,
      dueAmount: dueAmount || 0,
      smsSent: smsResult.success
    });

  } catch (error) {
    console.error('Error processing dispatch:', error);
    return NextResponse.json(
      { error: 'Failed to process dispatch' },
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