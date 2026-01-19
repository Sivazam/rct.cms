import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { batchId } = body;

    if (!batchId) {
      return NextResponse.json(
        { success: false, error: 'Batch ID is required for rollback' },
        { status: 400 }
      );
    }

    // Find all entries with the given batchId
    const q = query(
      collection(db, 'entries'),
      where('importBatchId', '==', batchId)
    );

    const querySnapshot = await getDocs(q);
    const entries = querySnapshot.docs;

    if (entries.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No entries found for this batch' },
        { status: 404 }
      );
    }

    let deletedCount = 0;
    let failedCount = 0;

    // Delete all entries in the batch
    for (const entryDoc of entries) {
      try {
        await deleteDoc(doc(db, 'entries', entryDoc.id));
        deletedCount++;
      } catch (error) {
        console.error('Error deleting entry:', error);
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      failedCount,
      message: `Successfully rolled back ${deletedCount} entries${failedCount > 0 ? ` (failed: ${failedCount})` : ''}`
    });
  } catch (error: any) {
    console.error('Rollback error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to rollback entries' },
      { status: 500 }
    );
  }
}
