'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Archive } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LockerStatusGrid from '@/components/admin/LockerStatusGrid';

export default function LockerStatusPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Archive className="h-6 w-6 text-primary" />
              <CardTitle>Locker Status</CardTitle>
            </div>
            <CardDescription>
              Real-time locker availability status across all locations
            </CardDescription>
          </CardHeader>
        </Card>

        <LockerStatusGrid />
      </div>
    </div>
  );
}
