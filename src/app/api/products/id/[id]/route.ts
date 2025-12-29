import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/productService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    
    // Get product by ID
    const product = await ProductService.getById(productId);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Use variants from the product document
    let variants = [];
    let defaultVariant = null;
    
    if (product.variants && product.variants.length > 0) {
      // Transform variants to match the expected format
      variants = product.variants.map(variant => ({
        id: variant.id,
        name: variant.name || variant.label, // Handle both name and label properties
        price: variant.price,
        originalPrice: variant.originalPrice || variant.price,
        discount: variant.discount,
        stock: variant.stock,
        sku: variant.sku || '',
        inventory: variant.stock,
        isDefault: variant.isDefault || false
      }));
      
      // Find default variant
      defaultVariant = variants.find(v => v.isDefault) || variants[0] || null;
    } else {
      // If no variants, create a default variant from product data
      variants = [{
        id: `default-${productId}`,
        name: 'Default',
        price: product.price,
        originalPrice: product.originalPrice || product.price,
        discount: product.discount,
        stock: product.stock,
        sku: `SKU-${productId}`,
        inventory: product.stock,
        isDefault: true
      }];
      defaultVariant = variants[0];
    }

    return NextResponse.json({
      ...product,
      variants,
      defaultVariant,
      // Add additional fields expected by the product detail page
      rating: product.rating || 4.5,
      reviews: product.reviews || 10,
      subtitle: product.subtitle || '',
      spiritualMeaning: product.spiritualMeaning || '',
      deity: product.deity || product.categoryName,
      origin: product.origin || '',
      specifications: product.specifications || [],
      wearGuide: product.wearGuide || null,
      careGuide: product.careGuide || null
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}