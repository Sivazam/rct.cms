import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST() {
  try {
    console.log('Creating test entry...');
    
    // Create a test entry
    const entryData = {
      customerName: 'Test Customer',
      customerMobile: '+919876543210',
      customerCity: 'Test City',
      numberOfPots: 1,
      locationId: 'test-location',
      operatorId: 'test-operator',
      paymentMethod: 'cash',
      entryDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'active',
      payments: [{
        amount: 500,
        date: new Date(),
        type: 'entry',
        method: 'cash',
        months: 1
      }],
      renewals: [],
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'entries'), entryData);
    
    console.log('Test entry created with ID:', docRef.id);
    
    return NextResponse.json({
      success: true,
      message: 'Test entry created successfully',
      entryId: docRef.id,
      entryData: {
        ...entryData,
        id: docRef.id
      }
    });
    
  } catch (error) {
    console.error('Error creating test entry:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}