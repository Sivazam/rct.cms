'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Check, X, MapPin, Phone, Mail, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { getUsers, updateUser, getLocations } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface Operator {
  id: string;
  email: string;
  name: string;
  mobile: string;
  role: 'admin' | 'operator';
  isActive: boolean;
  locationIds: string[];
  createdAt: any;
}

interface Location {
  id: string;
  venueName: string;
  address: string;
  isActive: boolean;
}

export default function OperatorManagement() {
  const { user } = useAuth();
  const [pendingOperators, setPendingOperators] = useState<Operator[]>([]);
  const [activeOperators, setActiveOperators] = useState<Operator[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching operator data...');
      const [pendingOps, activeOps, locs] = await Promise.all([
        getUsers('operator', false),
        getUsers('operator', true),
        getLocations()
      ]);
      
      console.log('Pending operators:', pendingOps);
      console.log('Active operators:', activeOps);
      console.log('Locations:', locs);
      
      setPendingOperators(pendingOps);
      setActiveOperators(activeOps);
      setLocations(locs.filter(loc => loc.isActive));
    } catch (error) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (operator: Operator) => {
    setSelectedOperator(operator);
    setSelectedLocations(operator.locationIds || []);
    setIsApproveDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedOperator || !user) {
      setError('Invalid operator or user');
      return;
    }

    try {
      await updateUser(selectedOperator.id, {
        isActive: true,
        locationIds: selectedLocations,
        lastLogin: new Date()
      });
      
      setIsApproveDialogOpen(false);
      setSelectedOperator(null);
      setSelectedLocations([]);
      fetchData();
    } catch (error: any) {
      setError(error.message || 'Failed to approve operator');
    }
  };

  const handleReject = async (operatorId: string) => {
    if (!confirm('Are you sure you want to reject this operator? This will delete their account.')) {
      return;
    }

    try {
      // For now, we'll just deactivate the operator
      // In a real system, you might want to delete the account
      await updateUser(operatorId, {
        isActive: false,
        rejectionReason: 'Rejected by admin'
      });
      fetchData();
    } catch (error: any) {
      setError(error.message || 'Failed to reject operator');
    }
  };

  const handleLocationToggle = (locationId: string, checked: boolean) => {
    if (checked) {
      setSelectedLocations(prev => [...prev, locationId]);
    } else {
      setSelectedLocations(prev => prev.filter(id => id !== locationId));
    }
  };

  const handleDeactivate = async (operatorId: string) => {
    if (!confirm('Are you sure you want to deactivate this operator?')) {
      return;
    }

    try {
      await updateUser(operatorId, {
        isActive: false
      });
      fetchData();
    } catch (error: any) {
      setError(error.message || 'Failed to deactivate operator');
    }
  };

  const handleActivate = async (operatorId: string) => {
    try {
      await updateUser(operatorId, {
        isActive: true
      });
      fetchData();
    } catch (error: any) {
      setError(error.message || 'Failed to activate operator');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Operator Management</h2>
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          {pendingOperators.length} Pending Approval
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Pending Approvals */}
      {pendingOperators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Pending Approvals</span>
            </CardTitle>
            <CardDescription>
              Operators waiting for admin approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingOperators.map((operator, index) => (
                <motion.div
                  key={operator.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{operator.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-4 w-4" />
                          <span>{operator.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-4 w-4" />
                          <span>{operator.mobile}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>Applied: {operator.createdAt?.toDate()?.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproveClick(operator)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(operator.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Operators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Active Operators</span>
          </CardTitle>
          <CardDescription>
            Currently active operators and their assigned locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeOperators.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No active operators found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOperators.map((operator, index) => (
                <motion.div
                  key={operator.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{operator.name}</h4>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-4 w-4" />
                          <span>{operator.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-4 w-4" />
                          <span>{operator.mobile}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {operator.locationIds?.length || 0} location(s) assigned
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApproveClick(operator)}
                    >
                      Edit Assignment
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeactivate(operator.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Deactivate
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedOperator?.isActive ? 'Edit Operator Assignment' : 'Approve Operator'}
            </DialogTitle>
            <DialogDescription>
              {selectedOperator?.isActive 
                ? 'Update location assignments for this operator'
                : 'Select locations to assign to this operator'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedOperator && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Operator Details</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {selectedOperator.name}</p>
                  <p><strong>Email:</strong> {selectedOperator.email}</p>
                  <p><strong>Mobile:</strong> {selectedOperator.mobile}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Assign Locations</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {locations.map((location) => (
                    <div key={location.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={location.id}
                        checked={selectedLocations.includes(location.id)}
                        onCheckedChange={(checked) => 
                          handleLocationToggle(location.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={location.id} className="flex-1 cursor-pointer">
                        <div className="font-medium">{location.venueName}</div>
                        <div className="text-sm text-gray-600">{location.address}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleApprove}
                  disabled={selectedLocations.length === 0}
                >
                  {selectedOperator?.isActive ? 'Update Assignment' : 'Approve Operator'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}