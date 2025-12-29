'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Plus, Edit, Trash2, Check, Home, Building, Phone, MapPin as MapPinIcon } from 'lucide-react';
import { userService } from '@/lib/services';
import { getCurrentUser } from '@/lib/auth';

interface Address {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  doorNo: string;
  city: string;
  pincode: string;
  landmark: string;
  addressType: 'home' | 'office' | 'other';
  customAddressName?: string;
  isDefault?: boolean;
  createdAt?: string;
}

interface AddressSelectionProps {
  onAddressSelect: (address: Address) => void;
  selectedAddress?: Address;
}

export function AddressSelection({ onAddressSelect, selectedAddress }: AddressSelectionProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [newAddress, setNewAddress] = useState<Address>({
    name: '',
    phone: '+91',
    email: '',
    doorNo: '',
    city: '',
    pincode: '',
    landmark: '',
    addressType: 'home',
    customAddressName: '',
    isDefault: false
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  // Prefill form with current user data when showing add form
  useEffect(() => {
    if (showAddForm && !editingAddress) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        // Try to get user details from userService to get email and name
        userService.getUserByPhoneNumber(currentUser.phoneNumber).then(user => {
          if (user) {
            setNewAddress(prev => ({
              ...prev,
              name: user.name || prev.name,
              email: user.email || prev.email,
              phone: user.phoneNumber || prev.phone,
              city: user.city || prev.city
            }));
          } else {
            // Fallback to just phone number from auth token
            setNewAddress(prev => ({
              ...prev,
              phone: currentUser.phoneNumber || prev.phone
            }));
          }
        }).catch(error => {
          console.log('Error fetching user details:', error);
          // Fallback to just phone number from auth token
          setNewAddress(prev => ({
            ...prev,
            phone: currentUser.phoneNumber || prev.phone
          }));
        });
      }
    }
  }, [showAddForm, editingAddress]);

  const loadAddresses = async () => {
    try {
      const currentUser = getCurrentUser();
      if (currentUser) {
        console.log('Loading addresses for user:', currentUser.phoneNumber);
        const user = await userService.getUserByPhoneNumber(currentUser.phoneNumber);
        if (user && user.addresses) {
          console.log('Found user with addresses:', user.addresses.length, user.addresses);
          
          // Remove duplicates based on address content (not just ID)
          const uniqueAddresses = user.addresses.filter((address, index, self) =>
            index === self.findIndex((a) => 
              a.name === address.name && 
              a.phone === address.phone && 
              a.doorNo === address.doorNo && 
              a.city === address.city && 
              a.pincode === address.pincode
            )
          );
          
          if (uniqueAddresses.length !== user.addresses.length) {
            console.log('Removed duplicate addresses:', user.addresses.length - uniqueAddresses.length, 'duplicates found');
          }
          
          setAddresses(uniqueAddresses);
          
          // Auto-select default address if none is selected
          if (!selectedAddress) {
            const defaultAddress = uniqueAddresses.find(addr => addr.isDefault) || uniqueAddresses[0];
            if (defaultAddress) {
              console.log('Auto-selecting default address:', defaultAddress);
              onAddressSelect(defaultAddress);
            }
          }
        } else {
          console.log('User found but no addresses:', user);
          setAddresses([]);
        }
      } else {
        console.log('No current user found');
        setAddresses([]);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!validateAddress(newAddress)) {
      alert(getValidationErrorMessage(newAddress));
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
            email: '',
            doorNo: '',
            city: '',
            pincode: '',
            landmark: '',
            addressType: 'home',
            customAddressName: '',
            isDefault: false
          });
          setShowAddForm(false);
        }
      }
    } catch (error) {
      console.error('Error adding address:', error);
      alert('Failed to add address');
    }
  };

  const handleUpdateAddress = async () => {
    if (!editingAddress || !validateAddress(editingAddress)) {
      alert(getValidationErrorMessage(editingAddress || newAddress));
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

  const validateAddress = (address: Address): boolean => {
    // Required fields: name, phone, doorNo, city, pincode
    const requiredFields = ['name', 'phone', 'doorNo', 'city', 'pincode'];
    
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
    
    // Phone validation - be more lenient, just check for reasonable length and numbers
    const cleanPhone = address.phone.replace(/[^\d]/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return false;
    }
    
    // Pincode must be 6 digits
    if (!/^\d{6}$/.test(address.pincode)) {
      return false;
    }
    
    // Email validation (optional field, but if provided must be valid)
    if (address.email && address.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(address.email)) {
        return false;
      }
    }
    
    return true;
  };

  const getValidationErrorMessage = (address: Address): string => {
    // Check if custom address name is missing for 'other' type
    if (address.addressType === 'other' && (!address.customAddressName || address.customAddressName.trim() === '')) {
      return 'Please enter a name to save this address as (e.g., "Mom\'s House")';
    }
    
    // Check email validation
    if (address.email && address.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(address.email)) {
        return 'Please enter a valid email address';
      }
    }
    
    // Check other required fields
    const requiredFields = ['name', 'phone', 'doorNo', 'city', 'pincode'];
    for (const field of requiredFields) {
      const value = address[field as keyof Address];
      if (!value || value.toString().trim() === '') {
        if (field === 'name') {
          return 'Please enter the recipient\'s full name';
        }
        if (field === 'city') {
          return 'Please enter the city';
        }
        return `Please fill in the ${field} field`;
      }
    }
    
    // Check phone format
    const cleanPhone = address.phone.replace(/[^\d]/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return 'Please enter a valid phone number (10-15 digits)';
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
    if (address.city) {
      parts.push(address.city);
    }
    return parts.join(', ');
  };

  const formatAddressType = (address: Address): string => {
    if (address.addressType === 'other' && address.customAddressName) {
      return address.customAddressName;
    }
    // Handle undefined addressType with fallback
    const addressType = address.addressType || 'home';
    return addressType.charAt(0).toUpperCase() + addressType.slice(1);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Shipping Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading addresses...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Shipping Address
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {addresses.length > 0 ? (
          <>
            <RadioGroup
              value={selectedAddress?.id || ''}
              onValueChange={(value) => {
                console.log('Radio button changed to:', value);
                const address = addresses.find(addr => addr.id === value);
                if (address) {
                  console.log('Found address, calling onAddressSelect:', address);
                  console.log('Address validation check:', {
                    hasName: !!address.name,
                    hasPhone: !!address.phone,
                    hasEmail: !!address.email,
                    hasDoorNo: !!address.doorNo,
                    hasCity: !!address.city,
                    hasPincode: !!address.pincode,
                    phoneValid: address.phone && address.phone.startsWith('+91') && address.phone.length >= 5,
                    pincodeValid: address.pincode && /^\d{6}$/.test(address.pincode)
                  });
                  onAddressSelect(address);
                } else {
                  console.log('No address found for id:', value);
                  console.log('Available addresses:', addresses.map(a => ({ id: a.id, name: a.name })));
                }
              }}
              className="space-y-3"
            >
              {addresses.map((address) => (
                <div key={address.id} className="relative">
                  <RadioGroupItem
                    value={address.id || ''}
                    id={address.id}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={address.id}
                    className={`flex flex-col p-4 border rounded-lg cursor-pointer transition-colors peer-data-[state=checked]:border-orange-600 peer-data-[state=checked]:bg-orange-50 hover:bg-gray-50 ${
                      selectedAddress?.id === address.id ? 'border-orange-600 bg-orange-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col space-y-1">
                            <span className="font-medium text-base break-words">{address.name}</span>
                            <span className="text-sm text-gray-600 break-words">{address.phone}</span>
                            {address.email && (
                              <span className="text-sm text-blue-600 break-all">{address.email}</span>
                            )}
                            {address.isDefault && (
                              <Badge variant="secondary" className="text-xs w-fit">
                                Default
                              </Badge>
                            )}
                          </div>
                        </div>
                        {selectedAddress?.id === address.id && (
                          <Check className="h-5 w-5 text-orange-600 flex-shrink-0 ml-2 mt-1" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 break-words">{formatAddress(address)}</p>
                        <p className="text-sm text-gray-600">Pincode: {address.pincode}</p>
                        {address.addressType === 'other' && address.customAddressName ? (
                          <p className="text-sm font-medium text-blue-600 break-words">
                            📍 {address.customAddressName}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Type: </span>
                            {formatAddressType(address)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Label>
                  
                  <div className="flex flex-row items-center space-x-2 mt-3 pt-3 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingAddress(address)}
                      className="h-8 px-3 py-1 text-xs sm:h-8 sm:w-8 sm:p-0"
                    >
                      <Edit className="h-4 w-4 sm:mr-0 mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAddress(address.id!)}
                      className="h-8 px-3 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 sm:h-8 sm:w-8 sm:p-0"
                    >
                      <Trash2 className="h-4 w-4 sm:mr-0 mr-1" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                    {!address.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(address.id!)}
                        className="h-8 px-3 py-1 text-xs sm:h-8 sm:w-auto sm:px-2 sm:py-0"
                      >
                        Set Default
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </RadioGroup>
            
            <Separator />
          </>
        ) : (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 mb-4">No saved addresses found</p>
          </div>
        )}

        {showAddForm || editingAddress ? (
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-medium text-lg">
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Recipient's Full Name *</Label>
                <Input
                  id="name"
                  value={editingAddress ? editingAddress.name : newAddress.name}
                  onChange={(e) => {
                    if (editingAddress) {
                      setEditingAddress({ ...editingAddress, name: e.target.value });
                    } else {
                      setNewAddress({ ...newAddress, name: e.target.value });
                    }
                  }}
                  placeholder="Enter recipient's full name"
                  required
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="phone" className="text-sm font-medium">Contact Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={editingAddress ? editingAddress.phone : newAddress.phone}
                  onChange={(e) => {
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
                    
                    if (editingAddress) {
                      setEditingAddress({ ...editingAddress, phone: value });
                    } else {
                      setNewAddress({ ...newAddress, phone: value });
                    }
                  }}
                  placeholder="+91"
                  required
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingAddress ? (editingAddress.email || '') : newAddress.email}
                  onChange={(e) => {
                    if (editingAddress) {
                      setEditingAddress({ ...editingAddress, email: e.target.value });
                    } else {
                      setNewAddress({ ...newAddress, email: e.target.value });
                    }
                  }}
                  placeholder="Enter email address (optional)"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="doorNo" className="text-sm font-medium">Door No/Flat No/Building Name *</Label>
                <Input
                  id="doorNo"
                  value={editingAddress ? editingAddress.doorNo : newAddress.doorNo}
                  onChange={(e) => {
                    if (editingAddress) {
                      setEditingAddress({ ...editingAddress, doorNo: e.target.value });
                    } else {
                      setNewAddress({ ...newAddress, doorNo: e.target.value });
                    }
                  }}
                  placeholder="Enter door/flat number or building name"
                  required
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city" className="text-sm font-medium">City *</Label>
                  <Input
                    id="city"
                    value={editingAddress ? (editingAddress.city || '') : newAddress.city}
                    onChange={(e) => {
                      if (editingAddress) {
                        setEditingAddress({ ...editingAddress, city: e.target.value });
                      } else {
                        setNewAddress({ ...newAddress, city: e.target.value });
                      }
                    }}
                    placeholder="Enter city"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="pincode" className="text-sm font-medium">Pincode *</Label>
                  <Input
                    id="pincode"
                    value={editingAddress ? editingAddress.pincode : newAddress.pincode}
                    onChange={(e) => {
                      let value = e.target.value;
                      
                      // Only allow numbers and limit to 6 digits
                      const numbersOnly = value.replace(/[^\d]/g, '');
                      if (numbersOnly.length > 6) {
                        value = numbersOnly.slice(0, 6);
                      } else {
                        value = numbersOnly;
                      }
                      
                      if (editingAddress) {
                        setEditingAddress({ ...editingAddress, pincode: value });
                      } else {
                        setNewAddress({ ...newAddress, pincode: value });
                      }
                    }}
                    placeholder="Enter 6-digit pincode"
                    maxLength={6}
                    required
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="landmark" className="text-sm font-medium">Nearby Landmark</Label>
                <Input
                  id="landmark"
                  value={editingAddress ? editingAddress.landmark : newAddress.landmark}
                  onChange={(e) => {
                    if (editingAddress) {
                      setEditingAddress({ ...editingAddress, landmark: e.target.value });
                    } else {
                      setNewAddress({ ...newAddress, landmark: e.target.value });
                    }
                  }}
                  placeholder="Enter nearby landmark (optional)"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Save as *</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (editingAddress) {
                      setEditingAddress({ ...editingAddress, addressType: 'home' });
                    } else {
                      setNewAddress({ ...newAddress, addressType: 'home' });
                    }
                  }}
                  className={`flex flex-col sm:flex-row items-center justify-center sm:justify-start space-y-1 sm:space-y-0 sm:space-x-2 px-3 py-2 rounded-lg border-2 transition-colors ${
                    (editingAddress ? editingAddress.addressType : newAddress.addressType) === 'home'
                      ? 'border-orange-600 bg-orange-50 text-orange-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Home className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">Home</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    if (editingAddress) {
                      setEditingAddress({ ...editingAddress, addressType: 'office' });
                    } else {
                      setNewAddress({ ...newAddress, addressType: 'office' });
                    }
                  }}
                  className={`flex flex-col sm:flex-row items-center justify-center sm:justify-start space-y-1 sm:space-y-0 sm:space-x-2 px-3 py-2 rounded-lg border-2 transition-colors ${
                    (editingAddress ? editingAddress.addressType : newAddress.addressType) === 'office'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Building className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">Office</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    if (editingAddress) {
                      setEditingAddress({ ...editingAddress, addressType: 'other' });
                    } else {
                      setNewAddress({ ...newAddress, addressType: 'other' });
                    }
                  }}
                  className={`flex flex-col sm:flex-row items-center justify-center sm:justify-start space-y-1 sm:space-y-0 sm:space-x-2 px-3 py-2 rounded-lg border-2 transition-colors ${
                    (editingAddress ? editingAddress.addressType : newAddress.addressType) === 'other'
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <MapPinIcon className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">Other</span>
                </button>
              </div>
              
              {/* Custom address label field - only show when "Other" is selected */}
              {(editingAddress ? editingAddress.addressType === 'other' : newAddress.addressType === 'other') && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Label htmlFor="customAddressName" className="text-sm font-medium text-blue-800">
                    Save Address As <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-blue-600 mb-2">Give this address a name (e.g., "Mom's House", "Work Office", "Friend's Place")</p>
                  <Input
                    id="customAddressName"
                    value={editingAddress ? (editingAddress.customAddressName || '') : newAddress.customAddressName}
                    onChange={(e) => {
                      if (editingAddress) {
                        setEditingAddress({ ...editingAddress, customAddressName: e.target.value });
                      } else {
                        setNewAddress({ ...newAddress, customAddressName: e.target.value });
                      }
                    }}
                    placeholder="e.g., Mom's House, Work Office"
                    className="border-blue-300 focus:border-blue-500"
                    required
                  />
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={editingAddress ? handleUpdateAddress : handleAddAddress}
                className="flex-1 sm:flex-none"
              >
                {editingAddress ? 'Update Address' : 'Add Address'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingAddress(null);
                }}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowAddForm(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Address
          </Button>
        )}
      </CardContent>
    </Card>
  );
}