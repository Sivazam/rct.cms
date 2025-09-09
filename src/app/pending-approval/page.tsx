'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-blue-900">
              Account Pending Approval
            </CardTitle>
            <CardDescription className="text-gray-600">
              Rotary Charitable Trust - SCM System
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Waiting for Admin Approval</h3>
              <p className="text-gray-600 mb-4">
                Your account has been created successfully and is currently pending approval from the administrator.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Account Details:</strong><br />
                  Name: {user?.name}<br />
                  Email: {user?.email}<br />
                  Role: {user?.role}<br />
                  Mobile: {user?.mobile}
                </p>
              </div>
              <p className="text-sm text-gray-500">
                You will receive an email notification once your account is approved.
                Please contact your administrator if you need immediate assistance.
              </p>
            </div>
            <div className="space-y-2">
              <Button onClick={handleLogout} variant="outline" className="w-full">
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}