import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, limit } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      totalRows,
      successful,
      failed,
      duplicateRows,
      lockerConflicts,
      importedBy,
      timestamp
    } = body;

    // Create import log entry
    const logDoc = await addDoc(collection(db, 'importLogs'), {
      totalRows,
      successful,
      failed,
      duplicateRows,
      lockerConflicts,
      importedBy,
      timestamp: timestamp || serverTimestamp(),
      createdAt: serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      logId: logDoc.id
    });
  } catch (error: any) {
    console.error('Error logging import:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to log import' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get recent import logs
    const q = query(
      collection(db, 'importLogs'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const querySnapshot = await getDocs(q);
    const logs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      logs
    });
  } catch (error: any) {
    console.error('Error fetching import logs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch import logs' },
      { status: 500 }
    );
  }
}
