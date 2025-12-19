import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedDispatchRecords } from '@/lib/unified-dispatch-service';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing unified dispatch service API');
    
    const records = await getUnifiedDispatchRecords();
    
    return NextResponse.json({
      success: true,
      totalCount: records.length,
      data: records.map(record => ({
        id: record.id,
        entryId: record.entryId,
        sourceCollection: record.sourceCollection,
        customerName: record.customerInfo.name,
        customerMobile: record.customerInfo.mobile,
        locationName: record.locationInfo.name,
        dispatchReason: record.dispatchInfo.dispatchReason,
        dispatchDate: record.dispatchInfo.dispatchDate,
        potsDispatched: record.dispatchInfo.potsDispatched,
        paymentAmount: record.dispatchInfo.paymentAmount,
        paymentType: record.dispatchInfo.paymentType,
        dueAmount: record.dispatchInfo.dueAmount
      }))
    });
  } catch (error) {
    console.error('🧪 Error in test-unified-dispatch API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}