// Test script to verify operator approval flow
// This script can be run in the browser console to test the flow

console.log('=== Operator Approval Flow Test ===');

// Test 1: Create a location (if none exists)
async function createTestLocation() {
  try {
    const { db, collection, addDoc, serverTimestamp } = await import('./src/lib/firebase.js');
    
    const locationData = {
      venueName: 'Test Location',
      address: '123 Test Street',
      contactNumber: '+919014882779',
      createdBy: 'test_admin',
      isActive: true,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'locations'), locationData);
    console.log('Test location created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating test location:', error);
  }
}

// Test 2: Create an operator user
async function createTestOperator() {
  try {
    const { auth, createUserWithEmailAndPassword } = await import('./src/lib/firebase.js');
    const { doc, setDoc, serverTimestamp, db, collection } = await import('./src/lib/firebase.js');
    
    // Create Firebase auth user
    const userCredential = await createUserWithEmailAndPassword(auth, 'testoperator@example.com', 'testpassword123');
    const firebaseUser = userCredential.user;
    
    console.log('Firebase auth user created:', firebaseUser.uid);
    
    // Create Firestore user document
    const userData = {
      email: 'testoperator@example.com',
      name: 'Test Operator',
      mobile: '+919014882779',
      role: 'operator',
      isActive: false, // Should be false for operators
      locationIds: [],
      createdAt: serverTimestamp(),
      createdBy: firebaseUser.uid,
      lastLogin: serverTimestamp()
    };
    
    await setDoc(doc(db, 'users', firebaseUser.uid), userData);
    console.log('Operator user document created');
    console.log('Operator should now appear in admin panel for approval');
    
    return firebaseUser.uid;
  } catch (error) {
    console.error('Error creating test operator:', error);
  }
}

// Test 3: Check if operator appears in pending list
async function checkPendingOperators() {
  try {
    const { getUsers } = await import('./src/lib/firestore.js');
    const pendingOperators = await getUsers('operator', false);
    console.log('Pending operators:', pendingOperators);
    return pendingOperators;
  } catch (error) {
    console.error('Error checking pending operators:', error);
  }
}

// Run all tests
async function runTests() {
  console.log('Starting operator approval flow tests...');
  
  // Step 1: Create test location
  const locationId = await createTestLocation();
  
  // Step 2: Create test operator
  const operatorId = await createTestOperator();
  
  // Step 3: Check pending operators
  setTimeout(async () => {
    const pendingOperators = await checkPendingOperators();
    console.log('Test completed. Pending operators found:', pendingOperators.length);
  }, 2000);
}

// Export functions for browser console
window.createTestLocation = createTestLocation;
window.createTestOperator = createTestOperator;
window.checkPendingOperators = checkPendingOperators;
window.runTests = runTests;

console.log('Test functions available in console:');
console.log('- createTestLocation()');
console.log('- createTestOperator()');
console.log('- checkPendingOperators()');
console.log('- runTests()');