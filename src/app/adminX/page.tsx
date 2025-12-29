'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, ExternalLink } from 'lucide-react';

export default function AdminXPage() {
  const router = useRouter();

  // Auto-redirect to new admin dashboard
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/admin-dashboard');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [router]);

  const handleManualRedirect = () => {
    router.push('/admin-dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Admin Access Simplified</CardTitle>
          <CardDescription className="text-gray-600">
            We've moved to a new, direct-access admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              You'll be redirected automatically in a few seconds...
            </p>
            <Button 
              onClick={handleManualRedirect}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Go to New Admin Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          
          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 text-center mb-2">
              The new admin dashboard requires no authentication
            </p>
            <div className="flex items-center justify-center space-x-2 text-xs text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Direct access • No login required</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}