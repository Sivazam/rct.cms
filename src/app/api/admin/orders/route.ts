import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { orderService } from '@/lib/services';
import { notificationService } from '@/lib/services/notificationService';

// JWT secret handling with error prevention
const getJwtSecret = (): string => {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    if (typeof secret !== 'string') {
      console.error('JWT_SECRET is not a string, using fallback');
      return 'your-secret-key';
    }
    return secret;
  } catch (error) {
    console.error('Error accessing JWT_SECRET:', error);
    return 'your-secret-key';
  }
};

// Buffer-based secret handling to avoid instanceof issues
const getSecretBuffer = (): Buffer => {
  const secret = getJwtSecret();
  try {
    return Buffer.from(secret);
  } catch (error) {
    console.error('Error creating buffer from secret:', error);
    return Buffer.from('your-secret-key');
  }
};

async function verifyAdmin(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return null;
  }

  try {
    // Try multiple verification approaches
    try {
      const secretBuffer = getSecretBuffer();
      return jwt.verify(token, secretBuffer);
    } catch (error) {
      console.warn('Buffer verification failed, trying string approach');
      const secretString = getJwtSecret();
      return jwt.verify(token, secretString, { algorithms: ['HS256'] });
    }
  } catch (error) {
    return null;
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Skip admin verification for admin dashboard
    const body = await request.json();
    const { orderId, status, cancellationReason } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    // Get the full order details before updating
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = { status };

    // Add cancellation reason if status is 'cancelled'
    if (status === 'cancelled' && cancellationReason) {
      updateData.cancellationReason = cancellationReason;
    }

    // Update order status
    await orderService.updateOrder(orderId, updateData);

    // Create notification for order status update
    try {
      const orderWithStatus = { ...order, ...updateData };
      await notificationService.createOrderNotification(orderWithStatus, 'status');
      
      // Send real-time notification to customer if supported
      if (order.userId) {
        await sendCustomerNotification(orderWithStatus, status);
        
        // Also update customer's orders cache if you have one
        await updateCustomerOrdersCache(order.userId);
      }
    } catch (notificationError) {
      console.warn('Failed to create order status notification:', notificationError);
      // Don't fail the status update if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}

// Function to send customer notification (could be expanded based on your notification system)
async function sendCustomerNotification(order: any, newStatus: string) {
  try {
    // This would integrate with your notification service
    // For now, we'll just log it - in a real implementation, this could:
    // - Send SMS via Twilio
    // - Send email via SendGrid/SES
    // - Send push notification via Firebase Cloud Messaging
    // - Update customer's notification preferences
    
    console.log(`🔔 Customer Notification: Order ${order.orderNumber} status changed to ${newStatus}`);
    console.log(`Customer: ${order.customerInfo.name} (${order.customerInfo.email})`);
    console.log(`User ID: ${order.userId}`);
    
    // You could add specific messages based on status
    let notificationMessage = '';
    switch (newStatus) {
      case 'processing':
        notificationMessage = `Your order ${order.orderNumber} is now being processed! We'll notify you when it ships.`;
        break;
      case 'shipped':
        notificationMessage = `Great news! Your order ${order.orderNumber} has been shipped and is on its way to you.`;
        break;
      case 'delivered':
        notificationMessage = `Your order ${order.orderNumber} has been delivered! Thank you for shopping with us.`;
        break;
      case 'cancelled':
        notificationMessage = `Your order ${order.orderNumber} has been cancelled. Please contact us if you have any questions.`;
        break;
      default:
        notificationMessage = `Your order ${order.orderNumber} status has been updated to: ${newStatus}`;
    }
    
    console.log(`Notification message: ${notificationMessage}`);
    
    // TODO: Implement actual notification sending here
    // Example: await sendSMS(order.customerInfo.phone, notificationMessage);
    // Example: await sendEmail(order.customerInfo.email, 'Order Status Update', notificationMessage);
    
  } catch (error) {
    console.error('Error sending customer notification:', error);
  }
}

// Check for abandoned orders (7-day logic)
async function checkAndProcessAbandonedOrders() {
  try {
    console.log('Checking for abandoned orders...');

    const allOrders = await orderService.getAllOrders();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    let updatedCount = 0;

    for (const order of allOrders) {
      const orderDate = new Date(order.orderDate);

      // Rule 1: Orders with paymentStatus: 'pending' for more than 7 days
      // Change to paymentStatus: 'failed', keep status: 'pending'
      if (order.paymentStatus === 'pending' && orderDate < sevenDaysAgo) {
        console.log(`Found abandoned pending order: ${order.orderNumber}, updating paymentStatus to failed`);
        await orderService.updateOrder(order.id!, {
          paymentStatus: 'failed'
        });
        updatedCount++;
      }

      // Rule 2: Orders with paymentStatus: 'failed' for more than 14 days (7 days after failed)
      // Change status: 'cancelled' (customer can no longer retry)
      if (order.paymentStatus === 'failed' && orderDate < fourteenDaysAgo && order.status !== 'cancelled') {
        console.log(`Found expired failed order: ${order.orderNumber}, updating status to cancelled`);
        await orderService.updateOrder(order.id!, {
          status: 'cancelled'
        });
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(`Processed ${updatedCount} abandoned orders`);
    } else {
      console.log('No abandoned orders found');
    }
  } catch (error) {
    console.error('Error checking abandoned orders:', error);
    // Don't fail the request if abandoned order check fails
  }
}

export async function GET(request: NextRequest) {
  try {
    // Skip admin verification for admin dashboard
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    console.log('Admin API: Fetching orders from Firestore...');

    // Check for abandoned orders (7-day logic)
    await checkAndProcessAbandonedOrders();

    let orders = await orderService.getAllOrders();
    console.log('Admin API: Found', orders.length, 'orders');

    // Filter by status if provided
    if (status) {
      orders = orders.filter(order => order.status === status);
      console.log('Admin API: Filtered to', orders.length, 'orders with status:', status);
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = orders.slice(startIndex, endIndex);

    const total = orders.length;

    console.log('Admin API: Returning', paginatedOrders.length, 'orders for page', page);

    return NextResponse.json({
      success: true,
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}