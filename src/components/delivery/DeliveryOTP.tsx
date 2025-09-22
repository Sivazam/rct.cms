'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Shield, Clock, Phone, MessageSquare, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  city: string;
}

interface Entry {
  id: string;
  customerId: string;
  customer: Customer;
  entryDate: string;
  expiryDate: string;
  pots: number;
  status: 'active' | 'expired' | 'delivered';
  locationId: string;
  locationName: string;
  renewalCount: number;
}

interface DeliveryOTPProps {
  entry: Entry;
  onOTPVerified: (otp: string) => void;
  onBack: () => void;
  loading?: boolean;
}

export default function DeliveryOTP({ entry, onOTPVerified, onBack, loading = false }: DeliveryOTPProps) {
  const { user } = useAuth();
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [attempts, setAttempts] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpId, setOtpId] = useState('');

  const maxAttempts = 3;
  const maxResends = 2;

  useEffect(() => {
    if (otpSent && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [otpSent, timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSendOTP = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setIsResending(true);
    setError('');

    try {
      const response = await fetch('/api/deliveries/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryId: entry.id,
          customerMobile: entry.customer.mobile,
          operatorId: user.uid,
          operatorName: user.name || 'Operator'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setOtpId(data.otpId);
      setOtpSent(true);
      setTimeLeft(600);
      setAttempts(0);
      
      console.log(`OTP sent to ${entry.customer.mobile} for entry ${entry.id}`);
    } catch (error: any) {
      setError(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    if (!user) {
      setError('User not authenticated');
      return;
    }

    if (attempts >= maxAttempts) {
      setError('Maximum attempts reached. Please request a new OTP.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/deliveries/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otpId: otpId,
          otp: otp,
          entryId: entry.id,
          operatorId: user.uid,
          operatorName: user.name || 'Operator'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      // OTP verified successfully
      onOTPVerified(otp);
    } catch (error: any) {
      setAttempts(attempts + 1);
      const remainingAttempts = maxAttempts - attempts - 1;
      setError(error.message || `Invalid OTP. ${remainingAttempts} attempts remaining.`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (timeLeft > 0) {
      setError('Please wait for the current OTP to expire before requesting a new one.');
      return;
    }

    await handleSendOTP();
  };

  const progressPercentage = ((600 - timeLeft) / 600) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Dispatch Verification</span>
          </CardTitle>
          <CardDescription>
            Verify customer identity with OTP for secure Dispatch
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Entry Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Dispatch Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Customer:</strong> {entry.customer.name}</p>
                <p><strong>Mobile:</strong> {entry.customer.mobile}</p>
                <p><strong>Location:</strong> {entry.locationName}</p>
              </div>
              <div>
                <p><strong>Pots:</strong> {entry.pots}</p>
                <p><strong>Entry ID:</strong> {entry.id.slice(-6)}</p>
                <p><strong>Status:</strong> {entry.status}</p>
              </div>
            </div>
          </div>

          {!otpSent ? (
            <div className="text-center space-y-4">
              <MessageSquare className="h-16 w-16 mx-auto text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Send OTP for Dispatch Verification</h3>
                <p className="text-gray-600 mb-4">
                  A one-time password will be sent to the customer's mobile number 
                  <span className="font-semibold"> {entry.customer.mobile}</span>
                </p>
              </div>
              <Button 
                onClick={handleSendOTP}
                disabled={isResending || loading}
                className="w-full"
              >
                {isResending ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* OTP Timer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>OTP expires in: {formatTime(timeLeft)}</span>
                  </span>
                  <span>Attempts: {attempts}/{maxAttempts}</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>

              {/* OTP Input */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="otp">Enter 6-digit OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(value);
                    }}
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                    disabled={timeLeft === 0 || attempts >= maxAttempts}
                  />
                </div>

                {error && (
                  <Alert variant={error.includes('Invalid') ? 'destructive' : 'default'}>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex space-x-3">
                  <Button
                    onClick={handleVerifyOTP}
                    disabled={!otp || otp.length !== 6 || timeLeft === 0 || attempts >= maxAttempts || isVerifying || loading}
                    className="flex-1"
                  >
                    {isVerifying ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleResendOTP}
                    disabled={timeLeft > 0 || isResending || loading}
                  >
                    {isResending ? 'Resending...' : 'Resend OTP'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={onBack}
              disabled={loading}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}