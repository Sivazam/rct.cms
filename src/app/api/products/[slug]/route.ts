import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Product, Variant } from '@/lib/models';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();
    
    const product = await Product.findOne({ 
      slug: params.slug, 
      status: 'active' 
    }).populate('category', 'name slug iconUrl').lean();

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get variants for the product
    const variants = await Variant.find({ 
      productId: product._id,
      inventory: { $gt: 0 }
    }).sort({ isDefault: -1, price: 1 }).lean();

    return NextResponse.json({
      ...product,
      variants
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}