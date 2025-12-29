import { NextRequest, NextResponse } from 'next/server';
import { firestoreService, storageService } from '@/lib/firebase';

// GET /api/admin/categories - Get all categories
export async function GET(request: NextRequest) {
  try {
    console.log('Admin API: Getting all categories');
    
    const categories = await firestoreService.getAll('categories', {
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
    
    console.log(`Admin API: Found ${categories.length} categories`);
    
    return NextResponse.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Admin API: Error getting categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/admin/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    console.log('Admin API: Creating new category');
    
    const body = await request.json();
    const { name, description, image, status } = body;
    
    if (!name || !description) {
      return NextResponse.json(
        { success: false, error: 'Name and description are required' },
        { status: 400 }
      );
    }
    
    const categoryData = {
      name,
      description,
      image: image || '',
      status: status || 'active',
      productCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const categoryId = await firestoreService.create('categories', categoryData);
    
    console.log(`Admin API: Category created with ID ${categoryId}`);
    
    return NextResponse.json({
      success: true,
      data: { id: categoryId, ...categoryData }
    }, { status: 201 });
  } catch (error) {
    console.error('Admin API: Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/categories - Update category
export async function PUT(request: NextRequest) {
  try {
    console.log('Admin API: Updating category');
    
    const body = await request.json();
    const { id, name, description, image, status } = body;
    
    if (!id || !name || !description) {
      return NextResponse.json(
        { success: false, error: 'ID, name, and description are required' },
        { status: 400 }
      );
    }
    
    const categoryData = {
      name,
      description,
      image,
      status,
      updatedAt: new Date().toISOString()
    };
    
    await firestoreService.update('categories', id, categoryData);
    
    console.log(`Admin API: Category ${id} updated`);
    
    return NextResponse.json({
      success: true,
      data: { id, ...categoryData }
    });
  } catch (error) {
    console.error('Admin API: Error updating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/categories - Delete category
export async function DELETE(request: NextRequest) {
  try {
    console.log('Admin API: Deleting category');
    
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }
    
    // Get category to check for image deletion
    const category = await firestoreService.getById('categories', id);
    if (category && category.image && !category.image.startsWith('/')) {
      // Delete image from Firebase Storage if it's a URL (not local path)
      try {
        // Extract path from URL and delete
        const imageUrl = new URL(category.image);
        const imagePath = imageUrl.pathname.split('/o/')[1]?.split('?')[0];
        if (imagePath) {
          const decodedPath = decodeURIComponent(imagePath);
          await storageService.deleteFile(decodedPath);
        }
      } catch (error) {
        console.warn('Failed to delete category image:', error);
      }
    }
    
    await firestoreService.delete('categories', id);
    
    console.log(`Admin API: Category ${id} deleted`);
    
    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Admin API: Error deleting category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}