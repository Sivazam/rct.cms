import { NextRequest, NextResponse } from 'next/server';
import { orderService } from '@/lib/services/orderService';
import { firestoreService } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    console.log('Dashboard API: Fetching statistics...');

    // Fetch order statistics
    let allOrders;
    try {
      allOrders = await orderService.getAllOrders();
      console.log('Orders fetched successfully, count:', allOrders.length);
    } catch (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch orders: ' + (error as any).message
        },
        { status: 500 }
      );
    }

    // Fetch product statistics directly from Firestore to avoid ProductService issues
    let allProducts;
    try {
      allProducts = await firestoreService.getAll('products', {
        orderBy: { field: 'createdAt', direction: 'desc' }
      });
      console.log('Products fetched successfully, count:', allProducts.length);
    } catch (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch products: ' + (error as any).message
        },
        { status: 500 }
      );
    }

    // Fetch customer statistics
    let allUsers;
    try {
      allUsers = await firestoreService.getAll('users');
      console.log('Users fetched successfully, count:', allUsers.length);
    } catch (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch users: ' + (error as any).message
        },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalOrders = allOrders.length;
    const pendingOrders = allOrders.filter(order => order.status === 'pending').length;
    const completedOrders = allOrders.filter(order => order.status === 'delivered' || order.paymentStatus === 'completed').length;
    const totalRevenue = allOrders
      .filter(order => order.paymentStatus === 'completed')
      .reduce((sum, order) => sum + order.total, 0);

    const totalProducts = allProducts.length;
    const totalCustomers = allUsers.length;

    console.log('Dashboard API: Statistics calculated:', {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      totalProducts,
      totalCustomers
    });

    return NextResponse.json({
      success: true,
      statistics: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue,
        totalProducts,
        totalCustomers
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard statistics: ' + (error as any).message
      },
      { status: 500 }
    );
  }
}
