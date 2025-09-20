const axios = require('axios');

// Test API authentication with different formats
const apiKey = 'QgRMDkEVHPoKaJcl3NbqyB8TW6rv9XudhY0Zj2izn57xF1wfICdGanl0ojySLuKHfrP9UDQYMsk41OC2';

async function testAuthFormat() {
    console.log('🔐 Testing API Authentication Formats');
    console.log('=====================================');
    
    const testUrl = 'https://www.fast2sms.com/dev/bulkV2';
    const testData = {
        sender_id: 'ROTCMS',
        message: 'Test message',
        language: 'english',
        route: 'dlt',
        numbers: '919014882779',
        variables_values: ['test'],
        template_id: '198233',
        entity_id: '1701175751242640436'
    };

    // Test different authentication formats
    const authFormats = [
        { name: 'Direct API Key', auth: apiKey },
        { name: 'Bearer Token', auth: `Bearer ${apiKey}` },
        { name: 'Basic Auth', auth: `Basic ${Buffer.from(apiKey).toString('base64')}` }
    ];

    for (const format of authFormats) {
        console.log(`\n🧪 Testing: ${format.name}`);
        
        try {
            const response = await axios.post(testUrl, {
                ...testData,
                authorization: format.auth
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'cache-control': 'no-cache'
                }
            });

            console.log('✅ SUCCESS:', response.data);
            return { success: true, format: format.name, data: response.data };

        } catch (error) {
            console.error('❌ ERROR:', error.response ? error.response.data : error.message);
        }
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n📋 All authentication formats failed');
    console.log('This suggests either:');
    console.log('1. API key is invalid or expired');
    console.log('2. API key format is incorrect');
    console.log('3. Account balance is insufficient');
    console.log('4. API endpoint has changed');
    
    return { success: false };
}

// Test with GET request (as shown in Excel)
async function testGetRequest() {
    console.log('\n🌐 Testing GET Request Format');
    console.log('============================');
    
    const testNumber = '919014882779';
    const templateId = '198233';
    const variables = 'Test1|Test2|Test3|Test4';
    
    const getUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=dlt&sender_id=ROTCMS&message=${templateId}&variables_values=${variables}&numbers=${testNumber}`;
    
    console.log('Testing URL:', getUrl.substring(0, 100) + '...');
    
    try {
        const response = await axios.get(getUrl, {
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

async function runAuthTests() {
    console.log('🚀 FastSMS Authentication Test');
    console.log('==============================');
    console.log('API Key:', apiKey.substring(0, 20) + '...');
    
    await testAuthFormat();
    await testGetRequest();
    
    console.log('\n🎯 Test complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Check if API key is valid in Fast2SMS portal');
    console.log('2. Verify account balance');
    console.log('3. Confirm sender_id and entity_id are correct');
    console.log('4. Check if templates are approved in Fast2SMS');
}

runAuthTests();