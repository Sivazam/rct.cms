'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isUserAuthenticated, getCurrentUser, getAuthToken } from '@/lib/auth';

export default function AuthDebugPage() {
  const [authStatus, setAuthStatus] = useState('Checking...');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cookies, setCookies] = useState<string>('');
  const [localStorageToken, setLocalStorageToken] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This ensures we only run client-side code
    setIsClient(true);
  }, []);

  const checkAuth = () => {
    console.log('=== Manual Auth Check ===');
    const authed = isUserAuthenticated();
    const user = getCurrentUser();
    const authToken = getAuthToken();
    const docCookies = isClient ? document.cookie : 'Not available on server';
    const localToken = isClient ? localStorage.getItem('auth-token') : 'Not available on server';

    console.log('Auth Status:', authed);
    console.log('Current User:', user);
    console.log('Auth Token:', authToken ? '***' : null);
    console.log('All Cookies:', docCookies);
    console.log('LocalStorage Token:', localToken ? '***' : null);

    setAuthStatus(authed ? 'Authenticated' : 'Not Authenticated');
    setCurrentUser(user);
    setToken(authToken);
    setCookies(docCookies);
    setLocalStorageToken(localToken);
  };

  useEffect(() => {
    if (isClient) {
      checkAuth();
    }
  }, [isClient]);

  const clearAuth = () => {
    if (isClient) {
      document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      localStorage.removeItem('auth-token');
      checkAuth();
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading debug page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Authentication Debug Page</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong>Auth Status:</strong> {authStatus}
              </div>
              <div>
                <strong>Has Token:</strong> {token ? 'Yes' : 'No'}
              </div>
            </div>
            
            {currentUser && (
              <div>
                <strong>Current User:</strong>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-sm">
                  {JSON.stringify(currentUser, null, 2)}
                </pre>
              </div>
            )}
            
            <div>
              <strong>Cookies:</strong>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-sm max-h-32 overflow-y-auto">
                {cookies || 'No cookies found'}
              </pre>
            </div>
            
            <div>
              <strong>LocalStorage:</strong>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-sm max-h-32 overflow-y-auto">
                {localStorageToken ? 'Auth token found in localStorage' : 'No auth token in localStorage'}
              </pre>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={checkAuth}>Refresh Status</Button>
              <Button variant="outline" onClick={clearAuth}>Clear Auth</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Browser Console</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Open the browser console (F12) to see detailed authentication logs. 
              Try the authentication flow and watch the console output.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Flow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Go to home page and add items to cart</li>
              <li>Click "Proceed to Checkout" in cart</li>
              <li>Enter phone number and click "Send OTP"</li>
              <li>Enter OTP and click "Verify OTP"</li>
              <li>Check if you're redirected to checkout</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}