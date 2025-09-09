'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import SpiritualCard from '@/components/ui/spiritual-card';
import SpiritualInput from '@/components/ui/spiritual-input';
import SpiritualButton from '@/components/ui/spiritual-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    mobile: '',
    role: 'operator' as 'admin' | 'operator'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords must match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await signup(
        formData.email,
        formData.password,
        formData.name,
        formData.mobile,
        formData.role
      );
      router.push('/pending-approval');
    } catch (error: any) {
      setError(error.message || 'Failed to create account');
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
          variant="ritual"
          title="Sign Up"
          description="Create your account for the Cremation Management System"
          mantra=""
          showOm={true}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <SpiritualInput
              id="name"
              label="Full Name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              icon="user"
              mantra=""
              placeholder="Enter your full name"
            />

            <SpiritualInput
              id="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
              icon="mail"
              mantra=""
              placeholder="Enter your email"
            />

            <SpiritualInput
              id="mobile"
              label="Mobile Number"
              type="tel"
              value={formData.mobile}
              onChange={(e) => handleChange('mobile', e.target.value)}
              required
              icon="phone"
              mantra=""
              placeholder="+91XXXXXXXXXX"
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-orange-700">
                Role <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <div className="text-orange-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
                  <SelectTrigger className="pl-10 pr-12 border-orange-200 focus:border-orange-400 focus:ring-orange-400 bg-orange-50/50 focus:bg-orange-50">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operator" className="text-orange-700">Operator</SelectItem>
                    <SelectItem value="admin" className="text-red-700">Administrator</SelectItem>
                  </SelectContent>
                </Select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <div className="text-orange-400 text-sm">ॐ</div>
                </div>
              </div>
              <div className="text-xs text-orange-600 italic">
                "Perform your duty equipoised, O Arjuna" - Bhagavad Gita 2.38
              </div>
            </div>

            <SpiritualInput
              id="password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              required
              icon="lock"
              mantra=""
              placeholder="Create your password"
            />

            <SpiritualInput
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              required
              icon="lock"
              mantra=""
              placeholder="Confirm your password"
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
              variant="ritual"
              size="lg"
              mantra=""
              showOm={true}
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </SpiritualButton>
          </form>

          <div className="mt-8 text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-orange-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-orange-50 text-orange-600 rounded-full">
                  ॐ Cremation Management System ॐ
                </span>
              </div>
            </div>

            <p className="text-sm text-orange-700">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="text-orange-600 hover:text-orange-800 underline font-medium"
              >
                Login here
              </Link>
            </p>

            <div className="text-xs text-orange-600 italic text-sanskrit">
              "Whatever action a great man performs, common men follow" - Bhagavad Gita 3.21
            </div>
          </div>
        </SpiritualCard>

        {/* Decorative elements */}
        <div className="mt-8 text-center">
          <div className="text-2xl text-red-600 animate-pulse">ॐ</div>
          <div className="text-xs text-orange-500 mt-2">
            Cremation Management System - Rotary Charitable Trust
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