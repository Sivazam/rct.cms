'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthTestPage() {
  const { user, loading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Debug Page</CardTitle>
            <CardDescription>
              This page shows the current authentication state without redirects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">User Object:</h3>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">User Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
                  <p><strong>Role:</strong> {user?.role || 'N/A'}</p>
                  <p><strong>Is Active:</strong> {user?.isActive?.toString() || 'N/A'}</p>
                  <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
                  <p><strong>Mobile:</strong> {user?.mobile || 'N/A'}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Routing Decision</CardTitle>
                </CardHeader>
                <CardContent>
                  <p><strong>Should Have Access:</strong> {(user?.role === 'admin' || user?.isActive) ? 'YES' : 'NO'}</p>
                  <p><strong>Destination:</strong> {(user?.role === 'admin' || user?.isActive) ? '/dashboard' : '/pending-approval'}</p>
                  <p><strong>Admin Dashboard:</strong> {user?.role === 'admin' ? '/dashboard/admin' : 'N/A'}</p>
                  <p><strong>Operator Dashboard:</strong> {user?.role === 'operator' ? '/dashboard/operator' : 'N/A'}</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => window.location.href = '/'}>
                Go to Home
              </Button>
              <Button onClick={() => window.location.href = '/dashboard'}>
                Go to Dashboard
              </Button>
              <Button onClick={() => window.location.href = '/dashboard/admin'}>
                Go to Admin Dashboard
              </Button>
              <Button onClick={() => window.location.href = '/dashboard/operator'}>
                Go to Operator Dashboard
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}