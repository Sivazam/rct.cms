'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Save, ArrowRight } from 'lucide-react';
import { MainLayout } from '@/components/store/MainLayout';
import { isUserAuthenticated, getCurrentUser } from '@/lib/auth';
import { userService } from '@/lib/services';

interface ProfileData {
  name: string;
  email: string;
  phoneNumber: string;
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phoneNumber: ''
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const authStatus = isUserAuthenticated();
    setIsAuthenticated(authStatus);
    
    if (!authStatus) {
      router.push('/auth/login');
      return;
    }

    const currentUser = getCurrentUser();
    if (currentUser) {
      try {
        const userData = await userService.getUserByPhoneNumber(currentUser.phoneNumber);
        if (userData) {
          // Check if profile is already complete
          if (userData.name && userData.email) {
            // Profile is complete, redirect to home
            router.push('/');
            return;
          }
          
          // Pre-fill existing data
          setProfileData({
            name: userData.name || '',
            email: userData.email || '',
            phoneNumber: userData.phoneNumber
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!profileData.name.trim()) {
      setError('Name is required');
      setLoading(false);
      return;
    }

    if (!profileData.email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const currentUser = getCurrentUser();
      if (currentUser) {
        const userData = await userService.getUserByPhoneNumber(currentUser.phoneNumber);
        if (userData) {
          // Update user with profile data
          await userService.updateUser(userData.id!, {
            name: profileData.name.trim(),
            email: profileData.email.trim()
          });

          // Verify the update was successful by fetching the updated data
          const updatedUserData = await userService.getUserByPhoneNumber(currentUser.phoneNumber);
          if (updatedUserData && updatedUserData.name && updatedUserData.email) {
            // Dispatch auth state change event only after verification
            window.dispatchEvent(new Event('auth-state-changed'));
            
            // Redirect to home or intended destination
            const redirectUrl = sessionStorage.getItem('redirectUrl');
            if (redirectUrl) {
              sessionStorage.removeItem('redirectUrl');
              router.push(redirectUrl);
            } else {
              router.push('/');
            }
          } else {
            throw new Error('Profile update verification failed');
          }
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (phone.startsWith('+91')) {
      return `+91 ${phone.slice(3, 8)} ${phone.slice(8)}`;
    }
    return phone;
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Please login to continue</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <User className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Complete Your Profile</CardTitle>
            <p className="text-gray-600">
              Please provide your details to get started
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formatPhoneNumber(profileData.phoneNumber)}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">Phone number cannot be changed</p>
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center">{error}</div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={loading}
              >
                {loading ? (
                  'Saving...'
                ) : (
                  <>
                    Complete Profile
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}