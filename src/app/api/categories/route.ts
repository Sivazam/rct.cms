import { NextRequest, NextResponse } from 'next/server';
import { categoryService } from '@/lib/services';

export async function GET() {
  try {
    const categories = await categoryService.getAllCategories();

    return NextResponse.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, slug, iconUrl } = await request.json();

    if (!name || !slug || !iconUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if category already exists
    const existingCategoryByName = await categoryService.getCategoryBySlug(slug);
    if (existingCategoryByName) {
      return NextResponse.json(
        { success: false, error: 'Category already exists' },
        { status: 400 }
      );
    }

    const categoryId = await categoryService.createCategory({
      name,
      slug,
      iconUrl
    });

    const newCategory = await categoryService.getCategoryById(categoryId);

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      category: newCategory
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}