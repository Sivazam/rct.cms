'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, Smartphone, Clock, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { generateOTP, verifyOTP } from '@/lib/firestore';
import { sendSMS } from '@/lib/sms';

interface OTPVerificationProps {
  mobile: string;
  entryId: string;
  type: 'renewal' | 'delivery';
  onVerified: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function OTPVerification({ 
  mobile, 
  entryId, 
  type, 
  onVerified, 
  onCancel, 
  loading = false 
}: OTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [otpId, setOtpId] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isResendEnabled, setIsResendEnabled] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  const MAX_ATTEMPTS = 3;
  const OTP_EXPIRY_MINUTES = 10;
  const RESEND_COOLDOWN_SECONDS = 30;

  useEffect(() => {
    generateAndSendOTP();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && generatedOTP) {
      setIsResendEnabled(true);
    }
    return () => clearTimeout(timer);
  }, [timeLeft, generatedOTP]);

  const generateAndSendOTP = async () => {
    setGenerating(true);
    setError('');

    try {
      const result = await generateOTP(mobile, type, entryId);
      setOtpId(result.otpId);
      setGeneratedOTP(result.otp);
      setTimeLeft(OTP_EXPIRY_MINUTES * 60);
      setIsResendEnabled(false);
      setAttempts(0);

      // Send OTP via SMS
      const message = `Your OTP for ${type} is: ${result.otp}. Valid for 10 minutes. Do not share this OTP with anyone. - RCT-CMS`;
      await sendSMS(mobile, message, entryId);

    } catch (error: any) {
      setError(error.message || 'Failed to generate OTP');
    } finally {
      setGenerating(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError('');

    if (!otp.trim()) {
      setError('Please enter the OTP');
      setVerifying(false);
      return;
    }

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      setVerifying(false);
      return;
    }

    try {
      await verifyOTP(otpId, otp);
      setIsVerified(true);
      setTimeout(() => {
        onVerified();
      }, 1000);
    } catch (error: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setError(`Maximum attempts (${MAX_ATTEMPTS}) reached. Please generate a new OTP.`);
        setIsResendEnabled(true);
      } else {
        setError(`Invalid OTP. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
      }
      setOtp('');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    await generateAndSendOTP();
    setOtp('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isVerified) {
    return (
      <Card>
        <CardContent className="pt-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">OTP Verified Successfully!</h3>
            <p className="text-gray-600">
              Your identity has been verified. You can now proceed with the {type}.
            </p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>OTP Verification</span>
        </CardTitle>
        <CardDescription>
          Enter the 6-digit OTP sent to {mobile} for {type} authorization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant={error.includes('Maximum attempts') ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* OTP Input */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Enter 6-digit OTP</Label>
            <Input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setOtp(value.slice(0, 6));
              }}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              disabled={verifying || loading}
              className="text-center text-lg tracking-widest"
            />
          </div>

          {/* Timer and Resend */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              {timeLeft > 0 ? (
                <span className="text-gray-600">
                  OTP expires in: {formatTime(timeLeft)}
                </span>
              ) : (
                <span className="text-red-600">OTP expired</span>
              )}
            </div>
            
            {isResendEnabled ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResend}
                disabled={generating}
                className="flex items-center space-x-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Resend OTP</span>
              </Button>
            ) : (
              <span className="text-gray-500">
                Resend available in: {formatTime(RESEND_COOLDOWN_SECONDS)}
              </span>
            )}
          </div>

          {/* Attempts Counter */}
          {attempts > 0 && (
            <div className="text-center">
              <Badge variant="outline" className="text-xs">
                Attempts: {attempts}/{MAX_ATTEMPTS}
              </Badge>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={verifying || loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={verifying || loading || otp.length !== 6 || timeLeft === 0}
            >
              {verifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Verify OTP
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">OTP Instructions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>A 6-digit OTP has been sent to your mobile number</li>
                <li>OTP is valid for 10 minutes</li>
                <li>You have {MAX_ATTEMPTS} attempts to enter the correct OTP</li>
                <li>Do not share the OTP with anyone</li>
                <li>If you don't receive OTP, click "Resend OTP" after cooldown</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}