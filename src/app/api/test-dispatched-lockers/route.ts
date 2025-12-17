import { NextRequest, NextResponse } from 'next/server';
import { getDispatchedLockers } from '@/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    
    console.log('🧪 Testing dispatched lockers API with locationId:', locationId);
    
    // Test without location filter first
    const allDispatched = await getDispatchedLockers();
    console.log('🧪 All dispatched items:', allDispatched.length);
    
    // Test with location filter if provided
    let filteredDispatched = allDispatched;
    if (locationId && locationId !== 'all') {
      filteredDispatched = await getDispatchedLockers({ locationId });
      console.log('🧪 Filtered dispatched items:', filteredDispatched.length);
    }
    
    return NextResponse.json({
      success: true,
      totalCount: allDispatched.length,
      filteredCount: filteredDispatched.length,
      locationId: locationId || 'all',
      data: filteredDispatched.map(item => ({
        id: item.id,
        source: item.sourceCollection,
        customerName: item.originalEntryData?.customerName || 'Unknown',
        customerMobile: item.originalEntryData?.customerMobile || 'Unknown',
        locationName: item.originalEntryData?.locationName || 'Unknown',
        locationId: item.originalEntryData?.locationId || item.locationId || 'Unknown',
        dispatchReason: item.dispatchInfo?.dispatchReason || 'Unknown',
        dispatchDate: item.dispatchInfo?.dispatchDate,
        potsDispatched: item.dispatchInfo?.potsDispatched || 0
      }))
    });
  } catch (error) {
    console.error('🧪 Error in test-dispatched-lockers API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}