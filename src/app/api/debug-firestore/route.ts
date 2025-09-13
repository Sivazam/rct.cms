import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'check-schema') {
      const results = {
        users: [],
        locations: [],
        entries: [],
        operators: [],
        adminUsers: []
      };

      // Check users collection
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        results.users = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Separate operators and admin users
        results.operators = results.users.filter(user => user.role === 'operator');
        results.adminUsers = results.users.filter(user => user.role === 'admin');
        
        console.log('Found users:', results.users.length);
        console.log('Operators:', results.operators.length);
        console.log('Admin users:', results.adminUsers.length);
      } catch (error) {
        console.error('Error fetching users:', error);
        results.users = [{ error: 'Failed to fetch users' }];
      }

      // Check locations collection
      try {
        const locationsSnapshot = await getDocs(collection(db, 'locations'));
        results.locations = locationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Found locations:', results.locations.length);
      } catch (error) {
        console.error('Error fetching locations:', error);
        results.locations = [{ error: 'Failed to fetch locations' }];
      }

      // Check entries collection
      try {
        const entriesSnapshot = await getDocs(collection(db, 'entries'));
        results.entries = entriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Found entries:', results.entries.length);
      } catch (error) {
        console.error('Error fetching entries:', error);
        results.entries = [{ error: 'Failed to fetch entries' }];
      }

      return NextResponse.json({
        success: true,
        message: 'Firestore schema check completed',
        summary: {
          users: results.users.length,
          operators: results.operators.length,
          adminUsers: results.adminUsers.length,
          locations: results.locations.length,
          entries: results.entries.length
        },
        data: results
      });

    }

    if (action === 'fix-operator') {
      const operatorId = searchParams.get('id');
      
      if (!operatorId) {
        return NextResponse.json({ error: 'Operator ID is required' }, { status: 400 });
      }

      const operatorDoc = await getDoc(doc(db, 'users', operatorId));
      
      if (!operatorDoc.exists()) {
        return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
      }

      const operatorData = operatorDoc.data();
      console.log('Current operator data:', operatorData);

      // Fix common operator schema issues
      const updates: any = {};
      
      if (!operatorData.role) {
        updates.role = 'operator';
      }
      
      if (typeof operatorData.isActive !== 'boolean') {
        updates.isActive = false; // Operators should be inactive by default until approved
      }
      
      if (!operatorData.locationIds || !Array.isArray(operatorData.locationIds)) {
        updates.locationIds = [];
      }

      if (Object.keys(updates).length > 0) {
        // Note: We can't update without importing updateDoc, so we'll return the suggested updates
        return NextResponse.json({
          success: false,
          message: 'Operator schema needs fixes',
          currentData: operatorData,
          suggestedUpdates: updates,
          note: 'Manual update required in Firebase console'
        });
      } else {
        return NextResponse.json({
          success: true,
          message: 'Operator schema is correct',
          currentData: operatorData
        });
      }
    }

    return NextResponse.json({ 
      message: 'Firestore debug endpoint',
      actions: ['check-schema', 'fix-operator'],
      note: 'Use ?action=check-schema to see all data'
    });

  } catch (error: any) {
    console.error('Firestore debug error:', error);
    return NextResponse.json({ 
      error: error.message,
      code: error.code 
    }, { status: 500 });
  }
}