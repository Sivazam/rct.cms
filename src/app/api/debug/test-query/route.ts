import { NextRequest, NextResponse } from 'next/server';
import { firestoreService } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber');
    
    if (!phoneNumber) {
      return NextResponse.json({
        success: false,
        error: 'Phone number is required'
      }, { status: 400 });
    }

    console.log('Debug: Testing different query approaches for phone:', phoneNumber);

    const results: any = {};

    // Test 1: Query with where and orderBy (current approach)
    try {
      const ordersWithOrderBy = await firestoreService.getAll('orders', {
        where: { field: 'userId', operator: '==', value: phoneNumber },
        orderBy: { field: 'orderDate', direction: 'desc' }
      });
      results.withOrderBy = {
        success: true,
        count: ordersWithOrderBy.length,
        orders: ordersWithOrderBy.map(o => ({ id: o.id, userId: o.userId }))
      };
    } catch (error) {
      results.withOrderBy = {
        success: false,
        error: (error as Error).message
      };
    }

    // Test 2: Query with where only (no orderBy)
    try {
      const ordersWhereOnly = await firestoreService.getAll('orders', {
        where: { field: 'userId', operator: '==', value: phoneNumber }
      });
      results.whereOnly = {
        success: true,
        count: ordersWhereOnly.length,
        orders: ordersWhereOnly.map(o => ({ id: o.id, userId: o.userId }))
      };
    } catch (error) {
      results.whereOnly = {
        success: false,
        error: (error as Error).message
      };
    }

    // Test 3: Get all orders and filter manually
    try {
      const allOrders = await firestoreService.getAll('orders');
      const filteredOrders = allOrders.filter(order => order.userId === phoneNumber);
      results.manualFilter = {
        success: true,
        totalCount: allOrders.length,
        filteredCount: filteredOrders.length,
        orders: filteredOrders.map(o => ({ id: o.id, userId: o.userId }))
      };
    } catch (error) {
      results.manualFilter = {
        success: false,
        error: (error as Error).message
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        phoneNumber,
        results
      }
    });
  } catch (error) {
    console.error('Debug: Error in test query:', error);
    return NextResponse.json({
      success: false,
      error: 'Test query failed',
      details: (error as Error).message
    }, { status: 500 });
  }
}