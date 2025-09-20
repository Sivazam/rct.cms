const axios = require('axios');

// Exact format from Fast2SMS Excel
const apiKey = 'QgRMDkEVHPoKaJcl3NbqyB8TW6rv9XudhY0Zj2izn57xF1wfICdGanl0ojySLuKHfrP9UDQYMsk41OC2';

// Test the exact URL format from Excel
async function testExcelFormat() {
    console.log('📊 Testing Exact Excel Format');
    console.log('============================');
    
    // From Excel: https://www.fast2sms.com/dev/bulkV2?authorization=<YOUR_API_KEY>&route=dlt&sender_id=ROTCMS&message=198233&variables_values=Var1|Var2|Var3|Var4&numbers=<MOBILE_NUMBER>
    
    const templateId = '198233';
    const variables = 'Test1|Test2|Test3|Test4';
    const mobileNumber = '919014882779';
    
    const exactUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=dlt&sender_id=ROTCMS&message=${templateId}&variables_values=${variables}&numbers=${mobileNumber}`;
    
    console.log('🔗 Testing URL:');
    console.log(exactUrl.substring(0, 100) + '...');
    
    try {
        const response = await axios.get(exactUrl);
        console.log('✅ SUCCESS:', response.data);
        return { success: true, data: response.data };
        
    } catch (error) {
        console.error('❌ ERROR:', error.response ? error.response.data : error.message);
        return { success: false, error: error.response ? error.response.data : error.message };
    }
}

// Test POST request with exact format
async function testPostExcelFormat() {
    console.log('\n📝 Testing POST Format (Excel Based)');
    console.log('====================================');
    
    try {
        const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
            authorization: apiKey,
            route: 'dlt',
            sender_id: 'ROTCMS',
            message: '198233',
            variables_values: 'Test1|Test2|Test3|Test4',
            numbers: '919014882779'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'cache-control': 'no-cache'
            }
        });

        console.log('✅ SUCCESS:', response.data);
        return { success: true, data: response.data };
        
    } catch (error) {
        console.error('❌ ERROR:', error.response ? error.response.data : error.message);
        return { success: false, error: error.response ? error.response.data : error.message };
    }
}

// Test with minimal required parameters
async function testMinimalFormat() {
    console.log('\n🔧 Testing Minimal Format');
    console.log('========================');
    
    try {
        const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
            authorization: apiKey,
            route: 'dlt',
            sender_id: 'ROTCMS',
            message: '198233',
            numbers: '919014882779'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'cache-control': 'no-cache'
            }
        });

        console.log('✅ SUCCESS:', response.data);
        return { success: true, data: response.data };
        
    } catch (error) {
        console.error('❌ ERROR:', error.response ? error.response.data : error.message);
        return { success: false, error: error.response ? error.response.data : error.message };
    }
}

async function runAllTests() {
    console.log('🚀 FastSMS Excel Format Test');
    console.log('============================');
    console.log('API Key:', apiKey.substring(0, 20) + '...');
    
    const results = [];
    
    results.push(await testExcelFormat());
    results.push(await testPostExcelFormat());
    results.push(await testMinimalFormat());
    
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    results.forEach((result, index) => {
        const testName = ['Excel GET Format', 'Excel POST Format', 'Minimal Format'][index];
        console.log(`${result.success ? '✅' : '❌'} ${testName}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    });
    
    const anySuccess = results.some(r => r.success);
    if (!anySuccess) {
        console.log('\n🚨 ALL TESTS FAILED - API KEY ISSUE');
        console.log('====================================');
        console.log('Possible issues:');
        console.log('1. API key is invalid or expired');
        console.log('2. API key format is incorrect');
        console.log('3. Account is suspended or has no balance');
        console.log('4. Fast2SMS API endpoint has changed');
        console.log('5. IP address is blocked');
        
        console.log('\n🔧 Troubleshooting Steps:');
        console.log('1. Login to Fast2SMS portal');
        console.log('2. Check API key in Settings → API');
        console.log('3. Verify account balance');
        console.log('4. Check if account is active');
        console.log('5. Try generating a new API key');
    }
    
    return results;
}

runAllTests();