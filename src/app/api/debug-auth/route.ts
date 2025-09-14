import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if Firebase is properly initialized
    if (!auth || !db) {
      throw new Error('Firebase not initialized');
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'check-user') {
      const email = searchParams.get('email');
      
      if (!email) {
        return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
      }

      // Try to find user by checking if there's a user document
      // Note: This is a simplified approach - in production you'd want proper user lookup
      return NextResponse.json({ 
        message: 'User check endpoint',
        email,
        note: 'This endpoint helps debug user authentication issues'
      });
    }

    if (action === 'create-admin') {
      const adminEmail = 'admin@rctscm.com';
      const adminPassword = 'admin123';
      
      try {
        // Check if admin already exists
        const adminDoc = await getDoc(doc(db, 'users', 'temp-check'));
        
        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
        const firebaseUser = userCredential.user;
        
        // Create Firestore user document
        const userData = {
          email: adminEmail,
          name: 'System Administrator',
          mobile: '9999999999',
          role: 'admin',
          isActive: true,
          locationIds: [],
          createdAt: serverTimestamp(),
          createdBy: firebaseUser.uid,
          lastLogin: serverTimestamp()
        };
        
        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
        
        return NextResponse.json({ 
          success: true,
          message: 'Default admin user created successfully!',
          email: adminEmail,
          password: adminPassword,
          uid: firebaseUser.uid
        });
        
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          return NextResponse.json({ 
            success: false,
            message: 'Admin user already exists',
            email: adminEmail,
            password: adminPassword
          });
        }
        throw error;
      }
    }

    return NextResponse.json({ 
      message: 'Auth debug endpoint',
      actions: ['check-user', 'create-admin'],
      note: 'Use ?action=create-admin to create default admin user'
    });

  } catch (error: any) {
    console.error('Auth debug error:', error);
    
    // Check if it's a Firebase initialization error
    if (error.code === 'auth/invalid-api-key') {
      return NextResponse.json({ 
        error: 'Firebase API key not configured. Please check environment variables.',
        code: error.code 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: error.message,
      code: error.code 
    }, { status: 500 });
  }
}