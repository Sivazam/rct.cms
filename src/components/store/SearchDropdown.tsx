'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { searchService, SearchResult } from '@/lib/services/searchService';
import { useRouter } from 'next/navigation';

interface SearchDropdownProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClose: () => void;
}

export function SearchDropdown({ searchQuery, onSearchChange, onClose }: SearchDropdownProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Handle search with debouncing
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    setShowResults(true);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const searchResults = await searchService.searchProducts(searchQuery, 4);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleProductClick = (product: SearchResult) => {
    console.log('SearchDropdown: Clicking product', { 
      id: product.id, 
      slug: product.slug, 
      name: product.name 
    });
    router.push(`/products/${product.id}`);
    onClose();
    onSearchChange(''); // Clear search after selection
  };

  const handleSeeAllResults = () => {
    router.push(`/?search=${encodeURIComponent(searchQuery)}`);
    onClose();
    onSearchChange(''); // Clear search after navigation
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

  if (!showResults) {
    return null;
  }

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-hidden z-50"
    >
      {/* Loading State */}
      {loading && (
        <div className="p-4 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-600">Searching...</span>
        </div>
      )}

      {/* No Results */}
      {!loading && searchQuery.trim().length > 0 && results.length === 0 && (
        <div className="p-4 text-center">
          <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No products found for "{searchQuery}"</p>
        </div>
      )}

      {/* Search Results */}
      {!loading && results.length > 0 && (
        <div className="max-h-80 overflow-y-auto">
          <div className="p-2">
            {results.map((product) => {
              const pricing = formatPrice(product.price, product.discount, product.originalPrice);
              
              return (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/products/default.jpg';
                      }}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </h4>
                    <p className="text-xs text-gray-600">{product.deity}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm font-semibold text-amber-600">
                        {pricing.current}
                      </span>
                      {pricing.original && (
                        <span className="text-xs text-gray-500 line-through">
                          {pricing.original}
                        </span>
                      )}
                      {pricing.savings && (
                        <Badge className="text-xs bg-red-100 text-red-700 hover:bg-red-100">
                          {pricing.savings}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              );
            })}
          </div>
          
          {/* See All Results Button */}
          <div className="border-t border-gray-200 p-3">
            <Button
              onClick={handleSeeAllResults}
              variant="outline"
              className="w-full text-sm"
            >
              See all results for "{searchQuery}"
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}