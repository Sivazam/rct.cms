'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';
import { MainLayout } from '@/components/store/MainLayout';
import { isUserAuthenticated } from '@/lib/auth';

export default function VerifyPage() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = () => {
      const authenticated = isUserAuthenticated();
      console.log('Verify page - User authentication status:', authenticated);
      
      if (authenticated) {
        console.log('User already authenticated, redirecting to home');
        router.push('/');
        return;
      }
    };

    // Check authentication first
    checkAuth();

    const storedPhone = sessionStorage.getItem('phoneNumber');
    console.log('Retrieved phone from session storage:', storedPhone);
    
    if (!storedPhone) {
      console.log('No phone number found, redirecting to login');
      router.push('/auth/login');
      return;
    }
    setPhoneNumber(storedPhone);

    // Timer for resend OTP
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup function
    return () => {
      clearInterval(interval);
      // Clear recaptcha on unmount
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

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Verifying OTP:', otp);
    console.log('Phone number:', phoneNumber);

    try {
      const confirmationResult = window.confirmationResult;
      const result = await confirmationResult.confirm(otp);
      
      console.log('Firebase confirmation result:', result);
      
      // User signed in successfully
      const user = result.user;
      console.log('Firebase user:', user);
      
      // Get ID token
      const idToken = await user.getIdToken();
      console.log('Firebase ID token:', idToken);
      
      // Send token to backend to create session
      console.log('Sending request to /api/auth/verify-otp');
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          phoneNumber: user.phoneNumber
        }),
      });

      console.log('API response status:', response.status);
      const responseData = await response.json();
      console.log('API response data:', responseData);

      if (response.ok) {
        console.log('OTP verification response:', responseData);
        
        // Store token in localStorage as fallback
        if (responseData.token) {
          console.log('Storing token in localStorage as fallback');
          localStorage.setItem('auth-token', responseData.token);
        }
        
        console.log('OTP verification successful');
        
        // Clear session storage
        sessionStorage.removeItem('phoneNumber');
        
        // Check if user needs to complete profile
        if (responseData.needsProfileCompletion) {
          console.log('User needs to complete profile, redirecting to complete-profile page');
          // Force a small delay to ensure cookies are set
          setTimeout(() => {
            // Dispatch custom event to notify components of auth state change
            window.dispatchEvent(new Event('auth-state-changed'));
            router.push('/auth/complete-profile');
          }, 200);
          return;
        }
        
        // Check if there's a redirect URL
        const redirectUrl = sessionStorage.getItem('redirectUrl');
        console.log('Redirect URL from session storage:', redirectUrl);
        
        // Force a small delay to ensure cookies are set
        setTimeout(() => {
          // Dispatch custom event to notify components of auth state change
          window.dispatchEvent(new Event('auth-state-changed'));
          
          if (redirectUrl) {
            sessionStorage.removeItem('redirectUrl');
            console.log('Redirecting to:', redirectUrl);
            router.push(redirectUrl);
          } else {
            console.log('No redirect URL, going to home page');
            // Redirect to home page
            router.push('/');
          }
        }, 200); // Reduced from 500ms to 200ms for faster response
      } else {
        console.error('API response not ok:', responseData);
        setError(responseData.error || 'Failed to verify OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      console.error('Error details:', {
        name: (error as any).name,
        message: (error as any).message,
        code: (error as any).code,
        stack: (error as any).stack
      });
      
      // Check if it's a Firebase auth error
      if ((error as any).code === 'auth/invalid-verification-code') {
        setError('Invalid OTP. Please enter the correct 6-digit code.');
      } else if ((error as any).code === 'auth/code-expired') {
        setError('OTP has expired. Please request a new one.');
      } else if ((error as any).code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else if ((error as any).message && (error as any).message.includes('Internal server error')) {
        setError('Server error. Please try again later.');
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    // Prevent multiple resends
    if (resendLoading || timer > 0) {
      console.log('Resend blocked - loading:', resendLoading, 'timer:', timer);
      return;
    }
    
    setResendLoading(true);
    try {
      // Ensure we have a valid recaptcha verifier
      if (!window.recaptchaVerifier) {
        console.log('No recaptcha verifier found, setting up new one');
        // We need to set up recaptcha again since we're on a different page
        const { RecaptchaVerifier } = await import('firebase/auth');
        const { auth } = await import('@/lib/firebase');
        
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
          }
        });
      }
      
      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;
      setTimer(30);
      setOtp('');
      setError('');
      console.log('OTP resent successfully');
    } catch (error) {
      console.error('Error resending OTP:', error);
      console.error('Error details:', {
        name: (error as any).name,
        message: (error as any).message,
        code: (error as any).code,
        stack: (error as any).stack
      });
      
      // Provide more specific error messages based on the error type
      if ((error as any).code === 'auth/invalid-phone-number') {
        setError('Invalid phone number. Please go back and enter a valid phone number.');
      } else if ((error as any).code === 'auth/quota-exceeded') {
        setError('OTP quota exceeded. Please try again later.');
      } else if ((error as any).code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.');
      } else {
        setError('Failed to resend OTP. Please try again.');
      }
    } finally {
      setResendLoading(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (phone.startsWith('+91')) {
      return `+91 ${phone.slice(3, 8)} ${phone.slice(8)}`;
    }
    return phone;
  };

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Verify OTP</CardTitle>
            <CardDescription className="text-gray-600">
              Enter the 6-digit code sent to {formatPhoneNumber(phoneNumber)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                  required
                />
              </div>
              
              {error && (
                <div className="text-red-600 text-sm text-center">{error}</div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </form>
            
            <div className="mt-6 text-center space-y-2">
              <button
                onClick={handleResendOTP}
                disabled={resendLoading || timer > 0}
                className="text-sm text-orange-600 hover:text-orange-700 disabled:text-gray-400"
              >
                {resendLoading ? 'Resending...' : timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
              </button>
              
              <button
                onClick={() => router.push('/auth/login')}
                className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-700 w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Change phone number
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}