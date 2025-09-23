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
import { Users, Check, X, MapPin, Phone, Mail, Calendar, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getUsers, updateUser, getLocations, getPendingOperators, getActiveOperators, getRejectedOperators, approveOperator, rejectOperator } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { formatFirestoreDate } from '@/lib/date-utils';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [pendingOperators, setPendingOperators] = useState<Operator[]>([]);
  const [activeOperators, setActiveOperators] = useState<Operator[]>([]);
  const [inactiveOperators, setInactiveOperators] = useState<Operator[]>([]);
  const [rejectedOperators, setRejectedOperators] = useState<Operator[]>([]);
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
      
      const [pendingOps, activeOps, rejectedOps, locs] = await Promise.all([
        getPendingOperators(),
        getActiveOperators(),
        getRejectedOperators(),
        getLocations()
      ]);
      
      console.log('Data fetched successfully:', {
        pendingOperators: pendingOps.length,
        activeOperators: activeOps.length,
        rejectedOperators: rejectedOps.length,
        locations: locs.length
      });
      
      setPendingOperators(pendingOps);
      setActiveOperators(activeOps);
      setRejectedOperators(rejectedOps);
      
      // For inactive operators, we want operators who are not active, not pending, and not rejected
      // These would be operators who were once active but then deactivated
      const allUsers = await getUsers();
      const inactiveOps = allUsers.filter(user => 
        user.role === 'operator' && 
        !user.isActive && 
        !user.isRejected &&
        !pendingOps.some(pending => pending.id === user.id) // Not in pending list
      );
      
      setInactiveOperators(inactiveOps);
      setLocations(locs.filter(loc => loc.isActive));
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
      console.error('Approval error: Missing operator or user', { selectedOperator, user });
      return;
    }

    if (selectedLocations.length === 0) {
      setError('Please select at least one location for the operator');
      return;
    }

    try {
      console.log('Approving operator:', {
        operatorId: selectedOperator.id,
        locationIds: selectedLocations,
        approvedBy: user.uid
      });
      
      await approveOperator(selectedOperator.id, selectedLocations, user.uid);
      
      console.log('Operator approved successfully');
      
      // Show success toast
      toast({
        title: "Operator Approved",
        description: `${selectedOperator.name} has been successfully approved and assigned to ${selectedLocations.length} location(s).`,
      });
      
      setIsApproveDialogOpen(false);
      setSelectedOperator(null);
      setSelectedLocations([]);
      fetchData();
    } catch (error: any) {
      console.error('Error approving operator:', error);
      const errorMessage = error.message || 'Failed to approve operator';
      setError(errorMessage);
      
      // Show error toast
      toast({
        title: "Approval Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (operatorId: string) => {
    const operator = pendingOperators.find(op => op.id === operatorId);
    if (!operator) {
      setError('Operator not found');
      return;
    }

    if (!confirm(`Are you sure you want to reject ${operator.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      console.log('Rejecting operator:', { operatorId, reason: 'Rejected by admin' });
      
      await rejectOperator(operatorId, 'Rejected by admin');
      
      console.log('Operator rejected successfully');
      
      // Show success toast
      toast({
        title: "Operator Rejected",
        description: `${operator.name} has been permanently rejected and cannot be restored.`,
      });
      
      fetchData();
    } catch (error: any) {
      console.error('Error rejecting operator:', error);
      const errorMessage = error.message || 'Failed to reject operator';
      setError(errorMessage);
      
      // Show error toast
      toast({
        title: "Rejection Failed",
        description: errorMessage,
        variant: "destructive",
      });
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
    const operator = activeOperators.find(op => op.id === operatorId);
    if (!operator) {
      setError('Operator not found');
      return;
    }

    if (!confirm(`Are you sure you want to deactivate ${operator.name}? They will no longer be able to access the system.`)) {
      return;
    }

    try {
      console.log('Deactivating operator:', { operatorId });
      
      await updateUser(operatorId, {
        isActive: false
      });
      
      console.log('Operator deactivated successfully');
      
      // Show success toast
      toast({
        title: "Operator Deactivated",
        description: `${operator.name} has been deactivated and can no longer access the system.`,
      });
      
      fetchData();
    } catch (error: any) {
      console.error('Error deactivating operator:', error);
      const errorMessage = error.message || 'Failed to deactivate operator';
      setError(errorMessage);
      
      // Show error toast
      toast({
        title: "Deactivation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleActivate = async (operatorId: string) => {
    const operator = inactiveOperators.find(op => op.id === operatorId);
    if (!operator) {
      setError('Operator not found');
      return;
    }

    try {
      console.log('Activating operator:', { operatorId });
      
      await updateUser(operatorId, {
        isActive: true
      });
      
      console.log('Operator activated successfully');
      
      // Show success toast
      toast({
        title: "Operator Activated",
        description: `${operator.name} has been activated and can now access the system.`,
      });
      
      fetchData();
    } catch (error: any) {
      console.error('Error activating operator:', error);
      const errorMessage = error.message || 'Failed to activate operator';
      setError(errorMessage);
      
      // Show error toast
      toast({
        title: "Activation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Operator Management</h2>
        <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
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
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4"
                >
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{operator.name}</h4>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{operator.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{operator.mobile}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span>Applied: {formatFirestoreDate(operator.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleApproveClick(operator)}
                      className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(operator.id)}
                      className="text-red-600 dark:text-red-300 hover:text-red-700 whitespace-nowrap"
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
              <p className="text-gray-500 dark:text-gray-400">No active operators found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOperators.map((operator, index) => (
                <motion.div
                  key={operator.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4"
                >
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium truncate">{operator.name}</h4>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{operator.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{operator.mobile}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span>
                          {operator.locationIds?.length || 0} location(s) assigned
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApproveClick(operator)}
                      className="whitespace-nowrap"
                    >
                      Edit Assignment
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeactivate(operator.id)}
                      className="text-red-600 dark:text-red-300 hover:text-red-700 whitespace-nowrap"
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

      {/* Inactive Operators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <span>Inactive Operators</span>
          </CardTitle>
          <CardDescription>
            Deactivated operators that can be reactivated
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inactiveOperators.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500  dark:text-gray-400">No inactive operators found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {inactiveOperators.map((operator, index) => (
                <motion.div
                  key={operator.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4 bg-gray-50 dark:bg-gray-900"
                >
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium truncate">{operator.name}</h4>
                        <Badge variant="secondary">Inactive</Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{operator.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{operator.mobile}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span>
                          {operator.locationIds?.length || 0} location(s) assigned
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApproveClick(operator)}
                      className="whitespace-nowrap"
                    >
                      Edit Assignment
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleActivate(operator.id)}
                      className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Activate
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejected Operators */}
      {rejectedOperators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-red-500" />
              <span>Rejected Operators</span>
            </CardTitle>
            <CardDescription>
              Operators who have been rejected and cannot be activated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rejectedOperators.map((operator, index) => (
                <motion.div
                  key={operator.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4 bg-red-50  dark:bg-red-900"
                >
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="h-6 w-6 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium truncate">{operator.name}</h4>
                        <Badge variant="destructive">Rejected</Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{operator.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{operator.mobile}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span>Applied: {formatFirestoreDate(operator.createdAt)}</span>
                      </div>
                      {operator.rejectionReason && (
                        <div className="flex items-center space-x-1 text-xs text-red-600 dark:text-red-300 mt-1">
                          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                          <span>Reason: {operator.rejectionReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    <Badge variant="outline" className="text-red-600 dark:text-red-300 border-red-200">
                      Cannot be restored
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
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
                        <div className="text-sm text-gray-600 dark:text-gray-300">{location.address}</div>
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