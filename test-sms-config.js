#!/usr/bin/env node

/**
 * SMS Configuration Test Script
 * This script tests the SMS configuration and provides instructions for deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 SMS Configuration Test Script');
console.log('================================\n');

// Check functions directory structure
const functionsDir = path.join(__dirname, 'functions');
const srcDir = path.join(functionsDir, 'src');

if (!fs.existsSync(functionsDir)) {
    console.error('❌ Functions directory not found');
    process.exit(1);
}

console.log('✅ Functions directory found');

// Check required files
const requiredFiles = [
    'src/index.ts',
    'src/index.js',
    'lib/sms-templates.ts',
    'lib/sms-logs.ts',
    'package.json'
];

requiredFiles.forEach(file => {
    const filePath = path.join(functionsDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} found`);
    } else {
        console.log(`❌ ${file} missing`);
    }
});

// Check package.json dependencies
const packageJsonPath = path.join(functionsDir, 'package.json');
if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const requiredDeps = ['firebase-functions', 'firebase-admin', 'axios'];
    
    console.log('\n📦 Checking dependencies:');
    requiredDeps.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
            console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
        } else {
            console.log(`❌ ${dep}: missing`);
        }
    });
}

// Check source code for DLT configuration
const indexTsPath = path.join(srcDir, 'index.ts');
if (fs.existsSync(indexTsPath)) {
    const content = fs.readFileSync(indexTsPath, 'utf8');
    
    console.log('\n🔍 Checking DLT configuration:');
    
    if (content.includes('route=dlt')) {
        console.log('✅ DLT route configured');
    } else {
        console.log('❌ DLT route not found');
    }
    
    if (content.includes('sender_id')) {
        console.log('✅ Sender ID parameter configured');
    } else {
        console.log('❌ Sender ID parameter missing');
    }
    
    if (content.includes('variables_values')) {
        console.log('✅ Variables values parameter configured');
    } else {
        console.log('❌ Variables values parameter missing');
    }
    
    if (content.includes('message=')) {
        console.log('✅ Message (template ID) parameter configured');
    } else {
        console.log('❌ Message parameter missing');
    }
}

console.log('\n📋 Deployment Instructions:');
console.log('========================');
console.log('1. Install Firebase CLI if not already installed:');
console.log('   npm install -g firebase-tools');
console.log('');
console.log('2. Login to Firebase:');
console.log('   firebase login');
console.log('');
console.log('3. Set up Firebase project configuration:');
console.log('   firebase use your-project-id');
console.log('');
console.log('4. Configure FastSMS credentials:');
console.log('   firebase functions:config:set fastsms.api_key="YOUR_API_KEY"');
console.log('   firebase functions:config:set fastsms.sender_id="YOUR_SENDER_ID"');
console.log('   firebase functions:config:set fastsms.entity_id="YOUR_ENTITY_ID"');
console.log('');
console.log('5. Deploy functions:');
console.log('   firebase deploy --only functions');
console.log('');
console.log('6. Verify deployment:');
console.log('   firebase functions:list');
console.log('');
console.log('📞 Fast2SMS Support:');
console.log('====================');
console.log('If you encounter DND issues, contact Fast2SMS support with:');
console.log('- Your API key');
console.log('- Sender ID: ROTCMS');
console.log('- Entity ID (if configured)');
console.log('- Template IDs being used');
console.log('- Error messages received');
console.log('');
console.log('🔗 New DLT Endpoint Format:');
console.log('============================');
console.log('https://www.fast2sms.com/dev/bulkV2?authorization=(API_KEY)&route=dlt&sender_id=ROTCMS&message=TEMPLATE_ID&variables_values=VAR1|VAR2|VAR3&flash=0&numbers=PHONE_NUMBER');
console.log('');
console.log('✅ Configuration test completed!');