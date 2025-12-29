'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Plus, Edit, Trash2, Home, Building, Check, Phone, MapPin as MapPinIcon } from 'lucide-react';
import { MainLayout } from '@/components/store/MainLayout';
import { isUserAuthenticated, getCurrentUser } from '@/lib/auth';
import { userService } from '@/lib/services';
import { useRouter } from 'next/navigation';

interface Address {
  id?: string;
  name: string;
  phone: string;
  doorNo: string;
  pincode: string;
  landmark: string;
  addressType: 'home' | 'office' | 'other';
  customAddressName?: string;
  isDefault?: boolean;
  createdAt?: string;
}

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [newAddress, setNewAddress] = useState<Address>({
    name: '',
    phone: '+91',
    doorNo: '',
    pincode: '',
    landmark: '',
    addressType: 'home',
    customAddressName: '',
    isDefault: false
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    checkAuthAndLoadAddresses();
  }, []);

  const checkAuthAndLoadAddresses = async () => {
    const authStatus = isUserAuthenticated();
    setIsAuthenticated(authStatus);
    
    if (!authStatus) {
      router.push('/auth/login');
      return;
    }

    await loadAddresses();
    await loadUserName();
  };

  const loadUserName = async () => {
    try {
      const currentUser = getCurrentUser();
      if (currentUser) {
        const user = await userService.getUserByPhoneNumber(currentUser.phoneNumber);
        if (user && user.name) {
          setUserName(user.name);
        }
      }
    } catch (error) {
      console.error('Error loading user name:', error);
    }
  };

  const loadAddresses = async () => {
    try {
      const currentUser = getCurrentUser();
      if (currentUser) {
        const user = await userService.getUserByPhoneNumber(currentUser.phoneNumber);
        if (user && user.addresses) {
          setAddresses(user.addresses);
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!validateAddress(newAddress)) {
      const errorMessage = getValidationErrorMessage(newAddress);
      alert(errorMessage);
      return;
    }

    try {
      const currentUser = getCurrentUser();
      if (currentUser) {
        const user = await userService.getUserByPhoneNumber(currentUser.phoneNumber);
        if (user) {
          await userService.addAddress(user.id!, newAddress);
          await loadAddresses();
          setNewAddress({
            name: '',
            phone: '+91',
            doorNo: '',
            pincode: '',
            landmark: '',
            addressType: 'home',
            customAddressName: '',
            isDefault: false
          });
          setIsDialogOpen(false);
        }
      }
    } catch (error) {
      console.error('Error adding address:', error);
      alert('Failed to add address');
    }
  };

  const handleUpdateAddress = async () => {
    if (!editingAddress || !validateAddress(editingAddress)) {
      const errorMessage = getValidationErrorMessage(editingAddress || newAddress);
      alert(errorMessage);
      return;
    }

    try {
      const currentUser = getCurrentUser();
      if (currentUser) {
        const user = await userService.getUserByPhoneNumber(currentUser.phoneNumber);
        if (user && editingAddress.id) {
          await userService.updateAddress(user.id!, editingAddress.id, editingAddress);
          await loadAddresses();
          setEditingAddress(null);
          setIsDialogOpen(false);
        }
      }
    } catch (error) {
      console.error('Error updating address:', error);
      alert('Failed to update address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      const currentUser = getCurrentUser();
      if (currentUser) {
        const user = await userService.getUserByPhoneNumber(currentUser.phoneNumber);
        if (user) {
          await userService.removeAddress(user.id!, addressId);
          await loadAddresses();
        }
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Failed to delete address');
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const currentUser = getCurrentUser();
      if (currentUser) {
        const user = await userService.getUserByPhoneNumber(currentUser.phoneNumber);
        if (user) {
          await userService.updateAddress(user.id!, addressId, { isDefault: true });
          await loadAddresses();
        }
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      alert('Failed to set default address');
    }
  };

  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingAddress(null);
    setNewAddress({
      name: userName, // Pre-fill with user's name
      phone: '+91',
      doorNo: '',
      pincode: '',
      landmark: '',
      addressType: 'home',
      customAddressName: '',
      isDefault: false
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingAddress(null);
  };

  const validateAddress = (address: Address): boolean => {
    // Required fields: name, phone (with +91), doorNo, pincode
    const requiredFields = ['name', 'phone', 'doorNo', 'pincode'];
    
    // If address type is 'other', customAddressName is also required
    if (address.addressType === 'other') {
      requiredFields.push('customAddressName');
    }
    
    for (const field of requiredFields) {
      const value = address[field as keyof Address];
      if (!value || value.toString().trim() === '') {
        return false;
      }
    }
    
    // Phone must start with +91 and contain only numbers after that
    if (!address.phone.startsWith('+91') || address.phone.length < 5) {
      return false;
    }
    
    // Pincode must be 6 digits
    if (!/^\d{6}$/.test(address.pincode)) {
      return false;
    }
    
    return true;
  };

  const getValidationErrorMessage = (address: Address): string => {
    // Check if custom address name is missing for 'other' type
    if (address.addressType === 'other' && (!address.customAddressName || address.customAddressName.trim() === '')) {
      return 'Please enter an address label to save this address as (e.g., "Mom\'s House")';
    }
    
    // Check other required fields
    const requiredFields = ['name', 'phone', 'doorNo', 'pincode'];
    for (const field of requiredFields) {
      const value = address[field as keyof Address];
      if (!value || value.toString().trim() === '') {
        if (field === 'name') {
          return 'Please enter the recipient\'s full name';
        }
        return `Please fill in the ${field} field`;
      }
    }
    
    // Check phone format
    if (!address.phone.startsWith('+91') || address.phone.length < 5) {
      return 'Please enter a valid phone number starting with +91';
    }
    
    // Check pincode format
    if (!/^\d{6}$/.test(address.pincode)) {
      return 'Please enter a valid 6-digit pincode';
    }
    
    return '';
  };

  const formatAddress = (address: Address): string => {
    const parts = [address.doorNo];
    if (address.landmark) {
      parts.push(`Near ${address.landmark}`);
    }
    return parts.join(', ');
  };

  const getAddressType = (address: Address): string => {
    if (address.addressType === 'other' && address.customAddressName) {
      return address.customAddressName;
    }
    switch (address.addressType) {
      case 'home':
        return 'Home';
      case 'office':
        return 'Office';
      default:
        return address.name || userName || 'Other';
    }
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Please login to view your addresses</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading addresses...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Addresses</h1>
              <p className="text-gray-600">Manage your saved addresses for quick checkout</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Address
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-[600px] w-full mx-auto sm:mx-4">
                <DialogHeader>
                  <DialogTitle>
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </DialogTitle>
                </DialogHeader>
                <AddressForm
                  address={editingAddress || newAddress}
                  setAddress={editingAddress ? setEditingAddress : setNewAddress}
                  onSave={editingAddress ? handleUpdateAddress : handleAddAddress}
                  onCancel={closeDialog}
                  isEditing={!!editingAddress}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Addresses Grid */}
          {addresses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {addresses.map((address) => (
                <Card key={address.id} className="relative hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getAddressType(address) === 'Home' ? (
                          <Home className="h-4 w-4 text-orange-600" />
                        ) : (
                          <Building className="h-4 w-4 text-blue-600" />
                        )}
                        <CardTitle className="text-lg">
                          {getAddressType(address)}
                        </CardTitle>
                      </div>
                      {address.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-medium">{address.name}</p>
                      <p className="text-sm text-gray-600">{address.phone}</p>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-gray-700 leading-relaxed">
                        <p>{formatAddress(address)}</p>
                        <p className="mt-1">Pincode: {address.pincode}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(address)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {addresses.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAddress(address.id!)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      {!address.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(address.id!)}
                          className="text-xs"
                        >
                          Set as Default
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-16">
                <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved addresses</h3>
                <p className="text-gray-600 mb-6">Save your addresses for a faster checkout experience</p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openAddDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Address
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-[600px] w-full mx-auto sm:mx-4">
                    <DialogHeader>
                      <DialogTitle>Add New Address</DialogTitle>
                    </DialogHeader>
                    <AddressForm
                      address={newAddress}
                      setAddress={setNewAddress}
                      onSave={handleAddAddress}
                      onCancel={closeDialog}
                      isEditing={false}
                    />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

interface AddressFormProps {
  address: Address;
  setAddress: (address: Address) => void;
  onSave: () => void;
  onCancel: () => void;
  isEditing: boolean;
}

function AddressForm({ address, setAddress, onSave, onCancel, isEditing }: AddressFormProps) {
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Only allow numbers after +91
    if (value.startsWith('+91')) {
      const numbersOnly = value.replace(/[^\d]/g, '');
      if (numbersOnly.length > 10) {
        value = '+91' + numbersOnly.slice(2, 12); // Limit to 10 digits after +91
      } else {
        value = '+91' + numbersOnly.slice(2);
      }
    } else if (value === '') {
      value = '+91';
    }
    
    setAddress({ ...address, phone: value });
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Only allow numbers and limit to 6 digits
    const numbersOnly = value.replace(/[^\d]/g, '');
    if (numbersOnly.length > 6) {
      value = numbersOnly.slice(0, 6);
    } else {
      value = numbersOnly;
    }
    
    setAddress({ ...address, pincode: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={address.name}
            onChange={(e) => setAddress({ ...address, name: e.target.value })}
            placeholder="Enter full name"
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Contact Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={address.phone}
            onChange={handlePhoneChange}
            placeholder="+91"
            required
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="doorNo">Door No/Flat No/Building Name *</Label>
        <Input
          id="doorNo"
          value={address.doorNo}
          onChange={(e) => setAddress({ ...address, doorNo: e.target.value })}
          placeholder="Enter door/flat number or building name"
          required
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="pincode">Pincode *</Label>
          <Input
            id="pincode"
            value={address.pincode}
            onChange={handlePincodeChange}
            placeholder="Enter 6-digit pincode"
            maxLength={6}
            required
          />
        </div>
        <div>
          <Label htmlFor="landmark">Nearby Landmark</Label>
          <Input
            id="landmark"
            value={address.landmark}
            onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
            placeholder="Enter nearby landmark (optional)"
          />
        </div>
      </div>
      
      <div>
        <Label>Save as *</Label>
        <div className="flex space-x-4 mt-2">
          <button
            type="button"
            onClick={() => setAddress({ ...address, addressType: 'home' })}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
              address.addressType === 'home'
                ? 'border-orange-600 bg-orange-50 text-orange-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </button>
          
          <button
            type="button"
            onClick={() => setAddress({ ...address, addressType: 'office' })}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
              address.addressType === 'office'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <Building className="h-4 w-4" />
            <span>Office</span>
          </button>
          
          <button
            type="button"
            onClick={() => setAddress({ ...address, addressType: 'other' })}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
              address.addressType === 'other'
                ? 'border-green-600 bg-green-50 text-green-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <MapPinIcon className="h-4 w-4" />
            <span>Other</span>
          </button>
        </div>
      </div>
      
      {/* Conditional address label field - only shown when 'other' is selected */}
      {address.addressType === 'other' && (
        <div>
          <Label htmlFor="customAddressName">Address Label *</Label>
          <Input
            id="customAddressName"
            value={address.customAddressName || ''}
            onChange={(e) => setAddress({ ...address, customAddressName: e.target.value })}
            placeholder="e.g., Mom's House, Friend's Place, etc."
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            This name will be used to identify this address
          </p>
        </div>
      )}
      
      {!isEditing && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isDefault"
            checked={address.isDefault}
            onChange={(e) => setAddress({ ...address, isDefault: e.target.checked })}
            className="rounded border-gray-300 text-orange-600 focus:ring-orange-600"
          />
          <Label htmlFor="isDefault">Set as default address</Label>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-2 pt-4">
        <Button onClick={onSave} className="flex-1 sm:flex-none">
          <Check className="h-4 w-4 mr-2" />
          {isEditing ? 'Update Address' : 'Add Address'}
        </Button>
        <Button variant="outline" onClick={onCancel} className="flex-1 sm:flex-none">
          Cancel
        </Button>
      </div>
    </div>
  );
}