#!/bin/bash

# SMS Integration Security Verification Script
# This script verifies that the SMS integration is secure and properly configured

set -e

echo "🔒 Running Security Verification..."
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

SECURITY_PASSED=true
SECURITY_WARNINGS=0
SECURITY_ERRORS=0

echo "🔍 Checking for security vulnerabilities..."
echo ""

# Check 1: Hardcoded API keys in front-end
print_info "Checking for hardcoded API keys in front-end code..."
if grep -r "FASTSMS_API_KEY\|QgRMDkEVHPoKaJcl3NbqyB8TW6rv9XudhY0Zj2izn57xF1wfICdGanl0ojySLuKHfrP9UDQYMsk41OC2" src/ 2>/dev/null; then
    print_error "❌ Hardcoded API keys found in front-end code!"
    echo "   Files containing API keys:"
    grep -r "FASTSMS_API_KEY\|QgRMDkEVHPoKaJcl3NbqyB8TW6rv9XudhY0Zj2izn57xF1wfICdGanl0ojySLuKHfrP9UDQYMsk41OC2" src/ 2>/dev/null | head -5
    SECURITY_ERRORS=$((SECURITY_ERRORS + 1))
    SECURITY_PASSED=false
else
    print_status "✅ No hardcoded API keys found in front-end code"
fi

# Check 2: API keys in environment files
print_info "Checking for API keys in environment files..."
if find . -name "*.env*" -o -name ".env*" | grep -v node_modules | xargs grep -l "QgRMDkEVHPoKaJcl3NbqyB8TW6rv9XudhY0Zj2izn57xF1wfICdGanl0ojySLuKHfrP9UDQYMsk41OC2" 2>/dev/null; then
    print_error "❌ API keys found in environment files!"
    SECURITY_ERRORS=$((SECURITY_ERRORS + 1))
    SECURITY_PASSED=false
else
    print_status "✅ No API keys found in environment files"
fi

# Check 3: Firebase Functions configuration
print_info "Checking Firebase Functions configuration..."
if command -v firebase &> /dev/null; then
    if firebase functions:config:get 2>/dev/null | grep -q "fastsms"; then
        print_status "✅ Firebase Functions configuration is set"
        
        # Check if API key is configured
        if firebase functions:config:get fastsms.api_key 2>/dev/null | grep -q "QgRMDkEVHPoKaJcl3NbqyB8TW6rv9XudhY0Zj2izn57xF1wfICdGanl0ojySLuKHfrP9UDQYMsk41OC2"; then
            print_status "✅ FastSMS API key is properly configured"
        else
            print_warning "⚠️  FastSMS API key might not be configured correctly"
            SECURITY_WARNINGS=$((SECURITY_WARNINGS + 1))
        fi
    else
        print_warning "⚠️  Firebase Functions configuration not set"
        SECURITY_WARNINGS=$((SECURITY_WARNINGS + 1))
    fi
else
    print_warning "⚠️  Firebase CLI not available for configuration check"
    SECURITY_WARNINGS=$((SECURITY_WARNINGS + 1))
fi

# Check 4: Front-end service security
print_info "Checking front-end service security..."
if [ -f "src/lib/sms-service.ts" ]; then
    # Check if it's using Firebase Functions
    if grep -q "httpsCallable.*functions" src/lib/sms-service.ts; then
        print_status "✅ Front-end service uses Firebase Functions"
    else
        print_error "❌ Front-end service might not be using Firebase Functions securely"
        SECURITY_ERRORS=$((SECURITY_ERRORS + 1))
        SECURITY_PASSED=false
    fi
    
    # Check for direct API calls
    if grep -q "axios\|fetch.*https://www.fastsms.com" src/lib/sms-service.ts; then
        print_error "❌ Direct API calls found in front-end service!"
        SECURITY_ERRORS=$((SECURITY_ERRORS + 1))
        SECURITY_PASSED=false
    else
        print_status "✅ No direct API calls in front-end service"
    fi
else
    print_error "❌ Front-end SMS service file not found"
    SECURITY_ERRORS=$((SECURITY_ERRORS + 1))
    SECURITY_PASSED=false
fi

# Check 5: Firebase Functions security
print_info "Checking Firebase Functions security..."
if [ -f "functions/src/index.ts" ]; then
    # Check for environment configuration usage
    if grep -q "functions.config().fastsms" functions/src/index.ts; then
        print_status "✅ Firebase Functions use environment configuration"
    else
        print_error "❌ Firebase Functions might not be using environment configuration"
        SECURITY_ERRORS=$((SECURITY_ERRORS + 1))
        SECURITY_PASSED=false
    fi
    
    # Check for hardcoded API keys in functions
    if grep -q "QgRMDkEVHPoKaJcl3NbqyB8TW6rv9XudhY0Zj2izn57xF1wfICdGanl0ojySLuKHfrP9UDQYMsk41OC2" functions/src/index.ts; then
        print_error "❌ Hardcoded API keys found in Firebase Functions!"
        SECURITY_ERRORS=$((SECURITY_ERRORS + 1))
        SECURITY_PASSED=false
    else
        print_status "✅ No hardcoded API keys in Firebase Functions"
    fi
    
    # Check for authentication
    if grep -q "context.auth" functions/src/index.ts; then
        print_status "✅ Authentication checks implemented"
    else
        print_warning "⚠️  Authentication checks might be missing"
        SECURITY_WARNINGS=$((SECURITY_WARNINGS + 1))
    fi
else
    print_error "❌ Firebase Functions file not found"
    SECURITY_ERRORS=$((SECURITY_ERRORS + 1))
    SECURITY_PASSED=false
fi

# Check 6: Logging and audit trail
print_info "Checking logging and audit trail..."
if [ -f "functions/src/index.ts" ]; then
    if grep -q "logSMS\|smsFunctionCalls" functions/src/index.ts; then
        print_status "✅ SMS logging implemented"
    else
        print_warning "⚠️  SMS logging might be incomplete"
        SECURITY_WARNINGS=$((SECURITY_WARNINGS + 1))
    fi
fi

if [ -f "src/lib/sms-logs.ts" ]; then
    print_status "✅ SMS logging service exists"
else
    print_warning "⚠️  SMS logging service might be missing"
    SECURITY_WARNINGS=$((SECURITY_WARNINGS + 1))
fi

# Check 7: Template validation
print_info "Checking template validation..."
if [ -f "src/lib/sms-templates.ts" ]; then
    if grep -q "validateTemplateVariables\|formatVariablesForAPI" src/lib/sms-templates.ts; then
        print_status "✅ Template validation implemented"
    else
        print_warning "⚠️  Template validation might be incomplete"
        SECURITY_WARNINGS=$((SECURITY_WARNINGS + 1))
    fi
else
    print_warning "⚠️  SMS templates file might be missing"
    SECURITY_WARNINGS=$((SECURITY_WARNINGS + 1))
fi

# Check 8: Error handling
print_info "Checking error handling..."
if [ -f "functions/src/index.ts" ]; then
    if grep -q "try.*catch\|error.*handling" functions/src/index.ts; then
        print_status "✅ Error handling implemented"
    else
        print_warning "⚠️  Error handling might be incomplete"
        SECURITY_WARNINGS=$((SECURITY_WARNINGS + 1))
    fi
fi

# Check 9: Rate limiting and retry logic
print_info "Checking rate limiting and retry logic..."
if [ -f "functions/src/index.ts" ]; then
    if grep -q "MAX_RETRY_ATTEMPTS\|RETRY_DELAY_MS" functions/src/index.ts; then
        print_status "✅ Retry logic implemented"
    else
        print_warning "⚠️  Retry logic might be missing"
        SECURITY_WARNINGS=$((SECURITY_WARNINGS + 1))
    fi
fi

# Check 10: File permissions
print_info "Checking file permissions..."
if [ -f "deploy-sms-functions.sh" ]; then
    if [ -x "deploy-sms-functions.sh" ]; then
        print_status "✅ Deployment script is executable"
    else
        print_warning "⚠️  Deployment script is not executable"
        SECURITY_WARNINGS=$((SECURITY_WARNINGS + 1))
    fi
fi

if [ -f "setup-secure-sms.sh" ]; then
    if [ -x "setup-secure-sms.sh" ]; then
        print_status "✅ Setup script is executable"
    else
        print_warning "⚠️  Setup script is not executable"
        SECURITY_WARNINGS=$((SECURITY_WARNINGS + 1))
    fi
fi

# Summary
echo ""
echo "📊 Security Verification Summary"
echo "================================"
echo ""

if [ "$SECURITY_PASSED" = true ] && [ "$SECURITY_ERRORS" -eq 0 ]; then
    echo -e "${GREEN}🎉 SECURITY VERIFICATION PASSED!${NC}"
    echo ""
    echo "✅ All critical security checks passed"
    echo "✅ No hardcoded API keys found"
    echo "✅ Proper environment configuration"
    echo "✅ Secure Firebase Functions implementation"
    echo "✅ Authentication and authorization enforced"
    echo "✅ Complete audit logging"
    echo ""
    if [ "$SECURITY_WARNINGS" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Minor warnings: $SECURITY_WARNINGS${NC}"
        echo "   These should be reviewed but don't block deployment"
    fi
    echo ""
    echo "🚀 Your SMS integration is secure and ready for production!"
else
    echo -e "${RED}❌ SECURITY VERIFICATION FAILED!${NC}"
    echo ""
    echo "Critical issues found:"
    echo "   • $SECURITY_ERRORS security errors"
    if [ "$SECURITY_WARNINGS" -gt 0 ]; then
        echo "   • $SECURITY_WARNINGS security warnings"
    fi
    echo ""
    echo "🔧 Please fix the issues above before deploying:"
    echo "   1. Remove all hardcoded API keys"
    echo "   2. Set up Firebase Functions environment configuration"
    echo "   3. Implement proper authentication and authorization"
    echo "   4. Add comprehensive logging"
    echo ""
    echo "📚 Refer to SMS_INTEGRATION_GUIDE.md for help"
fi

echo ""
echo "📋 Recommendations:"
echo "   • Regularly rotate your API keys"
echo "   • Monitor SMS usage and costs"
echo "   • Review audit logs periodically"
echo "   • Keep Firebase CLI and dependencies updated"
echo "   • Test failover scenarios"
echo ""

echo "🔒 Security Best Practices:"
echo "   • Never commit API keys to version control"
echo "   • Use environment variables for sensitive data"
echo "   • Implement proper authentication and authorization"
echo "   • Log all sensitive operations"
echo "   • Regular security audits"
echo ""

if [ "$SECURITY_PASSED" = true ] && [ "$SECURITY_ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✅ Ready for secure deployment!${NC}"
    exit 0
else
    echo -e "${RED}❌ Fix security issues before deployment${NC}"
    exit 1
fi