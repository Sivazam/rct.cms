import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { entryId, otp, operatorId } = await request.json();

    if (!entryId || !otp || !operatorId) {
      return NextResponse.json(
        { error: 'Entry ID, OTP, and Operator ID are required' },
        { status: 400 }
      );
    }

    // Find the OTP verification record
    const otpRef = collection(db, 'otpVerifications');
    const q = query(
      otpRef, 
      where('entryId', '==', entryId),
      where('purpose', '==', 'delivery'),
      where('isVerified', '==', false)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: 'No active OTP found for this entry' },
        { status: 404 }
      );
    }

    const otpDoc = querySnapshot.docs[0];
    const otpData = otpDoc.data();

    // Check if OTP is expired
    const otpExpiry = new Date(otpData.otpExpiry);
    const now = new Date();
    
    if (now > otpExpiry) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if maximum attempts reached
    if (otpData.attempts >= otpData.maxAttempts) {
      return NextResponse.json(
        { error: 'Maximum attempts reached. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      // Update attempt count
      await updateDoc(doc(db, 'otpVerifications', otpDoc.id), {
        attempts: otpData.attempts + 1,
        lastAttemptAt: serverTimestamp()
      });

      const remainingAttempts = otpData.maxAttempts - otpData.attempts - 1;
      return NextResponse.json(
        { 
          error: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
          attemptsUsed: otpData.attempts + 1,
          maxAttempts: otpData.maxAttempts
        },
        { status: 400 }
      );
    }

    // OTP is valid - mark as verified
    await updateDoc(doc(db, 'otpVerifications', otpDoc.id), {
      isVerified: true,
      verifiedAt: serverTimestamp(),
      verifiedBy: operatorId,
      attempts: otpData.attempts + 1
    });

    // Log the successful verification
    await addDoc(collection(db, 'deliveryLogs'), {
      entryId,
      operatorId,
      action: 'otp_verified',
      timestamp: serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      verifiedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error verifying delivery OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}