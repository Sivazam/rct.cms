'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone } from 'lucide-react';
import { MainLayout } from '@/components/store/MainLayout';
import { isUserAuthenticated } from '@/lib/auth';

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const authenticated = isUserAuthenticated();
    console.log('Login page - User authentication status:', authenticated);
    
    if (authenticated) {
      console.log('User already authenticated, redirecting to home');
      router.push('/');
      return;
    }

    // Cleanup function to clear recaptcha on unmount
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (error) {
          console.log('Error clearing recaptcha on unmount:', error);
        }
        window.recaptchaVerifier = null;
      }
    };
  }, [router]);

  const setupRecaptcha = () => {
    // Clear any existing recaptcha instance
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (error) {
        console.log('Error clearing recaptcha:', error);
      }
      window.recaptchaVerifier = null;
    }

    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (loading) {
      console.log('OTP already being sent, ignoring click');
      return;
    }
    
    setLoading(true);
    setError('');

    console.log('Sending OTP to phone number:', phoneNumber);

    try {
      setupRecaptcha();
      
      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      
      console.log('Formatted phone number:', formattedPhone);
      
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      window.confirmationResult = confirmationResult;
      
      console.log('OTP sent successfully');
      
      // Store phone number in session storage for verification page
      sessionStorage.setItem('phoneNumber', formattedPhone);
      
      console.log('Redirecting to verification page');
      router.push('/auth/verify');
    } catch (error) {
      console.error('Error sending OTP:', error);
      console.error('Error details:', {
        name: (error as any).name,
        message: (error as any).message,
        code: (error as any).code,
        stack: (error as any).stack
      });
      
      // Provide more specific error messages based on the error type
      if ((error as any).code === 'auth/invalid-phone-number') {
        setError('Invalid phone number. Please enter a valid phone number.');
      } else if ((error as any).code === 'auth/quota-exceeded') {
        setError('OTP quota exceeded. Please try again later.');
      } else if ((error as any).code === 'auth/user-disabled') {
        setError('This user account has been disabled.');
      } else if ((error as any).code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.');
      } else {
        setError('Failed to send OTP. Please check your phone number and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Phone className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Welcome to Sanathan Rudraksha</CardTitle>
            <CardDescription className="text-gray-600">
              Enter your phone number to login or signup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="text-center text-lg"
                  required
                />
              </div>
              
              {error && (
                <div className="text-red-600 text-sm text-center">{error}</div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={loading || phoneNumber.length < 10}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </form>
            
            <div id="recaptcha-container"></div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}