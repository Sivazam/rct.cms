// Template Data Requirements Analysis
// Let's document what data each template needs

const templateRequirements = {
    threeDayReminder: {
        message_id: "198607",
        template_id: "1707175786299400837",
        message: "నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్ లో ఉంచారు. {#var#} న గడువు ముగుస్తున్నందున వెంటనే తీసుకోగలరు లేదా కొనసాగేందుకు {#var#} నంబర్ కి సంప్రదించండి - {#var#} - ROTCMS",
        variable_count: 5,
        // Based on your clarification:
        confirmed_variables: [
            "Deceased Name",    // {#var#}
            "Location",         // {#var#} 
            "Expiry Date",      // {#var#}
            "Admin Mobile",     // {#var#}
            "Location"          // {#var#} (same as 2)
        ],
        needs_confirmation: false
    },

    lastdayRenewal: {
        message_id: "198608",
        template_id: "1707175786326312933",
        message: "నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్ లో ఉంచారు. ఈ రోజు {#var#} న గడువు ముగుస్తున్నందున వెంటనే తీసుకోగలరు లేదా కొనసాగేందుకు {#var#} నంబర్ కి సంప్రదించండి - {#var#} - ROTCMS",
        variable_count: 5,
        needs_confirmation: true,
        question: "What are the 5 variables needed for lastdayRenewal template? (similar to threeDayReminder but for last day)"
    },

    renewalConfirmCustomer: {
        message_id: "198609",
        template_id: "1707175786362862204",
        message: "ధన్యవాదాలు, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్‌లో ఉంచి ఉన్నాయి. ఇవి {#var#} వరకు స్టోరేజ్ టైమ్ పొడిగించబడ్డాయి. ఏమైనా సందేహాలుంటే {#var#} నంబర్‌కి సంప్రదించండి – {#var#} - ROTCMS",
        variable_count: 5,
        needs_confirmation: true,
        question: "What are the 5 variables needed for renewalConfirmCustomer template? (confirming renewal to customer)"
    },

    renewalConfirmAdmin: {
        message_id: "198610",
        template_id: "1707175786389503209",
        message: "{#var#} లాకర్‌లో, దివంగత {#var#} గారి అస్థికలు పొడిగించబడ్డాయి - ROTCMS",
        variable_count: 2,
        needs_confirmation: true,
        question: "What are the 2 variables needed for renewalConfirmAdmin template? (notifying admin about renewal)"
    },

    dispatchConfirmCustomer: {
        message_id: "198611",
        template_id: "1707175786420863806",
        message: "నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్ నుండి {#var#} న {#var#} గారికి (మొబైల్: {#var#}) హ్యాండోవర్ చేయబడినాయి. ఏమైనా సందేహాలుంటే {#var#} నంబర్‌కి సంప్రదించండి – {#var#} - ROTCMS",
        variable_count: 7,
        needs_confirmation: true,
        question: "What are the 7 variables needed for dispatchConfirmCustomer template? (confirming dispatch to customer)"
    },

    deliveryConfirmAdmin: {
        message_id: "198612",
        template_id: "1707175786441865610",
        message: "దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్ నుండి వారి కుటుంబానికి హ్యాండోవర్ చేయబడ్డాయి - ROTCMS",
        variable_count: 2,
        needs_confirmation: true,
        question: "What are the 2 variables needed for deliveryConfirmAdmin template? (confirming delivery to admin)"
    },

    finalDisposalReminderAdmin: {
        message_id: "198613",
        template_id: "1707175786495860514",
        message: "నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్‌లో 2 నెలలుగా రిన్యువల్ చేయబడలేదు. అనేక నోటీసుల తర్వాత కూడా స్పందన రాలేదు. కాబట్టి, ఇవి ఈ రోజు నుండి 3 రోజుల్లోపు రిన్యువల్ చేయకపోతే, గోదావరి నదిలో కలిపేస్తాము. తరువాత మేము బాధ్యత వహించము – {#var#} - ROTCMS",
        variable_count: 3,
        needs_confirmation: true,
        question: "What are the 3 variables needed for finalDisposalReminderAdmin template? (final disposal warning to admin)"
    }
};

console.log('📋 Template Data Requirements Analysis');
console.log('=====================================');

console.log('\n✅ CONFIRMED:');
console.log('threeDayReminder (198607) - 5 variables:');
console.log('1. Deceased Name');
console.log('2. Location'); 
console.log('3. Expiry Date');
console.log('4. Admin Mobile');
console.log('5. Location (same as 2)');

console.log('\n❌ NEEDS CONFIRMATION:');
Object.entries(templateRequirements).forEach(([key, template]) => {
    if (template.needs_confirmation) {
        console.log(`\n${key} (${template.message_id}) - ${template.variable_count} variables:`);
        console.log(`Question: ${template.question}`);
        console.log(`Message: ${template.message.substring(0, 100)}...`);
    }
});

console.log('\n📝 Please provide the variable details for the remaining templates.');
console.log('For each template, tell me what data should go in each {#var#} position.');

module.exports = templateRequirements;