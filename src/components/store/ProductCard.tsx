'use client';

import { useState, useEffect } from 'react';
import { Heart, Star, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCartStore } from '@/store/cartStore';
import { VariantSelector } from './VariantSelector';
import { useToast } from '@/hooks/use-toast';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { wishlistService } from '@/lib/services/wishlistService';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Product {
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

interface ProductCardProps {
  product: Product;
}

// Transform product variants to variant selector format
const transformVariants = (product: Product) => {
  if (!product.variants || product.variants.length === 0) {
    // If no variants, create a default variant from the main product
    return [{
      label: 'Default',
      price: product.price,
      sku: `DEF-${product.id}`,
      discount: 0,
      inventory: 100,
      isDefault: true
    }];
  }
  
  return product.variants.map(variant => ({
    label: variant.name || variant.label || 'Unnamed Variant',
    price: variant.price,
    sku: variant.sku,
    discount: variant.discount,
    inventory: variant.stock,
    isDefault: variant.id === product.variants![0].id // Mark first variant as default
  }));
};

export function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [showRepeatDialog, setShowRepeatDialog] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [updatingWishlist, setUpdatingWishlist] = useState(false);
  
  const { items, addItem, updateQuantity } = useCartStore();
  const { toast } = useToast();
  const router = useRouter();

  // Prefetch product page on hover for faster navigation
  const handleMouseEnter = () => {
    router.prefetch(`/products/${product.id}`);
  };

  // Check if product is in wishlist on component mount and listen for changes
  useEffect(() => {
    const checkWishlistStatus = async () => {
      try {
        const inWishlist = await wishlistService.isInWishlist(product.id);
        setIsWishlisted(inWishlist);
      } catch (error) {
        console.error('Error checking wishlist status:', error);
      }
    };
    
    checkWishlistStatus();
    
    // Listen for wishlist changes
    const handleWishlistChange = () => {
      checkWishlistStatus();
    };
    
    window.addEventListener('wishlist-changed', handleWishlistChange);
    
    return () => {
      window.removeEventListener('wishlist-changed', handleWishlistChange);
    };
  }, [product.id]);

  // Check if this product is already in cart - sum quantities of ALL variants
  const cartItemsForProduct = items.filter(item => item.productId === product.id);
  const totalQuantityInCart = cartItemsForProduct.reduce((sum, item) => sum + item.quantity, 0);
  
  // For increment/decrement operations, we still need the specific cart item
  const cartItem = cartItemsForProduct[0]; // Get first item for increment operations
  const quantityInCart = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    // Check if product has variants
    if (!product.variants || product.variants.length === 0) {
      // No variants - add main product directly
      handleDirectAddToCart();
      return;
    }
    
    // Product has variants - always show variant selector
    const variants = transformVariants(product);
    const availableVariants = variants.filter(v => v.inventory > 0);
    
    if (availableVariants.length === 0) {
      // All variants out of stock
      toast({
        title: "Out of stock",
        description: `${product.name} is currently out of stock`,
        variant: "destructive"
      });
      return;
    }
    
    // Show variant selector for products with variants
    setShowVariantSelector(true);
  };

  const handleDirectAddToCart = () => {
    setIsAdding(true);
    
    // Add item directly without API call simulation
    addItem({
      productId: product.id,
      variantId: `MAIN-${product.id}`,
      name: product.name,
      deity: product.deity,
      image: product.image,
      variant: {
        label: 'Default',
        price: product.price,
        sku: `MAIN-${product.id}`,
        discount: 0
      }
    });
    
    // Open cart after adding item
    useCartStore.getState().openCart();
    
    setIsAdding(false);
    
    toast({
      title: "Added to cart",
      description: `${product.name} added to cart`,
    });
  };

  const handleVariantSelect = (variant: any) => {
    setIsAdding(true);
    
    // Add item directly without API call simulation
    addItem({
      productId: product.id,
      variantId: variant.label, // Use variant.label instead of variant.sku since SKU is empty
      name: product.name,
      deity: product.deity,
      image: product.image,
      variant: {
        label: variant.label,
        price: variant.price,
        sku: variant.sku,
        discount: variant.discount
      }
    });
    
    // Open cart after adding item
    useCartStore.getState().openCart();
    
    setIsAdding(false);
    setShowVariantSelector(false);
    
    toast({
      title: "Added to cart",
      description: `${product.name} added to cart`,
    });
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity > totalQuantityInCart) {
      // This is an increment operation
      if (!product.variants || product.variants.length === 0) {
        // No variants - just increment the first item's quantity
        if (cartItem) {
          useCartStore.getState().updateQuantity(cartItem.id, newQuantity);
          
          // Open cart immediately after updating quantity
          useCartStore.getState().openCart();
          
          toast({
            title: "Quantity updated",
            description: `${product.name} quantity increased to ${newQuantity}`,
          });
        }
        return;
      }
      
      const variants = transformVariants(product);
      if (variants.length > 1) {
        // If multiple variants exist, show dialog to choose
        setShowRepeatDialog(true);
      } else {
        // If only one variant, just increment the first item's quantity
        if (cartItem) {
          useCartStore.getState().updateQuantity(cartItem.id, newQuantity);
          
          // Open cart immediately after updating quantity
          useCartStore.getState().openCart();
          
          toast({
            title: "Quantity updated",
            description: `${product.name} quantity increased to ${newQuantity}`,
          });
        }
      }
    } else if (newQuantity > 0) {
      // This is a decrement operation - find the most recent cart item and decrement it
      if (cartItemsForProduct.length > 0) {
        // Get the most recently added item (last in array)
        const mostRecentItem = cartItemsForProduct[cartItemsForProduct.length - 1];
        if (mostRecentItem.quantity > 1) {
          // Decrement the quantity
          useCartStore.getState().updateQuantity(mostRecentItem.id, mostRecentItem.quantity - 1);
          toast({
            title: "Quantity updated",
            description: `${product.name} quantity decreased to ${mostRecentItem.quantity - 1}`,
          });
        } else {
          // Remove the item if quantity would be 0
          useCartStore.getState().removeItem(mostRecentItem.id);
          toast({
            title: "Item removed",
            description: `${product.name} removed from cart`,
          });
        }
      }
    } else if (newQuantity === 0) {
      // Remove the item when quantity reaches 0
      if (cartItemsForProduct.length > 0) {
        // Get the most recently added item (last in array)
        const mostRecentItem = cartItemsForProduct[cartItemsForProduct.length - 1];
        useCartStore.getState().removeItem(mostRecentItem.id);
        toast({
          title: "Item removed",
          description: `${product.name} removed from cart`,
        });
      }
    }
  };

  const handleRepeat = () => {
    // Increment the most recently added item's quantity
    if (cartItemsForProduct.length > 0) {
      const mostRecentItem = cartItemsForProduct[cartItemsForProduct.length - 1];
      useCartStore.getState().updateQuantity(mostRecentItem.id, mostRecentItem.quantity + 1);
      setShowRepeatDialog(false);
      
      // Open cart after updating quantity
      useCartStore.getState().openCart();
      
      toast({
        title: "Quantity updated",
        description: `${product.name} quantity increased to ${mostRecentItem.quantity + 1}`,
      });
    }
  };

  const handleSelectDifferentVariant = () => {
    setShowRepeatDialog(false);
    setShowVariantSelector(true);
  };

  const toggleWishlist = async () => {
    try {
      setUpdatingWishlist(true);
      
      if (isWishlisted) {
        // Remove from wishlist
        await wishlistService.removeFromWishlistByProductId(product.id);
        setIsWishlisted(false);
        toast({
          title: "Removed from favorites",
          description: `${product.name} removed from your favorites`,
        });
      } else {
        // Add to wishlist
        await wishlistService.addToWishlist({
          productId: product.id,
          name: product.name,
          deity: product.deity,
          categoryName: product.categoryName,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.image,
          badge: product.badge,
          hasVariants: product.hasVariants,
          variants: product.variants
        });
        setIsWishlisted(true);
        toast({
          title: "Added to favorites",
          description: `${product.name} added to your favorites`,
        });
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive"
      });
    } finally {
      setUpdatingWishlist(false);
    }
  };

  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full scroll-optimized smooth-transition" style={{ border: `1px solid #846549` }} onMouseEnter={handleMouseEnter}>
        {/* Product Image - Fixed height */}
        <div className="aspect-square bg-white rounded-lg shadow-sm overflow-hidden flex-shrink-0 gpu-accelerated bg-gray-50">
          <Link href={`/products/${product.id}`} className="block w-full h-full">
            <OptimizedImage
              src={product.image}
              alt={product.name}
              className="w-full h-full group-hover:scale-105 optimized-image smooth-image-zoom"
              objectFit="cover"
            />
          </Link>
          
          {/* Badge */}
          {product.badge && (
            <Badge className="absolute top-2 left-2" style={{ backgroundColor: 'rgba(156,86,26,255)', color: 'white' }}>
              {product.badge}
            </Badge>
          )}
          
          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <Badge className="absolute top-2 right-2 bg-red-600 hover:bg-red-700">
              {discountPercentage}% OFF
            </Badge>
          )}
        </div>
        
        {/* Product Info - Flexible content area */}
        <div className="p-4 space-y-2 flex flex-col flex-1">
          {/* Deity Chip */}
          <div className="inline-block">
            <span className="inline-block px-1.5 py-0.5 text-xs font-medium rounded-full bg-[#846549] text-white whitespace-nowrap">
              {product.deity}
            </span>
          </div>
          
          {/* Product Name - Flexible but with max lines */}
          <div className="flex items-center justify-between h-full">
            <Link href={`/products/${product.id}`} className="flex-1">
              <h3 className="font-semibold line-clamp-2 hover:opacity-80 transition-colors" style={{ color: '#755e3e' }}>
                {product.name}
              </h3>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 hover:bg-white/20 flex-shrink-0 ml-2"
              onClick={toggleWishlist}
              disabled={updatingWishlist}
            >
              <Heart 
                className={`h-4 w-4 ${
                  isWishlisted ? 'fill-current' : ''
                }`}
                style={{ color: isWishlisted ? '#f20600' : '#846549' }}
              />
            </Button>
          </div>
          
          {/* Rating - Fixed height */}
          <div className="flex items-center space-x-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating)
                      ? 'fill-current'
                      : 'text-gray-300'
                  }`}
                  style={{ color: i < Math.floor(product.rating) ? 'rgba(160,82,16,255)' : undefined }}
                />
              ))}
            </div>
            <span className="text-sm" style={{ color: '#846549' }}>
              {product.rating} ({product.reviews})
            </span>
          </div>
          
          {/* Price - Fixed height */}
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold" style={{ color: '#755e3e' }}>
              ₹{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-sm line-through" style={{ color: '#846549' }}>
                ₹{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          
          {/* Add to Cart Button OR Counter - Fixed height */}
          <div className="mt-auto pt-2">
            {totalQuantityInCart === 0 ? (
              <Button
                onClick={handleAddToCart}
                disabled={isAdding}
                className="w-full h-10"
                variant="outline"
                style={{ borderColor: '#846549', color: '#846549' }}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {isAdding ? 'Adding...' : 'ADD TO CART'}
              </Button>
            ) : (
              <div className="flex items-center justify-center space-x-2 h-10">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  style={{ borderColor: '#846549', color: '#846549' }}
                  onClick={() => handleQuantityChange(totalQuantityInCart - 1)}
                  disabled={totalQuantityInCart <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium" style={{ color: '#755e3e' }}>{totalQuantityInCart}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  style={{ borderColor: '#846549', color: '#846549' }}
                  onClick={() => handleQuantityChange(totalQuantityInCart + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Variant Selector Modal - Show for all products */}
      <VariantSelector
        isOpen={showVariantSelector}
        onClose={() => setShowVariantSelector(false)}
        variants={transformVariants(product)}
        productName={product.name}
        onVariantSelect={handleVariantSelect}
      />

      {/* Repeat or Select Different Variant Dialog */}
      <Dialog open={showRepeatDialog} onOpenChange={setShowRepeatDialog}>
        <DialogContent className="sm:max-w-[425px] max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:rounded-t-lg max-sm:max-w-none max-sm:translate-y-0 max-sm:h-auto max-sm:p-6">
          <DialogHeader className="max-sm:text-center max-sm:mb-4">
            <DialogTitle className="max-sm:text-lg max-sm:mb-2">Choose an option</DialogTitle>
            <DialogDescription className="max-sm:text-sm max-sm:px-4">
              Would you like to add more of the same variant or select a different variant?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 max-sm:gap-2 max-sm:w-full">
            <Button 
              onClick={handleSelectDifferentVariant} 
              variant="outline" 
              className="sm:flex-1 max-sm:w-full max-sm:order-2" 
              style={{ borderColor: '#846549', color: '#846549' }}
            >
              Select Different Variant
            </Button>
            <Button 
              onClick={handleRepeat} 
              className="sm:flex-1 max-sm:w-full max-sm:order-1" 
              style={{ backgroundColor: 'rgba(156,86,26,255)', color: 'white' }}
            >
              Add Same Variant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}