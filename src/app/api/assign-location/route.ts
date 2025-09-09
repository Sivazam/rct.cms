import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { operatorId, locationId, action } = await request.json();

    if (!operatorId || !locationId || !action) {
      return NextResponse.json({ 
        error: 'Missing required parameters: operatorId, locationId, action' 
      }, { status: 400 });
    }

    // Get the operator document
    const operatorDoc = await getDoc(doc(db, 'users', operatorId));
    if (!operatorDoc.exists()) {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
    }

    const operatorData = operatorDoc.data();
    const currentLocationIds = operatorData.locationIds || [];

    let newLocationIds;
    
    if (action === 'assign') {
      // Add location if not already assigned
      if (!currentLocationIds.includes(locationId)) {
        newLocationIds = [...currentLocationIds, locationId];
      } else {
        newLocationIds = currentLocationIds; // Already assigned
      }
    } else if (action === 'remove') {
      // Remove location
      newLocationIds = currentLocationIds.filter((id: string) => id !== locationId);
    } else {
      return NextResponse.json({ 
        error: 'Invalid action. Use "assign" or "remove"' 
      }, { status: 400 });
    }

    // Update the operator document
    await updateDoc(doc(db, 'users', operatorId), {
      locationIds: newLocationIds
    });

    return NextResponse.json({
      success: true,
      message: `Location ${action}ed successfully`,
      operatorId,
      locationId,
      previousLocationIds: currentLocationIds,
      newLocationIds: newLocationIds
    });

  } catch (error: any) {
    console.error('Error assigning location:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operatorId = searchParams.get('operatorId');

    if (!operatorId) {
      return NextResponse.json({ 
        error: 'Operator ID is required' 
      }, { status: 400 });
    }

    const operatorDoc = await getDoc(doc(db, 'users', operatorId));
    if (!operatorDoc.exists()) {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
    }

    const operatorData = operatorDoc.data();

    return NextResponse.json({
      success: true,
      operator: {
        id: operatorId,
        ...operatorData
      }
    });

  } catch (error: any) {
    console.error('Error getting operator:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}