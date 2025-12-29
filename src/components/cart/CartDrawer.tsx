'use client';

import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Plus, Minus, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function CartDrawer() {
  const { items, updateQuantity, removeItem, getTotalItems, getTotalPrice, getDiscount, clearCart } = useCartStore();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative"
        onClick={() => useCartStore.getState().openCart()}
      >
        <ShoppingCart className="h-6 w-6" />
        {getTotalItems() > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-orange-600 hover:bg-orange-700">
            {getTotalItems()}
          </Badge>
        )}
      </Button>
    </div>
  );
}