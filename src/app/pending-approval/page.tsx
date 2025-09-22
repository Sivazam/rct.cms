'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SpiritualCard from '@/components/ui/spiritual-card';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function PendingApprovalPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/20 p-4 relative">
      {/* Background spiritual elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl text-orange-600">ॐ</div>
        <div className="absolute top-20 right-20 text-4xl text-red-600">卍</div>
        <div className="absolute bottom-20 left-20 text-5xl text-primary">🔥</div>
        <div className="absolute bottom-10 right-10 text-3xl text-orange-700">𑀰𑀺𑀪𑁆𑀢</div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <SpiritualCard
          variant="ritual"
          title="Account Pending Approval"
          description="SCM System"
          showOm={true}
          className="w-full max-w-md relative z-10"
        >
          <CardContent className="text-center relative z-10">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-orange-800">Waiting for Admin Approval</h3>
              <p className="text-orange-700 mb-4">
                Your account has been created successfully and is currently pending approval from the administrator.
              </p>
              <div className="bg-background p-4 rounded-lg mb-4 border border-orange-200">
                <p className="text-sm text-orange-800">
                  <strong>Account Details:</strong><br />
                  Name: {user?.name}<br />
                  Email: {user?.email}<br />
                  Role: {user?.role}<br />
                  Mobile: {user?.mobile}
                </p>
              </div>
              <p className="text-sm text-orange-600">
                You will receive an email notification once your account is approved.
                Please contact your administrator if you need immediate assistance.
              </p>
            </div>
            <div className="space-y-2">
              <Button onClick={handleLogout} variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-background">
                Logout
              </Button>
            </div>
          </CardContent>
        </SpiritualCard>
      </motion.div>
    </div>
  );
}