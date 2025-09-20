// CORRECT Template ID vs Message ID Mapping for Fast2SMS
// Template IDs = DLT Template IDs (same as before)
// Message IDs = Fast2SMS Message IDs (198607, 198608, etc.)

const correctMapping = {
    // Template 1: Three Day Reminder
    threeDayReminder: {
        dlt_template_id: "1707175786299400837",  // This is the TEMPLATE ID (same as before)
        fastsms_message_id: "198607",           // This is the MESSAGE ID (from Fast2SMS)
        sender_id: "ROTCMS",
        message: "నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్ లో ఉంచారు. {#var#} న గడువు ముగుస్తున్నందున వెంటనే తీసుకోగలరు లేదా కొనసాగేందుకు {#var#} నంబర్ కి సంప్రదించండి - {#var#} - ROTCMS",
        variable_count: 5,
        purpose: "Three day reminder before disposal",
        variables: [
            "deceasedName",    // Deceased person name (entry name)
            "location",         // Location (location this entry got registered)
            "expiryDate",      // Date of expiry of storage
            "adminContact",    // Admin contact number
            "location"         // Location (location this entry got registered) - repeated
        ]
    },

    // Template 2: Last Day Renewal
    lastdayRenewal: {
        dlt_template_id: "1707175786326312933",  // This is the TEMPLATE ID (same as before)
        fastsms_message_id: "198608",           // This is the MESSAGE ID (from Fast2SMS)
        sender_id: "ROTCMS",
        message: "నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్ లో ఉంచారు. ఈ రోజు {#var#} న గడువు ముగుస్తున్నందున వెంటనే తీసుకోగలరు లేదా కొనసాగేందుకు {#var#} నంబర్ కి సంప్రదించండి - {#var#} - ROTCMS",
        variable_count: 5,
        purpose: "Last day renewal reminder",
        variables: [
            "deceasedName",    // Deceased person name (entry name)
            "location",         // Location (location this entry got registered)
            "expiryDate",      // Date of expiry of storage
            "adminContact",    // Admin contact number
            "location"         // Location (location this entry got registered) - repeated
        ]
    },

    // Template 3: Renewal Confirm Customer
    renewalConfirmCustomer: {
        dlt_template_id: "1707175786362862204",  // This is the TEMPLATE ID (same as before)
        fastsms_message_id: "198609",           // This is the MESSAGE ID (from Fast2SMS)
        sender_id: "ROTCMS",
        message: "ధన్యవాదాలు, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్‌లో ఉంచి ఉన్నాయి. ఇవి {#var#} వరకు స్టోరేజ్ టైమ్ పొడిగించబడ్డాయి. ఏమైనా సందేహాలుంటే {#var#} నంబర్‌కి సంప్రదించండి – {#var#} - ROTCMS",
        variable_count: 5,
        purpose: "Renewal confirmation to customer",
        variables: [
            "deceasedName",    // Deceased person name (entry name)
            "location",         // Location (location this entry got registered)
            "newExpiryDate",   // New Date of expiry of storage after renewal
            "adminContact",    // Admin contact number
            "location"         // Location (location this entry got registered) - repeated
        ]
    },

    // Template 4: Renewal Confirm Admin
    renewalConfirmAdmin: {
        dlt_template_id: "1707175786389503209",  // This is the TEMPLATE ID (same as before)
        fastsms_message_id: "198610",           // This is the MESSAGE ID (from Fast2SMS)
        sender_id: "ROTCMS",
        message: "{#var#} లాకర్‌లో, దివంగత {#var#} గారి అస్థికలు పొడిగించబడ్డాయి - ROTCMS",
        variable_count: 2,
        purpose: "Renewal confirmation to admin",
        variables: [
            "location",         // Location renewal happened
            "deceasedName"     // Deceased person name whose renewal has happened
        ]
    },

    // Template 5: Dispatch Confirm Customer
    dispatchConfirmCustomer: {
        dlt_template_id: "1707175786420863806",  // This is the TEMPLATE ID (same as before)
        fastsms_message_id: "198611",           // This is the MESSAGE ID (from Fast2SMS)
        sender_id: "ROTCMS",
        message: "నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్ నుండి {#var#} న {#var#} గారికి (మొబైల్: {#var#}) హ్యాండోవర్ చేయబడినాయి. ఏమైనా సందేహాలుంటే {#var#} నంబర్‌కి సంప్రదించండి – {#var#} - ROTCMS",
        variable_count: 7,
        purpose: "Dispatch confirmation to customer",
        variables: [
            "deceasedName",        // Deceased person name (entry name)
            "location",             // Location (location this entry got registered)
            "dispatchDate",         // Date of dispatch happened
            "handoverPersonName",   // Contact person name who handed over the pot
            "handoverPersonMobile", // Contact person mobile number who handed over the pot
            "adminContact",         // Admin contact number
            "location"              // Location (location this entry got registered) - repeated
        ]
    },

    // Template 6: Delivery Confirm Admin
    deliveryConfirmAdmin: {
        dlt_template_id: "1707175786441865610",  // This is the TEMPLATE ID (same as before)
        fastsms_message_id: "198612",           // This is the MESSAGE ID (from Fast2SMS)
        sender_id: "ROTCMS",
        message: "దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్ నుండి వారి కుటుంబానికి హ్యాండోవర్ చేయబడ్డాయి - ROTCMS",
        variable_count: 2,
        purpose: "Delivery confirmation to admin",
        variables: [
            "deceasedName",    // Deceased person name (entry name) whose dispatch/delivery have happened
            "location"         // Location (location this entry got registered) whose dispatched
        ]
    },

    // Template 7: Final Disposal Reminder Admin
    finalDisposalReminderAdmin: {
        dlt_template_id: "1707175786495860514",  // This is the TEMPLATE ID (same as before)
        fastsms_message_id: "198613",           // This is the MESSAGE ID (from Fast2SMS)
        sender_id: "ROTCMS",
        message: "నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్‌లో 2 నెలలుగా రిన్యువల్ చేయబడలేదు. అనేక నోటీసుల తర్వాత కూడా స్పందన రాలేదు. కాబట్టి, ఇవి ఈ రోజు నుండి 3 రోజుల్లోపు రిన్యువల్ చేయకపోతే, గోదావరి నదిలో కలిపేస్తాము. తరువాత మేము బాధ్యత వహించము – {#var#} - ROTCMS",
        variable_count: 3,
        purpose: "Final disposal reminder to admin",
        variables: [
            "deceasedName",    // Deceased person name (entry name)
            "location",         // Location (location this entry got registered)
            "location"          // Location (location this entry got registered) - repeated
        ]
    }
};

// CORRECT Firebase Functions Template Mapping
// For Fast2SMS API, we use the MESSAGE ID in the "message" parameter
const firebaseTemplateMapping = {
    threeDayReminder: "198607",           // Use this in "message" parameter
    lastdayRenewal: "198608",             // Use this in "message" parameter
    renewalConfirmCustomer: "198609",     // Use this in "message" parameter
    renewalConfirmAdmin: "198610",        // Use this in "message" parameter
    dispatchConfirmCustomer: "198611",    // Use this in "message" parameter
    deliveryConfirmAdmin: "198612",      // Use this in "message" parameter
    finalDisposalReminderAdmin: "198613"  // Use this in "message" parameter
};

console.log('🎯 CORRECT TEMPLATE vs MESSAGE ID MAPPING');
console.log('========================================');

console.log('\n📋 KEY UNDERSTANDING:');
console.log('====================');
console.log('❌ WRONG: Using DLT Template IDs in Fast2SMS API');
console.log('✅ CORRECT: Using Fast2SMS Message IDs in API "message" parameter');
console.log('');
console.log('📊 Template IDs (DLT) vs Message IDs (Fast2SMS):');
console.log('==============================================');

Object.entries(correctMapping).forEach(([key, template]) => {
    console.log(`\n📝 ${template.purpose} (${key}):`);
    console.log(`   DLT Template ID: ${template.dlt_template_id}`);
    console.log(`   FastSMS Message ID: ${template.fastsms_message_id}`);
    console.log(`   API Usage: message: "${template.fastsms_message_id}"`);
});

console.log('\n🔧 CORRECT FIREBASE FUNCTIONS MAPPING:');
console.log('=====================================');
console.log('const templateIds = {');
Object.entries(firebaseTemplateMapping).forEach(([key, messageId]) => {
    console.log(`    ${key}: "${messageId}",`);
});
console.log('};');

console.log('\n📝 CORRECT API CALL FORMAT:');
console.log('==========================');
console.log('axios.post("https://www.fast2sms.com/dev/bulkV2", {');
console.log('    authorization: "YOUR_API_KEY",');
console.log('    sender_id: "ROTCMS",');
console.log('    message: "198607",           // ← Use FastSMS Message ID here');
console.log('    language: "telugu",');
console.log('    route: "dlt",');
console.log('    numbers: "919014882779",');
console.log('    variables_values: ["రాముడు", "లాకర్-A", "2025-09-25", "919014882779", "లాకర్-A"],');
console.log('    entity_id: "1701175751242640436"');
console.log('});');

console.log('\n🎯 SUMMARY:');
console.log('============');
console.log('✅ Template IDs (DLT): 1707175786299400837, etc. (same as before)');
console.log('✅ Message IDs (Fast2SMS): 198607, 198608, etc. (from Excel)');
console.log('✅ API Parameter: Use Message ID in "message" field');
console.log('✅ Template IDs are NOT used in Fast2SMS API calls');

module.exports = {
    correctMapping,
    firebaseTemplateMapping
};