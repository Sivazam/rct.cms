'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import SpiritualCard from '@/components/ui/spiritual-card';
import SpiritualInput from '@/components/ui/spiritual-input';
import SpiritualButton from '@/components/ui/spiritual-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 p-4">
      {/* Subtle background element */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-10 right-10 text-4xl text-amber-300">ॐ</div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <SpiritualCard
          variant="sacred"
          title="Login"
          description="Access the Cremation Management System"
          showOm={false}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <SpiritualInput
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon="mail"
              placeholder="Enter your email"
            />

            <SpiritualInput
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              icon="lock"
              placeholder="Enter your password"
            />

            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <SpiritualButton
              type="submit"
              variant="sacred"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Login'}
            </SpiritualButton>
          </form>

          <div className="mt-8 text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-amber-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-amber-700 rounded-full">
                  Cremation Management System
                </span>
              </div>
            </div>

            <p className="text-sm text-amber-700">
              New to the system?{' '}
              <Link 
                href="/signup" 
                className="text-amber-800 hover:text-amber-900 underline font-medium"
              >
                Create an account
              </Link>
            </p>

            <div className="text-xs text-amber-600 italic">
              Rotary Charitable Trust
            </div>
          </div>
        </SpiritualCard>

        {/* Subtle decorative element */}
        <div className="mt-8 text-center">
          <div className="text-xs text-amber-500">
            Cremation Management System
          </div>
        </div>
      </motion.div>
    </div>
  );
}