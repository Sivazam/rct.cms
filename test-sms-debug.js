#!/usr/bin/env node

/**
 * SMS Debug Test Script
 * This script helps test the Firebase debug function to identify SMS configuration issues
 */

const https = require('https');

// Firebase project configuration - UPDATE THESE VALUES
const FIREBASE_CONFIG = {
    projectId: 'your-project-id', // Replace with your Firebase project ID
    apiKey: 'your-api-key', // Replace with your Firebase API key
};

// Test configuration
const TEST_CONFIG = {
    templateKey: 'finalDisposalReminder', // Template to test
    testMobile: '919014882779', // Test mobile number
};

// Firebase function endpoint
function getFunctionUrl(functionName) {
    return `https://${FIREBASE_CONFIG.projectId}-us-central1.cloudfunctions.net/${functionName}`;
}

// Make authenticated request to Firebase function
async function callFirebaseFunction(functionName, data) {
    return new Promise((resolve, reject) => {
        const url = getFunctionUrl(functionName);
        const postData = JSON.stringify(data);
        
        const options = {
            hostname: `${FIREBASE_CONFIG.projectId}-us-central1.cloudfunctions.net`,
            port: 443,
            path: `/${functionName}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Authorization': `Bearer ${FIREBASE_CONFIG.apiKey}`, // This might need to be adjusted
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    resolve({
                        status: res.statusCode,
                        data: parsedData
                    });
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

// Main test function
async function runTests() {
    console.log('🔍 SMS Debug Test Script');
    console.log('========================');
    console.log('Project ID:', FIREBASE_CONFIG.projectId);
    console.log('Template Key:', TEST_CONFIG.templateKey);
    console.log('Test Mobile:', TEST_CONFIG.testMobile);
    console.log('');

    // Test 1: Debug Configuration
    console.log('📋 Test 1: Debug Configuration');
    console.log('------------------------------');
    try {
        const result = await callFirebaseFunction('debugTemplateConfig', {
            templateKey: TEST_CONFIG.templateKey
        });
        
        console.log('Status:', result.status);
        console.log('Response:', JSON.stringify(result.data, null, 2));
        
        if (result.data && result.data.debug) {
            console.log('\n📊 Configuration Summary:');
            console.log('  - API Key Configured:', result.data.debug.config.hasApiKey);
            console.log('  - Sender ID Configured:', result.data.debug.config.hasSenderId);
            console.log('  - Entity ID Configured:', result.data.debug.config.hasEntityId);
            console.log('  - Entity ID:', result.data.debug.config.entityId);
            console.log('  - Sender ID:', result.data.debug.config.senderId);
            console.log('  - Active Templates:', result.data.debug.templates.active);
            console.log('  - Total Templates:', result.data.debug.templates.total);
        }
    } catch (error) {
        console.error('❌ Test 1 Failed:', error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: API Call Test
    console.log('📞 Test 2: API Call Test');
    console.log('------------------------');
    try {
        const result = await callFirebaseFunction('debugTemplateConfig', {
            templateKey: TEST_CONFIG.templateKey,
            testMobile: TEST_CONFIG.testMobile
        });
        
        console.log('Status:', result.status);
        console.log('Response:', JSON.stringify(result.data, null, 2));
        
        if (result.data && result.data.debug && result.data.debug.apiTest) {
            const apiTest = result.data.debug.apiTest;
            console.log('\n📊 API Test Summary:');
            console.log('  - Success:', apiTest.success);
            console.log('  - Message:', apiTest.message || 'No message');
            if (apiTest.error) {
                console.log('  - Error:', apiTest.error);
            }
        }
    } catch (error) {
        console.error('❌ Test 2 Failed:', error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    console.log('✅ Tests completed!');
}

// Check if configuration is set
function checkConfiguration() {
    const issues = [];
    
    if (FIREBASE_CONFIG.projectId === 'your-project-id') {
        issues.push('Firebase Project ID not configured');
    }
    
    if (FIREBASE_CONFIG.apiKey === 'your-api-key') {
        issues.push('Firebase API Key not configured');
    }
    
    if (issues.length > 0) {
        console.error('❌ Configuration Issues:');
        issues.forEach(issue => console.error(`  - ${issue}`));
        console.error('\nPlease update the FIREBASE_CONFIG object in this script.');
        process.exit(1);
    }
}

// Run the tests
if (require.main === module) {
    checkConfiguration();
    runTests().catch(console.error);
}

module.exports = { callFirebaseFunction, runTests, checkConfiguration };