'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, RotateCcw, Smartphone, Shield, MapPin, MessageSquare } from 'lucide-react';
import { useAdminConfigStore } from '@/stores/admin-config';
import LocationManagement from './LocationManagement';
import SMSLogsTable from './SMSLogsTable';

export default function AdminSettings() {
  const { adminMobile, setAdminMobile, resetToDefault } = useAdminConfigStore();
  const [inputMobile, setInputMobile] = useState(adminMobile);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSave = () => {
    try {
      setAdminMobile(inputMobile);
      setMessage({ type: 'success', text: 'Admin mobile number updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update admin mobile number. Please check the format.' });
    }
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000);
  };

  const handleReset = () => {
    resetToDefault();
    setInputMobile(useAdminConfigStore.getState().adminMobile);
    setMessage({ type: 'success', text: 'Admin mobile number reset to default!' });
    setIsEditing(false);
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000);
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
                  onChange={(e) => setInputMobile(e.target.value)}
                  placeholder="+919014882779"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter the full mobile number with country code (e.g., +919014882779)
                </p>
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
          {message && (
            <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/30' : 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/30'}>
              <AlertDescription className={message.type === 'success' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}>
                {message.text}
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
    </div>
  );
}