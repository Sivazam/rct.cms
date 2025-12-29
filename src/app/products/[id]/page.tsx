'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Star, Heart, Share2, Shield, Check, ArrowRight, ShoppingCart, Minus, Plus, Truck, RotateCcw, Award, Sparkles, Package, Info, Zap, ZapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCartStore } from '@/store/cartStore';
import { MainLayout } from '@/components/store/MainLayout';
import { useToast } from '@/hooks/use-toast';
import { ImageWithLoader } from '@/components/ui/ImageWithLoader';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  spiritualMeaning?: string;
  deity: string;
  price: number;
  originalPrice?: number;
  discount: number;
  category: string;
  categoryName: string;
  images: string[];
  variants: Array<{
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    discount: number;
    stock: number;
    sku: string;
    inventory: number;
    isDefault?: boolean;
  }>;
  status: 'active' | 'inactive';
  stock: number;
  createdAt: string;
  defaultVariant?: any;
  origin?: string;
  specifications?: string[];
  wearGuide?: {
    title: string;
    steps: string[];
    image?: string;
  };
  careGuide?: {
    title: string;
    steps: string[];
    image?: string;
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [shakeButton, setShakeButton] = useState<'add-to-cart' | 'buy-now' | null>(null);
  const [shakeVariants, setShakeVariants] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  
  const { addItem, items } = useCartStore();
  const { toast } = useToast();

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/id/${productId}`);
        if (response.ok) {
          const productData = await response.json();
          setProduct(productData);
          // Set default variant if available
          if (productData.defaultVariant) {
            setSelectedVariant(productData.defaultVariant);
          }
        } else {
          console.error('Failed to fetch product');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Check if this product is already in cart
  const cartItemsForProduct = product ? items.filter(item => item.productId === product.id) : [];
  const isCurrentVariantInCart = selectedVariant && 
    cartItemsForProduct.some(item => item.variant.label === selectedVariant.name);
  
  useEffect(() => {
    setIsInCart(isCurrentVariantInCart);
  }, [isCurrentVariantInCart]);

  const handleAddToCart = () => {
    if (!product) return;
    
    const availableVariants = product.variants ? product.variants.filter(v => v.inventory > 0) : [];
    
    if (availableVariants.length > 1 && !selectedVariant) {
      setShakeVariants(true);
      toast({
        title: "Please select a variant",
        description: "Choose a variant before adding to cart",
        variant: "destructive",
      });
      
      setTimeout(() => {
        setShakeVariants(false);
      }, 1000);
      return;
    }
    
    const variantToAdd = selectedVariant || availableVariants[0];
    if (variantToAdd) {
      addItem({
        productId: product.id,
        name: product.name,
        deity: product.deity,
        image: product.images[0],
        variant: {
          label: variantToAdd.name,
          price: variantToAdd.price,
          sku: variantToAdd.sku,
          discount: variantToAdd.discount
        }
      });
      
      toast({
        title: "Added to cart",
        description: `${product.name} added to cart`,
      });
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    
    const availableVariants = product.variants ? product.variants.filter(v => v.inventory > 0) : [];
    
    if (availableVariants.length > 1 && !selectedVariant) {
      setShakeVariants(true);
      toast({
        title: "Please select a variant",
        description: "Choose a variant before proceeding to buy",
        variant: "destructive",
      });
      
      setTimeout(() => {
        setShakeVariants(false);
      }, 1000);
      return;
    }
    
    const variantToAdd = selectedVariant || availableVariants[0];
    if (variantToAdd) {
      addItem({
        productId: product.id,
        name: product.name,
        deity: product.deity,
        image: product.images[0],
        variant: {
          label: variantToAdd.name,
          price: variantToAdd.price,
          sku: variantToAdd.sku,
          discount: variantToAdd.discount
        }
      });
      
      toast({
        title: "Added to cart",
        description: `${product.name} added to cart`,
      });
      
      // Navigate to cart to view items and proceed to checkout
      window.location.href = '/cart';
    }
  };

  const handleGoToCart = () => {
    useCartStore.getState().openCart();
  };

  const formatPrice = (price: number, discount: number = 0, originalPrice?: number) => {
    const discountedPrice = price - (price * discount) / 100;
    const hasOriginalPrice = originalPrice && originalPrice > price;
    return {
      current: `₹${discountedPrice.toLocaleString()}`,
      original: hasOriginalPrice ? `₹${originalPrice.toLocaleString()}` : (discount > 0 ? `₹${price.toLocaleString()}` : null),
      savings: hasOriginalPrice ? `${Math.round(((originalPrice! - price) / originalPrice!) * 100)}% OFF` : (discount > 0 ? `${discount}% OFF` : null)
    };
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
          {/* Loading Skeleton */}
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Image Gallery Skeleton */}
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  <div>
                    <Skeleton className="aspect-[16/9] rounded-2xl" />
                  </div>
                  <div className="flex gap-2">
                    {[...Array(4)].map((_, index) => (
                      <Skeleton key={index} className="w-20 h-20 rounded-xl" />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Product Info Skeleton */}
              <div className="space-y-6">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <p>Product not found</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const currentPricing = formatPrice(selectedVariant?.price || product.price, selectedVariant?.discount || 0, selectedVariant?.originalPrice || product.originalPrice);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <a href="/" className="hover:text-amber-700 transition-colors">Home</a>
            <span>/</span>
            <a 
              href={`/?category=${encodeURIComponent(product.categoryName)}`} 
              className="hover:text-amber-700 transition-colors"
            >
              {product.categoryName}
            </a>
            <span>/</span>
            <span className="text-amber-900 font-medium">{product.name}</span>
          </nav>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Image Gallery - 2 columns */}
            <div className="lg:col-span-2">
              {/* Main Image Slider */}
              <div className="relative">
                <div className="aspect-[16/9] bg-white rounded-2xl shadow-lg overflow-hidden">
                  <OptimizedImage
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300"
                    priority={true}
                    objectFit="cover"
                  />
                </div>
                
                {/* Slider Navigation */}
                <button
                  onClick={() => setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all duration-200 z-10"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => setSelectedImage((prev) => (prev + 1) % product.images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all duration-200 z-10"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {/* Thumbnail Strip */}
              <div className="flex gap-2 mt-4 pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                      selectedImage === index 
                        ? 'ring-2 ring-amber-500 ring-offset-2' 
                        : ''
                    }`}
                  >
                    <OptimizedImage
                      src={image}
                      alt={`${product.name} view ${index + 1}`}
                      className="w-full h-full object-cover"
                      objectFit="cover"
                      priority={index === 0}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Information - 1 column */}
            <div className="space-y-6">
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">
                      {product.name}
                    </h1>
                    <div className="flex items-center space-x-3">
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                        {product.deity}
                      </Badge>
                      {product.origin && (
                        <span className="text-sm text-gray-600">Origin: {product.origin}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className="hidden sm:flex"
                  >
                    <Heart className={`h-6 w-6 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                  </Button>
                </div>
                
                {/* Rating */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(product.rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold text-gray-900">{product.rating}</span>
                  <span className="text-gray-600">({product.reviews} reviews)</span>
                </div>
              </div>

              {/* Price */}
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-6 border border-amber-200">
                <div className="flex items-baseline space-x-3 mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {currentPricing.current}
                  </span>
                  {currentPricing.original && (
                    <span className="text-xl text-gray-500 line-through">
                      {currentPricing.original}
                    </span>
                  )}
                </div>
                {currentPricing.savings && (
                  <Badge className="bg-red-500 hover:bg-red-600 text-white">
                    {currentPricing.savings}
                  </Badge>
                )}
              </div>

              {/* Variant Selection */}
              {product.variants.length > 1 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Select Variant</h3>
                  <RadioGroup
                    value={selectedVariant?.id || ''}
                    onValueChange={(value) => {
                      const variant = product.variants.find(v => v.id === value);
                      setSelectedVariant(variant);
                    }}
                    className={`grid grid-cols-2 gap-3 ${shakeVariants ? 'animate-shake' : ''}`}
                  >
                    {product.variants.map((variant) => {
                      const pricing = formatPrice(variant.price, variant.discount, variant.originalPrice);
                      return (
                        <div key={variant.id} className="relative">
                          <RadioGroupItem
                            value={variant.id}
                            id={variant.id}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={variant.id}
                            className="flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all peer-data-[state=checked]:border-amber-500 peer-data-[state=checked]:bg-amber-50 hover:border-amber-300 hover:bg-amber-50/50"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-gray-900">{variant.name}</span>
                              <div className="flex space-x-1">
                                {variant.isDefault && (
                                  <Badge variant="secondary" className="text-xs">Default</Badge>
                                )}
                                {variant.inventory < 5 && variant.inventory > 0 && (
                                  <Badge className="bg-red-500 hover:bg-red-600 text-xs">
                                    {variant.inventory} left
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="text-lg font-bold text-gray-900">{pricing.current}</span>
                              {pricing.original && (
                                <span className="text-sm text-gray-500 line-through">{pricing.original}</span>
                              )}
                            </div>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              )}

              {/* Specifications */}
              {product.specifications && product.specifications.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Product Details</h3>
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="grid grid-cols-1 gap-3">
                      {product.specifications.map((spec, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{spec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Trust Indicators */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-200">
                  <Shield className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Authenticity</p>
                    <p className="text-xs text-gray-600">100% Genuine</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-200">
                  <Truck className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Free Shipping</p>
                    <p className="text-xs text-gray-600">On orders ₹500+</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-200">
                  <RotateCcw className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Easy Returns</p>
                    <p className="text-xs text-gray-600">7 days return</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-200">
                  <Award className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Certified</p>
                    <p className="text-xs text-gray-600">Lab Tested</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Information Tabs */}
          <div className="mt-12">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-white rounded-xl border border-gray-200 p-1">
                <TabsTrigger value="description" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white rounded-lg">Description</TabsTrigger>
                {product.spiritualMeaning && (
                  <TabsTrigger value="spiritual" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white rounded-lg">Spiritual Meaning</TabsTrigger>
                )}
                {product.wearGuide && (
                  <TabsTrigger value="wear-guide" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white rounded-lg">Wear Guide</TabsTrigger>
                )}
                {product.careGuide && (
                  <TabsTrigger value="care-guide" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white rounded-lg">Care Guide</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="description" className="mt-8">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Product Description</h3>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {product.description}
                  </p>
                </div>
              </TabsContent>
              
              {product.spiritualMeaning && (
                <TabsContent value="spiritual" className="mt-8">
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Spiritual Significance</h3>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {product.spiritualMeaning}
                    </p>
                  </div>
                </TabsContent>
              )}
              
              {product.wearGuide && (
                <TabsContent value="wear-guide" className="mt-8">
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">{product.wearGuide.title}</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <ol className="space-y-4">
                          {product.wearGuide.steps.map((step, index) => (
                            <li key={index} className="flex items-start space-x-4">
                              <span className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </span>
                              <span className="text-gray-700 text-lg">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div className="flex justify-center">
                        {product.wearGuide.image ? (
                          <ImageWithLoader
                            src={product.wearGuide.image}
                            alt="Wear Guide"
                            className="w-full max-w-sm h-64 object-cover rounded-xl"
                          />
                        ) : (
                          <div className="w-full max-w-sm h-64 bg-gray-100 rounded-xl flex items-center justify-center">
                            <Sparkles className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}
              
              {product.careGuide && (
                <TabsContent value="care-guide" className="mt-8">
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">{product.careGuide.title}</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <ol className="space-y-4">
                          {product.careGuide.steps.map((step, index) => (
                            <li key={index} className="flex items-start space-x-4">
                              <span className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </span>
                              <span className="text-gray-700 text-lg">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div className="flex justify-center">
                        {product.careGuide.image ? (
                          <ImageWithLoader
                            src={product.careGuide.image}
                            alt="Care Guide"
                            className="w-full max-w-sm h-64 object-cover rounded-xl"
                          />
                        ) : (
                          <div className="w-full max-w-sm h-64 bg-gray-100 rounded-xl flex items-center justify-center">
                            <Package className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>

        {/* Fixed Bottom Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl z-50" style={{ borderColor: '#d4a574' }}>
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {!isInCart ? (
                <>
                  <Button
                    onClick={handleAddToCart}
                    variant="outline"
                    className={`flex-1 h-12 text-base font-semibold border-2 border-amber-500 text-amber-700 hover:bg-amber-50 transition-colors ${shakeButton === 'add-to-cart' ? 'animate-shake' : ''}`}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    className={`flex-1 h-12 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-colors ${shakeButton === 'buy-now' ? 'animate-shake' : ''}`}
                  >
                    <div className="relative">
          <ZapIcon className="h-5 w-5 mr-2 text-white" />
        </div>
                    Buy Now
                    <ArrowRight className="h-5 w-5 ml-2 text-white" />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleGoToCart}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white transition-colors"
                >
                  Go to Cart
                  <ShoppingCart className="h-5 w-5 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Image Zoom Modal */}
        <Dialog open={isImageZoomed} onOpenChange={setIsImageZoomed}>
          <DialogContent className="max-w-5xl max-h-[90vh] p-0">
            <div className="relative">
              <OptimizedImage
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-contain"
                objectFit="contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}