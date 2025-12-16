'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, RotateCcw, Smartphone, Shield, MapPin, MessageSquare, Clock, Play, TestTube } from 'lucide-react';
import { useAdminConfigStore } from '@/stores/admin-config';
import LocationManagement from './LocationManagement';
import SMSLogsTable from './SMSLogsTable';

export default function AdminSettings() {
  const { adminMobile, setAdminMobile, resetToDefault } = useAdminConfigStore();
  const [inputMobile, setInputMobile] = useState(adminMobile);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Scheduler settings state
  const [schedulerConfig, setSchedulerConfig] = useState({
    hour: 10,
    minute: 0,
    enabled: true
  });
  const [isEditingScheduler, setIsEditingScheduler] = useState(false);
  const [schedulerMessage, setSchedulerMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Sync input with global state when adminMobile changes
  useEffect(() => {
    setInputMobile(adminMobile);
  }, [adminMobile]);

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
      setAdminMobile(inputMobile);
      setValidationError(null);
      
      // Also update Firebase config
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminMobile: inputMobile }),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: 'Admin mobile number updated successfully in both local state and Firebase config!' 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: `Local state updated but Firebase config failed: ${result.error}` 
        });
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating admin mobile:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to update admin mobile number. Please try again.' 
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
    setInputMobile(useAdminConfigStore.getState().adminMobile);
    setMessage({ type: 'success', text: 'Admin mobile number reset to default!' });
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
      
      // Here you would typically update the pubsub schedule
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

  const handleTestReminders = async () => {
    try {
      setSchedulerMessage({ 
        type: 'success', 
        text: 'Testing expiry reminders... Check console for results.' 
      });
      
      // Call the existing cloud function directly
      const response = await fetch('https://us-central1-rctscm01.cloudfunctions.net/sendAllExpiryReminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({
          reminderTypes: ['3day', 'lastday', '60day']
        })
      });
      
      const result = await response.json();
      console.log('🧪 [TEST] Expiry reminders test result:', result);
      
      // Show more detailed result to user
      if (result.success) {
        const threeDayCount = result.results?.threeDayReminders?.sent || 0;
        const lastDayCount = result.results?.lastDayReminders?.sent || 0;
        const finalDisposalCount = result.results?.finalDisposalReminders?.sent || 0;
        
        setSchedulerMessage({ 
          type: 'success', 
          text: `✅ Test completed! ${threeDayCount} three-day, ${lastDayCount} last-day, and ${finalDisposalCount} final disposal reminders sent.` 
        });
      } else {
        setSchedulerMessage({ 
          type: 'error', 
          text: `❌ Test failed: ${result.message || 'Unknown error'}` 
        });
      }
      
    } catch (error) {
      console.error('Error testing expiry reminders:', error);
      setSchedulerMessage({ 
        type: 'error', 
        text: 'Failed to test expiry reminders. Please check console.' 
      });
    }
  };

  // Helper function to get auth token for cloud function call
  const getAuthToken = async () => {
    // This would typically get the current user's auth token
    // For demo purposes, you might need to implement proper auth
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.token || 'demo-token';
    } catch {
      return 'demo-token';
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

      {/* Admin Mobile Configuration */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Smartphone className="h-5 w-5" />
          <h3 className="text-xl font-semibold">Admin Mobile Configuration</h3>
        </div>
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5" />
            <span>Admin Mobile Number</span>
            <Shield className="h-4 w-4 text-green-500" />
          </CardTitle>
          <CardDescription>
            Configure the admin mobile number for SMS notifications. This number will receive 
            administrative alerts and notifications from the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Configuration */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900  rounded-lg">
            <div>
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Current Admin Mobile</Label>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-lg font-semibold">{formatMobileDisplay(adminMobile)}</span>
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
                <Label htmlFor="adminMobile" className="text-sm font-medium">
                  New Admin Mobile Number
                </Label>
                <Input
                  id="adminMobile"
                  type="tel"
                  value={inputMobile}
                  onChange={(e) => {
                    setInputMobile(e.target.value);
                    setValidationError(validateMobile(e.target.value));
                  }}
                  placeholder="+919014882779"
                  className={`mt-1 ${validationError ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter the full mobile number with country code (e.g., +919014882779)
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

          {/* Information */}
          {/* <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How this works:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• The admin mobile number is stored in global state</li>
              <li>• All SMS notifications to admin will use this number</li>
              <li>• Changes take effect immediately across all components</li>
              <li>• The backend continues to use Firebase config as before</li>
            </ul>
          </div> */}
        </CardContent>
      </Card>
      </div>

      {/* SMS Logs Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="text-xl font-semibold">SMS Logs & Reports</h3>
        </div>
        <SMSLogsTable />
      </div>

      {/* Scheduler Configuration Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <h3 className="text-xl font-semibold">Scheduler Configuration</h3>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Expiry Reminders Scheduler</span>
              <Badge variant={schedulerConfig.enabled ? "default" : "secondary"}>
                {schedulerConfig.enabled ? 'Active' : 'Inactive'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Configure when automatic expiry reminders should be sent. This is currently for demo purposes 
              - the actual PubSub scheduler runs at 10AM daily.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Configuration */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Current Schedule</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-lg font-semibold">
                    {schedulerConfig.hour.toString().padStart(2, '0')}:{schedulerConfig.minute.toString().padStart(2, '0')}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Daily
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingScheduler(!isEditingScheduler)}
              >
                {isEditingScheduler ? 'Cancel' : 'Configure'}
              </Button>
            </div>

            {/* Edit Form */}
            {isEditingScheduler && (
              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/30 space-y-4">
                <div>
                  <Label className="text-sm font-medium">
                    Daily Run Time (24-hour format)
                  </Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex items-center space-x-1">
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={schedulerConfig.hour}
                        onChange={(e) => setSchedulerConfig(prev => ({ 
                          ...prev, 
                          hour: Math.max(0, Math.min(23, parseInt(e.target.value) || 0))
                        }))}
                        className="w-16 text-center"
                        placeholder="HH"
                      />
                      <span className="text-lg font-medium">:</span>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={schedulerConfig.minute}
                        onChange={(e) => setSchedulerConfig(prev => ({ 
                          ...prev, 
                          minute: Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
                        }))}
                        className="w-16 text-center"
                        placeholder="MM"
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Format: HH:MM (e.g., 10:00 for 10AM)
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="schedulerEnabled"
                    checked={schedulerConfig.enabled}
                    onChange={(e) => setSchedulerConfig(prev => ({ 
                      ...prev, 
                      enabled: e.target.checked 
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="schedulerEnabled" className="text-sm">
                    Enable automatic expiry reminders
                  </Label>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleSaveScheduler} className="flex items-center space-x-1">
                    <Save className="h-4 w-4" />
                    <span>Save Schedule</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleTestReminders}
                    className="flex items-center space-x-1"
                  >
                    <TestTube className="h-4 w-4" />
                    <span>Test Now</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Status Message */}
            {schedulerMessage && (
              <Alert className={schedulerMessage.type === 'success' ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/30' : 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/30'}>
                <AlertDescription className={schedulerMessage.type === 'success' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}>
                  {schedulerMessage.text}
                </AlertDescription>
              </Alert>
            )}

            {/* Information */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center space-x-2">
                <Play className="h-4 w-4" />
                <span>How it works:</span>
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• <strong>3-Day Reminders:</strong> Sent to customers 3 days before expiry</li>
                <li>• <strong>Last-Day Reminders:</strong> Sent to customers on expiry day</li>
                <li>• <strong>60-Day Final Disposal:</strong> Sent to customers and admin for entries expired 60+ days</li>
                <li>• <strong>Demo Mode:</strong> Use "Test Now" to trigger all reminders immediately</li>
                <li>• <strong>Production:</strong> Actual PubSub scheduler runs at configured time daily</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}