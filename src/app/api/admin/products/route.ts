import { NextRequest, NextResponse } from 'next/server';
import { firestoreService, storageService } from '@/lib/firebase';
import { CategoryService } from '@/lib/services/categoryService';
import { config, parseLargeFormData } from './config';

// Export config for Next.js to handle larger payloads
export { config };

// GET /api/admin/products - Get all products
export async function GET(request: NextRequest) {
  try {
    console.log('Admin API: Getting all products');
    
    const products = await firestoreService.getAll('products', {
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
    
    console.log(`Admin API: Found ${products.length} products`);
    
    return NextResponse.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Admin API: Error getting products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - Create new product
export async function POST(request: NextRequest) {
  try {
    console.log('Admin API: Creating new product - START');
    
    // Use the custom form data parser to handle large payloads
    const formData = await parseLargeFormData(request);
    console.log('Admin API: FormData parsed successfully');
    
    // Extract basic product data
    const name = formData.get('name') as string;
    const deity = formData.get('deity') as string;
    const description = formData.get('description') as string;
    const spiritualMeaning = formData.get('spiritualMeaning') as string;
    const origin = formData.get('origin') as string;
    const category = formData.get('category') as string;
    const status = formData.get('status') as string;
    const isBestseller = formData.get('isBestseller') === 'true';
    const tags = JSON.parse(formData.get('tags') as string || '[]');
    const variants = JSON.parse(formData.get('variants') as string || '[]');
    const specifications = formData.get('specifications') ? JSON.parse(formData.get('specifications') as string) : undefined;
    const wearGuide = formData.get('wearGuide') ? JSON.parse(formData.get('wearGuide') as string) : undefined;
    const careGuide = formData.get('careGuide') ? JSON.parse(formData.get('careGuide') as string) : undefined;
    
    console.log('Admin API: Basic data extracted - Name:', name, 'Category:', category);
    
    if (!name || !deity || !description || !category) {
      console.log('Admin API: Validation failed - missing required fields');
      return NextResponse.json(
        { success: false, error: 'Name, deity, description, and category are required' },
        { status: 400 }
      );
    }
    
    // Handle image uploads with try-catch for better error handling
    const images = formData.getAll('newImages') as File[];
    let imageUrls: string[] = [];
    
    if (images.length > 0) {
      try {
        console.log(`Admin API: Uploading ${images.length} images`);
        imageUrls = await storageService.uploadFiles(images, 'products/rudra');
        console.log('Admin API: Images uploaded successfully');
      } catch (uploadError) {
        console.error('Admin API: Error uploading images:', uploadError);
        return NextResponse.json(
          { success: false, error: 'Failed to upload images: ' + (uploadError as Error).message },
          { status: 500 }
        );
      }
    }
    
    // Handle guide image uploads with try-catch
    const wearGuideImageFile = formData.get('wearGuideImage') as File;
    const careGuideImageFile = formData.get('careGuideImage') as File;
    let wearGuideImageUrl = '';
    let careGuideImageUrl = '';
    
    if (wearGuideImageFile && wearGuideImageFile.size > 0) {
      try {
        console.log('Admin API: Uploading wear guide image');
        const uploadedUrls = await storageService.uploadFiles([wearGuideImageFile], 'products/guides');
        wearGuideImageUrl = uploadedUrls[0];
      } catch (uploadError) {
        console.error('Admin API: Error uploading wear guide image:', uploadError);
        // Don't fail the whole request for guide images
      }
    }
    
    if (careGuideImageFile && careGuideImageFile.size > 0) {
      try {
        console.log('Admin API: Uploading care guide image');
        const uploadedUrls = await storageService.uploadFiles([careGuideImageFile], 'products/guides');
        careGuideImageUrl = uploadedUrls[0];
      } catch (uploadError) {
        console.error('Admin API: Error uploading care guide image:', uploadError);
        // Don't fail the whole request for guide images
      }
    }
    
    // Update wearGuide and careGuide with image URLs
    if (wearGuide && wearGuideImageUrl) {
      wearGuide.image = wearGuideImageUrl;
    }
    if (careGuide && careGuideImageUrl) {
      careGuide.image = careGuideImageUrl;
    }
    
    // Calculate total stock from variants
    const totalStock = variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
    
    // Calculate main price, original price, and discount from first variant
    const mainPrice = variants.length > 0 ? variants[0].price : 0;
    const mainOriginalPrice = variants.length > 0 ? variants[0].originalPrice : null;
    const mainDiscount = variants.length > 0 ? variants[0].discount : 0;

    // Get category name
    const categoryData = await CategoryService.getById(category);
    const categoryName = categoryData ? categoryData.name : 'Unknown Category';

    // Generate unique SKUs for variants that don't have them
    const variantsWithSkus = variants.map((v: any, index: number) => ({
      ...v,
      id: v.id || Date.now().toString() + Math.random(),
      sku: v.sku || `SKU${index + 1}`
    }));

    // Create product data with proper handling of undefined/null values
    const productData: any = {
      name,
      deity,
      description,
      spiritualMeaning,
      origin,
      category,
      categoryName, // Add category name for frontend compatibility
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), // Add slug for frontend compatibility
      image: imageUrls[0] || '',
      images: imageUrls,
      price: mainPrice, // Add price for frontend compatibility
      discount: mainDiscount, // Add discount for frontend compatibility
      stock: totalStock, // Add stock for frontend compatibility
      variants: variantsWithSkus,
      tags,
      specifications,
      wearGuide,
      careGuide,
      status,
      isBestseller,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Only add originalPrice if it's not null/undefined
    if (mainOriginalPrice !== null && mainOriginalPrice !== undefined && mainOriginalPrice > 0) {
      productData.originalPrice = mainOriginalPrice;
    }
    
    console.log('Admin API: Creating product in Firestore...');
    const productId = await firestoreService.create('products', productData);
    
    console.log(`Admin API: Product created with ID ${productId}`);
    
    return NextResponse.json({
      success: true,
      data: { id: productId, ...productData }
    }, { status: 201 });
  } catch (error) {
    console.error('Admin API: Error creating product:', error);
    console.error('Admin API: Error details:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name
    });
    return NextResponse.json(
      { success: false, error: 'Failed to create product: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/products - Update product
export async function PUT(request: NextRequest) {
  try {
    console.log('Admin API: Updating product');
    
    // Use the custom form data parser to handle large payloads
    const formData = await parseLargeFormData(request);
    
    // Extract product data
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const deity = formData.get('deity') as string;
    const description = formData.get('description') as string;
    const spiritualMeaning = formData.get('spiritualMeaning') as string;
    const origin = formData.get('origin') as string;
    const category = formData.get('category') as string;
    const status = formData.get('status') as string;
    const isBestseller = formData.get('isBestseller') === 'true';
    const tags = JSON.parse(formData.get('tags') as string || '[]');
    const variants = JSON.parse(formData.get('variants') as string || '[]');
    const imagesToDelete = JSON.parse(formData.get('imagesToDelete') as string || '[]');
    const specifications = formData.get('specifications') ? JSON.parse(formData.get('specifications') as string) : undefined;
    const wearGuide = formData.get('wearGuide') ? JSON.parse(formData.get('wearGuide') as string) : undefined;
    const careGuide = formData.get('careGuide') ? JSON.parse(formData.get('careGuide') as string) : undefined;
    
    if (!id || !name || !deity || !description || !category) {
      return NextResponse.json(
        { success: false, error: 'ID, name, deity, description, and category are required' },
        { status: 400 }
      );
    }
    
    // Get existing product to handle image deletions
    const existingProduct = await firestoreService.getById('products', id);
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Handle image deletions
    if (imagesToDelete.length > 0) {
      for (const imageUrl of imagesToDelete) {
        try {
          if (!imageUrl.startsWith('/')) {
            const urlObj = new URL(imageUrl);
            const imagePath = urlObj.pathname.split('/o/')[1]?.split('?')[0];
            if (imagePath) {
              const decodedPath = decodeURIComponent(imagePath);
              await storageService.deleteFile(decodedPath);
            }
          }
        } catch (error) {
          console.warn('Failed to delete image:', imageUrl, error);
        }
      }
    }
    
    // Handle new image uploads
    const newImages = formData.getAll('newImages') as File[];
    let newImageUrls: string[] = [];
    
    if (newImages.length > 0) {
      console.log(`Admin API: Uploading ${newImages.length} new images`);
      newImageUrls = await storageService.uploadFiles(newImages, 'products/rudra');
    }
    
    // Handle guide image uploads
    const wearGuideImageFile = formData.get('wearGuideImage') as File;
    const careGuideImageFile = formData.get('careGuideImage') as File;
    let wearGuideImageUrl = '';
    let careGuideImageUrl = '';
    
    if (wearGuideImageFile && wearGuideImageFile.size > 0) {
      console.log('Admin API: Uploading wear guide image');
      const uploadedUrls = await storageService.uploadFiles([wearGuideImageFile], 'products/guides');
      wearGuideImageUrl = uploadedUrls[0];
    }
    
    if (careGuideImageFile && careGuideImageFile.size > 0) {
      console.log('Admin API: Uploading care guide image');
      const uploadedUrls = await storageService.uploadFiles([careGuideImageFile], 'products/guides');
      careGuideImageUrl = uploadedUrls[0];
    }
    
    // Update wearGuide and careGuide with image URLs
    if (wearGuide && wearGuideImageUrl) {
      wearGuide.image = wearGuideImageUrl;
    }
    if (careGuide && careGuideImageUrl) {
      careGuide.image = careGuideImageUrl;
    }
    
    // Combine existing images (not deleted) with new images
    const existingImages = existingProduct.images || [];
    const updatedImages = existingImages
      .filter((url: string) => !imagesToDelete.includes(url))
      .concat(newImageUrls);
    
    // Calculate total stock from variants if variants are being updated
    let totalStock = existingProduct.stock || 0;
    let mainPrice = existingProduct.price || 0;
    let mainOriginalPrice = existingProduct.originalPrice;
    let mainDiscount = existingProduct.discount || 0;
    
    if (variants && variants.length > 0) {
      totalStock = variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
      mainPrice = variants[0].price;
      mainOriginalPrice = variants[0].originalPrice;
      mainDiscount = variants[0].discount;
    }

    // Get category name if category is being updated
    let categoryName = existingProduct.categoryName || 'Unknown Category';
    if (category && category !== existingProduct.category) {
      const categoryData = await CategoryService.getById(category);
      categoryName = categoryData ? categoryData.name : 'Unknown Category';
    }

    // Generate unique SKUs for variants that don't have them
    const variantsWithSkus = variants.map((v: any, index: number) => ({
      ...v,
      id: v.id || Date.now().toString() + Math.random(),
      sku: v.sku || `SKU${index + 1}`
    }));

    // Create product data with proper handling of undefined/null values
    const productData: any = {
      name,
      deity,
      description,
      spiritualMeaning,
      origin,
      category,
      categoryName, // Add category name for frontend compatibility
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), // Add slug for frontend compatibility
      image: updatedImages[0] || existingProduct.image,
      images: updatedImages,
      price: mainPrice, // Add price for frontend compatibility
      discount: mainDiscount, // Add discount for frontend compatibility
      stock: totalStock, // Add stock for frontend compatibility
      variants: variantsWithSkus,
      tags,
      specifications,
      wearGuide,
      careGuide,
      status,
      isBestseller,
      updatedAt: new Date().toISOString()
    };

    // Only add originalPrice if it's not null/undefined and greater than 0
    if (mainOriginalPrice !== null && mainOriginalPrice !== undefined && mainOriginalPrice > 0) {
      productData.originalPrice = mainOriginalPrice;
    }
    
    await firestoreService.update('products', id, productData);
    
    console.log(`Admin API: Product ${id} updated`);
    
    return NextResponse.json({
      success: true,
      data: { id, ...productData }
    });
  } catch (error) {
    console.error('Admin API: Error updating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products - Delete product
export async function DELETE(request: NextRequest) {
  try {
    console.log('Admin API: Deleting product');
    
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    // Get product to check for image deletions
    const product = await firestoreService.getById('products', id);
    if (product && product.images) {
      // Delete all product images from Firebase Storage
      for (const imageUrl of product.images) {
        try {
          if (!imageUrl.startsWith('/')) {
            const urlObj = new URL(imageUrl);
            const imagePath = urlObj.pathname.split('/o/')[1]?.split('?')[0];
            if (imagePath) {
              const decodedPath = decodeURIComponent(imagePath);
              await storageService.deleteFile(decodedPath);
            }
          }
        } catch (error) {
          console.warn('Failed to delete product image:', imageUrl, error);
        }
      }
    }
    
    await firestoreService.delete('products', id);
    
    console.log(`Admin API: Product ${id} deleted`);
    
    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Admin API: Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}