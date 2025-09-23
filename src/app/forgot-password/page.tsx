'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Here you would implement the password reset logic
      // For now, we'll simulate a successful request
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess('Password reset link has been sent to your email address.');
    } catch (error: any) {
      setError(error.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Desktop - Split Screen */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        {/* Image Side - Full screen image */}
        <div className="absolute inset-0">
          <Image
            src="/KB1.webp"
            alt="Cremation Management"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
      </div>

      {/* Form Side - Always Visible */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              CMS
            </h1>
            <p className="text-muted-foreground">
              Management system for cremation services
            </p>
          </div>

          <Card className="border shadow-lg">
            <CardHeader className="space-y-1">
              <div className="flex items-center space-x-2 mb-2">
                <Link 
                  href="/login" 
                  className="text-primary hover:text-muted-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Forgot Password
                </CardTitle>
              </div>
              <CardDescription className="text-muted-foreground">
                Enter your email address and we'll send you a reset link
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {success ? (
                <div className="space-y-4">
                  <Alert className="border-green-200 bg-green-50">
                    <AlertDescription className="text-green-700">
                      {success}
                    </AlertDescription>
                  </Alert>
                  <Button 
                    onClick={() => router.push('/login')}
                    className="w-full bg-primary hover:bg-primary text-white font-medium py-3"
                  >
                    Back to Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Enter your email address"
                        className="pl-10 border focus:border-primary focus:ring-primary"
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-700">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary text-white font-medium py-3"
                    disabled={loading}
                  >
                    {loading ? (
                      'Sending...'
                    ) : (
                      <>
                        Send Reset Link
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-background text-muted-foreground">
                      Cremation Management System
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Remember your password?{' '}
                    <Link 
                      href="/login" 
                      className="text-foreground hover:text-foreground font-medium underline"
                    >
                      Back to login
                    </Link>
                  </p>
                </div>
                
                {/* Branding */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Built with ❤️ by <span className="font-semibold text-foreground">HarTe Labs</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}