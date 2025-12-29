'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Package, Truck, Home } from 'lucide-react';

export default function OrderSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user came from checkout (you can add more validation here)
    const fromCheckout = sessionStorage.getItem('fromCheckout');
    if (!fromCheckout) {
      router.push('/');
    }
    sessionStorage.removeItem('fromCheckout');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-600">Order Placed Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <Package className="h-5 w-5 text-gray-600" />
                <span className="text-gray-600">Order confirmation sent to your email</span>
              </div>
              
              <div className="flex items-center justify-center space-x-3">
                <Truck className="h-5 w-5 text-gray-600" />
                <span className="text-gray-600">Free shipping on all orders</span>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-800">
                Thank you for your purchase! Your spiritual products will be carefully packaged and shipped within 1-2 business days.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/')}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <Home className="h-4 w-4 mr-2" />
                Continue Shopping
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => router.push('/my-orders')}
                className="w-full"
              >
                View Order History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}