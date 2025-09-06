import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendSMS, SMSTemplates } from '@/lib/sms';

export async function POST(request: NextRequest) {
  try {
    const { entryId, operatorId } = await request.json();

    if (!entryId || !operatorId) {
      return NextResponse.json(
        { error: 'Entry ID and Operator ID are required' },
        { status: 400 }
      );
    }

    // Check if entry exists and is active
    const entriesRef = collection(db, 'entries');
    const q = query(entriesRef, where('id', '==', entryId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    const entryDoc = querySnapshot.docs[0];
    const entryData = entryDoc.data();

    if (entryData.status !== 'active') {
      return NextResponse.json(
        { error: 'Entry is not active and cannot be delivered' },
        { status: 400 }
      );
    }

    // Generate OTP (6-digit random number)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store OTP verification record
    const otpRecord = {
      entryId,
      operatorId,
      otp,
      otpExpiry: otpExpiry.toISOString(),
      attempts: 0,
      maxAttempts: 3,
      isVerified: false,
      createdAt: serverTimestamp(),
      purpose: 'delivery'
    };

    await addDoc(collection(db, 'otpVerifications'), otpRecord);

    // Send OTP to customer via SMS
    const customerMobile = entryData.customerMobile;
    const customerName = entryData.customerName;
    
    const smsMessage = `RCT-CMS: Your delivery verification OTP is ${otp}. This OTP will expire in 10 minutes. Please do not share this OTP with anyone. Entry ID: ${entryId.slice(-6)}`;

    const smsResult = await sendSMS(customerMobile, smsMessage, entryId);

    if (!smsResult.success) {
      console.error('Failed to send OTP SMS:', smsResult.error);
      // Continue even if SMS fails, as OTP is stored in database
    }

    // Log the OTP generation
    await addDoc(collection(db, 'deliveryLogs'), {
      entryId,
      operatorId,
      action: 'otp_generated',
      otpSent: !!smsResult.success,
      customerMobile,
      timestamp: serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      message: 'OTP generated and sent successfully',
      otpExpiry: otpExpiry.toISOString(),
      entryId: entryId.slice(-6), // Return only last 6 digits for security
      customerName,
      customerMobile: customerMobile.slice(0, -4) + 'XXXX' // Mask mobile number
    });

  } catch (error) {
    console.error('Error generating delivery OTP:', error);
    return NextResponse.json(
      { error: 'Failed to generate OTP' },
      { status: 500 }
    );
  }
}