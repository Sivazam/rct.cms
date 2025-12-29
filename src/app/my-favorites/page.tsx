'use client';

import { useState, useEffect } from 'react';
import { Heart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MainLayout } from '@/components/store/MainLayout';
import { ProductCard } from '@/components/store/ProductCard';
import { useToast } from '@/hooks/use-toast';
import { wishlistService, WishlistItem } from '@/lib/services/wishlistService';
import { isUserAuthenticated } from '@/lib/auth';
import Link from 'next/link';

interface StoreProduct {
  id: string;
  name: string;
  deity: string;
  categoryName: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
  hasVariants?: boolean;
  variants?: Array<{
    id: string;
    name?: string;
    label?: string;
    price: number;
    originalPrice?: number;
    discount: number;
    stock: number;
    sku: string;
  }>;
}

export default function MyFavoritesPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Load wishlist items
  useEffect(() => {
    loadWishlist();
  }, []);

  // Subscribe to wishlist changes for real-time updates
  useEffect(() => {
    if (isUserAuthenticated()) {
      const unsubscribe = wishlistService.subscribeToWishlist((items) => {
        setWishlistItems(items);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const items = await wishlistService.getWishlist();
      setWishlistItems(items);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to load your favorites",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (itemId: string, itemName: string) => {
    try {
      setRemovingItemId(itemId);
      await wishlistService.removeFromWishlist(itemId);
      
      // Update local state immediately for better UX
      setWishlistItems(prev => prev.filter(item => item.id !== itemId));
      
      toast({
        title: "Removed from favorites",
        description: `${itemName} removed from your favorites`,
      });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from favorites",
        variant: "destructive"
      });
    } finally {
      setRemovingItemId(null);
    }
  };

  // Transform wishlist items to StoreProduct format for ProductCard
  const transformToStoreProduct = (item: WishlistItem): StoreProduct => ({
    id: item.productId,
    name: item.name,
    deity: item.deity,
    categoryName: item.categoryName,
    price: item.price,
    originalPrice: item.originalPrice,
    rating: 4.5, // Default rating
    reviews: 10, // Default reviews
    image: item.image,
    badge: item.badge,
    hasVariants: item.hasVariants,
    variants: item.variants || []
  });

  return (
    <MainLayout>
      <div className="min-h-screen" style={{ backgroundColor: '#f4f0eb' }}>
          {/* Header */}
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                  <ArrowLeft className="h-6 w-6" style={{ color: '#846549' }} />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold" style={{ color: '#755e3e' }}>My Favorites</h1>
                  <p className="text-gray-600 mt-1">
                    {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} in your wishlist
                  </p>
                </div>
              </div>
              
              {wishlistItems.length > 0 && (
                <Button
                  onClick={() => {
                    wishlistService.clearWishlist();
                    setWishlistItems([]);
                    toast({
                      title: "Cleared favorites",
                      description: "All items removed from your favorites",
                    });
                  }}
                  variant="outline"
                  className="text-sm"
                  style={{ borderColor: '#846549', color: '#846549' }}
                >
                  Clear All
                </Button>
              )}
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#846549' }}></div>
              </div>
            ) : wishlistItems.length === 0 ? (
              <Card>
                <CardContent className="text-center py-16">
                  <Heart className="h-16 w-16 mx-auto mb-4" style={{ color: '#846549' }} />
                  <h3 className="text-xl font-semibold mb-2" style={{ color: '#755e3e' }}>No favorites yet</h3>
                  <p className="text-gray-600 mb-6">
                    Start adding your favorite spiritual products to your wishlist!
                  </p>
                  <Link href="/">
                    <Button 
                      className="px-6"
                      style={{ backgroundColor: 'rgba(156,86,26,255)', color: 'white' }}
                    >
                      Browse Products
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {wishlistItems.map((item) => {
                  const storeProduct = transformToStoreProduct(item);
                  return (
                    <ProductCard 
                      key={item.id} 
                      product={storeProduct}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </MainLayout>
  );
}