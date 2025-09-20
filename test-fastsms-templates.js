const axios = require('axios');

// Your Firebase config (from firebase functions:config:get)
const config = {
    api_key: 'QgRMDkEVHPoKaJcl3NbqyB8TW6rv9XudhY0Zj2izn57xF1wfICdGanl0ojySLuKHfrP9UDQYMsk41OC2',
    sender_id: 'ROTCMS',
    entity_id: '1701175751242640436'
};

// Template mapping - UPDATE THESE WITH Fast2SMS TEMPLATE IDs
const templates = {
    finalDisposalReminder: {
        template_id: 'PASTE_FAST2SMS_TEMPLATE_ID_HERE', // ← UPDATE THIS
        message: 'Your item with ID {#var#} is ready for final disposal. Please collect it from our center. - ROTCMS',
        variables: ['TEST001']
    },
    threeDayReminder: {
        template_id: 'PASTE_FAST2SMS_TEMPLATE_ID_HERE', // ← UPDATE THIS
        message: 'Reminder: Your item with ID {#var#} will be disposed in 3 days. Please renew or collect. - ROTCMS',
        variables: ['TEST002']
    }
    // Add other templates as needed
};

async function testTemplate(templateName, templateConfig) {
    console.log(`\n🧪 Testing: ${templateName}`);
    console.log(`Template ID: ${templateConfig.template_id}`);
    console.log(`Message: ${templateConfig.message}`);
    console.log(`Variables: ${templateConfig.variables.join(', ')}`);

    try {
        const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
            authorization: config.api_key,
            sender_id: config.sender_id,
            message: templateConfig.message,
            language: 'english',
            route: 'dlt',
            numbers: '919014882779', // Your admin mobile for testing
            variables_values: templateConfig.variables,
            template_id: templateConfig.template_id,
            entity_id: config.entity_id
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

async function runTests() {
    console.log('🚀 FastSMS Template Test');
    console.log('========================');
    console.log('Using config:');
    console.log(`- Sender ID: ${config.sender_id}`);
    console.log(`- Entity ID: ${config.entity_id}`);
    console.log(`- API Key: ${config.api_key.substring(0, 20)}...`);

    // Test each template
    for (const [templateName, templateConfig] of Object.entries(templates)) {
        if (templateConfig.template_id === 'PASTE_FAST2SMS_TEMPLATE_ID_HERE') {
            console.log(`\n⚠️  Skipping ${templateName} - template ID not updated`);
            continue;
        }

        await testTemplate(templateName, templateConfig);
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('\n🎯 Test complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Login to Fast2SMS portal');
    console.log('2. Go to SMS → DLT Templates');
    console.log('3. Copy the Template IDs from Fast2SMS');
    console.log('4. Update them in this script');
    console.log('5. Run: node test-fastsms-templates.js');
}

runTests();