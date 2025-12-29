'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, ArrowLeft, CreditCard, RefreshCw, Package, Calendar, MapPin, Phone, CheckCircle, XCircle, Clock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { OrderTimeline, type OrderStatus } from '@/components/orders/OrderTimeline';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { loadRazorpayScript, initializeRazorpay } from '@/lib/razorpay';
import { isUserAuthenticated } from '@/lib/auth';

interface Order {
  id: string;
  orderNumber: string;
  customerInfo: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    discount: number;
    totalPrice: number;
    image?: string;
  }>;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  orderDate: string;
  paidAt?: string;
  cancellationReason?: string;
  razorpayOrderId?: string;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderNumber = params.orderNumber as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    loadRazorpayScript().then(setRazorpayLoaded);
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        console.log('OrderDetail: Fetching order:', orderNumber);

        // Check authentication
        if (!isUserAuthenticated()) {
          router.push('/auth/login');
          return;
        }

        // Fetch all user orders and find matching one
        const response = await fetch('/api/orders/by-user');
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        const userOrders = data.orders || [];
        const foundOrder = userOrders.find((o: Order) => o.orderNumber === orderNumber);

        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber, router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'packed': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProductImage = (item: { name: string; image?: string }) => {
    if (item.image) {
      return item.image;
    }

    // Fallback images
    return '/products/10-mukhi.jpg';
  };

  const handleRetryPayment = async () => {
    if (!order || !razorpayLoaded) return;

    setPaymentProcessing(true);

    try {
      console.log('Retrying payment for order:', order.id);

      // Create retry Razorpay order
      const response = await fetch('/api/payment/retry-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to retry payment');
      }

      const apiResponse = await response.json();
      console.log('Retry payment response:', apiResponse);

      if (!apiResponse.success) {
        throw new Error(apiResponse.error || 'Failed to create retry order');
      }

      const { orderId, amount, currency, keyId } = apiResponse.data;

      console.log('Razorpay retry order created:', { orderId, amount, currency, keyId });

      // Initialize Razorpay payment
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'Sanathan Rudraksha',
        description: `Retry payment for order ${order.orderNumber}`,
        image: '/logo-original.png',
        order_id: orderId,
        prefill: {
          name: order.customerInfo.name,
          contact: order.customerInfo.phone,
        },
        theme: {
          color: '#A36922',
        },
        handler: async (response: any) => {
          try {
            console.log('Payment successful:', response);

            // Verify payment
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            if (verifyResponse.ok) {
              console.log('Payment verified successfully');
              // Reload order details
              window.location.reload();
            } else {
              const verifyError = await verifyResponse.json();
              console.error('Payment verification failed:', verifyError);
              alert('Payment verification failed: ' + (verifyError.error || 'Unknown error'));
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
          } finally {
            setPaymentProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed');
            setPaymentProcessing(false);
          },
          onclose: () => {
            console.log('Payment modal closed');
            setPaymentProcessing(false);
          }
        },
        "callback_url": undefined
      };

      console.log('Initializing Razorpay with options:', { ...options, key: '***' });
      await initializeRazorpay(options);
    } catch (error) {
      console.error('Retry payment error:', error);
      const errorMessage = (error as Error).message || 'Failed to retry payment. Please try again.';
      alert(errorMessage);
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/my-orders')}>
              Back to Orders
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-4">The order you're looking for does not exist.</p>
            <Button onClick={() => router.push('/my-orders')}>
              Back to Orders
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="container mx-auto px-4 py-8">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => router.push('/my-orders')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>

          <div className="space-y-6">
            {/* Order Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Order #{order.orderNumber}
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-600">
                        {formatDate(order.orderDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Payment:</span>
                      <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                        {order.paymentStatus === 'completed' ? 'Completed' :
                         order.paymentStatus === 'failed' ? 'Failed' :
                         order.paymentStatus === 'refunded' ? 'Refunded' :
                         'Pending'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Order:</span>
                      <Badge className={getOrderStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Retry Payment Button */}
                {order.paymentStatus === 'failed' && order.status !== 'cancelled' && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-red-900">Payment Failed</p>
                        <p className="text-sm text-red-700 mt-1 mb-3">
                          Your payment could not be processed. You can retry payment within 7 days.
                        </p>
                        <Button
                          onClick={handleRetryPayment}
                          disabled={paymentProcessing || !razorpayLoaded}
                          className="w-full sm:w-auto"
                          style={{ backgroundColor: '#A36922', color: 'white' }}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          {paymentProcessing ? 'Processing...' : 'Retry Payment'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {order.status === 'cancelled' && order.cancellationReason && (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Cancellation Reason:</span> {order.cancellationReason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Timeline */}
              <div>
                <OrderTimeline status={order.status} />
              </div>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <OptimizedImage
                          src={getProductImage(item)}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                          width={64}
                          height={64}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">{formatPrice(item.totalPrice)}</p>
                          {item.discount > 0 && (
                            <p className="text-xs text-gray-500 line-through">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>{order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-lg" style={{ color: '#A36922' }}>
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>

                {order.paidAt && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span>
                        Paid on {formatDate(order.paidAt)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{order.customerInfo.name}</p>
                  <div className="flex items-center mt-2">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{order.customerInfo.phone}</span>
                  </div>
                  <p className="mt-2">{order.customerInfo.address}</p>
                  <p>
                    {order.customerInfo.city}, {order.customerInfo.state} {order.customerInfo.pincode}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
