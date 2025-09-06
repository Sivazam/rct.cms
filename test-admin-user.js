// Test script to check and create default admin user
import { auth, db } from './src/lib/firebase.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

async function createDefaultAdmin() {
  try {
    const adminEmail = 'admin@rctscm.com';
    const adminPassword = 'admin123';
    
    console.log('Creating default admin user...');
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const firebaseUser = userCredential.user;
    
    console.log('Firebase user created:', firebaseUser.uid);
    
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
    
    console.log('Default admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    
    return firebaseUser;
    
  } catch (error) {
    console.error('Error creating default admin:', error);
    throw error;
  }
}

async function checkExistingUsers() {
  try {
    // This would normally be done with a proper query
    console.log('Checking for existing users...');
    console.log('Note: You may need to manually check Firestore console for existing users');
  } catch (error) {
    console.error('Error checking users:', error);
  }
}

// Run the tests
if (require.main === module) {
  console.log('=== Admin User Test Script ===');
  
  checkExistingUsers()
    .then(() => {
      console.log('\nWould you like to create a default admin user?');
      console.log('This will create: admin@rctscm.com / admin123');
      console.log('Run createDefaultAdmin() to create the user.');
    })
    .catch(console.error);
}

export { createDefaultAdmin, checkExistingUsers };