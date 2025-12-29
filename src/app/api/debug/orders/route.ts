import { NextRequest, NextResponse } from 'next/server';
import { orderService, userService } from '@/lib/services';

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

    console.log('Debug: Checking orders for phone number:', phoneNumber);

    // Get user
    const user = await userService.getUserByPhoneNumber(phoneNumber);
    console.log('Debug: User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('Debug: User details:', {
        id: user.id,
        phoneNumber: user.phoneNumber,
        orderIds: user.orderIds,
        addressesCount: user.addresses?.length || 0
      });
    }

    // Get orders by user ID
    let ordersByUserId = [];
    try {
      ordersByUserId = await orderService.getOrdersByUserId(phoneNumber);
      console.log('Debug: Orders by userId:', ordersByUserId.length);
    } catch (error) {
      console.error('Debug: Error getting orders by userId:', error);
    }

    // Get all orders (for comparison)
    let allOrders = [];
    try {
      allOrders = await orderService.getAllOrders();
      console.log('Debug: All orders count:', allOrders.length);
      
      // Find orders that might belong to this user
      const userOrders = allOrders.filter(order => order.userId === phoneNumber);
      console.log('Debug: User orders from all orders:', userOrders.length);
      
      if (userOrders.length > 0) {
        console.log('Debug: Sample user order:', {
          id: userOrders[0].id,
          orderNumber: userOrders[0].orderNumber,
          userId: userOrders[0].userId,
          status: userOrders[0].status
        });
      }
    } catch (error) {
      console.error('Debug: Error getting all orders:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        user: user ? {
          id: user.id,
          phoneNumber: user.phoneNumber,
          name: user.name,
          orderIds: user.orderIds,
          addressesCount: user.addresses?.length || 0
        } : null,
        ordersByUserId: ordersByUserId.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          userId: order.userId,
          status: order.status,
          total: order.total,
          orderDate: order.orderDate
        })),
        allOrdersCount: allOrders.length,
        userOrdersFromAll: allOrders.filter(order => order.userId === phoneNumber).length
      }
    });
  } catch (error) {
    console.error('Debug: Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      details: (error as Error).message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, testOrderData } = body;

    if (!phoneNumber) {
      return NextResponse.json({
        success: false,
        error: 'Phone number is required'
      }, { status: 400 });
    }

    console.log('Debug: Creating test order for phone number:', phoneNumber);

    // Create a test order
    const testOrder = {
      userId: phoneNumber,
      customerInfo: {
        name: 'Test User',
        phone: phoneNumber,
        email: 'test@example.com',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      items: [{
        name: 'Test Product',
        quantity: 1,
        price: 100,
        discount: 0,
        totalPrice: 100
      }],
      subtotal: 100,
      shippingCost: 0,
      total: 100,
      razorpayOrderId: 'test_order_' + Date.now(),
      status: 'paid' as const,
      paymentStatus: 'completed' as const,
      orderDate: new Date()
    };

    const orderId = await orderService.createOrder(testOrder);
    console.log('Debug: Test order created with ID:', orderId);

    // Associate order with user
    try {
      await userService.addOrderToUser(phoneNumber, orderId);
      console.log('Debug: Order associated with user');
    } catch (error) {
      console.error('Debug: Error associating order with user:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        message: 'Test order created successfully'
      }
    });
  } catch (error) {
    console.error('Debug: Error creating test order:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create test order',
      details: (error as Error).message
    }, { status: 500 });
  }
}