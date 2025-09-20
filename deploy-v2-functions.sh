#!/bin/bash

echo "🚀 DEPLOYING V2 FUNCTIONS (NEW NAMES)"
echo "This will deploy functions with new names to avoid upgrade conflicts"

# Navigate to project root
cd "$(dirname "$0")"

echo "📦 Deploying V2 functions..."
firebase deploy --only functions:sendSMSV2,functions:dailyExpiryCheckV2,functions:retryFailedSMSV2,functions:getSMSStatisticsV2,functions:smsHealthCheckV2

echo "✅ V2 Functions deployed successfully!"
echo ""
echo "📝 NEXT STEPS:"
echo "1. Update your frontend code to use the new function names:"
echo "   - sendSMS → sendSMSV2"
echo "   - dailyExpiryCheck → dailyExpiryCheckV2"
echo "   - retryFailedSMS → retryFailedSMSV2"
echo "   - getSMSStatistics → getSMSStatisticsV2"
echo "   - smsHealthCheck → smsHealthCheckV2"
echo ""
echo "2. Test the new functions to ensure they work correctly"
echo "3. Once verified, you can delete the old functions if desired"