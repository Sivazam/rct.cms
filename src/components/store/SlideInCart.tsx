'use client';

import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Minus, Plus as PlusIcon, ShoppingBag, Heart, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isUserAuthenticated } from '@/lib/auth';
import { useEffect } from 'react';

export function SlideInCart() {
  const { 
    items, 
    isOpen, 
    closeCart, 
    updateQuantity, 
    removeItem, 
    getTotalItems, 
    getTotalPrice,
    clearCart 
  } = useCartStore();
  
  const router = useRouter();

  // Handle scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Don't render if cart is closed
  if (!isOpen) return null;

  const formatPrice = (price: number, discount: number = 0) => {
    const discountedPrice = price - (price * discount) / 100;
    return {
      current: `₹${discountedPrice.toLocaleString()}`,
      original: discount > 0 ? `₹${price.toLocaleString()}` : null,
    };
  };

  // Calculate shipping costs and totals
  const subtotal = getTotalPrice();
  const shippingCost = subtotal >= 999 ? 0 : 99;
  const shipping = shippingCost;
  const total = subtotal + shipping;
  const remainingForFreeShipping = subtotal < 999 ? 999 - subtotal : 0;

  const handleProceedToCheckout = () => {
    if (!isUserAuthenticated()) {
      sessionStorage.setItem('redirectUrl', '/checkout');
      closeCart();
      router.push('/auth/login');
    } else {
      closeCart();
      router.push('/checkout');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Semi-transparent overlay */}
      <div 
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={closeCart}
      />
      
      {/* Cart Panel - slides in from right */}
      <div className="absolute right-0 top-0 w-full max-w-md h-full bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ borderColor: '#e5e7eb' }}>
          <div className="flex items-center space-x-3">
            <ShoppingBag className="h-5 w-5" style={{ color: 'rgba(156,86,26,255)' }} />
            <h2 className="text-lg font-semibold" style={{ color: '#755e3e' }}>Your Cart</h2>
            <Badge variant="secondary" className="text-xs">{getTotalItems()} items</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={closeCart} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 py-6" style={{ color: '#846549' }}>
              <ShoppingBag className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-base mb-1">Your cart is empty</p>
              <p className="text-sm opacity-75">Add some spiritual products to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const pricing = formatPrice(item.variant.price, item.variant.discount);
                const itemTotal = (item.variant.price - (item.variant.price * item.variant.discount) / 100) * item.quantity;
                
                return (
                  <div key={item.id} className="flex space-x-2 p-2 border rounded-lg bg-white shadow-sm" style={{ borderColor: '#f3f4f6' }}>
                    {/* Product Image */}
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-md flex-shrink-0"
                    />
                    
                    {/* Product Details */}
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate" style={{ color: '#755e3e' }}>{item.name}</h3>
                          <p className="text-xs opacity-75 truncate" style={{ color: '#846549' }}>{item.deity}</p>
                          <p className="text-xs opacity-60 truncate" style={{ color: '#846549' }}>{item.variant.label}</p>
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-1 ml-1 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-xs font-medium" style={{ color: '#755e3e' }}>
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <PlusIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Price and Remove */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-sm" style={{ color: '#755e3e' }}>
                            {pricing.current}
                          </span>
                          {pricing.original && (
                            <span className="text-xs line-through opacity-60" style={{ color: '#846549' }}>
                              {pricing.original}
                            </span>
                          )}
                          {item.variant.discount > 0 && (
                            <Badge className="bg-red-600 hover:bg-red-700 text-xs px-1 py-0">
                              {item.variant.discount}% OFF
                            </Badge>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          style={{ color: '#f20600' }}
                          className="h-6 w-6 p-0 flex-shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </div>
          
          {/* Cart Footer */}
          {items.length > 0 && (
            <div className="border-t p-3 space-y-2 bg-white flex-shrink-0" style={{ borderColor: '#e5e7eb' }}>
              {/* Wishlist and Clear */}
              <div className="flex justify-between items-center">
                <Button variant="ghost" size="sm" style={{ color: 'rgba(156,86,26,255)' }}>
                  <Heart className="h-3 w-3 mr-1" />
                  Save to Wishlist
                </Button>
                <Button variant="ghost" size="sm" onClick={clearCart} style={{ color: '#f20600' }}>
                  Clear Cart
                </Button>
              </div>
              
              <Separator />
              
              {/* Total */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#6b7280' }}>Subtotal</span>
                  <span style={{ color: '#755e3e' }}>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#6b7280' }}>Shipping</span>
                  <div className="text-right">
                    {shipping === 0 ? (
                      <>
                        <span className="text-gray-400 line-through text-xs">₹99</span>
                        <span className="text-green-600 ml-1 text-xs">Free</span>
                      </>
                    ) : (
                      <span style={{ color: '#6b7280' }}>₹{shipping.toLocaleString()}</span>
                    )}
                  </div>
                </div>
                {remainingForFreeShipping > 0 && (
                  <div className="flex justify-between text-sm">
                    <span></span>
                    <span className="text-orange-600 font-medium text-xs">
                      Add ₹{remainingForFreeShipping.toLocaleString()} more for FREE delivery
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span style={{ color: '#755e3e' }}>Total</span>
                  <span style={{ color: '#755e3e' }}>₹{total.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Checkout Button */}
              <div className="space-y-1 pt-1">
                <Button 
                  className="w-full text-sm py-2" 
                  style={{ backgroundColor: 'rgba(156,86,26,255)', color: 'white' }}
                  onClick={handleProceedToCheckout}
                >
                  Proceed to Checkout
                  <ArrowRight className="h-3 w-3 ml-2" />
                </Button>
                <Button variant="outline" className="w-full text-sm py-1.5" style={{ borderColor: '#e5e7eb', color: '#6b7280' }} asChild>
                  <Link href="/cart" onClick={(e) => { 
                    e.preventDefault(); 
                    closeCart(); 
                    router.push('/cart');
                  }}>
                    View Full Cart
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full text-sm py-1.5" style={{ color: 'rgba(156,86,26,255)' }} asChild>
                  <Link href="/" onClick={(e) => {
                    e.preventDefault();
                    closeCart();
                    router.push('/');
                  }}>
                    <PlusIcon className="h-3 w-3 mr-2" />
                    Add more items
                  </Link>
                </Button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}