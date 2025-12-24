'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, RotateCcw, Smartphone, Shield, MapPin, MessageSquare, Clock, Play, TestTube, Headphones } from 'lucide-react';
import { useAdminConfigStore, useHelpDeskMobile, useSetHelpDeskMobile } from '@/stores/admin-config';
import LocationManagement from './LocationManagement';
import SMSLogsTable from './SMSLogsTable';
import { functions, httpsCallable } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminSettings() {
  const helpDeskMobile = useHelpDeskMobile();
  const setHelpDeskMobile = useSetHelpDeskMobile();
  const { resetToDefault } = useAdminConfigStore();
  const { user } = useAuth();
  const [inputMobile, setInputMobile] = useState(helpDeskMobile);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Sync input with global state when helpDeskMobile changes
  useEffect(() => {
    setInputMobile(helpDeskMobile);
  }, [helpDeskMobile]);

  // Real-time validation
  const validateMobile = (mobile: string): string | null => {
    if (!mobile) return null;
    
    // Remove formatting characters
    const cleaned = mobile.replace(/[\s\-\(\)]/g, '');
    const digitsOnly = cleaned.replace(/\D/g, '');
    
    if (digitsOnly.length < 10 || digitsOnly.length > 12) {
      return 'Mobile number must be 10-12 digits';
    }
    
    return null;
  };

  const handleSave = async () => {
    // Validate before saving
    const validationError = validateMobile(inputMobile);
    if (validationError) {
      setValidationError(validationError);
      setMessage({ type: 'error', text: validationError });
      return;
    }
    
    try {
      // Update local state first
      setHelpDeskMobile(inputMobile);
      setValidationError(null);
      
      // Also update Firestore config
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ helpDeskMobile: inputMobile }),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: 'Help desk mobile number updated successfully!' 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: `Failed to update help desk mobile: ${result.error}` 
        });
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating help desk mobile:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to update help desk mobile number. Please try again.' 
      });
    }
    
    // Clear message after 5 seconds
    setTimeout(() => {
      setMessage(null);
      setValidationError(null);
    }, 5000);
  };

  const handleReset = () => {
    resetToDefault();
    setInputMobile(useAdminConfigStore.getState().helpDeskMobile);
    setMessage({ type: 'success', text: 'Help desk mobile number reset to default!' });
    setIsEditing(false);
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveScheduler = async () => {
    try {
      // Calculate next run time
      const now = new Date();
      const nextRun = new Date();
      nextRun.setHours(schedulerConfig.hour, schedulerConfig.minute, 0, 0);
      
      // If next run is in the past, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      
      setSchedulerMessage({ 
        type: 'success', 
        text: `Scheduler configured to run daily at ${schedulerConfig.hour.toString().padStart(2, '0')}:${schedulerConfig.minute.toString().padStart(2, '0')}. Next run: ${nextRun.toLocaleString()}` 
      });
      setIsEditingScheduler(false);
      
      // Here you would typically update of pubsub schedule
      // For demo purposes, we're just showing the configuration
      console.log('🕐 [SCHEDULER] Configuration updated:', {
        hour: schedulerConfig.hour,
        minute: schedulerConfig.minute,
        enabled: schedulerConfig.enabled,
        nextRun: nextRun.toISOString()
      });
      
    } catch (error) {
      console.error('Error updating scheduler configuration:', error);
      setSchedulerMessage({ 
        type: 'error', 
        text: 'Failed to update scheduler configuration. Please try again.' 
      });
    }
    
    // Clear message after 5 seconds
    setTimeout(() => setSchedulerMessage(null), 5000);
  };

  const handleDebugEntries = async () => {
    try {
      // Check if user is authenticated
      if (!user) {
        setSchedulerMessage({ 
          type: 'error', 
          text: '❌ You must be logged in to debug entries.' 
        });
        return;
      }

      console.log('🔍 [DEBUG] Starting entries debug...');
      setSchedulerMessage({ 
        type: 'success', 
        text: '🔍 Debugging entries data... Check console for details.' 
      });
      
      // Call debug function
      const debugEntries = httpsCallable(functions, 'debugEntries');
      const result = await debugEntries();
      
      console.log('🔍 [DEBUG] Debug result:', result.data);
      
      if (result.data?.success) {
        const entriesCount = result.data.entries?.length || 0;
        const threeDayMatches = result.data.dateTests?.threeDaysFromNow?.entryMatches || 0;
        const tomorrowMatches = result.data.dateTests?.tomorrow?.entryMatches || 0;
        const todayMatches = result.data.dateTests?.today?.entryMatches || 0;
        const expiredMatches = result.data.dateTests?.expired?.entryMatches || 0;
        const sixtyDayMatches = result.data.dateTests?.sixtyDaysAgo?.entryMatches || 0;
        
        setSchedulerMessage({ 
          type: 'success', 
          text: `🔍 Debug complete! Found ${entriesCount} entries. 3-day: ${threeDayMatches}, Tomorrow: ${tomorrowMatches}, Today: ${todayMatches}, Expired: ${expiredMatches}, 60-day: ${sixtyDayMatches}` 
        });
      } else {
        setSchedulerMessage({ 
          type: 'error', 
          text: `❌ Debug failed: ${result.data?.error || 'Unknown error'}` 
        });
      }
      
    } catch (error: any) {
      console.error('Error debugging entries:', error);
      setSchedulerMessage({ 
        type: 'error', 
        text: `❌ Debug failed: ${error.message}` 
      });
    }
  };

  const handleTestReminders = async () => {
    try {
      // Check if user is authenticated
      if (!user) {
        setSchedulerMessage({ 
          type: 'error', 
          text: '❌ You must be logged in to test expiry reminders.' 
        });
        return;
      }

      console.log('🧪 [TEST] Starting expiry reminders test...', {
        user: user.email,
        uid: user.uid,
        role: user.role
      });

      setSchedulerMessage({ 
        type: 'success', 
        text: 'Testing expiry reminders... This may take a few moments.' 
      });
      
      // First test basic connectivity with simpleTest
      try {
        console.log('🧪 [TEST] Testing basic connectivity...');
        const simpleTest = httpsCallable(functions, 'simpleTest');
        const simpleResult = await simpleTest();
        console.log('🧪 [TEST] Simple test result:', simpleResult.data);
        
        if (!simpleResult.data?.success) {
          setSchedulerMessage({ 
            type: 'error', 
            text: `❌ Basic connectivity test failed: ${simpleResult.data?.error || 'Unknown error'}` 
          });
          return;
        }
        
        setSchedulerMessage({ 
          type: 'success', 
          text: '✅ Basic connectivity test passed. Now testing expiry reminders...' 
        });
        
      } catch (error: any) {
        console.error('🧪 [TEST] Simple test error:', error);
        setSchedulerMessage({ 
          type: 'error', 
          text: `❌ Basic connectivity test failed: ${error.message}` 
        });
        return;
      }
      
      // Try to call to new testExpiryReminders function (if deployed) or fallback to sendExpiry
      let result;
      try {
        // First try to new testExpiryReminders function
        const testExpiryReminders = httpsCallable(functions, 'testExpiryReminders');
        result = await testExpiryReminders({
          reminderTypes: ['3day', 'lastday', '60day']
        });
      } catch (error: any) {
        if (error.code === 'functions/not-found') {
          // Fallback: inform user to deploy to new function
          setSchedulerMessage({ 
            type: 'error', 
            text: '❌ Test function not deployed. Please run: cd functions && firebase deploy --only functions:testExpiryReminders' 
          });
          return;
        }
        throw error;
      }
      
      console.log('🧪 [TEST] Expiry reminders test result:', result.data);
      
      // Show more detailed result to user
      if (result.data?.success) {
        const threeDayCount = result.data.results?.threeDayReminders?.sent || 0;
        const lastDayCount = result.data.results?.lastDayReminders?.sent || 0;
        const finalDisposalCount = result.data.results?.finalDisposalReminders?.sent || 0;
        
        setSchedulerMessage({ 
          type: 'success', 
          text: `✅ Test completed! ${threeDayCount} three-day, ${lastDayCount} last-day, and ${finalDisposalCount} final disposal reminders sent.` 
        });
      } else {
        setSchedulerMessage({ 
          type: 'error', 
          text: `❌ Test failed: ${result.data?.message || 'Unknown error'}` 
        });
      }
      
    } catch (error: any) {
      console.error('Error testing expiry reminders:', error);
      
      // Handle Firebase Functions specific errors
      let errorMessage = 'Failed to test expiry reminders. Please check console.';
      if (error.code === 'unauthenticated') {
        errorMessage = '❌ Authentication required. Please log in and try again.';
      } else if (error.code === 'permission-denied') {
        errorMessage = '❌ Permission denied. You need admin privileges to test reminders.';
      } else if (error.code === 'functions/not-found') {
        errorMessage = '❌ Test function not deployed. Please deploy to testExpiryReminders function first.';
      } else if (error.message) {
        errorMessage = `❌ Error: ${error.message}`;
      }
      
      setSchedulerMessage({ 
        type: 'error', 
        text: errorMessage
      });
    }
  };

  const formatMobileDisplay = (mobile: string) => {
    if (mobile.startsWith('+91') && mobile.length > 5) {
      return `+91 ${mobile.slice(3, 8)} ${mobile.slice(8)}`;
    }
    return mobile;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Admin Settings</h2>
      </div>

      {/* Location Management Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <h3 className="text-xl font-semibold">Location Management</h3>
        </div>
        <LocationManagement />
      </div>

      {/* Help Desk Mobile Configuration */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Headphones className="h-5 w-5" />
          <h3 className="text-xl font-semibold">Help Desk Mobile Configuration</h3>
        </div>
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5" />
            <span>Help Desk Mobile Number</span>
            <Shield className="h-4 w-4 text-green-500" />
          </CardTitle>
          <CardDescription>
            Configure the help desk mobile number for customer support. This number will be 
            included in all SMS messages sent to customers for any queries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Configuration */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Current Help Desk Mobile</Label>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-lg font-semibold">{formatMobileDisplay(helpDeskMobile)}</span>
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/30 space-y-4">
              <div>
                <Label htmlFor="helpDeskMobile" className="text-sm font-medium">
                  New Help Desk Mobile Number
                </Label>
                <Input
                  id="helpDeskMobile"
                  type="tel"
                  value={inputMobile}
                  onChange={(e) => {
                    setInputMobile(e.target.value);
                    setValidationError(validateMobile(e.target.value));
                  }}
                  placeholder="+91 9395133359"
                  className={`mt-1 ${validationError ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter the full mobile number with country code (e.g., +91 9395133359)
                  </p>
                  {validationError && (
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                      {validationError}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleSave} className="flex items-center space-x-1">
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  className="flex items-center space-x-1"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset to Default</span>
                </Button>
              </div>
            </div>
          )}

          {/* Status Message */}
          {(message || validationError) && (
            <Alert className={message?.type === 'success' ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/30' : 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/30'}>
              <AlertDescription className={message?.type === 'success' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}>
                {validationError || message?.text}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      </div>

      {/* SMS Logs Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="text-xl font-semibold">SMS Logs</h3>
        </div>
        <SMSLogsTable />
      </div>
    </div>
  );
}
