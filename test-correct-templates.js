const axios = require('axios');

// Your Firebase config
const config = {
    api_key: 'QgRMDkEVHPoKaJcl3NbqyB8TW6rv9XudhY0Zj2izn57xF1wfICdGanl0ojySLuKHfrP9UDQYMsk41OC2',
    sender_id: 'ROTCMS',
    entity_id: '1701175751242640436'
};

// CORRECT TEMPLATE MAPPING (using Fast2SMS message_id)
const correctTemplateMapping = {
    finalDisposalReminder: "198233",
    threeDayReminder: "198607",
    lastdayRenewal: "198608",
    renewalConfirmCustomer: "198609",
    renewalConfirmAdmin: "198610",
    dispatchConfirmCustomer: "198611",
    deliveryConfirmAdmin: "198612",
    finalDisposalReminderAdmin: "198613"
};

// Test templates with sample data
const testTemplates = {
    finalDisposalReminder: {
        message_id: "198233",
        message: "నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లో {#var#} న గడువు ముగుస్తుంది. కొనసాగింపు కోసం {#var#} కి సంప్రదించండి లేదా మా వద్దకు రండి. – ROTCMS",
        variables: ["రాముడు", "లాకర్-1", "2025-09-25", "919014882779"]
    },
    renewalConfirmAdmin: {
        message_id: "198610",
        message: "{#var#} లాకర్‌లో, దివంగత {#var#} గారి అస్థికలు పొడిగించబడ్డాయి - ROTCMS",
        variables: ["లాకర్-A", "సీత"]
    }
};

async function testTemplate(templateName, templateConfig) {
    console.log(`\n🧪 Testing: ${templateName}`);
    console.log(`Message ID: ${templateConfig.message_id}`);
    console.log(`Variables: ${templateConfig.variables.join(', ')}`);

    try {
        const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
            authorization: config.api_key,
            sender_id: config.sender_id,
            message: templateConfig.message,
            language: 'telugu', // Changed to telugu since messages are in Telugu
            route: 'dlt',
            numbers: '919014882779', // Your admin mobile
            variables_values: templateConfig.variables,
            template_id: templateConfig.message_id, // Use message_id as template_id
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
    console.log('🚀 Testing CORRECT FastSMS Template IDs');
    console.log('========================================');
    console.log('Using config:');
    console.log(`- Sender ID: ${config.sender_id}`);
    console.log(`- Entity ID: ${config.entity_id}`);
    console.log(`- API Key: ${config.api_key.substring(0, 20)}...`);

    console.log('\n📋 CORRECT TEMPLATE MAPPING:');
    console.log(JSON.stringify(correctTemplateMapping, null, 2));

    // Test each template
    for (const [templateName, templateConfig] of Object.entries(testTemplates)) {
        await testTemplate(templateName, templateConfig);
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('\n🎯 Test complete!');
    console.log('\n📋 If this works, update your Firebase Functions with:');
    console.log('const templateIds = {');
    Object.entries(correctTemplateMapping).forEach(([key, value]) => {
        console.log(`    ${key}: "${value}",`);
    });
    console.log('};');
}

runTests();