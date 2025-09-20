// Test data creation script for locations, customers, and entries only (skip users)
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
  
  const entries = [
    {
      customerName: 'Suresh Kumar',
      customerMobile: '+919014882779',
      customerCity: 'Chennai',
      numberOfPots: 2,
      locationId: locationIds[0],
      operatorId: 'operator2_uid',
      paymentMethod: 'cash',
      entryDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now (expiring soon)
      status: 'active',
      payments: [{
        amount: 500,
        date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        type: 'entry',
        method: 'cash',
        months: 1
      }],
      renewals: [{
        amount: 300,
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        type: 'renewal',
        method: 'cash',
        months: 1
      }],
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
      entryDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      status: 'active',
      payments: [{
        amount: 500,
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
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
      entryDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      expiryDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago (expired)
      status: 'delivered',
      payments: [{
        amount: 500,
        date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
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

// Main function to create test data
async function createTestData() {
  console.log('🚀 Starting test data creation...\n');
  
  try {
    // Step 1: Create locations
    console.log('Step 1: Creating locations...');
    const locationIds = await createTestLocations();
    console.log(`✅ Created ${locationIds.length} locations\n`);
    
    // Step 2: Create customers
    console.log('Step 2: Creating customers...');
    const customerIds = await createTestCustomers(locationIds);
    console.log(`✅ Created ${customerIds.length} customers\n`);
    
    // Step 3: Create entries
    console.log('Step 3: Creating entries...');
    const entryIds = await createTestEntries(customerIds, locationIds);
    console.log(`✅ Created ${entryIds.length} entries\n`);
    
    console.log('🎉 Test data created successfully!');
    console.log('\n📋 Test Data Summary:');
    console.log(`- Locations: ${locationIds.length}`);
    console.log(`- Customers: ${customerIds.length}`);
    console.log(`- Entries: ${entryIds.length}`);
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

// Run the script
createTestData().then(() => {
  console.log('\n✅ Test data creation completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});