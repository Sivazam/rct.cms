import { NextRequest, NextResponse } from 'next/server';
import { productService, variantService, categoryService } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sort = searchParams.get('sort') || 'createdAt';

    let products: any[] = [];

    // Get products based on filters
    if (category) {
      products = await productService.getProductsByCategory(category);
    } else if (search) {
      products = await productService.searchProducts(search);
    } else {
      products = await productService.getAllProducts(true);
    }

    // Apply sorting
    switch (sort) {
      case 'price-low':
        products.sort((a, b) => {
          const aPrice = a.variants?.[0]?.price || 0;
          const bPrice = b.variants?.[0]?.price || 0;
          return aPrice - bPrice;
        });
        break;
      case 'price-high':
        products.sort((a, b) => {
          const aPrice = a.variants?.[0]?.price || 0;
          const bPrice = b.variants?.[0]?.price || 0;
          return bPrice - aPrice;
        });
        break;
      case 'rating':
        // Note: Rating field not implemented yet, sort by newest as fallback
        products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'newest':
      default:
        products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Get variants for each product
    const productsWithVariants = await Promise.all(
      products.map(async (product) => {
        const variants = await variantService.getVariantsByProductId(product.id);
        const availableVariants = variants.filter(v => v.inventory > 0);

        return {
          ...product,
          variants: availableVariants,
          defaultVariant: availableVariants.find(v => v.isDefault) || availableVariants[0]
        };
      })
    );

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = productsWithVariants.slice(startIndex, endIndex);

    const total = products.length;

    return NextResponse.json({
      success: true,
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}