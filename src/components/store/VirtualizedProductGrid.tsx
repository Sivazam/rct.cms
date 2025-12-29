'use client';

import { ProductCard } from './ProductCard';

interface Product {
  id: string;
  name: string;
  deity: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
  hasVariants?: boolean;
  variants?: Array<{
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    discount: number;
    stock: number;
    sku: string;
  }>;
}

interface VirtualizedProductGridProps {
  products: Product[];
}

export function VirtualizedProductGrid({ products }: VirtualizedProductGridProps) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}