// FastSMS Template Mapping from DLT API Excel
// This contains the correct template IDs from Fast2SMS

const fastsmsTemplates = {
    // Template 1: Final Disposal Reminder (4 variables)
    finalDisposalReminder: {
        message_id: "198233",
        template_id: "1707175786481546224", // DLT Content Template ID
        sender_id: "ROTCMS",
        message: "నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లో {#var#} న గడువు ముగుస్తుంది. కొనసాగింపు కోసం {#var#} కి సంప్రదించండి లేదా మా వద్దకు రండి. – ROTCMS",
        variable_count: 4,
        variable_values: "Var1|Var2|Var3|Var4",
        api_url: "https://www.fast2sms.com/dev/bulkV2?authorization=<YOUR_API_KEY>&route=dlt&sender_id=ROTCMS&message=198233&variables_values=Var1|Var2|Var3|Var4&numbers=<MOBILE_NUMBER>"
    },

    // Template 2: Three Day Reminder (5 variables)
    threeDayReminder: {
        message_id: "198607",
        template_id: "1707175786299400837", // DLT Content Template ID
        sender_id: "ROTCMS",
        message: "నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్ లో ఉంచారు. {#var#} న గడువు ముగుస్తున్నందున వెంటనే తీసుకోగలరు లేదా కొనసాగేందుకు {#var#} నంబర్ కి సంప్రదించండి - {#var#} - ROTCMS",
        variable_count: 5,
        variable_values: "Var1|Var2|Var3|Var4|Var5",
        api_url: "https://www.fast2sms.com/dev/bulkV2?authorization=<YOUR_API_KEY>&route=dlt&sender_id=ROTCMS&message=198607&variables_values=Var1|Var2|Var3|Var4|Var5&numbers=<MOBILE_NUMBER>"
    },

    // Template 3: Last Day Renewal (5 variables)
    lastdayRenewal: {
        message_id: "198608",
        template_id: "1707175786326312933", // DLT Content Template ID
        sender_id: "ROTCMS",
        message: "నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్ లో ఉంచారు. ఈ రోజు {#var#} న గడువు ముగుస్తున్నందున వెంటనే తీసుకోగలరు లేదా కొనసాగేందుకు {#var#} నంబర్ కి సంప్రదించండి - {#var#} - ROTCMS",
        variable_count: 5,
        variable_values: "Var1|Var2|Var3|Var4|Var5",
        api_url: "https://www.fast2sms.com/dev/bulkV2?authorization=<YOUR_API_KEY>&route=dlt&sender_id=ROTCMS&message=198608&variables_values=Var1|Var2|Var3|Var4|Var5&numbers=<MOBILE_NUMBER>"
    },

    // Template 4: Renewal Confirm Customer (5 variables)
    renewalConfirmCustomer: {
        message_id: "198609",
        template_id: "1707175786362862204", // DLT Content Template ID
        sender_id: "ROTCMS",
        message: "ధన్యవాదాలు, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్‌లో ఉంచి ఉన్నాయి. ఇవి {#var#} వరకు స్టోరేజ్ టైమ్ పొడిగించబడ్డాయి. ఏమైనా సందేహాలుంటే {#var#} నంబర్‌కి సంప్రదించండి – {#var#} - ROTCMS",
        variable_count: 5,
        variable_values: "Var1|Var2|Var3|Var4|Var5",
        api_url: "https://www.fast2sms.com/dev/bulkV2?authorization=<YOUR_API_KEY>&route=dlt&sender_id=ROTCMS&message=198609&variables_values=Var1|Var2|Var3|Var4|Var5&numbers=<MOBILE_NUMBER>"
    },

    // Template 5: Renewal Confirm Admin (2 variables)
    renewalConfirmAdmin: {
        message_id: "198610",
        template_id: "1707175786389503209", // DLT Content Template ID
        sender_id: "ROTCMS",
        message: "{#var#} లాకర్‌లో, దివంగత {#var#} గారి అస్థికలు పొడిగించబడ్డాయి - ROTCMS",
        variable_count: 2,
        variable_values: "Var1|Var2",
        api_url: "https://www.fast2sms.com/dev/bulkV2?authorization=<YOUR_API_KEY>&route=dlt&sender_id=ROTCMS&message=198610&variables_values=Var1|Var2&numbers=<MOBILE_NUMBER>"
    },

    // Template 6: Dispatch Confirm Customer (7 variables)
    dispatchConfirmCustomer: {
        message_id: "198611",
        template_id: "1707175786420863806", // DLT Content Template ID
        sender_id: "ROTCMS",
        message: "నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్ నుండి {#var#} న {#var#} గారికి (మొబైల్: {#var#}) హ్యాండోవర్ చేయబడినాయి. ఏమైనా సందేహాలుంటే {#var#} నంబర్‌కి సంప్రదించండి – {#var#} - ROTCMS",
        variable_count: 7,
        variable_values: "Var1|Var2|Var3|Var4|Var5|Var6|Var7",
        api_url: "https://www.fast2sms.com/dev/bulkV2?authorization=<YOUR_API_KEY>&route=dlt&sender_id=ROTCMS&message=198611&variables_values=Var1|Var2|Var3|Var4|Var5|Var6|Var7&numbers=<MOBILE_NUMBER>"
    },

    // Template 7: Delivery Confirm Admin (2 variables)
    deliveryConfirmAdmin: {
        message_id: "198612",
        template_id: "1707175786441865610", // DLT Content Template ID
        sender_id: "ROTCMS",
        message: "దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్ నుండి వారి కుటుంబానికి హ్యాండోవర్ చేయబడ్డాయి - ROTCMS",
        variable_count: 2,
        variable_values: "Var1|Var2",
        api_url: "https://www.fast2sms.com/dev/bulkV2?authorization=<YOUR_API_KEY>&route=dlt&sender_id=ROTCMS&message=198612&variables_values=Var1|Var2&numbers=<MOBILE_NUMBER>"
    },

    // Template 8: Final Disposal Reminder Admin (3 variables)
    finalDisposalReminderAdmin: {
        message_id: "198613",
        template_id: "1707175786495860514", // DLT Content Template ID
        sender_id: "ROTCMS",
        message: "నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్‌లో 2 నెలలుగా రిన్యువల్ చేయబడలేదు. అనేక నోటీసుల తర్వాత కూడా స్పందన రాలేదు. కాబట్టి, ఇవి ఈ రోజు నుండి 3 రోజుల్లోపు రిన్యువల్ చేయకపోతే, గోదావరి నదిలో కలిపేస్తాము. తరువాత మేము బాధ్యత వహించము – {#var#} - ROTCMS",
        variable_count: 3,
        variable_values: "Var1|Var2|Var3",
        api_url: "https://www.fast2sms.com/dev/bulkV2?authorization=<YOUR_API_KEY>&route=dlt&sender_id=ROTCMS&message=198613&variables_values=Var1|Var2|Var3&numbers=<MOBILE_NUMBER>"
    }
};

// Create the correct mapping for Firebase Functions
const correctTemplateMapping = {
    finalDisposalReminder: "198233",        // Use message_id from Fast2SMS
    threeDayReminder: "198607",            // Use message_id from Fast2SMS
    lastdayRenewal: "198608",              // Use message_id from Fast2SMS
    renewalConfirmCustomer: "198609",      // Use message_id from Fast2SMS
    renewalConfirmAdmin: "198610",         // Use message_id from Fast2SMS
    dispatchConfirmCustomer: "198611",     // Use message_id from Fast2SMS
    deliveryConfirmAdmin: "198612",         // Use message_id from Fast2SMS
    finalDisposalReminderAdmin: "198613"   // Use message_id from Fast2SMS
};

console.log('🎯 CORRECT TEMPLATE MAPPING FOR FASTSMS:');
console.log('========================================');
console.log(JSON.stringify(correctTemplateMapping, null, 2));

console.log('\n📋 KEY INSIGHTS:');
console.log('================');
console.log('✅ Use "message_id" (198233, 198607, etc.) NOT "template_id"');
console.log('✅ These are the Fast2SMS message IDs from the Excel');
console.log('✅ All templates use sender_id: "ROTCMS"');
console.log('✅ All templates use entity_id: "1701175751242640436"');
console.log('✅ Templates are in Telugu language');

module.exports = {
    fastsmsTemplates,
    correctTemplateMapping
};