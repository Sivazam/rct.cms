// Complete Template Data Mapping for RCT CMS
// All templates with their exact variable requirements

const completeTemplateMapping = {
    // Template 1: Three Day Reminder (5 variables)
    threeDayReminder: {
        message_id: "198607",
        template_id: "1707175786299400837",
        sender_id: "ROTCMS",
        message: "నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్ లో ఉంచారు. {#var#} న గడువు ముగుస్తున్నందున వెంటనే తీసుకోగలరు లేదా కొనసాగేందుకు {#var#} నంబర్ కి సంప్రదించండి - {#var#} - ROTCMS",
        variable_count: 5,
        purpose: "Three day reminder before disposal",
        variables: [
            {
                position: 1,
                placeholder: "{#var#}",
                data_field: "deceasedName",
                description: "Deceased person name (entry name)"
            },
            {
                position: 2,
                placeholder: "{#var#}",
                data_field: "location",
                description: "Location (location this entry got registered)"
            },
            {
                position: 3,
                placeholder: "{#var#}",
                data_field: "expiryDate",
                description: "Date of expiry of storage"
            },
            {
                position: 4,
                placeholder: "{#var#}",
                data_field: "adminContact",
                description: "Admin contact number"
            },
            {
                position: 5,
                placeholder: "{#var#}",
                data_field: "location",
                description: "Location (location this entry got registered) - repeated"
            }
        ],
        api_format: {
            template_id: "198607",
            variables_order: ["deceasedName", "location", "expiryDate", "adminContact", "location"]
        }
    },

    // Template 2: Last Day Renewal (5 variables)
    lastdayRenewal: {
        message_id: "198608",
        template_id: "1707175786326312933",
        sender_id: "ROTCMS",
        message: "నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్ లో ఉంచారు. ఈ రోజు {#var#} న గడువు ముగుస్తున్నందున వెంటనే తీసుకోగలరు లేదా కొనసాగేందుకు {#var#} నంబర్ కి సంప్రదించండి - {#var#} - ROTCMS",
        variable_count: 5,
        purpose: "Last day renewal reminder",
        variables: [
            {
                position: 1,
                placeholder: "{#var#}",
                data_field: "deceasedName",
                description: "Deceased person name (entry name)"
            },
            {
                position: 2,
                placeholder: "{#var#}",
                data_field: "location",
                description: "Location (location this entry got registered)"
            },
            {
                position: 3,
                placeholder: "{#var#}",
                data_field: "expiryDate",
                description: "Date of expiry of storage"
            },
            {
                position: 4,
                placeholder: "{#var#}",
                data_field: "adminContact",
                description: "Admin contact number"
            },
            {
                position: 5,
                placeholder: "{#var#}",
                data_field: "location",
                description: "Location (location this entry got registered) - repeated"
            }
        ],
        api_format: {
            template_id: "198608",
            variables_order: ["deceasedName", "location", "expiryDate", "adminContact", "location"]
        }
    },

    // Template 3: Renewal Confirm Customer (5 variables)
    renewalConfirmCustomer: {
        message_id: "198609",
        template_id: "1707175786362862204",
        sender_id: "ROTCMS",
        message: "ధన్యవాదాలు, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్‌లో ఉంచి ఉన్నాయి. ఇవి {#var#} వరకు స్టోరేజ్ టైమ్ పొడిగించబడ్డాయి. ఏమైనా సందేహాలుంటే {#var#} నంబర్‌కి సంప్రదించండి – {#var#} - ROTCMS",
        variable_count: 5,
        purpose: "Renewal confirmation to customer",
        variables: [
            {
                position: 1,
                placeholder: "{#var#}",
                data_field: "deceasedName",
                description: "Deceased person name (entry name)"
            },
            {
                position: 2,
                placeholder: "{#var#}",
                data_field: "location",
                description: "Location (location this entry got registered)"
            },
            {
                position: 3,
                placeholder: "{#var#}",
                data_field: "newExpiryDate",
                description: "New Date of expiry of storage after renewal"
            },
            {
                position: 4,
                placeholder: "{#var#}",
                data_field: "adminContact",
                description: "Admin contact number"
            },
            {
                position: 5,
                placeholder: "{#var#}",
                data_field: "location",
                description: "Location (location this entry got registered) - repeated"
            }
        ],
        api_format: {
            template_id: "198609",
            variables_order: ["deceasedName", "location", "newExpiryDate", "adminContact", "location"]
        }
    },

    // Template 4: Renewal Confirm Admin (2 variables)
    renewalConfirmAdmin: {
        message_id: "198610",
        template_id: "1707175786389503209",
        sender_id: "ROTCMS",
        message: "{#var#} లాకర్‌లో, దివంగత {#var#} గారి అస్థికలు పొడిగించబడ్డాయి - ROTCMS",
        variable_count: 2,
        purpose: "Renewal confirmation to admin",
        variables: [
            {
                position: 1,
                placeholder: "{#var#}",
                data_field: "location",
                description: "Location renewal happened"
            },
            {
                position: 2,
                placeholder: "{#var#}",
                data_field: "deceasedName",
                description: "Deceased person name whose renewal has happened"
            }
        ],
        api_format: {
            template_id: "198610",
            variables_order: ["location", "deceasedName"]
        }
    },

    // Template 5: Dispatch Confirm Customer (7 variables)
    dispatchConfirmCustomer: {
        message_id: "198611",
        template_id: "1707175786420863806",
        sender_id: "ROTCMS",
        message: "నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్ నుండి {#var#} న {#var#} గారికి (మొబైల్: {#var#}) హ్యాండోవర్ చేయబడినాయి. ఏమైనా సందేహాలుంటే {#var#} నంబర్‌కి సంప్రదించండి – {#var#} - ROTCMS",
        variable_count: 7,
        purpose: "Dispatch confirmation to customer",
        variables: [
            {
                position: 1,
                placeholder: "{#var#}",
                data_field: "deceasedName",
                description: "Deceased person name (entry name)"
            },
            {
                position: 2,
                placeholder: "{#var#}",
                data_field: "location",
                description: "Location (location this entry got registered)"
            },
            {
                position: 3,
                placeholder: "{#var#}",
                data_field: "dispatchDate",
                description: "Date of dispatch happened"
            },
            {
                position: 4,
                placeholder: "{#var#}",
                data_field: "handoverPersonName",
                description: "Contact person name who handed over the pot"
            },
            {
                position: 5,
                placeholder: "{#var#}",
                data_field: "handoverPersonMobile",
                description: "Contact person mobile number who handed over the pot"
            },
            {
                position: 6,
                placeholder: "{#var#}",
                data_field: "adminContact",
                description: "Admin contact number"
            },
            {
                position: 7,
                placeholder: "{#var#}",
                data_field: "location",
                description: "Location (location this entry got registered) - repeated"
            }
        ],
        api_format: {
            template_id: "198611",
            variables_order: ["deceasedName", "location", "dispatchDate", "handoverPersonName", "handoverPersonMobile", "adminContact", "location"]
        }
    },

    // Template 6: Delivery Confirm Admin (2 variables)
    deliveryConfirmAdmin: {
        message_id: "198612",
        template_id: "1707175786441865610",
        sender_id: "ROTCMS",
        message: "దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్ నుండి వారి కుటుంబానికి హ్యాండోవర్ చేయబడ్డాయి - ROTCMS",
        variable_count: 2,
        purpose: "Delivery confirmation to admin",
        variables: [
            {
                position: 1,
                placeholder: "{#var#}",
                data_field: "deceasedName",
                description: "Deceased person name (entry name) whose dispatch/delivery have happened"
            },
            {
                position: 2,
                placeholder: "{#var#}",
                data_field: "location",
                description: "Location (location this entry got registered) whose dispatched"
            }
        ],
        api_format: {
            template_id: "198612",
            variables_order: ["deceasedName", "location"]
        }
    },

    // Template 7: Final Disposal Reminder Admin (3 variables)
    finalDisposalReminderAdmin: {
        message_id: "198613",
        template_id: "1707175786495860514",
        sender_id: "ROTCMS",
        message: "నమస్తే, దివంగత {#var#} గారి అస్థికలు {#var#} లాకర్‌లో 2 నెలలుగా రిన్యువల్ చేయబడలేదు. అనేక నోటీసుల తర్వాత కూడా స్పందన రాలేదు. కాబట్టి, ఇవి ఈ రోజు నుండి 3 రోజుల్లోపు రిన్యువల్ చేయకపోతే, గోదావరి నదిలో కలిపేస్తాము. తరువాత మేము బాధ్యత వహించము – {#var#} - ROTCMS",
        variable_count: 3,
        purpose: "Final disposal reminder to admin",
        variables: [
            {
                position: 1,
                placeholder: "{#var#}",
                data_field: "deceasedName",
                description: "Deceased person name (entry name)"
            },
            {
                position: 2,
                placeholder: "{#var#}",
                data_field: "location",
                description: "Location (location this entry got registered)"
            },
            {
                position: 3,
                placeholder: "{#var#}",
                data_field: "location",
                description: "Location (location this entry got registered) - repeated"
            }
        ],
        api_format: {
            template_id: "198613",
            variables_order: ["deceasedName", "location", "location"]
        }
    }
};

// Create the correct mapping for Firebase Functions
const firebaseTemplateMapping = {
    threeDayReminder: "198607",
    lastdayRenewal: "198608",
    renewalConfirmCustomer: "198609",
    renewalConfirmAdmin: "198610",
    dispatchConfirmCustomer: "198611",
    deliveryConfirmAdmin: "198612",
    finalDisposalReminderAdmin: "198613"
};

// Helper function to get variables for API call
function getTemplateVariables(templateName, data) {
    const template = completeTemplateMapping[templateName];
    if (!template) {
        throw new Error(`Template ${templateName} not found`);
    }

    const variables = template.api_format.variables_order.map(field => {
        if (!data[field]) {
            throw new Error(`Missing required field: ${field} for template ${templateName}`);
        }
        return data[field];
    });

    return {
        template_id: template.api_format.template_id,
        variables: variables,
        variable_count: template.variable_count
    };
}

console.log('🎯 COMPLETE TEMPLATE MAPPING FOR RCT CMS');
console.log('=========================================');

console.log('\n📋 FIREBASE FUNCTIONS TEMPLATE MAPPING:');
console.log(JSON.stringify(firebaseTemplateMapping, null, 2));

console.log('\n📊 DETAILED TEMPLATE BREAKDOWN:');
console.log('=================================');

Object.entries(completeTemplateMapping).forEach(([key, template]) => {
    console.log(`\n📝 ${template.purpose} (${key})`);
    console.log(`   Message ID: ${template.message_id}`);
    console.log(`   Variables (${template.variable_count}):`);
    
    template.variables.forEach(variable => {
        console.log(`   ${variable.position}. ${variable.data_field}: ${variable.description}`);
    });
    
    console.log(`   API Format: template_id: "${template.api_format.template_id}", variables: [${template.api_format.variables_order.join(', ')}]`);
});

console.log('\n🔧 USAGE EXAMPLE:');
console.log('=================');
console.log('// Example: Send threeDayReminder');
console.log('const data = {');
console.log('   deceasedName: "రాముడు",');
console.log('   location: "లాకర్-A",');
console.log('   expiryDate: "2025-09-25",');
console.log('   adminContact: "919014882779"');
console.log('};');
console.log('');
console.log('const templateData = getTemplateVariables("threeDayReminder", data);');
console.log('// Result: {');
console.log('//   template_id: "198607",');
console.log('//   variables: ["రాముడు", "లాకర్-A", "2025-09-25", "919014882779", "లాకర్-A"],');
console.log('//   variable_count: 5');
console.log('// }');

module.exports = {
    completeTemplateMapping,
    firebaseTemplateMapping,
    getTemplateVariables
};