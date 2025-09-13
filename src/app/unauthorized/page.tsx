'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SpiritualCard from '@/components/ui/spiritual-card';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleBack = () => {
    router.back();
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 p-4 relative">
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
        className="w-full max-w-md"
      >
        <SpiritualCard
          variant="ritual"
          title="Access Denied"
          description="You don't have permission to access this page"
          showOm={true}
          className="w-full max-w-md relative z-10"
        >
          <CardContent className="text-center relative z-10">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-red-800">Unauthorized Access</h3>
              <p className="text-red-700 mb-4">
                You don't have the necessary permissions to view this page.
                Please contact your administrator if you believe this is an error.
              </p>
              {user && (
                <div className="bg-orange-50 p-4 rounded-lg mb-4 border border-orange-200">
                  <p className="text-sm text-orange-800">
                    <strong>Current User:</strong><br />
                    Name: {user.name}<br />
                    Role: {user.role}<br />
                    Status: {user.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Button onClick={handleBack} variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50">
                Go Back
              </Button>
              <Button onClick={handleLogout} className="w-full bg-orange-600 hover:bg-orange-700">
                Logout
              </Button>
            </div>
          </CardContent>
        </SpiritualCard>
      </motion.div>
    </div>
  );
}