'use client';

import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Minus, Plus, ShoppingBag, Heart, ArrowRight, Trash2, Plus as PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isUserAuthenticated } from '@/lib/auth';
import { MainLayout } from '@/components/store/MainLayout';
import { ImageWithLoader } from '@/components/ui/ImageWithLoader';

export default function CartPage() {
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    getTotalItems, 
    getTotalPrice,
    clearCart 
  } = useCartStore();
  
  const router = useRouter();

  // Calculate shipping costs and totals
  const subtotal = getTotalPrice();
  const shippingCost = subtotal >= 999 ? 0 : 99;
  const shipping = shippingCost;
  const total = subtotal + shipping;
  const remainingForFreeShipping = subtotal < 999 ? 999 - subtotal : 0;

  const formatPrice = (price: number, discount: number = 0) => {
    const discountedPrice = price - (price * discount) / 100;
    return {
      current: `₹${discountedPrice.toLocaleString()}`,
      original: discount > 0 ? `₹${price.toLocaleString()}` : null,
    };
  };

  const handleProceedToCheckout = () => {
    if (!isUserAuthenticated()) {
      sessionStorage.setItem('redirectUrl', '/checkout');
      router.push('/auth/login');
    } else {
      router.push('/checkout');
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen" style={{ backgroundColor: '#f4f0eb' }}>
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <ArrowLeft className="h-5 w-5" style={{ color: '#846549' }} />
                <span style={{ color: '#846549' }}>Continue Shopping</span>
              </Link>
              <div className="flex items-center space-x-3">
                <ShoppingBag className="h-6 w-6" style={{ color: 'rgba(156,86,26,255)' }} />
                {/* <h1 className="text-2xl font-bold" style={{ color: '#755e3e' }}>Shopping Cart</h1> */}
                <Badge variant="secondary">{getTotalItems()} items</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Cart Content */}
        <div className="container mx-auto px-4 py-8">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <ShoppingBag className="h-24 w-24 mb-6 opacity-50" style={{ color: '#846549' }} />
              <h2 className="text-2xl font-semibold mb-2" style={{ color: '#755e3e' }}>Your cart is empty</h2>
              <p className="text-lg mb-6" style={{ color: '#846549' }}>Add some spiritual products to get started</p>
              <Link href="/">
                <Button 
                  className="px-8 py-3"
                  style={{ backgroundColor: 'rgba(156,86,26,255)', color: 'white' }}
                >
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold" style={{ color: '#755e3e' }}>
                      Cart Items ({getTotalItems()})
                    </h2>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={clearCart}
                      style={{ borderColor: '#f20600', color: '#f20600' }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Cart
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {items.map((item) => {
                      const pricing = formatPrice(item.variant.price, item.variant.discount);
                      const itemTotal = (item.variant.price - (item.variant.price * item.variant.discount) / 100) * item.quantity;
                      
                      return (
                        <div key={item.id} className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 p-4 border rounded-lg" style={{ borderColor: '#f3f4f6' }}>
                          {/* Product Image */}
                          <ImageWithLoader 
                            src={item.image} 
                            alt={item.name}
                            className="w-full sm:w-24 h-48 sm:h-24 object-cover rounded-lg"
                          />
                          
                          {/* Product Details */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base sm:text-base" style={{ color: '#755e3e' }}>{item.name}</h3>
                                <p className="text-sm" style={{ color: '#846549' }}>{item.deity}</p>
                                <p className="text-sm opacity-75" style={{ color: '#846549' }}>{item.variant.label}</p>
                              </div>
                              
                              {/* Quantity Controls */}
                              <div className="flex items-center space-x-2 ml-4">
                                <span className="text-sm font-medium" style={{ color: '#6b7280' }}>Qty:</span>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="w-12 text-center font-medium" style={{ color: '#755e3e' }}>
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Price and Actions */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
                                <span className="font-bold text-lg" style={{ color: '#755e3e' }}>
                                  {pricing.current}
                                </span>
                                {pricing.original && (
                                  <span className="text-sm line-through opacity-60" style={{ color: '#846549' }}>
                                    {pricing.original}
                                  </span>
                                )}
                                {item.variant.discount > 0 && (
                                  <Badge className="bg-red-600 hover:bg-red-700 self-start sm:self-auto">
                                    {item.variant.discount}% OFF
                                  </Badge>
                                )}
                                {/* <span className="text-sm font-medium" style={{ color: '#755e3e' }}>
                                  ₹{Math.round(item.variant.price - (item.variant.price * item.variant.discount) / 100) * item.quantity}
                                </span> */}
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                                style={{ color: '#f20600' }}
                                className="self-start sm:self-auto"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                  <h2 className="text-xl font-semibold mb-4" style={{ color: '#755e3e' }}>
                    Order Summary
                  </h2>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#6b7280' }}>Subtotal ({getTotalItems()} items)</span>
                      <span style={{ color: '#755e3e' }}>₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#6b7280' }}>Shipping</span>
                      <div className="text-right">
                        {shipping === 0 ? (
                          <>
                            <span className="text-gray-400 line-through text-sm">99</span>
                            <span className="text-green-600 ml-2 text-sm">Free</span>
                          </>
                        ) : (
                          <span style={{ color: '#6b7280' }}>{shipping}</span>
                        )}
                      </div>
                    </div>
                    {remainingForFreeShipping > 0 && (
                      <div className="flex justify-between text-sm">
                        <span></span>
                        <span className="text-orange-600 font-medium text-sm">
                          Add ₹{remainingForFreeShipping.toLocaleString()} more for FREE delivery
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#6b7280' }}>Tax</span>
                      <span style={{ color: '#755e3e' }}>Calculated at checkout</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span style={{ color: '#755e3e' }}>Total</span>
                      <span style={{ color: '#755e3e' }}>₹{total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 mt-6">
                    <Button 
                      className="w-full"
                      style={{ backgroundColor: 'rgba(156,86,26,255)', color: 'white' }}
                      onClick={handleProceedToCheckout}
                    >
                      Proceed to Checkout
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    
                    <Button variant="outline" className="w-full" style={{ borderColor: '#846549', color: '#846549' }}>
                      <Heart className="h-4 w-4 mr-2" />
                      Save to Wishlist
                    </Button>
                    
                    <Link href="/" className="block">
                      <Button variant="ghost" className="w-full" style={{ color: 'rgba(156,86,26,255)' }}>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add more items
                      </Button>
                    </Link>
                  </div>

                  {/* Security Note */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-center" style={{ color: '#6b7280' }}>
                      🔒 Secure Checkout • Your payment information is encrypted and secure
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}