#!/bin/bash

# SMS Debug Test Script using curl
# This script helps test the Firebase debug function to identify SMS configuration issues

# Configuration - UPDATE THESE VALUES
PROJECT_ID="your-project-id"  # Replace with your Firebase project ID
API_KEY="your-api-key"        # Replace with your Firebase API key or auth token

# Test configuration
TEMPLATE_KEY="finalDisposalReminder"
TEST_MOBILE="919014882779"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function URL
FUNCTION_URL="https://${PROJECT_ID}-us-central1.cloudfunctions.net/debugTemplateConfig"

echo -e "${BLUE}🔍 SMS Debug Test Script${NC}"
echo "========================"
echo "Project ID: $PROJECT_ID"
echo "Template Key: $TEMPLATE_KEY"
echo "Test Mobile: $TEST_MOBILE"
echo ""

# Check configuration
if [ "$PROJECT_ID" = "your-project-id" ] || [ "$API_KEY" = "your-api-key" ]; then
    echo -e "${RED}❌ Configuration Issues:${NC}"
    echo "  - Firebase Project ID not configured" 
    echo "  - Firebase API Key not configured"
    echo ""
    echo "Please update the configuration variables in this script."
    exit 1
fi

# Test 1: Debug Configuration
echo -e "${YELLOW}📋 Test 1: Debug Configuration${NC}"
echo "------------------------------"

REQUEST_DATA='{
    "templateKey": "'"$TEMPLATE_KEY"'"
}'

echo "Request Data: $REQUEST_DATA"
echo ""

RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d "$REQUEST_DATA" \
    "$FUNCTION_URL")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "========================"
echo ""

# Test 2: API Call Test
echo -e "${YELLOW}📞 Test 2: API Call Test${NC}"
echo "------------------------"

REQUEST_DATA='{
    "templateKey": "'"$TEMPLATE_KEY"'",
    "testMobile": "'"$TEST_MOBILE"'"
}'

echo "Request Data: $REQUEST_DATA"
echo ""

RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d "$REQUEST_DATA" \
    "$FUNCTION_URL")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo -e "${GREEN}✅ Tests completed!${NC}"

# Instructions
echo ""
echo "📝 Next Steps:"
echo "1. Check the response for configuration issues"
echo "2. Look for Entity ID mismatches"
echo "3. Verify template IDs are correct"
echo "4. Check if API key has proper permissions"
echo ""
echo "🔧 Common Issues:"
echo "- Entity ID mismatch between FastSMS and Firebase config"
echo "- Template ID not registered with correct Entity ID"
echo "- API key missing DLT route permissions"
echo "- Sender ID not activated"