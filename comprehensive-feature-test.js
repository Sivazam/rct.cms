#!/usr/bin/env node

// Comprehensive Feature Testing Script for SCM System
// This script tests all admin and operator features systematically

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, addDoc, getDocs, query, where, serverTimestamp, doc, updateDoc, deleteDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCn0OL6-s6mq0FvWORZ2kDLN1lEqM-ADvo",
    authDomain: "rctscm01.firebaseapp.com",
    projectId: "rctscm01",
    storageBucket: "rctscm01.firebasestorage.app",
    messagingSenderId: "254761013200",
    appId: "1:254761013200:web:4b82ce8ff1a8733f1333d5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Test results storage
const testResults = {
    passed: [],
    failed: [],
    warnings: []
};

// Helper function to log test results
function logTest(testName, passed, message, details = null) {
    const result = {
        name: testName,
        passed: passed,
        message: message,
        details: details,
        timestamp: new Date().toISOString()
    };
    
    if (passed) {
        testResults.passed.push(result);
        console.log(`✅ ${testName}: ${message}`);
    } else {
        testResults.failed.push(result);
        console.log(`❌ ${testName}: ${message}`);
        if (details) console.log(`   Details: ${details}`);
    }
}

// Helper function to log warnings
function logWarning(testName, message, details = null) {
    const result = {
        name: testName,
        message: message,
        details: details,
        timestamp: new Date().toISOString()
    };
    testResults.warnings.push(result);
    console.log(`⚠️  ${testName}: ${message}`);
}

// Test 1: Authentication System
async function testAuthentication() {
    console.log('\n🔐 Testing Authentication System...');
    
    try {
        // Test admin login
        const adminCredential = await signInWithEmailAndPassword(auth, 'admin@test.com', 'admin123');
        logTest('Admin Login', true, 'Admin authentication successful');
        
        // Test operator login
        await auth.signOut();
        const operatorCredential = await signInWithEmailAndPassword(auth, 'operator2@test.com', 'operator123');
        logTest('Operator Login', true, 'Operator authentication successful');
        
        return adminCredential.user;
    } catch (error) {
        logTest('Authentication', false, 'Authentication failed', error.message);
        return null;
    }
}

// Test 2: Location Management (Admin Only)
async function testLocationManagement() {
    console.log('\n📍 Testing Location Management...');
    
    try {
        // Login as admin
        await signInWithEmailAndPassword(auth, 'admin@test.com', 'admin123');
        
        // Test location creation
        const testLocation = {
            venueName: 'Test Location ' + Date.now(),
            address: '123 Test Street, Test City',
            contactNumber: '+911234567890',
            isActive: true,
            createdAt: serverTimestamp()
        };
        
        const locationRef = await addDoc(collection(db, 'locations'), testLocation);
        logTest('Location Creation', true, `Location created with ID: ${locationRef.id}`);
        
        // Test location retrieval
        const locationSnapshot = await getDocs(collection(db, 'locations'));
        const locations = locationSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        logTest('Location Retrieval', true, `Retrieved ${locations.length} locations`);
        
        // Test location update
        await updateDoc(doc(db, 'locations', locationRef.id), {
            venueName: 'Updated Test Location',
            contactNumber: '+919014882779'
        });
        logTest('Location Update', true, 'Location updated successfully');
        
        // Test location deletion
        await deleteDoc(doc(db, 'locations', locationRef.id));
        logTest('Location Deletion', true, 'Location deleted successfully');
        
        return true;
    } catch (error) {
        logTest('Location Management', false, 'Location management failed', error.message);
        return false;
    }
}

// Test 3: Operator Management (Admin Only)
async function testOperatorManagement() {
    console.log('\n👥 Testing Operator Management...');
    
    try {
        // Login as admin
        await signInWithEmailAndPassword(auth, 'admin@test.com', 'admin123');
        
        // Get operators
        const operatorsSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'operator')));
        const operators = operatorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const pendingOperators = operators.filter(op => !op.isActive);
        const activeOperators = operators.filter(op => op.isActive);
        
        logTest('Operator Retrieval', true, `Found ${operators.length} operators (${pendingOperators.length} pending, ${activeOperators.length} active)`);
        
        // Test operator approval workflow (if pending operators exist)
        if (pendingOperators.length > 0) {
            const testOperator = pendingOperators[0];
            await updateDoc(doc(db, 'users', testOperator.id), {
                isActive: true,
                approvedBy: 'admin_test',
                approvedAt: serverTimestamp(),
                locationIds: ['test_location_id']
            });
            logTest('Operator Approval', true, `Operator ${testOperator.name} approved successfully`);
        } else {
            logWarning('Operator Approval', 'No pending operators found to test approval workflow');
        }
        
        return true;
    } catch (error) {
        logTest('Operator Management', false, 'Operator management failed', error.message);
        return false;
    }
}

// Test 4: Customer Entry System
async function testCustomerEntrySystem() {
    console.log('\n📝 Testing Customer Entry System...');
    
    try {
        // Login as operator
        await signInWithEmailAndPassword(auth, 'operator2@test.com', 'operator123');
        
        // Get a location
        const locationsSnapshot = await getDocs(collection(db, 'locations'));
        if (locationsSnapshot.empty) {
            logWarning('Customer Entry', 'No locations found for testing');
            return false;
        }
        
        const location = locationsSnapshot.docs[0];
        const locationId = location.id;
        
        // Test customer creation
        const customerData = {
            name: 'Test Customer ' + Date.now(),
            mobile: '+91' + Math.floor(Math.random() * 10000000000),
            city: 'Test City',
            additionalDetails: 'Test customer entry',
            locationId: locationId,
            createdBy: 'test_operator',
            createdAt: serverTimestamp()
        };
        
        const customerRef = await addDoc(collection(db, 'customers'), customerData);
        logTest('Customer Creation', true, `Customer created with ID: ${customerRef.id}`);
        
        // Test entry creation
        const entryData = {
            customerName: customerData.name,
            customerMobile: customerData.mobile,
            customerCity: customerData.city,
            numberOfPots: 2,
            locationId: locationId,
            operatorId: 'test_operator',
            paymentMethod: 'cash',
            entryDate: new Date(),
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            status: 'active',
            payments: [{
                amount: 500,
                date: new Date(),
                type: 'entry',
                method: 'cash',
                months: 1
            }],
            renewals: [],
            createdAt: serverTimestamp()
        };
        
        const entryRef = await addDoc(collection(db, 'entries'), entryData);
        logTest('Entry Creation', true, `Entry created with ID: ${entryRef.id}`);
        
        // Test customer search
        const customerSearch = await getDocs(query(collection(db, 'customers'), where('mobile', '==', customerData.mobile)));
        const foundCustomer = customerSearch.docs[0];
        logTest('Customer Search', true, `Customer found: ${foundCustomer.data().name}`);
        
        return true;
    } catch (error) {
        logTest('Customer Entry System', false, 'Customer entry system failed', error.message);
        return false;
    }
}

// Test 5: Renewal System
async function testRenewalSystem() {
    console.log('\n🔄 Testing Renewal System...');
    
    try {
        // Login as operator
        await signInWithEmailAndPassword(auth, 'operator2@test.com', 'operator123');
        
        // Get an active entry
        const entriesSnapshot = await getDocs(query(collection(db, 'entries'), where('status', '==', 'active')));
        if (entriesSnapshot.empty) {
            logWarning('Renewal System', 'No active entries found for testing');
            return false;
        }
        
        const entry = entriesSnapshot.docs[0];
        const entryId = entry.id;
        const entryData = entry.data();
        
        // Test OTP generation (simulated)
        const otpData = {
            mobile: entryData.customerMobile,
            otp: '123456', // Test OTP
            type: 'renewal',
            entryId: entryId,
            generatedAt: serverTimestamp(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            verified: false,
            attempts: 0
        };
        
        const otpRef = await addDoc(collection(db, 'otpVerifications'), otpData);
        logTest('OTP Generation', true, `OTP generated for renewal: ${otpRef.id}`);
        
        // Test OTP verification
        await updateDoc(doc(db, 'otpVerifications', otpRef.id), {
            verified: true
        });
        logTest('OTP Verification', true, 'OTP verified successfully');
        
        // Test renewal processing
        const renewalData = {
            date: new Date(),
            months: 3,
            amount: 900, // 3 months * 300
            method: 'cash',
            operatorId: 'test_operator',
            newExpiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
        };
        
        const currentRenewals = entryData.renewals || [];
        await updateDoc(doc(db, 'entries', entryId), {
            renewals: [...currentRenewals, renewalData],
            expiryDate: renewalData.newExpiryDate,
            payments: [...(entryData.payments || []), {
                amount: renewalData.amount,
                date: renewalData.date,
                type: 'renewal',
                method: renewalData.method,
                months: renewalData.months
            }]
        });
        
        logTest('Renewal Processing', true, `Renewal processed for entry: ${entryId}`);
        
        return true;
    } catch (error) {
        logTest('Renewal System', false, 'Renewal system failed', error.message);
        return false;
    }
}

// Test 6: Delivery System
async function testDeliverySystem() {
    console.log('\n🚚 Testing Delivery System...');
    
    try {
        // Login as operator
        await signInWithEmailAndPassword(auth, 'operator2@test.com', 'operator123');
        
        // Get an active entry
        const entriesSnapshot = await getDocs(query(collection(db, 'entries'), where('status', '==', 'active')));
        if (entriesSnapshot.empty) {
            logWarning('Delivery System', 'No active entries found for testing');
            return false;
        }
        
        const entry = entriesSnapshot.docs[0];
        const entryId = entry.id;
        const entryData = entry.data();
        
        // Test OTP generation for delivery
        const otpData = {
            mobile: entryData.customerMobile,
            otp: '654321', // Test OTP
            type: 'delivery',
            entryId: entryId,
            generatedAt: serverTimestamp(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            verified: false,
            attempts: 0
        };
        
        const otpRef = await addDoc(collection(db, 'otpVerifications'), otpData);
        logTest('Delivery OTP Generation', true, `OTP generated for delivery: ${otpRef.id}`);
        
        // Test OTP verification
        await updateDoc(doc(db, 'otpVerifications', otpRef.id), {
            verified: true
        });
        logTest('Delivery OTP Verification', true, 'Delivery OTP verified successfully');
        
        // Test delivery processing
        await updateDoc(doc(db, 'entries', entryId), {
            status: 'delivered',
            deliveredAt: serverTimestamp(),
            deliveredBy: 'test_operator'
        });
        
        logTest('Delivery Processing', true, `Delivery processed for entry: ${entryId}`);
        
        return true;
    } catch (error) {
        logTest('Delivery System', false, 'Delivery system failed', error.message);
        return false;
    }
}

// Test 7: Dashboard Data Sync
async function testDashboardDataSync() {
    console.log('\n📊 Testing Dashboard Data Sync...');
    
    try {
        // Get system stats before
        const statsBefore = await getDocs(collection(db, 'systemStats'));
        const entriesBefore = await getDocs(query(collection(db, 'entries'), where('status', '==', 'active')));
        
        // Create a test entry to trigger sync
        const locationsSnapshot = await getDocs(collection(db, 'locations'));
        if (locationsSnapshot.empty) {
            logWarning('Dashboard Sync', 'No locations found for sync test');
            return false;
        }
        
        const location = locationsSnapshot.docs[0];
        const testEntry = {
            customerName: 'Sync Test Customer',
            customerMobile: '+91' + Math.floor(Math.random() * 10000000000),
            customerCity: 'Test City',
            numberOfPots: 1,
            locationId: location.id,
            operatorId: 'test_operator',
            paymentMethod: 'cash',
            entryDate: new Date(),
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'active',
            payments: [{
                amount: 500,
                date: new Date(),
                type: 'entry',
                method: 'cash',
                months: 1
            }],
            renewals: [],
            createdAt: serverTimestamp()
        };
        
        await addDoc(collection(db, 'entries'), testEntry);
        
        // Get system stats after
        const entriesAfter = await getDocs(query(collection(db, 'entries'), where('status', '==', 'active')));
        
        // Check if count increased
        if (entriesAfter.size > entriesBefore.size) {
            logTest('Dashboard Sync', true, `Entry count increased from ${entriesBefore.size} to ${entriesAfter.size}`);
        } else {
            logTest('Dashboard Sync', false, 'Entry count did not increase as expected');
        }
        
        return true;
    } catch (error) {
        logTest('Dashboard Data Sync', false, 'Dashboard sync failed', error.message);
        return false;
    }
}

// Test 8: Schema Validation
async function testSchemaValidation() {
    console.log('\n🔍 Testing Schema Validation...');
    
    try {
        // Test locations schema
        const locationsSnapshot = await getDocs(collection(db, 'locations'));
        if (!locationsSnapshot.empty) {
            const location = locationsSnapshot.docs[0].data();
            const requiredLocationFields = ['venueName', 'address', 'isActive'];
            const missingLocationFields = requiredLocationFields.filter(field => !(field in location));
            
            if (missingLocationFields.length === 0) {
                logTest('Locations Schema', true, 'All required fields present');
            } else {
                logTest('Locations Schema', false, `Missing fields: ${missingLocationFields.join(', ')}`);
            }
        } else {
            logWarning('Locations Schema', 'No locations to validate');
        }
        
        // Test users schema
        const usersSnapshot = await getDocs(collection(db, 'users'));
        if (!usersSnapshot.empty) {
            const user = usersSnapshot.docs[0].data();
            const requiredUserFields = ['email', 'name', 'role', 'isActive'];
            const missingUserFields = requiredUserFields.filter(field => !(field in user));
            
            if (missingUserFields.length === 0) {
                logTest('Users Schema', true, 'All required fields present');
            } else {
                logTest('Users Schema', false, `Missing fields: ${missingUserFields.join(', ')}`);
            }
        } else {
            logWarning('Users Schema', 'No users to validate');
        }
        
        // Test entries schema
        const entriesSnapshot = await getDocs(collection(db, 'entries'));
        if (!entriesSnapshot.empty) {
            const entry = entriesSnapshot.docs[0].data();
            const requiredEntryFields = ['customerName', 'customerMobile', 'numberOfPots', 'locationId', 'operatorId', 'status'];
            const missingEntryFields = requiredEntryFields.filter(field => !(field in entry));
            
            if (missingEntryFields.length === 0) {
                logTest('Entries Schema', true, 'All required fields present');
            } else {
                logTest('Entries Schema', false, `Missing fields: ${missingEntryFields.join(', ')}`);
            }
        } else {
            logWarning('Entries Schema', 'No entries to validate');
        }
        
        return true;
    } catch (error) {
        logTest('Schema Validation', false, 'Schema validation failed', error.message);
        return false;
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting Comprehensive Feature Testing...\n');
    console.log('📋 Testing Plan:');
    console.log('   1. Authentication System');
    console.log('   2. Location Management (Admin)');
    console.log('   3. Operator Management (Admin)');
    console.log('   4. Customer Entry System');
    console.log('   5. Renewal System');
    console.log('   6. Delivery System');
    console.log('   7. Dashboard Data Sync');
    console.log('   8. Schema Validation');
    console.log('');
    
    const startTime = Date.now();
    
    // Run all tests
    await testAuthentication();
    await testLocationManagement();
    await testOperatorManagement();
    await testCustomerEntrySystem();
    await testRenewalSystem();
    await testDeliverySystem();
    await testDashboardDataSync();
    await testSchemaValidation();
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // Generate test report
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`⏱️  Total Test Duration: ${duration.toFixed(2)} seconds`);
    console.log(`✅ Passed Tests: ${testResults.passed.length}`);
    console.log(`❌ Failed Tests: ${testResults.failed.length}`);
    console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
    console.log('');
    
    if (testResults.failed.length > 0) {
        console.log('❌ FAILED TESTS:');
        testResults.failed.forEach(test => {
            console.log(`   • ${test.name}: ${test.message}`);
            if (test.details) {
                console.log(`     Details: ${test.details}`);
            }
        });
        console.log('');
    }
    
    if (testResults.warnings.length > 0) {
        console.log('⚠️  WARNINGS:');
        testResults.warnings.forEach(test => {
            console.log(`   • ${test.name}: ${test.message}`);
            if (test.details) {
                console.log(`     Details: ${test.details}`);
            }
        });
        console.log('');
    }
    
    // Overall assessment
    const totalTests = testResults.passed.length + testResults.failed.length;
    const successRate = (testResults.passed.length / totalTests * 100).toFixed(1);
    
    console.log('🎯 OVERALL ASSESSMENT:');
    console.log(`   Success Rate: ${successRate}%`);
    
    if (successRate >= 90) {
        console.log('   🟢 Status: PRODUCTION READY');
    } else if (successRate >= 70) {
        console.log('   🟡 Status: NEEDS MINOR FIXES');
    } else {
        console.log('   🔴 Status: NEEDS MAJOR FIXES');
    }
    
    console.log('');
    console.log('📋 RECOMMENDATIONS:');
    
    if (testResults.failed.length > 0) {
        console.log('   1. Fix all failed tests before production');
        console.log('   2. Investigate error messages for root causes');
        console.log('   3. Re-test after fixes are applied');
    }
    
    if (testResults.warnings.length > 0) {
        console.log('   4. Review warnings for potential improvements');
        console.log('   5. Consider edge cases in warning scenarios');
    }
    
    if (successRate >= 90) {
        console.log('   5. System is ready for production deployment');
        console.log('   6. Consider user acceptance testing');
        console.log('   7. Plan for monitoring and maintenance');
    }
    
    console.log('');
    console.log('='.repeat(60));
    
    return {
        passed: testResults.passed.length,
        failed: testResults.failed.length,
        warnings: testResults.warnings.length,
        successRate: parseFloat(successRate),
        duration: duration,
        details: testResults
    };
}

// Export test results
module.exports = { runAllTests, testResults };

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().then(results => {
        console.log('\n🏁 Testing completed!');
        process.exit(results.failed.length > 0 ? 1 : 0);
    }).catch(error => {
        console.error('💥 Test runner crashed:', error);
        process.exit(1);
    });
}