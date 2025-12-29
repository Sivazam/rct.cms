import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import { firestoreService } from '@/lib/firebase';
import { IUser } from '@/lib/models/User';
import { wishlistService } from '@/lib/services/wishlistService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Ensure JWT_SECRET is a string and handle potential module conflicts
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
    console.log('OTP verification API called');
    const { idToken, phoneNumber } = await request.json();

    console.log('Received data:', { idToken: idToken ? '***' : 'missing', phoneNumber });

    if (!idToken || !phoneNumber) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to MongoDB (optional - if using MongoDB)
    await connectDB();

    // Create or update user in Firestore
    let existingUser: any = null;
    let isNewUser = false;
    let needsProfileCompletion = true;
    let userId: string = phoneNumber; // Use phone number as document ID
    
    try {
      console.log('Creating/updating user in Firestore for phone:', phoneNumber);
      
      // Check if user exists using phone number as document ID
      existingUser = await firestoreService.getById('users', phoneNumber);

      let userData: IUser = {
        phoneNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (existingUser) {
        // Update existing user
        userId = phoneNumber; // Phone number is the document ID
        await firestoreService.update('users', userId, {
          updatedAt: new Date()
        });
        console.log('User updated in Firestore:', userId);
        
        // Check if user has completed profile
        needsProfileCompletion = !existingUser.name || !existingUser.email;
        if (needsProfileCompletion) {
          console.log('User profile incomplete, needs completion');
        }
      } else {
        // Create new user with phone number as document ID
        userId = await firestoreService.create('users', userData, phoneNumber);
        isNewUser = true;
        console.log('New user created in Firestore with phone number as ID:', userId);
      }
    } catch (firestoreError) {
      console.error('Error creating/updating user in Firestore:', firestoreError);
      // Don't fail the authentication if Firestore fails
      // Assume it's a new user if we can't check
      isNewUser = true;
      needsProfileCompletion = true;
      // Use phone number as userId even for temporary cases
      userId = phoneNumber;
    }

    // Create JWT token for session management
    console.log('Creating JWT token');
    
    // userId is now always the phone number
    console.log('Using phone number as userId:', userId);
    
    // Try multiple approaches for token signing
    let token: string;
    try {
      // Approach 1: Use Buffer-based secret
      const secretBuffer = getSecretBuffer();
      token = jwt.sign(
        { 
          phoneNumber,
          userId: userId // Include the phone number as userId
        },
        secretBuffer,
        { expiresIn: '7d' }
      );
      console.log('Token created successfully using Buffer secret');
    } catch (error) {
      console.warn('Buffer approach failed, trying string approach:', error);
      // Approach 2: Use string secret with explicit options
      const secretString = getJwtSecret();
      token = jwt.sign(
        { 
          phoneNumber,
          userId: userId // Include the phone number as userId
        },
        secretString,
        { algorithm: 'HS256', expiresIn: '7d' }
      );
      console.log('Token created successfully using string secret');
    }

    // Create response with session cookie
    const response = NextResponse.json(
      { 
        message: 'OTP verified successfully',
        success: true,
        phoneNumber,
        token, // Include token in response for fallback storage
        isNewUser, // Indicate if this is a new user
        needsProfileCompletion // Indicate if profile completion is needed
      },
      { status: 200 }
    );

    // Set HTTP-only cookie for session
    console.log('Setting auth-token cookie');
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: false, // Set to false in development
      sameSite: 'lax', // Use 'lax' instead of 'strict' for better compatibility
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    console.log('Cookie set in response headers');
    console.log('Response cookies:', response.cookies.getAll());

    // Merge local wishlist with Firestore after successful login
    try {
      console.log('Merging local wishlist with Firestore...');
      await wishlistService.mergeLocalWishlist();
      console.log('Wishlist merge completed successfully');
    } catch (error) {
      console.error('Error merging wishlist:', error);
      // Don't fail the authentication if wishlist merge fails
    }

    console.log('OTP verification completed successfully');
    return response;
  } catch (error) {
    console.error('OTP verification error:', error);
    console.error('Error details:', {
      name: (error as any).name,
      message: (error as any).message,
      stack: (error as any).stack,
      code: (error as any).code
    });
    return NextResponse.json(
      { error: 'Internal server error', details: (error as any).message },
      { status: 500 }
    );
  }
}