const axios = require('axios');

// FastSMS API Configuration
const FASTSMS_API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your actual API key
const FASTSMS_API_URL = 'https://www.fast2sms.com/dev/bulkV2';

// Template configurations - replace with your actual values
const templates = {
    finalDisposalReminder: {
        template_id: '1707175786481546224',
        entity_id: '1701175751242640436',
        sender_id: 'ROTCMS',
        message: 'Your item with ID {#var#} is ready for final disposal. Please collect it from our center. - ROTCMS',
        variables: ['ITEM123']
    },
    threeDayReminder: {
        template_id: '1707175786299400837',
        entity_id: '1701175751242640436',
        sender_id: 'ROTCMS',
        message: 'Reminder: Your item with ID {#var#} will be disposed in 3 days. Please renew or collect. - ROTCMS',
        variables: ['ITEM456']
    },
    lastdayRenewal: {
        template_id: '1707175786326312933',
        entity_id: '1701175751242640436',
        sender_id: 'ROTCMS',
        message: 'Last day reminder: Renew your item {#var#} today to avoid disposal. Contact us immediately. - ROTCMS',
        variables: ['ITEM789']
    },
    renewalConfirmCustomer: {
        template_id: '1707175786362862204',
        entity_id: '1701175751242640436',
        sender_id: 'ROTCMS',
        message: 'Your item {#var#} has been successfully renewed. Thank you for using our service. - ROTCMS',
        variables: ['ITEM101']
    },
    renewalConfirmAdmin: {
        template_id: '1707175786389503209',
        entity_id: '1701175751242640436',
        sender_id: 'ROTCMS',
        message: 'Admin: Item {#var#} has been renewed by customer. Please update records. - ROTCMS',
        variables: ['ITEM202']
    },
    dispatchConfirmCustomer: {
        template_id: '1707175786420863806',
        entity_id: '1701175751242640436',
        sender_id: 'ROTCMS',
        message: 'Your item {#var#} has been dispatched. Track your delivery with ID: {#var1#}. - ROTCMS',
        variables: ['ITEM303', 'TRACK123']
    },
    deliveryConfirmAdmin: {
        template_id: '1707175786441865610',
        entity_id: '1701175751242640436',
        sender_id: 'ROTCMS',
        message: 'Admin: Item {#var#} has been delivered successfully. Tracking ID: {#var1#}. - ROTCMS',
        variables: ['ITEM404', 'TRACK456']
    },
    finalDisposalReminderAdmin: {
        template_id: '1707175786495860514',
        entity_id: '1701175751242640436',
        sender_id: 'ROTCMS',
        message: 'Admin: Item {#var#} is ready for final disposal. Please take necessary action. - ROTCMS',
        variables: ['ITEM505']
    }
};

async function testTemplate(templateName, templateConfig) {
    console.log(`\n🧪 Testing template: ${templateName}`);
    console.log(`Template ID: ${templateConfig.template_id}`);
    console.log(`Entity ID: ${templateConfig.entity_id}`);
    console.log(`Sender ID: ${templateConfig.sender_id}`);
    console.log(`Message: ${templateConfig.message}`);
    console.log(`Variables: ${templateConfig.variables.join(', ')}`);

    try {
        const response = await axios.post(FASTSMS_API_URL, {
            authorization: FASTSMS_API_KEY,
            sender_id: templateConfig.sender_id,
            message: templateConfig.message,
            language: 'english',
            route: 'dlt',
            numbers: '919876543210', // Test number
            variables_values: templateConfig.variables,
            template_id: templateConfig.template_id,
            entity_id: templateConfig.entity_id
        }, {
            headers: {
                'Content-Type': 'application/json',
                'cache-control': 'no-cache'
            }
        });

        console.log('✅ Success:', response.data);
        return { success: true, data: response.data };

    } catch (error) {
        console.error('❌ Error:', error.response ? error.response.data : error.message);
        return { success: false, error: error.response ? error.response.data : error.message };
    }
}

async function runDiagnostic() {
    console.log('🚀 Starting FastSMS Diagnostic Test');
    console.log('=====================================');

    const results = {};
    
    for (const [templateName, templateConfig] of Object.entries(templates)) {
        results[templateName] = await testTemplate(templateName, templateConfig);
        
        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n📊 Summary of Results:');
    console.log('======================');
    
    const successful = Object.entries(results).filter(([_, result]) => result.success);
    const failed = Object.entries(results).filter(([_, result]) => !result.success);
    
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    
    if (failed.length > 0) {
        console.log('\n❌ Failed Templates:');
        failed.forEach(([templateName, result]) => {
            console.log(`- ${templateName}: ${result.error}`);
        });
    }

    return results;
}

// Run the diagnostic
runDiagnostic().then(results => {
    console.log('\n🎯 Diagnostic complete!');
    process.exit(0);
}).catch(error => {
    console.error('💥 Diagnostic failed:', error);
    process.exit(1);
});