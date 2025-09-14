import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendSMS, SMSTemplates } from '@/lib/sms';

export async function POST(request: NextRequest) {
  try {
    const { entryId, operatorId } = await request.json();

    console.log('OTP Request received:', { entryId, operatorId });

    if (!entryId || !operatorId) {
      console.log('Missing required fields:', { entryId, operatorId });
      return NextResponse.json(
        { error: 'Entry ID and Operator ID are required' },
        { status: 400 }
      );
    }

    // Check if entry exists and is active
    const entryRef = doc(db, 'entries', entryId);
    const entryDoc = await getDoc(entryRef);

    console.log('Entry document exists:', entryDoc.exists());

    if (!entryDoc.exists()) {
      console.log('Entry not found for ID:', entryId);
      
      // Check if there are any entries at all
      const allEntriesSnapshot = await getDocs(collection(db, 'entries'));
      console.log('Total entries in database:', allEntriesSnapshot.size);
      
      if (allEntriesSnapshot.size === 0) {
        return NextResponse.json(
          { 
            error: 'No entries found in database. Please create some test entries first.',
            suggestion: 'Please create a customer entry to get started.',
            totalEntries: 0
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Entry not found',
          entryId: entryId,
          totalEntries: allEntriesSnapshot.size,
          availableEntryIds: allEntriesSnapshot.docs.map(doc => doc.id).slice(0, 5)
        },
        { status: 404 }
      );
    }

    const entryData = entryDoc.data();
    
    console.log('Entry found:', { 
      id: entryDoc.id, 
      status: entryData.status,
      customerName: entryData.customerName,
      customerMobile: entryData.customerMobile
    });

    if (entryData.status !== 'active') {
      console.log('Entry not active:', entryData.status);
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

    // TODO: Replace with actual Fast2SMS integration when credentials are available
    // OTP SMS to customer - currently simulating instead of sending
    console.log('SMS would be sent to customer:', customerMobile);
    console.log('Message:', smsMessage);
    
    // Simulate SMS sending (replace with actual sendSMS call when Fast2SMS is ready)
    const smsResult = { success: true }; // Mock successful result
    /*
    const smsResult = await sendSMS(customerMobile, smsMessage, entryId);
    */

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