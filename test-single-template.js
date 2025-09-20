// Simple test script - run this after fixing template registration
// Usage: node test-single-template.js

const axios = require('axios');

const FASTSMS_CONFIG = {
  apiKey: 'QgRMDkEVHPoKaJcl3NbqyB8TW6rv9XudhY0Zj2izn57xF1wfICdGanl0ojySLuKHfrP9UDQYMsk41OC2',
  senderId: 'ROTCMS',
  entityId: '1701175751242640436',
  baseUrl: 'https://www.fast2sms.com/dev/bulkV2'
};

// Test just one template with minimal variables
async function testSingleTemplate() {
  const templateId = '1707175786481546224'; // finalDisposalReminder
  const simpleVariables = 'Test|Test|Test'; // Simple test variables
  
  try {
    console.log('🔍 Testing single template after Fast2SMS fix...');
    console.log('🔍 Template ID:', templateId);
    console.log('🔍 Variables:', simpleVariables);
    
    const url = new URL(FASTSMS_CONFIG.baseUrl);
    url.searchParams.append('authorization', FASTSMS_CONFIG.apiKey);
    url.searchParams.append('route', 'dlt');
    url.searchParams.append('sender_id', FASTSMS_CONFIG.senderId);
    url.searchParams.append('message', templateId);
    url.searchParams.append('variables_values', simpleVariables);
    url.searchParams.append('flash', '0');
    url.searchParams.append('numbers', '9876543210');
    url.searchParams.append('entity_id', FASTSMS_CONFIG.entityId);

    console.log('🔍 Making API request...');
    const response = await axios.get(url.toString(), {
      timeout: 30000,
      headers: { 'User-Agent': 'RCT-CMS/1.0' }
    });

    console.log('🎉 API Response:', response.data);
    
    if (response.data.return === true) {
      console.log('✅ SUCCESS! Template is working correctly');
      console.log('📝 Request ID:', response.data.request_id);
    } else {
      console.log('❌ FAILED:', response.data.message);
      console.log('🔍 Full response:', response.data);
    }
    
  } catch (error) {
    console.log('❌ ERROR:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.log('🔍 Error details:', error.response.data);
    }
  }
}

// Run the test
testSingleTemplate();