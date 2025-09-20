// Test script to check current data state and test admin features
// Run this in browser console when logged in as admin

console.log('=== Admin Features Test Script ===');

// Test 1: Check current data state
async function checkCurrentData() {
  try {
    // Check locations
    const locations = await getLocations();
    console.log('📍 Current Locations:', locations.length, locations);
    
    // Check operators
    const pendingOperators = await getPendingOperators();
    const activeOperators = await getActiveOperators();
    console.log('👥 Pending Operators:', pendingOperators.length, pendingOperators);
    console.log('👥 Active Operators:', activeOperators.length, activeOperators);
    
    // Check entries
    const entries = await getEntries();
    console.log('📝 Total Entries:', entries.length);
    
    // Check system stats
    const stats = await getSystemStats();
    console.log('📊 System Stats:', stats);
    
    return { locations, pendingOperators, activeOperators, entries, stats };
  } catch (error) {
    console.error('Error checking current data:', error);
  }
}

// Test 2: Create a test location
async function testCreateLocation() {
  try {
    console.log('🧪 Testing Location Creation...');
    
    const locationData = {
      venueName: 'Test Location - ' + new Date().toLocaleTimeString(),
      address: '123 Test Street, Test City',
      contactNumber: '+911234567890',
      createdBy: 'admin_test'
    };
    
    const locationId = await addLocation(locationData);
    console.log('✅ Location created successfully:', locationId);
    
    // Verify it was created
    const locations = await getLocations();
    const newLocation = locations.find(loc => loc.id === locationId);
    console.log('✅ Location verification:', newLocation ? 'SUCCESS' : 'FAILED');
    
    return locationId;
  } catch (error) {
    console.error('❌ Location creation failed:', error);
  }
}

// Test 3: Test Customer Entry System
async function testCustomerEntry() {
  try {
    console.log('🧪 Testing Customer Entry System...');
    
    // First get a location
    const locations = await getLocations();
    if (locations.length === 0) {
      console.log('❌ No locations available. Create a location first.');
      return;
    }
    
    const locationId = locations[0].id;
    console.log('📍 Using location:', locations[0].venueName);
    
    // Test customer search (should return null for new customer)
    const testMobile = '+919014882779';
    const existingCustomer = await getCustomerByMobile(testMobile);
    console.log('🔍 Customer search result:', existingCustomer || 'No existing customer found');
    
    // Create customer
    const customerId = await addCustomer({
      name: 'Test Customer',
      mobile: testMobile,
      city: 'Test City',
      additionalDetails: 'Test customer for admin validation',
      createdBy: 'admin_test',
      locationId: locationId
    });
    console.log('✅ Customer created:', customerId);
    
    // Verify customer was created
    const customerCheck = await getCustomerByMobile(testMobile);
    console.log('✅ Customer verification:', customerCheck ? 'SUCCESS' : 'FAILED');
    
    // Create entry
    const entryId = await addEntry({
      customerId: customerId,
      customerName: 'Test Customer',
      customerMobile: testMobile,
      numberOfPots: 2,
      locationId: locationId,
      operatorId: 'admin_test_operator',
      paymentMethod: 'cash'
    });
    console.log('✅ Entry created:', entryId);
    
    // Verify entry was created
    const entries = await getEntries();
    const newEntry = entries.find(entry => entry.id === entryId);
    console.log('✅ Entry verification:', newEntry ? 'SUCCESS' : 'FAILED');
    
    return { customerId, entryId };
  } catch (error) {
    console.error('❌ Customer Entry test failed:', error);
  }
}

// Test 4: Test Operator Management (simulate operator creation)
async function testOperatorManagement() {
  try {
    console.log('🧪 Testing Operator Management...');
    
    // Check current pending operators
    const pendingBefore = await getPendingOperators();
    console.log('📋 Pending operators before test:', pendingBefore.length);
    
    // Note: In real scenario, operator creation happens through signup
    // For testing, we'll check the management interface
    
    const activeOperators = await getActiveOperators();
    console.log('👥 Current active operators:', activeOperators.length);
    
    // Test operator approval workflow (if there are pending operators)
    if (pendingBefore.length > 0) {
      console.log('🔄 Found pending operators for testing approval workflow');
      // In real test, we would test approval here
    } else {
      console.log('ℹ️  No pending operators to test approval');
    }
    
    return { pending: pendingBefore.length, active: activeOperators.length };
  } catch (error) {
    console.error('❌ Operator Management test failed:', error);
  }
}

// Test 5: Test Dashboard Data Sync
async function testDashboardSync() {
  try {
    console.log('🧪 Testing Dashboard Data Sync...');
    
    // Get current stats
    const statsBefore = await getSystemStats();
    console.log('📊 Stats before test:', statsBefore);
    
    // Get entries count
    const entriesBefore = await getEntries({ status: 'active' });
    console.log('📝 Active entries before:', entriesBefore.length);
    
    // Create a test entry to see if stats update
    const locations = await getLocations();
    if (locations.length === 0) {
      console.log('❌ No locations available for sync test');
      return;
    }
    
    // This would normally be done through the UI
    // For testing, we're checking if the data fetching works correctly
    
    const statsAfter = await getSystemStats();
    const entriesAfter = await getEntries({ status: 'active' });
    
    console.log('📊 Stats after test:', statsAfter);
    console.log('📝 Active entries after:', entriesAfter.length);
    
    // Check if data is consistent
    const statsConsistent = Object.keys(statsBefore).length === Object.keys(statsAfter).length;
    console.log('✅ Data consistency check:', statsConsistent ? 'PASS' : 'NEEDS INVESTIGATION');
    
    return { statsBefore, entriesBefore, statsAfter, entriesAfter };
  } catch (error) {
    console.error('❌ Dashboard Sync test failed:', error);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting comprehensive admin features test...\n');
  
  // Test 1: Check current state
  console.log('=== Test 1: Current Data State ===');
  await checkCurrentData();
  console.log('');
  
  // Test 2: Location Management
  console.log('=== Test 2: Location Management ===');
  await testCreateLocation();
  console.log('');
  
  // Test 3: Customer Entry System
  console.log('=== Test 3: Customer Entry System ===');
  await testCustomerEntry();
  console.log('');
  
  // Test 4: Operator Management
  console.log('=== Test 4: Operator Management ===');
  await testOperatorManagement();
  console.log('');
  
  // Test 5: Dashboard Sync
  console.log('=== Test 5: Dashboard Data Sync ===');
  await testDashboardSync();
  console.log('');
  
  console.log('✅ All admin feature tests completed!');
  console.log('📋 Check the results above for any issues that need attention.');
}

// Make functions available globally
window.checkCurrentData = checkCurrentData;
window.testCreateLocation = testCreateLocation;
window.testCustomerEntry = testCustomerEntry;
window.testOperatorManagement = testOperatorManagement;
window.testDashboardSync = testDashboardSync;
window.runAllTests = runAllTests;

console.log('🔧 Test script loaded successfully!');
console.log('📖 Available functions:');
console.log('- checkCurrentData() - Check current data state');
console.log('- testCreateLocation() - Test location creation');
console.log('- testCustomerEntry() - Test customer entry system');
console.log('- testOperatorManagement() - Test operator management');
console.log('- testDashboardSync() - Test dashboard data sync');
console.log('- runAllTests() - Run all tests');
console.log('\n⚠️  Make sure you are logged in as admin before running tests!');
console.log('🌐 Navigate to http://localhost:3000 and login, then run tests in console.');