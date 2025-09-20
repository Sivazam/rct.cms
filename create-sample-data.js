// Sample data creation script for the Smart Cremation Management System
// This script can be run in the browser console to populate test data

console.log('=== Sample Data Creation Script ===');
console.log('Run createSampleData() to create all test data');
console.log('Individual functions available:');
console.log('- createTestLocations()');
console.log('- createTestOperators()');
console.log('- createTestCustomers()');
console.log('- createTestEntries()');
console.log('- createTestRenewals()');

// Import required functions (these will be available in browser console)
async function getFirebaseModules() {
  const { db, collection, addDoc, doc, setDoc, serverTimestamp } = await import('./src/lib/firebase.js');
  const { createUserWithEmailAndPassword } = await import('firebase/auth');
  const { auth } = await import('./src/lib/firebase.js');
  return { db, collection, addDoc, doc, setDoc, serverTimestamp, createUserWithEmailAndPassword, auth };
}

// Create test locations
async function createTestLocations() {
  try {
    const { db, collection, addDoc, serverTimestamp } = await getFirebaseModules();
    
    const locations = [
      {
        venueName: 'Main Branch',
        address: '123 Cremation Road, Chennai',
        contactNumber: '+914412345678',
        isActive: true
      },
      {
        venueName: 'North Branch',
        address: '456 Ash Street, Chennai',
        contactNumber: '+914423456789',
        isActive: true
      },
      {
        venueName: 'South Branch',
        address: '789 Memorial Lane, Chennai',
        contactNumber: '+914434567890',
        isActive: true
      }
    ];
    
    const locationIds = [];
    for (const location of locations) {
      const docRef = await addDoc(collection(db, 'locations'), {
        ...location,
        createdAt: serverTimestamp()
      });
      locationIds.push(docRef.id);
      console.log('Created location:', location.venueName, 'with ID:', docRef.id);
    }
    
    return locationIds;
  } catch (error) {
    console.error('Error creating test locations:', error);
  }
}

// Create test operators (pending and active)
async function createTestOperators() {
  try {
    const { createUserWithEmailAndPassword, auth, db, doc, setDoc, serverTimestamp } = await getFirebaseModules();
    
    const operators = [
      {
        email: 'operator1@example.com',
        password: 'operator123',
        name: 'Raj Kumar',
        mobile: '+919014882779',
        isActive: false // Pending approval
      },
      {
        email: 'operator2@example.com',
        password: 'operator123',
        name: 'Priya Sharma',
        mobile: '+919865432109',
        isActive: false // Pending approval
      },
      {
        email: 'operator3@example.com',
        password: 'operator123',
        name: 'Amit Patel',
        mobile: '+919854321098',
        isActive: true // Already approved
      }
    ];
    
    const operatorIds = [];
    for (const operator of operators) {
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, operator.email, operator.password);
      const firebaseUser = userCredential.user;
      
      // Create Firestore user document
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        email: operator.email,
        name: operator.name,
        mobile: operator.mobile,
        role: 'operator',
        isActive: operator.isActive,
        locationIds: operator.isActive ? ['location1', 'location2'] : [], // Active operators have locations assigned
        createdAt: serverTimestamp(),
        createdBy: firebaseUser.uid,
        lastLogin: serverTimestamp(),
        ...(operator.isActive && {
          approvedBy: 'admin_uid',
          approvedAt: serverTimestamp()
        })
      });
      
      operatorIds.push(firebaseUser.uid);
      console.log('Created operator:', operator.name, 'Status:', operator.isActive ? 'Active' : 'Pending');
    }
    
    return operatorIds;
  } catch (error) {
    console.error('Error creating test operators:', error);
  }
}

// Create test customers
async function createTestCustomers() {
  try {
    const { db, collection, addDoc, serverTimestamp } = await getFirebaseModules();
    
    const customers = [
      {
        name: 'Suresh Kumar',
        mobile: '+919014882779',
        city: 'Chennai',
        additionalDetails: 'Regular customer'
      },
      {
        name: 'Lakshmi Devi',
        mobile: '+919865432109',
        city: 'Chennai',
        additionalDetails: 'Prefers morning visits'
      },
      {
        name: 'Ramesh Babu',
        mobile: '+919854321098',
        city: 'Chennai',
        additionalDetails: 'Large family requirements'
      },
      {
        name: 'Meena Kumari',
        mobile: '+918765432109',
        city: 'Chennai',
        additionalDetails: 'Senior citizen'
      },
      {
        name: 'Karthik Rajan',
        mobile: '+918654321098',
        city: 'Chennai',
        additionalDetails: 'Corporate client'
      }
    ];
    
    const customerIds = [];
    for (const customer of customers) {
      const docRef = await addDoc(collection(db, 'customers'), {
        ...customer,
        createdBy: 'operator_uid',
        locationId: 'location1',
        createdAt: serverTimestamp()
      });
      customerIds.push(docRef.id);
      console.log('Created customer:', customer.name, 'with ID:', docRef.id);
    }
    
    return customerIds;
  } catch (error) {
    console.error('Error creating test customers:', error);
  }
}

// Create test entries
async function createTestEntries() {
  try {
    const { db, collection, addDoc, serverTimestamp } = await getFirebaseModules();
    
    const entries = [
      {
        customerName: 'Suresh Kumar',
        customerMobile: '+919014882779',
        customerCity: 'Chennai',
        numberOfPots: 2,
        locationId: 'location1',
        operatorId: 'operator3_uid',
        paymentMethod: 'cash',
        entryDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now (expiring soon)
        status: 'active'
      },
      {
        customerName: 'Lakshmi Devi',
        customerMobile: '+919865432109',
        customerCity: 'Chennai',
        numberOfPots: 1,
        locationId: 'location2',
        operatorId: 'operator3_uid',
        paymentMethod: 'upi',
        entryDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        status: 'active'
      },
      {
        customerName: 'Ramesh Babu',
        customerMobile: '+919854321098',
        customerCity: 'Chennai',
        numberOfPots: 3,
        locationId: 'location1',
        operatorId: 'operator3_uid',
        paymentMethod: 'cash',
        entryDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        expiryDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago (expired)
        status: 'expired'
      },
      {
        customerName: 'Meena Kumari',
        customerMobile: '+918765432109',
        customerCity: 'Chennai',
        numberOfPots: 1,
        locationId: 'location3',
        operatorId: 'operator3_uid',
        paymentMethod: 'upi',
        entryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        status: 'active'
      },
      {
        customerName: 'Karthik Rajan',
        customerMobile: '+918654321098',
        customerCity: 'Chennai',
        numberOfPots: 2,
        locationId: 'location2',
        operatorId: 'operator3_uid',
        paymentMethod: 'cash',
        entryDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        expiryDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago (expired)
        status: 'delivered'
      }
    ];
    
    const entryIds = [];
    for (const entry of entries) {
      const docRef = await addDoc(collection(db, 'entries'), {
        ...entry,
        payments: [{
          amount: 500,
          date: entry.entryDate,
          type: 'entry',
          method: entry.paymentMethod,
          months: 1
        }],
        renewals: [],
        createdAt: serverTimestamp()
      });
      entryIds.push(docRef.id);
      console.log('Created entry for:', entry.customerName, 'Status:', entry.status);
    }
    
    return entryIds;
  } catch (error) {
    console.error('Error creating test entries:', error);
  }
}

// Create test renewals
async function createTestRenewals() {
  try {
    const { db, collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp } = await getFirebaseModules();
    
    // First get existing entries
    const entriesQuery = query(collection(db, 'entries'), where('status', '==', 'active'));
    const querySnapshot = await getDocs(entriesQuery);
    const entries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (entries.length === 0) {
      console.log('No active entries found for creating renewals');
      return;
    }
    
    // Add renewals to first 2 active entries
    for (let i = 0; i < Math.min(2, entries.length); i++) {
      const entry = entries[i];
      const renewalMonths = i === 0 ? 3 : 6; // First entry: 3 months, Second entry: 6 months
      const renewalAmount = renewalMonths * 300;
      const renewalDate = new Date(Date.now() - (i + 1) * 10 * 24 * 60 * 60 * 1000); // 10-20 days ago
      const newExpiryDate = new Date(entry.expiryDate.toDate().getTime() + renewalMonths * 30 * 24 * 60 * 60 * 1000);
      
      const renewal = {
        date: renewalDate,
        months: renewalMonths,
        amount: renewalAmount,
        method: i === 0 ? 'cash' : 'upi',
        operatorId: 'operator3_uid',
        newExpiryDate: newExpiryDate
      };
      
      // Update the entry with renewal
      const currentRenewals = entry.renewals || [];
      await updateDoc(doc(db, 'entries', entry.id), {
        renewals: [...currentRenewals, renewal],
        expiryDate: newExpiryDate,
        payments: [...(entry.payments || []), {
          amount: renewalAmount,
          date: renewalDate,
          type: 'renewal',
          method: renewal.method,
          months: renewalMonths
        }]
      });
      
      console.log(`Added ${renewalMonths}-month renewal to entry for ${entry.customerName}`);
    }
    
    console.log('Test renewals created successfully');
  } catch (error) {
    console.error('Error creating test renewals:', error);
  }
}

// Main function to create all sample data
async function createSampleData() {
  console.log('Creating all sample data...');
  
  try {
    // Step 1: Create locations
    console.log('\n1. Creating locations...');
    await createTestLocations();
    
    // Step 2: Create operators
    console.log('\n2. Creating operators...');
    await createTestOperators();
    
    // Step 3: Create customers
    console.log('\n3. Creating customers...');
    await createTestCustomers();
    
    // Step 4: Create entries
    console.log('\n4. Creating entries...');
    await createTestEntries();
    
    // Step 5: Create renewals
    console.log('\n5. Creating renewals...');
    await createTestRenewals();
    
    console.log('\n✅ All sample data created successfully!');
    console.log('\nTest credentials:');
    console.log('Pending Operators:');
    console.log('- operator1@example.com / operator123 (Raj Kumar)');
    console.log('- operator2@example.com / operator123 (Priya Sharma)');
    console.log('Active Operator:');
    console.log('- operator3@example.com / operator123 (Amit Patel)');
    
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
}

// Make functions available in browser console
window.createTestLocations = createTestLocations;
window.createTestOperators = createTestOperators;
window.createTestCustomers = createTestCustomers;
window.createTestEntries = createTestEntries;
window.createTestRenewals = createTestRenewals;
window.createSampleData = createSampleData;

console.log('\nSample data creation script loaded successfully!');
console.log('Run createSampleData() in browser console to populate test data.');