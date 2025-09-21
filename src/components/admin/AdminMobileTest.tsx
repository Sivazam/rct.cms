'use client';

import { useAdminMobile, useSetAdminMobile, useAdminConfigStore } from '@/stores/admin-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminMobileTest() {
  const adminMobile = useAdminMobile();
  const setAdminMobile = useSetAdminMobile();
  const storeState = useAdminConfigStore.getState();

  const handleTestSet = () => {
    setAdminMobile('+919876543210');
  };

  const handleReset = () => {
    storeState.resetToDefault();
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Admin Mobile Test</CardTitle>
          <CardDescription>Test the global admin mobile state</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Current Admin Mobile:</Label>
            <div className="p-2 bg-gray-100 rounded">
              {adminMobile || 'undefined'}
            </div>
          </div>
          
          <div>
            <Label>Type:</Label>
            <div className="p-2 bg-gray-100 rounded">
              {typeof adminMobile}
            </div>
          </div>
          
          <div>
            <Label>Length:</Label>
            <div className="p-2 bg-gray-100 rounded">
              {adminMobile?.length || 'undefined'}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={handleTestSet}>
              Set Test Mobile (+919876543210)
            </Button>
            <Button onClick={handleReset} variant="outline">
              Reset to Default
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}