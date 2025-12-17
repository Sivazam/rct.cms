// Test script for dispatched lockers functionality
// Run with: bun run test-dispatched-lockers.js

const { getDispatchedLockers } = require('./src/lib/firestore.ts');

async function testDispatchedLockers() {
  try {
    console.log('🧪 Starting test for dispatched lockers...');
    
    // Test 1: Get all dispatched lockers without filter
    console.log('\n🧪 Test 1: Getting all dispatched lockers...');
    const allDispatched = await getDispatchedLockers();
    console.log(`✅ Found ${allDispatched.length} total dispatched items`);
    
    if (allDispatched.length > 0) {
      console.log('📋 Sample data:');
      allDispatched.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.sourceCollection} - ${item.originalEntryData?.customerName || 'Unknown'} (${item.originalEntryData?.locationName || 'Unknown'})`);
      });
    }
    
    // Test 2: Test with a specific location ID (use first available location)
    if (allDispatched.length > 0) {
      const firstLocationId = allDispatched[0].originalEntryData?.locationId || allDispatched[0].locationId;
      if (firstLocationId) {
        console.log(`\n🧪 Test 2: Filtering by locationId: ${firstLocationId}`);
        const filteredDispatched = await getDispatchedLockers({ locationId: firstLocationId });
        console.log(`✅ Found ${filteredDispatched.length} items for location ${firstLocationId}`);
      }
    }
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testDispatchedLockers();
}

module.exports = { testDispatchedLockers };