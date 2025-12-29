import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import jwt from 'jsonwebtoken';
import { orderService, userService, type IOrderItem, type ICustomerInfo } from '@/lib/services';
import { getUserIdentifier, getGuestUserIdentifier, standardizeUserId } from '@/lib/userUtils';

// Razorpay Configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_RHpVquZ5e0nUkX';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'C0qZuu2HhC7cLYUKBxlKI2at';

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

export async function POST(request: NextRequest) {
  try {
    console.log('Payment create-order API called');
    
    // Check authentication (optional for guest checkout)
    const token = request.cookies.get('auth-token')?.value;
    let userIdentifier;
    
    if (token) {
      try {
        // Try multiple verification approaches
        let decoded: any;
        try {
          const secretBuffer = getSecretBuffer();
          decoded = jwt.verify(token, secretBuffer);
          console.log('Payment: Token verified using Buffer secret');
        } catch (error) {
          console.warn('Payment: Buffer verification failed, trying string approach');
          const secretString = getJwtSecret();
          decoded = jwt.verify(token, secretString, { algorithms: ['HS256'] });
          console.log('Payment: Token verified using string secret');
        }
        
        // Get standardized user identifier
        userIdentifier = getUserIdentifier(decoded);
        console.log('Payment: Authenticated user identifier:', userIdentifier);
      } catch (error) {
        // Invalid token, treat as guest
        userIdentifier = getGuestUserIdentifier(shippingAddress?.phone);
        console.log('Payment: Invalid token, using guest identifier:', userIdentifier);
      }
    } else {
      // Guest checkout
      userIdentifier = getGuestUserIdentifier(shippingAddress?.phone);
      console.log('Payment: Guest checkout identifier:', userIdentifier);
    }

    // Get cart data from request body
    const body = await request.json();
    console.log('Request body received:', { 
      hasItems: !!body.items, 
      hasShippingAddress: !!body.shippingAddress,
      hasCustomerInfo: !!body.customerInfo,
      itemCount: body.items?.length || 0,
      shippingAddress: body.shippingAddress
    });

    const { items, shippingAddress, customerInfo } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('Invalid cart data:', items);
      return NextResponse.json(
        { success: false, error: 'Invalid cart data' },
        { status: 400 }
      );
    }

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.name || !shippingAddress.phone || !shippingAddress.address) {
      console.error('Invalid shipping address:', shippingAddress);
      return NextResponse.json(
        { success: false, error: 'Complete shipping address is required', details: 'Missing required address fields' },
        { status: 400 }
      );
    }

      console.log('Creating or updating user for phone:', shippingAddress.phone);
    
    // Create or update user if phone number is provided - with better error handling
    if (shippingAddress.phone && userIdentifier.isAuthenticated) {
      try {
        // Use the standardized user ID (phone number)
        const standardizedUserId = standardizeUserId(userIdentifier.userId);
        
        console.log('Attempting to create/update user with phone:', standardizedUserId, 'isAuthenticated:', userIdentifier.isAuthenticated);
        
        // Prepare user data with address
        const userData = {
          phoneNumber: standardizedUserId,
          name: shippingAddress.name,
          email: customerInfo?.email || '',
          address: shippingAddress.address,
          city: shippingAddress.city || '',
          state: shippingAddress.state || '',
          pincode: shippingAddress.pincode || ''
        };

        // Create or update user
        const userIdFromDb = await userService.createOrUpdateUser(userData);
        
        console.log('User created/updated with database ID:', userIdFromDb);
        
        // Add shipping address to user's addresses only if it's not already saved
        try {
          // Check if this address already exists for the user
          const existingUser = await userService.getUserByPhoneNumber(standardizedUserId);
          let addressExists = false;
          
          if (existingUser && existingUser.addresses) {
            const addressString = `${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}`;
            addressExists = existingUser.addresses.some((addr: any) => 
              `${addr.address}, ${addr.city}, ${addr.state} - ${addr.pincode}` === addressString
            );
          }
          
          if (!addressExists) {
            const addressData = {
              name: shippingAddress.name,
              phone: shippingAddress.phone,
              address: shippingAddress.address,
              city: shippingAddress.city || '',
              state: shippingAddress.state || '',
              pincode: shippingAddress.pincode || '',
              isDefault: false // Don't override existing default
            };
            
            await userService.addAddress(userIdFromDb, addressData);
            console.log('New address added to user profile successfully');
          } else {
            console.log('Address already exists in user profile, skipping duplication');
          }
        } catch (addressError) {
          console.error('Error checking/adding address to user profile:', addressError);
          // Don't fail the order creation if address addition fails
        }
        
        console.log('User created/updated successfully:', standardizedUserId);
      } catch (error) {
        console.error('Error creating/updating user:', error);
        console.error('User creation error details:', {
          name: (error as any).name,
          message: (error as any).message,
          stack: (error as any).stack,
          code: (error as any).code
        });
        // Don't fail the order creation if user creation fails
        // Continue with original user identifier
      }
    }

    // Calculate total amount
    const subtotal = items.reduce((sum, item) => {
      const price = item.variant.price - (item.variant.price * item.variant.discount) / 100;
      return sum + (price * item.quantity);
    }, 0);

    // Add shipping cost (free shipping for orders above 999)
    const shippingCost = subtotal >= 999 ? 0 : 99;
    const total = subtotal + shippingCost;

    console.log('Order totals calculated:', { subtotal, shippingCost, total });

    // Create Razorpay order
    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(total * 100), // Convert to paise
      currency: 'INR',
      receipt: `order_${Date.now()}_${userIdentifier.userId}`,
      payment_capture: 1,
      notes: {
        customer_name: shippingAddress.name,
        customer_phone: shippingAddress.phone,
        customer_email: customerInfo?.email || '',
        order_type: 'spiritual_products'
      }
    };

    console.log('Creating Razorpay order with options:', { 
      ...options, 
      key_secret: '***',
      amount: options.amount,
      currency: options.currency,
      receipt: options.receipt
    });

    let razorpayOrder: any;
    try {
      razorpayOrder = await razorpay.orders.create(options);
      console.log('Razorpay order created successfully:', razorpayOrder.id);
      console.log('Full Razorpay response:', razorpayOrder);
    } catch (razorpayError) {
      console.error('Razorpay order creation failed:', razorpayError);
      console.error('Razorpay error details:', {
        name: (razorpayError as any).name,
        message: (razorpayError as any).message,
        stack: (razorpayError as any).stack,
        code: (razorpayError as any).code,
        statusCode: (razorpayError as any).statusCode,
        description: (razorpayError as any).description
      });
      throw new Error(`Failed to create Razorpay order: ${(razorpayError as any).message || 'Unknown error'}`);
    }

    // Prepare order data for Firebase
    const orderItems: IOrderItem[] = items.map(item => ({
      productId: item.productId,
      variantId: item.variantId,
      name: item.name,
      quantity: item.quantity,
      price: item.variant.price,
      discount: item.variant.discount,
      totalPrice: (item.variant.price - (item.variant.price * item.variant.discount) / 100) * item.quantity,
      image: item.image // Include the product image from cart item
    }));

    const customerData: ICustomerInfo = {
      name: shippingAddress.name,
      phone: shippingAddress.phone,
      email: customerInfo?.email || '',
      address: shippingAddress.address,
      city: shippingAddress.city || '',
      state: shippingAddress.state || '',
      pincode: shippingAddress.pincode || ''
    };

    console.log('Creating order in Firebase...');

    // Create order in Firebase with fallback
    let orderId: string;
    try {
      // Use standardized user ID for order creation
      const standardizedUserId = standardizeUserId(userIdentifier.userId);
      
      const orderData = {
        userId: standardizedUserId,
        customerInfo: customerData,
        items: orderItems,
        subtotal,
        shippingCost,
        total,
        razorpayOrderId: razorpayOrder.id,
        status: 'pending',
        paymentStatus: 'pending',
        orderDate: new Date()
      };
      
      orderId = await orderService.createOrder(orderData);
      console.log('Order created successfully in Firebase:', orderId, 'with userId:', standardizedUserId);
      
      // Associate order with user
      try {
        console.log('Associating order with user:', standardizedUserId, 'orderId:', orderId, 'isAuthenticated:', userIdentifier.isAuthenticated);
        if (userIdentifier.isAuthenticated) {
          await userService.addOrderToUser(standardizedUserId, orderId);
          console.log('Order associated with user successfully');
        } else {
          console.log('Skipping user association for guest user');
        }
      } catch (associationError) {
        console.error('Error associating order with user:', associationError);
        // Don't fail the order creation if association fails
      }
    } catch (firebaseError) {
      console.error('Firebase order creation failed:', firebaseError);
      console.error('Firebase error details:', {
        name: (firebaseError as any).name,
        message: (firebaseError as any).message,
        stack: (firebaseError as any).stack,
        code: (firebaseError as any).code
      });
      // Fallback: Generate a local order ID without Firebase
      orderId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('Using fallback order ID:', orderId, 'with userId:', standardizedUserId);
      // Continue with the payment process even if Firebase fails
      // The order can be reconciled later
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: RAZORPAY_KEY_ID,
        dbOrderId: orderId,
        subtotal,
        shippingCost,
        total
      }
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    console.error('Error details:', {
      name: (error as any).name,
      message: (error as any).message,
      stack: (error as any).stack,
      code: (error as any).code
    });
    return NextResponse.json(
      { success: false, error: 'Failed to create order', details: (error as any).message },
      { status: 500 }
    );
  }
}