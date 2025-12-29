import { getUserIdentifier, standardizeUserId } from './userUtils';
import { orderService } from './services';
import { userService } from './services';

/**
 * Test utility to verify the complete order flow with new identification system
 */

export interface TestResult {
  success: boolean;
  message: string;
  details: any;
}

export async function testOrderFlow(): Promise<TestResult> {
  const result: TestResult = {
    success: false,
    message: '',
    details: {}
  };

  try {
    console.log('🧪 Starting order flow test...');

    // Test 1: User Identification Standardization
    console.log('📋 Test 1: User Identification Standardization');
    const testUser = {
      phoneNumber: '+919014882779',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
    };

    const userIdentifier = getUserIdentifier(testUser);
    const standardizedUserId = standardizeUserId(userIdentifier.userId);

    console.log('Test user identifier:', userIdentifier);
    console.log('Standardized user ID:', standardizedUserId);

    result.details.userIdentification = {
      original: testUser,
      identifier: userIdentifier,
      standardized: standardizedUserId,
      isValid: standardizedUserId === testUser.phoneNumber
    };

    if (standardizedUserId !== testUser.phoneNumber) {
      throw new Error('User identification standardization failed');
    }

    console.log('✅ User identification standardization passed');

    // Test 2: Order Creation with Standardized ID
    console.log('📋 Test 2: Order Creation with Standardized ID');
    
    const testOrderData = {
      userId: standardizedUserId,
      customerInfo: {
        name: 'Test User',
        phone: '+919014882779',
        email: 'test@example.com',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      items: [
        {
          name: 'Test Product',
          quantity: 1,
          price: 1000,
          discount: 10,
          totalPrice: 900
        }
      ],
      subtotal: 900,
      shippingCost: 0,
      total: 900,
      razorpayOrderId: 'test_order_123',
      status: 'pending' as const,
      paymentStatus: 'pending' as const,
      orderDate: new Date()
    };

    const testOrderId = await orderService.createOrder(testOrderData);
    console.log('Test order created with ID:', testOrderId);

    result.details.orderCreation = {
      orderId: testOrderId,
      userId: standardizedUserId,
      success: !!testOrderId
    };

    if (!testOrderId) {
      throw new Error('Order creation failed');
    }

    console.log('✅ Order creation with standardized ID passed');

    // Test 3: Order Retrieval by Standardized ID
    console.log('📋 Test 3: Order Retrieval by Standardized ID');
    
    const retrievedOrders = await orderService.getOrdersByUserId(standardizedUserId);
    console.log('Retrieved orders:', retrievedOrders.length);

    result.details.orderRetrieval = {
      userId: standardizedUserId,
      retrievedCount: retrievedOrders.length,
      foundTestOrder: retrievedOrders.some(order => order.id === testOrderId)
    };

    if (retrievedOrders.length === 0) {
      throw new Error('No orders retrieved for user');
    }

    const testOrderFound = retrievedOrders.some(order => order.id === testOrderId);
    if (!testOrderFound) {
      throw new Error('Test order not found in retrieved orders');
    }

    console.log('✅ Order retrieval by standardized ID passed');

    // Test 4: User-Order Association
    console.log('📋 Test 4: User-Order Association');
    
    await userService.addOrderToUser(standardizedUserId, testOrderId);
    console.log('Order associated with user');

    const userWithOrders = await userService.getUserWithOrders(standardizedUserId);
    console.log('User with orders:', userWithOrders ? 'Found' : 'Not found');

    result.details.userOrderAssociation = {
      userId: standardizedUserId,
      userFound: !!userWithOrders,
      ordersCount: userWithOrders?.orders?.length || 0,
      testOrderInUser: userWithOrders?.orders?.some((order: any) => order.id === testOrderId) || false
    };

    if (!userWithOrders || !userWithOrders.orders || userWithOrders.orders.length === 0) {
      throw new Error('User-order association failed');
    }

    const orderInUser = userWithOrders.orders.some((order: any) => order.id === testOrderId);
    if (!orderInUser) {
      throw new Error('Test order not found in user orders');
    }

    console.log('✅ User-order association passed');

    // Cleanup: Remove test order
    try {
      await orderService.deleteOrder(testOrderId);
      console.log('Test order cleaned up');
    } catch (cleanupError) {
      console.warn('Cleanup failed:', cleanupError);
    }

    result.success = true;
    result.message = 'All order flow tests passed successfully!';
    result.details.summary = {
      testsPassed: 4,
      testOrderId: testOrderId,
      userId: standardizedUserId
    };

    console.log('🎉 All order flow tests passed!');

  } catch (error) {
    console.error('❌ Order flow test failed:', error);
    result.success = false;
    result.message = `Order flow test failed: ${(error as Error).message}`;
    result.details.error = (error as Error).message;
  }

  return result;
}

/**
 * Test the migration functionality
 */
export async function testMigration(): Promise<TestResult> {
  const result: TestResult = {
    success: false,
    message: '',
    details: {}
  };

  try {
    console.log('🧪 Starting migration test...');

    const { dryRunMigration } = await import('./migrateOrders');
    const dryRunResult = await dryRunMigration();

    console.log('Dry run result:', dryRunResult);

    result.details.dryRun = dryRunResult;

    if (!dryRunResult.success) {
      throw new Error('Migration dry run failed');
    }

    result.success = true;
    result.message = 'Migration test passed successfully!';
    result.details.summary = {
      dryRunSuccess: true,
      ordersNeedingMigration: dryRunResult.migratedOrders
    };

    console.log('✅ Migration test passed');

  } catch (error) {
    console.error('❌ Migration test failed:', error);
    result.success = false;
    result.message = `Migration test failed: ${(error as Error).message}`;
    result.details.error = (error as Error).message;
  }

  return result;
}