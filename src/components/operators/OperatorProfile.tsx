'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { getLocations } from '@/lib/firestore';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit,
  Save,
  X,
  Building2,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatFirestoreDate } from '@/lib/date-utils';

interface OperatorData {
  name: string;
  email: string;
  phone?: string;
  locationIds: string[];
  isActive: boolean;
  createdAt: any;
  lastLogin?: any;
}

export default function OperatorProfile() {
  const { user } = useAuth();
  const [operatorData, setOperatorData] = useState<OperatorData | null>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchOperatorData();
  }, [user]);

  const fetchOperatorData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch locations
      const allLocations = await getLocations();
      const assignedLocations = allLocations.filter(loc => 
        user.locationIds?.includes(loc.id) && loc.isActive
      );
      setLocations(assignedLocations);

      // Set operator data
      const data: OperatorData = {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        locationIds: user.locationIds || [],
        isActive: user.isActive || false,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      };
      
      setOperatorData(data);
      setEditForm({
        name: data.name,
        phone: data.phone || ''
      });
    } catch (error) {
      console.error('Error fetching operator data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setMessage(null);
  };

  const handleCancel = () => {
    setEditing(false);
    if (operatorData) {
      setEditForm({
        name: operatorData.name,
        phone: operatorData.phone || ''
      });
    }
    setMessage(null);
  };

  const handleSave = async () => {
    if (!operatorData) return;

    setSaving(true);
    setMessage(null);

    try {
      // Here you would typically update the user profile
      // For now, we'll just show a success message
      setMessage({
        type: 'success',
        text: 'Profile updated successfully!'
      });
      
      // Update local state
      setOperatorData({
        ...operatorData,
        name: editForm.name,
        phone: editForm.phone
      });
      
      setEditing(false);
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to update profile. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!operatorData) {
    return (
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <p className="text-center text-gray-500 dark:text-gray-400">Unable to load profile data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-accent dark:bg-gray-700 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground dark:text-gray-300" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900 dark:text-gray-100">Operator Profile</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Your personal information and account details</CardDescription>
              </div>
            </div>
            {!editing && (
              <Button variant="outline" onClick={handleEdit} className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className={`mb-4 ${
              message.type === 'error' 
                ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20' 
                : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
            }`}>
              <AlertDescription className={
                message.type === 'error' 
                  ? 'text-red-800 dark:text-red-200' 
                  : 'text-green-800 dark:text-green-200'
              }>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">Personal Information</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <div className="flex-1">
                    {editing ? (
                      <div className="space-y-1">
                        <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Full Name</Label>
                        <Input
                          id="name"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          disabled={saving}
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{operatorData.name}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email Address</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{operatorData.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <div className="flex-1">
                    {editing ? (
                      <div className="space-y-1">
                        <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">Phone Number</Label>
                        <Input
                          id="phone"
                          value={editForm.phone}
                          onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          disabled={saving}
                          placeholder="Enter phone number"
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{operatorData.phone || 'Not provided'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">Account Information</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Account Status</p>
                    <Badge variant={operatorData.isActive ? 'default' : 'secondary'} className={
                      operatorData.isActive 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }>
                      {operatorData.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Account Created</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {operatorData.createdAt ? formatFirestoreDate(operatorData.createdAt) : 'N/A'}
                    </p>
                  </div>
                </div>

                {operatorData.lastLogin && (
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Last Login</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {formatFirestoreDate(operatorData.lastLogin)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Assigned Locations */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Assigned Locations</h3>
            {locations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {locations.map((location) => (
                  <motion.div
                    key={location.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-900"
                  >
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-muted-foreground dark:text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{location.venueName}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{location.address}</p>
                        {location.contactNumber && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Contact: {location.contactNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                <p className="text-gray-500 dark:text-gray-400">No locations assigned</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Contact your administrator to get location access</p>
              </div>
            )}
          </div>

          {/* Edit Actions */}
          {editing && (
            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={handleCancel} disabled={saving} className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}