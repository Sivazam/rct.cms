// FastSMS Configuration Validator
// This script helps identify common configuration issues

const fs = require('fs');
const path = require('path');

function validateConfiguration() {
    console.log('🔍 FastSMS Configuration Validator');
    console.log('===================================');

    // Check if we have the required configuration files
    const requiredFiles = [
        '.env.local',
        'firebase.json',
        'functions/index.js'
    ];

    const existingFiles = [];
    const missingFiles = [];

    requiredFiles.forEach(file => {
        if (fs.existsSync(file)) {
            existingFiles.push(file);
        } else {
            missingFiles.push(file);
        }
    });

    console.log('\n📁 File Check:');
    console.log('✅ Existing files:', existingFiles.join(', ') || 'None');
    console.log('❌ Missing files:', missingFiles.join(', ') || 'None');

    // Check environment variables
    console.log('\n🔑 Environment Variables Check:');
    
    if (fs.existsSync('.env.local')) {
        const envContent = fs.readFileSync('.env.local', 'utf8');
        const requiredVars = [
            'FASTSMS_API_KEY',
            'FASTSMS_ENTITY_ID',
            'FASTSMS_SENDER_ID'
        ];

        const foundVars = [];
        const missingVars = [];

        requiredVars.forEach(varName => {
            if (envContent.includes(varName)) {
                foundVars.push(varName);
            } else {
                missingVars.push(varName);
            }
        });

        console.log('✅ Found variables:', foundVars.join(', ') || 'None');
        console.log('❌ Missing variables:', missingVars.join(', ') || 'None');

        // Check API key format
        const apiKeyMatch = envContent.match(/FASTSMS_API_KEY=([^\n\r]+)/);
        if (apiKeyMatch) {
            const apiKey = apiKeyMatch[1].trim();
            console.log(`🔑 API Key format: ${apiKey.length > 10 ? 'Valid length' : 'Too short'}`);
            console.log(`🔑 API Key starts with: ${apiKey.substring(0, 8)}...`);
        }
    }

    // Check Firebase Functions code
    console.log('\n⚙️  Firebase Functions Check:');
    
    if (fs.existsSync('functions/index.js')) {
        const functionsContent = fs.readFileSync('functions/index.js', 'utf8');
        
        // Check for common issues
        const checks = {
            'API endpoint': functionsContent.includes('fast2sms.com'),
            'Template ID usage': functionsContent.includes('template_id'),
            'Entity ID usage': functionsContent.includes('entity_id'),
            'Error handling': functionsContent.includes('try') && functionsContent.includes('catch'),
            'Authorization header': functionsContent.includes('authorization'),
            'Content-Type header': functionsContent.includes('Content-Type')
        };

        Object.entries(checks).forEach(([check, found]) => {
            console.log(`${found ? '✅' : '❌'} ${check}: ${found ? 'Found' : 'Missing'}`);
        });
    }

    console.log('\n📋 Common Issues to Check:');
    console.log('========================');
    console.log('1. Template ID format - should be exactly as shown in Fast2SMS portal');
    console.log('2. Entity ID format - should be exactly as shown in Fast2SMS portal');
    console.log('3. Sender ID format - should be exactly as shown in Fast2SMS portal');
    console.log('4. Message format - should match DLT template exactly');
    console.log('5. Variables format - should use {#var#}, {#var1#}, etc.');
    console.log('6. API endpoint - should be https://www.fast2sms.com/dev/bulkV2');
    console.log('7. Request headers - should include proper Content-Type');
    console.log('8. Authorization format - should be the API key itself');

    console.log('\n🎯 Next Steps:');
    console.log('==============');
    console.log('1. Update the diagnostic script with your actual configuration');
    console.log('2. Run: node fastsms-diagnostic.js');
    console.log('3. Review the results to identify the specific issue');
    console.log('4. Check Fast2SMS portal for template status and formatting');
}

validateConfiguration();