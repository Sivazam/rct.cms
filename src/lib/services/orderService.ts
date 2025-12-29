import { firestoreService } from '@/lib/firebase';
import { wishlistService } from './wishlistService';
import { notificationService } from './notificationService';

export interface IOrderItem {
  productId?: string;
  variantId?: string;
  name: string;
  quantity: number;
  price: number;
  discount: number;
  totalPrice: number;
  image?: string;
}

export interface ICustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface IOrder {
  id?: string;
  userId: string;
  customerInfo: ICustomerInfo;
  items: IOrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  orderNumber?: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: 'pending' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  orderDate: Date;
  paidAt?: Date;
  cancellationReason?: string;
  createdAt?: any;
  updatedAt?: any;
}

class OrderService {
  private collection = 'orders';

  // Create a new order
  async createOrder(orderData: Omit<IOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('OrderService: Creating order with data:', { 
        userId: orderData.userId, 
        itemCount: orderData.items.length,
        total: orderData.total 
      });
      
      // Generate order number
      const orderNumber = `RUD${Date.now().toString().slice(-8)}`;
      
      const orderToCreate = {
        ...orderData,
        orderNumber,
        orderDate: new Date().toISOString()
      };

      console.log('OrderService: Creating document in Firestore...');
      console.log('OrderService: Order data to create:', JSON.stringify(orderToCreate, null, 2));
      
      const orderId = await firestoreService.create(this.collection, orderToCreate);
      console.log('OrderService: Order created successfully with ID:', orderId);
      console.log('OrderService: Order should be associated with userId:', orderData.userId);
      
      // Create notification for new order
      try {
        const orderWithId = { ...orderData, id: orderId };
        await notificationService.createOrderNotification(orderWithId, 'new');
      } catch (notificationError) {
        console.warn('OrderService: Failed to create notification:', notificationError);
        // Don't fail the order creation if notification fails
      }
      
      return orderId;
    } catch (error) {
      console.error('OrderService: Error creating order:', error);
      console.error('OrderService: Error details:', {
        name: (error as any).name,
        message: (error as any).message,
        stack: (error as any).stack,
        code: (error as any).code
      });
      throw new Error(`Failed to create order: ${(error as any).message || 'Unknown error'}`);
    }
  }

  // Get order by ID
  async getOrderById(id: string): Promise<IOrder | null> {
    try {
      return await firestoreService.getById(this.collection, id);
    } catch (error) {
      console.error('Error getting order:', error);
      throw error;
    }
  }

  // Get order by Razorpay order ID
  async getOrderByRazorpayOrderId(razorpayOrderId: string): Promise<IOrder | null> {
    try {
      const orders = await firestoreService.getAll(this.collection, {
        where: { field: 'razorpayOrderId', operator: '==', value: razorpayOrderId }
      });
      return orders.length > 0 ? orders[0] : null;
    } catch (error) {
      console.error('Error getting order by Razorpay ID:', error);
      throw error;
    }
  }

  // Get orders by user ID
  async getOrdersByUserId(userId: string): Promise<IOrder[]> {
    try {
      console.log('OrderService: Getting orders for userId:', userId);
      console.log('OrderService: Query parameters:', {
        collection: this.collection,
        where: { field: 'userId', operator: '==', value: userId },
        orderBy: { field: 'orderDate', direction: 'desc' }
      });
      
      let orders: IOrder[] = [];
      
      // Try to query with orderBy first (more efficient)
      try {
        orders = await firestoreService.getAll(this.collection, {
          where: { field: 'userId', operator: '==', value: userId },
          orderBy: { field: 'orderDate', direction: 'desc' }
        });
        console.log('OrderService: Found', orders.length, 'orders with orderBy');
      } catch (orderByError) {
        console.warn('OrderService: Query with orderBy failed, trying without orderBy:', orderByError);
        
        // Fallback: query without orderBy and sort manually
        try {
          orders = await firestoreService.getAll(this.collection, {
            where: { field: 'userId', operator: '==', value: userId }
          });
          console.log('OrderService: Found', orders.length, 'orders without orderBy');
          
          // Sort manually by orderDate (newest first)
          orders.sort((a, b) => {
            const dateA = new Date(a.orderDate).getTime();
            const dateB = new Date(b.orderDate).getTime();
            return dateB - dateA;
          });
          console.log('OrderService: Orders sorted manually');
        } catch (whereOnlyError) {
          console.error('OrderService: Even where-only query failed:', whereOnlyError);
          throw whereOnlyError;
        }
      }
      
      console.log('OrderService: Final orders count:', orders.length);
      if (orders.length > 0) {
        console.log('OrderService: First order sample:', {
          id: orders[0].id,
          orderNumber: orders[0].orderNumber,
          userId: orders[0].userId,
          status: orders[0].status
        });
      }
      return orders;
    } catch (error) {
      console.error('OrderService: Error getting user orders:', error);
      console.error('OrderService: Error details:', {
        name: (error as any).name,
        message: (error as any).message,
        stack: (error as any).stack,
        code: (error as any).code
      });
      throw error;
    }
  }

  // Get all orders (for admin)
  async getAllOrders(): Promise<IOrder[]> {
    try {
      return await firestoreService.getAll(this.collection, {
        orderBy: { field: 'orderDate', direction: 'desc' }
      });
    } catch (error) {
      console.error('Error getting all orders:', error);
      throw error;
    }
  }

  // Update order
  async updateOrder(id: string, updateData: Partial<IOrder>): Promise<void> {
    try {
      await firestoreService.update(this.collection, id, updateData);
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  // Update payment status
  async updatePaymentStatus(
    razorpayOrderId: string, 
    paymentData: {
      razorpayPaymentId: string;
      razorpaySignature: string;
      status: 'paid' | 'failed';
    }
  ): Promise<void> {
    try {
      const order = await this.getOrderByRazorpayOrderId(razorpayOrderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const updateData: Partial<IOrder> = {
        razorpayPaymentId: paymentData.razorpayPaymentId,
        razorpaySignature: paymentData.razorpaySignature,
        // Don't change 'status' field - only admin can change it for fulfillment
        // Only update paymentStatus based on payment result
        paymentStatus: paymentData.status === 'paid' ? 'completed' : 'failed',
        paidAt: paymentData.status === 'paid' ? new Date().toISOString() : undefined
      };

      await this.updateOrder(order.id!, updateData);

      // Create notification for payment status update
      try {
        const orderWithStatus = { ...order, ...updateData };
        await notificationService.createOrderNotification(orderWithStatus, 'payment');
      } catch (notificationError) {
        console.warn('OrderService: Failed to create payment notification:', notificationError);
        // Don't fail the payment update if notification fails
      }

      // If payment is completed, remove items from wishlist
      if (paymentData.status === 'paid') {
        console.log('Payment completed, removing items from wishlist...');
        await this.removeWishlistItemsOnOrderCompletion(order.items);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  // Delete order
  async deleteOrder(id: string): Promise<void> {
    try {
      await firestoreService.delete(this.collection, id);
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }

  // Remove items from wishlist when order is completed
  private async removeWishlistItemsOnOrderCompletion(orderItems: IOrderItem[]): Promise<void> {
    try {
      // Extract product IDs from order items
      const productIds = orderItems
        .filter(item => item.productId) // Only items with productId
        .map(item => item.productId!);

      if (productIds.length === 0) {
        return; // No products to remove from wishlist
      }

      console.log('Removing items from wishlist for completed order:', productIds);
      
      // Remove each product from wishlist
      for (const productId of productIds) {
        try {
          await wishlistService.removeFromWishlistByProductId(productId);
          console.log(`Removed product ${productId} from wishlist`);
        } catch (error) {
          console.warn(`Failed to remove product ${productId} from wishlist:`, error);
          // Continue with other products even if one fails
        }
      }
      
      console.log('Wishlist cleanup completed for order');
    } catch (error) {
      console.error('Error removing items from wishlist on order completion:', error);
      // Don't throw the error as this is a secondary operation
      // Order completion should not fail due to wishlist cleanup issues
    }
  }

  // Get order statistics
  async getOrderStats(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    paidOrders: number;
  }> {
    try {
      const orders = await this.getAllOrders();
      
      return {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
        pendingOrders: orders.filter(order => order.status === 'pending').length,
        paidOrders: orders.filter(order => order.paymentStatus === 'completed').length
      };
    } catch (error) {
      console.error('Error getting order stats:', error);
      throw error;
    }
  }
}

export const orderService = new OrderService();
export default orderService;