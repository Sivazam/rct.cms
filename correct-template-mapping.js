// CORRECT FastSMS Template Mapping (Updated)
// Based on the corrected Excel data you provided

const fastsmsTemplates = {
    // Template 1: Three Day Reminder (5 variables)
    threeDayReminder: {
        message_id: "198607",
        template_id: "1707175786299400837", // DLT Content Template ID
        sender_id: "ROTCMS",
        message: "నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్ లో ఉంచారు. {#var#} న గడువు ముగుస్తున్నందున వెంటనే తీసుకోగలరు లేదా కొనసాగేందుకు {#var#} నంబర్ కి సంప్రదించండి - {#var#} - ROTCMS",
        variable_count: 5,
        variable_values: "Var1|Var2|Var3|Var4|Var5",
        purpose: "Three day reminder before disposal",
        variables_meaning: ["Deceased Name", "Locker Number", "Expiry Date", "Contact Number", "Contact Person"]
    },

    // Template 2: Last Day Renewal (5 variables)
    lastdayRenewal: {
        message_id: "198608",
        template_id: "1707175786326312933", // DLT Content Template ID
        sender_id: "ROTCMS",
        message: "నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్ లో ఉంచారు. ఈ రోజు {#var#} న గడువు ముగుస్తున్నందున వెంటనే తీసుకోగలరు లేదా కొనసాగేందుకు {#var#} నంబర్ కి సంప్రదించండి - {#var#} - ROTCMS",
        variable_count: 5,
        variable_values: "Var1|Var2|Var3|Var4|Var5",
        purpose: "Last day renewal reminder",
        variables_meaning: ["Deceased Name", "Locker Number", "Expiry Date", "Contact Number", "Contact Person"]
    },

    // Template 3: Renewal Confirm Customer (5 variables)
    renewalConfirmCustomer: {
        message_id: "198609",
        template_id: "1707175786362862204", // DLT Content Template ID
        sender_id: "ROTCMS",
        message: "ధన్యవాదాలు, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్‌లో ఉంచి ఉన్నాయి. ఇవి {#var#} వరకు స్టోరేజ్ టైమ్ పొడిగించబడ్డాయి. ఏమైనా సందేహాలుంటే {#var#} నంబర్‌కి సంప్రదించండి – {#var#} - ROTCMS",
        variable_count: 5,
        variable_values: "Var1|Var2|Var3|Var4|Var5",
        purpose: "Renewal confirmation to customer",
        variables_meaning: ["Deceased Name", "Locker Number", "Extended Date", "Contact Number", "Contact Person"]
    },

    // Template 4: Renewal Confirm Admin (2 variables)
    renewalConfirmAdmin: {
        message_id: "198610",
        template_id: "1707175786389503209", // DLT Content Template ID
        sender_id: "ROTCMS",
        message: "{#var#} లాకర్‌లో, దివంగత {#var#} గారి అస్థికలు పొడిగించబడ్డాయి - ROTCMS",
        variable_count: 2,
        variable_values: "Var1|Var2",
        purpose: "Renewal confirmation to admin",
        variables_meaning: ["Locker Number", "Deceased Name"]
    },

    // Template 5: Dispatch Confirm Customer (7 variables)
    dispatchConfirmCustomer: {
        message_id: "198611",
        template_id: "1707175786420863806", // DLT Content Template ID
        sender_id: "ROTCMS",
        message: "నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్ నుండి {#var#} న {#var#} గారికి (మొబైల్: {#var#}) హ్యాండోవర్ చేయబడినాయి. ఏమైనా సందేహాలుంటే {#var#} నంబర్‌కి సంప్రదించండి – {#var#} - ROTCMS",
        variable_count: 7,
        variable_values: "Var1|Var2|Var3|Var4|Var5|Var6|Var7",
        purpose: "Dispatch confirmation to customer",
        variables_meaning: ["Deceased Name", "Source Locker", "Date", "Recipient Name", "Recipient Mobile", "Contact Number", "Contact Person"]
    },

    // Template 6: Delivery Confirm Admin (2 variables)
    deliveryConfirmAdmin: {
        message_id: "198612",
        template_id: "1707175786441865610", // DLT Content Template ID
        sender_id: "ROTCMS",
        message: "దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్ నుండి వారి కుటుంబానికి హ్యాండోవర్ చేయబడ్డాయి - ROTCMS",
        variable_count: 2,
        variable_values: "Var1|Var2",
        purpose: "Delivery confirmation to admin",
        variables_meaning: ["Deceased Name", "Locker Number"]
    },

    // Template 7: Final Disposal Reminder Admin (3 variables)
    finalDisposalReminderAdmin: {
        message_id: "198613",
        template_id: "1707175786495860514", // DLT Content Template ID
        sender_id: "ROTCMS",
        message: "నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్‌లో 2 నెలలుగా రిన్యువల్ చేయబడలేదు. అనేక నోటీసుల తర్వాత కూడా స్పందన రాలేదు. కాబట్టి, ఇవి ఈ రోజు నుండి 3 రోజుల్లోపు రిన్యువల్ చేయకపోతే, గోదావరి నదిలో కలిపేస్తాము. తరువాత మేము బాధ్యత వహించము – {#var#} - ROTCMS",
        variable_count: 3,
        variable_values: "Var1|Var2|Var3",
        purpose: "Final disposal reminder to admin",
        variables_meaning: ["Deceased Name", "Locker Number", "Contact Person"]
    }
};

// Create the correct mapping for Firebase Functions
const correctTemplateMapping = {
    threeDayReminder: "198607",           // Three day reminder before disposal
    lastdayRenewal: "198608",             // Last day renewal reminder
    renewalConfirmCustomer: "198609",     // Renewal confirmation to customer
    renewalConfirmAdmin: "198610",        // Renewal confirmation to admin
    dispatchConfirmCustomer: "198611",    // Dispatch confirmation to customer
    deliveryConfirmAdmin: "198612",      // Delivery confirmation to admin
    finalDisposalReminderAdmin: "198613" // Final disposal reminder to admin
};

console.log('🎯 CORRECT TEMPLATE MAPPING FOR FASTSMS:');
console.log('========================================');
console.log(JSON.stringify(correctTemplateMapping, null, 2));

console.log('\n📋 TEMPLATE PURPOSES AND VARIABLES:');
console.log('====================================');

Object.entries(fastsmsTemplates).forEach(([key, template]) => {
    console.log(`\n📝 ${key} (Message ID: ${template.message_id})`);
    console.log(`   Purpose: ${template.purpose}`);
    console.log(`   Variables (${template.variable_count}): ${template.variables_meaning.join(', ')}`);
    console.log(`   Message Preview: ${template.message.substring(0, 100)}...`);
});

console.log('\n🔍 HOW TO IDENTIFY WHICH TEMPLATE TO USE:');
console.log('========================================');
console.log('1. **Three Day Reminder** (198607):');
console.log('   - Use when: 3 days before disposal deadline');
console.log('   - Variables: [Deceased Name, Locker Number, Expiry Date, Contact Number, Contact Person]');
console.log('');
console.log('2. **Last Day Renewal** (198608):');
console.log('   - Use when: Today is the last day for renewal');
console.log('   - Variables: [Deceased Name, Locker Number, Expiry Date, Contact Number, Contact Person]');
console.log('');
console.log('3. **Renewal Confirm Customer** (198609):');
console.log('   - Use when: Confirming successful renewal to customer');
console.log('   - Variables: [Deceased Name, Locker Number, Extended Date, Contact Number, Contact Person]');
console.log('');
console.log('4. **Renewal Confirm Admin** (198610):');
console.log('   - Use when: Notifying admin about renewal');
console.log('   - Variables: [Locker Number, Deceased Name]');
console.log('');
console.log('5. **Dispatch Confirm Customer** (198611):');
console.log('   - Use when: Confirming dispatch to customer');
console.log('   - Variables: [Deceased Name, Source Locker, Date, Recipient Name, Recipient Mobile, Contact Number, Contact Person]');
console.log('');
console.log('6. **Delivery Confirm Admin** (198612):');
console.log('   - Use when: Confirming delivery to admin');
console.log('   - Variables: [Deceased Name, Locker Number]');
console.log('');
console.log('7. **Final Disposal Reminder Admin** (198613):');
console.log('   - Use when: Final reminder before disposal (admin only)');
console.log('   - Variables: [Deceased Name, Locker Number, Contact Person]');

module.exports = {
    fastsmsTemplates,
    correctTemplateMapping
};