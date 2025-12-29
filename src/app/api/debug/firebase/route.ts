import { NextRequest, NextResponse } from 'next/server';
import { firestoreService } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug API: Testing Firebase connection...');
    
    // Test fetching orders from Firestore
    const orders = await firestoreService.getAll('orders');
    console.log('Debug API: Found', orders.length, 'orders');
    
    // Test fetching one order details
    if (orders.length > 0) {
      console.log('Debug API: First order sample:', {
        id: orders[0].id,
        orderNumber: orders[0].orderNumber,
        userId: orders[0].userId,
        status: orders[0].status,
        customerInfo: orders[0].customerInfo ? 'exists' : 'missing',
        items: orders[0].items ? orders[0].items.length + ' items' : 'missing'
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Firebase connection successful',
      ordersCount: orders.length,
      sampleOrder: orders.length > 0 ? {
        id: orders[0].id,
        orderNumber: orders[0].orderNumber,
        userId: orders[0].userId,
        status: orders[0].status,
        total: orders[0].total,
        orderDate: orders[0].orderDate
      } : null
    });
  } catch (error) {
    console.error('Debug API: Error testing Firebase:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Firebase connection failed',
        details: (error as any).message 
      },
      { status: 500 }
    );
  }
}