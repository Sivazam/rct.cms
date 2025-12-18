'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  Building2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getLocations } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customerData: NewCustomerData) => Promise<void>;
  initialMobile?: string;
  isLoading?: boolean;
}

export interface NewCustomerData {
  name: string;
  mobile: string;
  city: string;
  additionalDetails: string;
  locationId: string;
  createdBy: string;
}

export default function NewCustomerModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialMobile = '',
  isLoading = false 
}: NewCustomerModalProps) {
  const { user } = useAuth();
  const [locations, setLocations] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [formData, setFormData] = useState<NewCustomerData>({
    name: '',
    mobile: initialMobile,
    city: '',
    additionalDetails: '',
    locationId: '',
    createdBy: user?.id || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug logging
  console.log('🔍 [NEW_CUSTOMER_MODAL] Modal props:', { isOpen, initialMobile, isLoading });

  // Fetch locations on mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // Update mobile when initialMobile changes
  useEffect(() => {
    if (initialMobile) {
      setFormData(prev => ({ ...prev, mobile: initialMobile }));
    }
  }, [initialMobile]);

  const fetchLocations = async () => {
    try {
      setLoadingLocations(true);
      const locationsData = await getLocations();
      const activeLocations = locationsData.filter(loc => loc.isActive);
      setLocations(activeLocations);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Mobile validation
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number starting with 6-9';
    }

    // City validation
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    } else if (formData.city.trim().length < 2) {
      newErrors.city = 'City must be at least 2 characters';
    }

    // Location validation
    if (!formData.locationId) {
      newErrors.locationId = 'Please select a location';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form on successful submission
      setFormData({
        name: '',
        mobile: initialMobile,
        city: '',
        additionalDetails: '',
        locationId: '',
        createdBy: user?.id || ''
      });
      setErrors({});
    } catch (error) {
      console.error('Error submitting customer data:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    console.log('🔍 [NEW_CUSTOMER_MODAL] Modal close requested');
    onClose();
  };

  const handleInputChange = (field: keyof NewCustomerData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectedLocation = locations.find(loc => loc.id === formData.locationId);

  return (
    <Dialog open={isOpen} onInteractOutside={(e) => e.preventDefault()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5" />
            New Customer Registration
          </DialogTitle>
          <DialogDescription>
            Register a new customer for ash pot entry. Please fill in all the required information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Customer Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    Customer Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter customer full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={errors.name ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Mobile Number */}
                <div className="space-y-2">
                  <Label htmlFor="mobile" className="flex items-center gap-2">
                    Mobile Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={formData.mobile}
                    onChange={(e) => handleInputChange('mobile', e.target.value.replace(/\D/g, ''))}
                    maxLength={10}
                    className={errors.mobile ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.mobile && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.mobile}
                    </p>
                  )}
                </div>

                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city" className="flex items-center gap-2">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Enter customer city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={errors.city ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.city && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.city}
                    </p>
                  )}
                </div>

                {/* Location Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="locationId" className="flex items-center gap-2">
                    Location <span className="text-red-500">*</span>
                  </Label>
                  {loadingLocations ? (
                    <div className="flex items-center gap-2 p-2 border rounded-md">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading locations...
                    </div>
                  ) : (
                    <Select
                      value={formData.locationId}
                      onValueChange={(value) => handleInputChange('locationId', value)}
                      disabled={isSubmitting || locations.length === 0}
                    >
                      <SelectTrigger className={errors.locationId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              <span>{location.venueName}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.locationId && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.locationId}
                    </p>
                  )}
                  {selectedLocation && (
                    <p className="text-xs text-muted-foreground mt-1">
                      📍 {selectedLocation.address}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Additional Details</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="additionalDetails">Additional Information (Optional)</Label>
                <Textarea
                  id="additionalDetails"
                  placeholder="Enter any additional notes or special requirements..."
                  value={formData.additionalDetails}
                  onChange={(e) => handleInputChange('additionalDetails', e.target.value)}
                  rows={3}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  This field is optional. You can enter any special requirements or notes about the customer.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Selected Location Summary */}
          {selectedLocation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-muted/50 rounded-lg border"
            >
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">{selectedLocation.venueName}</h4>
                  <p className="text-sm text-muted-foreground">{selectedLocation.address}</p>
                  <p className="text-xs text-muted-foreground">
                    Contact: {selectedLocation.contactNumber || 'Not available'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            
            <div className="flex items-center gap-2">
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </div>
              )}
              
              <Button
                type="submit"
                disabled={isSubmitting || loadingLocations}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Registering...
                  </div>
                ) : (
                  'Register Customer'
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}