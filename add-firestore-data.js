// Firestore data creation script for testing the SCM System
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCn0OL6-s6mq0FvWORZ2kDLN1lEqM-ADvo",
  authDomain: "rctscm01.firebaseapp.com",
  projectId: "rctscm01",
  storageBucket: "rctscm01.firebasestorage.app",
  messagingSenderId: "254761013200",
  appId: "1:254761013200:web:4b82ce8ff1a8733f1333d5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper function to create test locations
async function createTestLocations() {
  console.log('Creating test locations...');
  
  const locations = [
    {
      venueName: 'Main Branch',
      address: '123 Cremation Road, Chennai',
      contactNumber: '+914412345678',
      isActive: true,
      createdAt: serverTimestamp()
    },
    {
      venueName: 'North Branch',
      address: '456 Ash Street, Chennai',
      contactNumber: '+914423456789',
      isActive: true,
      createdAt: serverTimestamp()
    },
    {
      venueName: 'South Branch',
      address: '789 Memorial Lane, Chennai',
      contactNumber: '+914434567890',
      isActive: true,
      createdAt: serverTimestamp()
    }
  ];
  
  const locationIds = [];
  for (const location of locations) {
    try {
      const docRef = await addDoc(collection(db, 'locations'), location);
      locationIds.push(docRef.id);
      console.log(`✅ Created location: ${location.venueName} (ID: ${docRef.id})`);
    } catch (error) {
      console.error(`❌ Error creating location ${location.venueName}:`, error);
    }
  }
  
  return locationIds;
}

// Helper function to create test user documents in Firestore
async function createTestUserDocuments(locationIds) {
  console.log('Creating test user documents...');
  
  const users = [
    {
      email: 'admin@test.com',
      name: 'Admin User',
      mobile: '+919014882779',
      role: 'admin',
      isActive: true,
      locationIds: [],
      createdAt: serverTimestamp(),
      createdBy: 'system',
      lastLogin: serverTimestamp()
    },
    {
      email: 'operator1@test.com',
      name: 'Raj Kumar',
      mobile: '+919876543211',
      role: 'operator',
      isActive: false, // Pending approval
      locationIds: [],
      createdAt: serverTimestamp(),
      createdBy: 'system',
      lastLogin: serverTimestamp()
    },
    {
      email: 'operator2@test.com',
      name: 'Priya Sharma',
      mobile: '+919876543212',
      role: 'operator',
      isActive: true, // Already approved
      locationIds: locationIds.slice(0, 2), // Assigned to first 2 locations
      createdAt: serverTimestamp(),
      createdBy: 'system',
      lastLogin: serverTimestamp(),
      approvedBy: 'admin_uid',
      approvedAt: serverTimestamp()
    }
  ];
  
  const userIds = [];
  for (const user of users) {
    try {
      const docRef = await addDoc(collection(db, 'users'), user);
      userIds.push(docRef.id);
      console.log(`✅ Created user document: ${user.name} (${user.role}) - Status: ${user.isActive ? 'Active' : 'Pending'}`);
    } catch (error) {
      console.error(`❌ Error creating user document for ${user.email}:`, error);
    }
  }
  
  return userIds;
}

// Helper function to create test customers
async function createTestCustomers(locationIds) {
  console.log('Creating test customers...');
  
  const customers = [
    {
      name: 'Suresh Kumar',
      mobile: '+919014882779',
      city: 'Chennai',
      additionalDetails: 'Regular customer',
      locationId: locationIds[0],
      createdBy: 'operator2_uid',
      createdAt: serverTimestamp()
    },
    {
      name: 'Lakshmi Devi',
      mobile: '+919876543211',
      city: 'Chennai',
      additionalDetails: 'Prefers morning visits',
      locationId: locationIds[1],
      createdBy: 'operator2_uid',
      createdAt: serverTimestamp()
    },
    {
      name: 'Ramesh Babu',
      mobile: '+919876543212',
      city: 'Chennai',
      additionalDetails: 'Large family requirements',
      locationId: locationIds[0],
      createdBy: 'operator2_uid',
      createdAt: serverTimestamp()
    }
  ];
  
  const customerIds = [];
  for (const customer of customers) {
    try {
      const docRef = await addDoc(collection(db, 'customers'), customer);
      customerIds.push(docRef.id);
      console.log(`✅ Created customer: ${customer.name} (ID: ${docRef.id})`);
    } catch (error) {
      console.error(`❌ Error creating customer ${customer.name}:`, error);
    }
  }
  
  return customerIds;
}

// Helper function to create test entries
async function createTestEntries(customerIds, locationIds) {
  console.log('Creating test entries...');
  
  const now = Date.now();
  const entries = [
    {
      customerName: 'Suresh Kumar',
      customerMobile: '+919014882779',
      customerCity: 'Chennai',
      numberOfPots: 2,
      locationId: locationIds[0],
      operatorId: 'operator2_uid',
      paymentMethod: 'cash',
      entryDate: new Date(now - 25 * 24 * 60 * 60 * 1000), // 25 days ago
      expiryDate: new Date(now + 5 * 24 * 60 * 60 * 1000), // 5 days from now (expiring soon)
      status: 'active',
      payments: [{
        amount: 500,
        date: new Date(now - 25 * 24 * 60 * 60 * 1000),
        type: 'entry',
        method: 'cash',
        months: 1
      }],
      renewals: [],
      createdAt: serverTimestamp()
    },
    {
      customerName: 'Lakshmi Devi',
      customerMobile: '+919876543211',
      customerCity: 'Chennai',
      numberOfPots: 1,
      locationId: locationIds[1],
      operatorId: 'operator2_uid',
      paymentMethod: 'upi',
      entryDate: new Date(now - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      expiryDate: new Date(now + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      status: 'active',
      payments: [{
        amount: 500,
        date: new Date(now - 15 * 24 * 60 * 60 * 1000),
        type: 'entry',
        method: 'upi',
        months: 1
      }],
      renewals: [],
      createdAt: serverTimestamp()
    },
    {
      customerName: 'Ramesh Babu',
      customerMobile: '+919876543212',
      customerCity: 'Chennai',
      numberOfPots: 3,
      locationId: locationIds[0],
      operatorId: 'operator2_uid',
      paymentMethod: 'cash',
      entryDate: new Date(now - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      expiryDate: new Date(now - 15 * 24 * 60 * 60 * 1000), // 15 days ago (expired)
      status: 'expired',
      payments: [{
        amount: 500,
        date: new Date(now - 45 * 24 * 60 * 60 * 1000),
        type: 'entry',
        method: 'cash',
        months: 1
      }],
      renewals: [],
      createdAt: serverTimestamp()
    },
    {
      customerName: 'Meena Kumari',
      customerMobile: '+918765432109',
      customerCity: 'Chennai',
      numberOfPots: 1,
      locationId: locationIds[2],
      operatorId: 'operator2_uid',
      paymentMethod: 'upi',
      entryDate: new Date(now - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      expiryDate: new Date(now + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      status: 'active',
      payments: [{
        amount: 500,
        date: new Date(now - 10 * 24 * 60 * 60 * 1000),
        type: 'entry',
        method: 'upi',
        months: 1
      }],
      renewals: [],
      createdAt: serverTimestamp()
    },
    {
      customerName: 'Karthik Rajan',
      customerMobile: '+918654321098',
      customerCity: 'Chennai',
      numberOfPots: 2,
      locationId: locationIds[1],
      operatorId: 'operator2_uid',
      paymentMethod: 'cash',
      entryDate: new Date(now - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      expiryDate: new Date(now - 30 * 24 * 60 * 60 * 1000), // 30 days ago (expired)
      status: 'delivered',
      payments: [{
        amount: 500,
        date: new Date(now - 60 * 24 * 60 * 60 * 1000),
        type: 'entry',
        method: 'cash',
        months: 1
      }],
      renewals: [],
      createdAt: serverTimestamp()
    }
  ];
  
  const entryIds = [];
  for (const entry of entries) {
    try {
      const docRef = await addDoc(collection(db, 'entries'), entry);
      entryIds.push(docRef.id);
      console.log(`✅ Created entry for: ${entry.customerName} (Status: ${entry.status})`);
    } catch (error) {
      console.error(`❌ Error creating entry for ${entry.customerName}:`, error);
    }
  }
  
  return entryIds;
}

// Main function to create all sample data
async function createAllSampleData() {
  console.log('🚀 Starting Firestore data creation...\n');
  
  try {
    // Step 1: Create locations
    console.log('Step 1: Creating locations...');
    const locationIds = await createTestLocations();
    console.log(`✅ Created ${locationIds.length} locations\n`);
    
    // Step 2: Create user documents
    console.log('Step 2: Creating user documents...');
    const userIds = await createTestUserDocuments(locationIds);
    console.log(`✅ Created ${userIds.length} user documents\n`);
    
    // Step 3: Create customers
    console.log('Step 3: Creating customers...');
    const customerIds = await createTestCustomers(locationIds);
    console.log(`✅ Created ${customerIds.length} customers\n`);
    
    // Step 4: Create entries
    console.log('Step 4: Creating entries...');
    const entryIds = await createTestEntries(customerIds, locationIds);
    console.log(`✅ Created ${entryIds.length} entries\n`);
    
    console.log('🎉 All Firestore data created successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Admin: admin@test.com / admin123');
    console.log('Pending Operator: operator1@test.com / operator123');
    console.log('Active Operator: operator2@test.com / operator123');
    
  } catch (error) {
    console.error('❌ Error creating Firestore data:', error);
  }
}

// Run the script
createAllSampleData().then(() => {
  console.log('\n✅ Firestore data creation completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});