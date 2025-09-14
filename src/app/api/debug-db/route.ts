import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET() {
  try {
    console.log('Debug: Checking database entries...');
    
    // Check if Firebase is properly initialized
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    
    // Check entries collection
    const entriesRef = collection(db, 'entries');
    const entriesSnapshot = await getDocs(entriesRef);
    
    const entries = entriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('Entries found:', entries.length);
    
    // Check customers collection
    const customersRef = collection(db, 'customers');
    const customersSnapshot = await getDocs(customersRef);
    
    const customers = customersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('Customers found:', customers.length);
    
    // Check locations collection
    const locationsRef = collection(db, 'locations');
    const locationsSnapshot = await getDocs(locationsRef);
    
    const locations = locationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('Locations found:', locations.length);
    
    // Check users collection
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('Users found:', users.length);
    
    return NextResponse.json({
      success: true,
      counts: {
        entries: entries.length,
        customers: customers.length,
        locations: locations.length,
        users: users.length
      },
      sampleData: {
        entries: entries.slice(0, 3), // Show first 3 entries
        customers: customers.slice(0, 3), // Show first 3 customers
        locations: locations.slice(0, 3), // Show first 3 locations
        users: users.slice(0, 3) // Show first 3 users
      }
    });
    
  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    
    // Check if it's a Firebase initialization error
    if (error.code === 'auth/invalid-api-key') {
      return NextResponse.json({
        success: false,
        error: 'Firebase API key not configured. Please check environment variables.',
        code: error.code
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}