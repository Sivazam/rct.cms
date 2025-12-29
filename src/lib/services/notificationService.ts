import { firestoreService } from '@/lib/firebase';

export interface INotification {
  id?: string;
  userId?: string;
  title: string;
  message: string;
  type: 'order' | 'product' | 'system' | 'promotion';
  isRead: boolean;
  createdAt?: any;
  updatedAt?: any;
  data?: any; // Additional data related to the notification
}

class NotificationService {
  private collection = 'notifications';

  // Create a new notification
  async createNotification(notificationData: Omit<INotification, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('NotificationService: Creating notification:', notificationData.title);
      
      const notificationToCreate = {
        ...notificationData,
        isRead: false,
        createdAt: new Date().toISOString()
      };

      const notificationId = await firestoreService.create(this.collection, notificationToCreate);
      console.log('NotificationService: Notification created with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('NotificationService: Error creating notification:', error);
      throw new Error(`Failed to create notification: ${(error as any).message || 'Unknown error'}`);
    }
  }

  // Get notifications for a user
  async getUserNotifications(userId: string, limit = 50): Promise<INotification[]> {
    try {
      const notifications = await firestoreService.getAll(this.collection, {
        where: { field: 'userId', operator: '==', value: userId },
        orderBy: { field: 'createdAt', direction: 'desc' },
        limit
      });
      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Get all notifications (for admin)
  async getAllNotifications(limit = 100): Promise<INotification[]> {
    try {
      const notifications = await firestoreService.getAll(this.collection, {
        orderBy: { field: 'createdAt', direction: 'desc' },
        limit
      });
      return notifications;
    } catch (error) {
      console.error('Error getting all notifications:', error);
      throw error;
    }
  }

  // Get unread notifications count
  async getUnreadCount(userId?: string): Promise<number> {
    try {
      let notifications: INotification[];
      
      if (userId) {
        notifications = await firestoreService.getAll(this.collection, {
          where: { field: 'userId', operator: '==', value: userId }
        });
      } else {
        notifications = await firestoreService.getAll(this.collection);
      }
      
      return notifications.filter(n => !n.isRead).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await firestoreService.update(this.collection, notificationId, {
        isRead: true,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId?: string): Promise<void> {
    try {
      let notifications: INotification[];
      
      if (userId) {
        notifications = await firestoreService.getAll(this.collection, {
          where: { field: 'userId', operator: '==', value: userId }
        });
      } else {
        notifications = await firestoreService.getAll(this.collection);
      }
      
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      await Promise.all(
        unreadNotifications.map(notification =>
          firestoreService.update(this.collection, notification.id!, {
            isRead: true,
            updatedAt: new Date().toISOString()
          })
        )
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await firestoreService.delete(this.collection, notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Create order notification
  async createOrderNotification(orderData: any, type: 'new' | 'status' | 'payment'): Promise<string> {
    let title: string;
    let message: string;
    
    switch (type) {
      case 'new':
        title = 'New Order Received';
        message = `Order #${orderData.orderNumber} received from ${orderData.customerInfo.name}`;
        break;
      case 'status':
        title = 'Order Status Updated';
        message = `Order #${orderData.orderNumber} status changed to ${orderData.status}`;
        break;
      case 'payment':
        title = 'Payment Received';
        message = `Payment of ₹${orderData.total} received for order #${orderData.orderNumber}`;
        break;
      default:
        title = 'Order Update';
        message = `Update for order #${orderData.orderNumber}`;
    }
    
    return this.createNotification({
      title,
      message,
      type: 'order',
      isRead: false,
      data: {
        orderId: orderData.id,
        orderNumber: orderData.orderNumber,
        customerId: orderData.userId
      }
    });
  }

  // Create product notification
  async createProductNotification(productData: any, type: 'low_stock' | 'out_of_stock'): Promise<string> {
    let title: string;
    let message: string;
    
    switch (type) {
      case 'low_stock':
        title = 'Low Stock Alert';
        message = `Product "${productData.name}" is running low on stock (${productData.stock} units left)`;
        break;
      case 'out_of_stock':
        title = 'Out of Stock';
        message = `Product "${productData.name}" is now out of stock`;
        break;
      default:
        title = 'Product Update';
        message = `Update for product "${productData.name}"`;
    }
    
    return this.createNotification({
      title,
      message,
      type: 'product',
      isRead: false,
      data: {
        productId: productData.id,
        productName: productData.name
      }
    });
  }

  // Create system notification
  async createSystemNotification(title: string, message: string): Promise<string> {
    return this.createNotification({
      title,
      message,
      type: 'system',
      isRead: false
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;