import { NextRequest, NextResponse } from 'next/server';
import { getSystemStats } from '@/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing system stats API');
    
    const stats = await getSystemStats();
    
    return NextResponse.json({
      success: true,
      stats: {
        totalEntries: stats.totalEntries,
        totalRenewals: stats.totalRenewals,
        totalDeliveries: stats.totalDeliveries,
        currentActive: stats.currentActive,
        expiringIn7Days: stats.expiringIn7Days,
        monthlyRevenue: stats.monthlyRevenue,
        renewalCollections: stats.renewalCollections,
        deliveryCollections: stats.deliveryCollections
      }
    });
  } catch (error) {
    console.error('🧪 Error in test-system-stats API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}