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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 p-4">
      {/* Background spiritual elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl text-orange-600">ॐ</div>
        <div className="absolute top-20 right-20 text-4xl text-red-600">卍</div>
        <div className="absolute bottom-20 left-20 text-5xl text-amber-600">🔥</div>
        <div className="absolute bottom-10 right-10 text-3xl text-orange-700">𑀰𑀺𑀪𑁆𑀢</div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <SpiritualCard
          variant="sacred"
          title="Sacred Portal"
          description="Enter the spiritual realm of service"
          mantra="ॐ गं गणपतये नमः"
          showOm={true}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <SpiritualInput
              id="email"
              label="Divine Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon="mail"
              mantra="ॐ सह नाववतु"
              placeholder="Enter your sacred email"
            />

            <SpiritualInput
              id="password"
              label="Sacred Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              icon="lock"
              mantra="ॐ भूर्भुवः स्वः"
              placeholder="Enter your sacred password"
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
              mantra="ॐ श्रीं ह्रीं क्लीं"
              showOm={true}
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Entering Sacred Space...' : 'Enter Sacred Portal'}
            </SpiritualButton>
          </form>

          <div className="mt-8 text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-orange-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-orange-50 text-orange-600 rounded-full">
                  ॐ Sacred Journey ॐ
                </span>
              </div>
            </div>

            <p className="text-sm text-orange-700">
              New to this sacred service?{' '}
              <Link 
                href="/signup" 
                className="text-orange-600 hover:text-orange-800 underline font-medium"
              >
                Begin your spiritual journey
              </Link>
            </p>

            <div className="text-xs text-orange-600 italic text-sanskrit">
              "The soul is unborn, eternal, ever-existing" - Bhagavad Gita 2.20
            </div>
          </div>
        </SpiritualCard>

        {/* Decorative elements */}
        <div className="mt-8 text-center">
          <div className="text-2xl text-orange-600 animate-pulse">ॐ</div>
          <div className="text-xs text-orange-500 mt-2">
            Rotary Charitable Trust - Serving with Divine Purpose
          </div>
        </div>
      </motion.div>

      <style jsx>{`
        .text-sanskrit {
          font-family: 'Noto Sans Devanagari', serif;
        }
      `}</style>
    </div>
  );
}