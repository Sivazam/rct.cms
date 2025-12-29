import { firestoreService, storageService } from '@/lib/firebase';
import { CategoryService } from './categoryService';

export interface Variant {
  id: string;
  name?: string;
  label?: string;
  price: number;
  originalPrice?: number;
  discount: number;
  stock: number;
  sku: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount: number;
  category: string;
  categoryName: string;
  images: string[];
  variants: Variant[];
  status: 'active' | 'inactive';
  stock: number;
  createdAt: string;
}

export class ProductService {
  private static readonly COLLECTION_NAME = 'products';

  // Get all products
  static async getAll(): Promise<Product[]> {
    try {
      const products = await firestoreService.getAll(this.COLLECTION_NAME, {
        orderBy: { field: 'createdAt', direction: 'desc' }
      });
      return products as Product[];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  // Get product by ID
  static async getById(id: string): Promise<Product | null> {
    try {
      const product = await firestoreService.getById(this.COLLECTION_NAME, id);
      return product as Product;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }

  // Get products by category
  static async getByCategory(categoryId: string): Promise<Product[]> {
    try {
      const products = await firestoreService.getAll(this.COLLECTION_NAME, {
        where: { field: 'category', operator: '==', value: categoryId },
        orderBy: { field: 'name', direction: 'asc' }
      });
      return products as Product[];
    } catch (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
  }

  // Get active products only
  static async getActive(): Promise<Product[]> {
    try {
      const products = await firestoreService.getAll(this.COLLECTION_NAME, {
        where: { field: 'status', operator: '==', value: 'active' },
        orderBy: { field: 'createdAt', direction: 'desc' }
      });
      return products as Product[];
    } catch (error) {
      console.error('Error fetching active products:', error);
      return [];
    }
  }

  // Create new product
  static async create(productData: Omit<Product, 'id' | 'createdAt' | 'slug'>, imageFiles?: File[]): Promise<string> {
    try {
      let imageUrls = productData.images;
      
      // Upload images to Firebase Storage if provided
      if (imageFiles && imageFiles.length > 0) {
        imageUrls = await storageService.uploadFiles(imageFiles, 'products');
      }

      // Calculate total stock from variants
      const totalStock = productData.variants.reduce((sum, variant) => sum + variant.stock, 0);
      
      // Calculate main price from first variant
      const mainPrice = productData.variants.length > 0 ? productData.variants[0].price : 0;
      const mainOriginalPrice = productData.variants.length > 0 ? productData.variants[0].originalPrice : undefined;
      const mainDiscount = productData.variants.length > 0 ? productData.variants[0].discount : 0;

      const productToCreate = {
        ...productData,
        images: imageUrls,
        price: mainPrice,
        originalPrice: mainOriginalPrice,
        discount: mainDiscount,
        stock: totalStock,
        slug: productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      };

      const productId = await firestoreService.create(this.COLLECTION_NAME, productToCreate);
      
      // Update category product count
      await CategoryService.updateProductCount(productData.category, 1);
      
      return productId;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  // Update product
  static async update(id: string, productData: Partial<Product>, newImageFiles?: File[], imagesToDelete?: string[]): Promise<void> {
    try {
      let imageUrls = productData.images;
      
      // Delete specified images from Firebase Storage
      if (imagesToDelete && imagesToDelete.length > 0) {
        for (const imageUrl of imagesToDelete) {
          try {
            const urlObj = new URL(imageUrl);
            const imagePath = urlObj.pathname.split('/o/')[1]?.split('?')[0];
            if (imagePath) {
              const decodedPath = decodeURIComponent(imagePath);
              await storageService.deleteFile(decodedPath);
            }
          } catch (error) {
            console.warn('Failed to delete image:', imageUrl, error);
          }
        }
        
        // Remove deleted images from the array
        imageUrls = imageUrls?.filter(url => !imagesToDelete.includes(url)) || [];
      }
      
      // Upload new images to Firebase Storage if provided
      if (newImageFiles && newImageFiles.length > 0) {
        const newImageUrls = await storageService.uploadFiles(newImageFiles, 'products');
        imageUrls = [...(imageUrls || []), ...newImageUrls];
      }

      // Calculate total stock from variants if variants are being updated
      let totalStock = productData.stock;
      let mainPrice = productData.price;
      let mainOriginalPrice = productData.originalPrice;
      let mainDiscount = productData.discount;
      
      if (productData.variants) {
        totalStock = productData.variants.reduce((sum, variant) => sum + variant.stock, 0);
        mainPrice = productData.variants.length > 0 ? productData.variants[0].price : 0;
        mainOriginalPrice = productData.variants.length > 0 ? productData.variants[0].originalPrice : undefined;
        mainDiscount = productData.variants.length > 0 ? productData.variants[0].discount : 0;
      }

      const productToUpdate = {
        ...productData,
        ...(imageUrls && { images: imageUrls }),
        ...(totalStock !== undefined && { stock: totalStock }),
        ...(mainPrice !== undefined && { price: mainPrice }),
        ...(mainOriginalPrice !== undefined && { originalPrice: mainOriginalPrice }),
        ...(mainDiscount !== undefined && { discount: mainDiscount })
      };

      await firestoreService.update(this.COLLECTION_NAME, id, productToUpdate);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  // Delete product
  static async delete(id: string): Promise<void> {
    try {
      const product = await this.getById(id);
      if (product) {
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

        // Update category product count
        await CategoryService.updateProductCount(product.category, -1);
      }

      await firestoreService.delete(this.COLLECTION_NAME, id);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Search products
  static async search(query: string): Promise<Product[]> {
    try {
      // Note: Firestore doesn't support native text search
      // This is a simple implementation that filters on the client side
      // For production, consider using Algolia or Elasticsearch
      const allProducts = await this.getActive();
      const lowercaseQuery = query.toLowerCase();
      
      return allProducts.filter(product => 
        product.name.toLowerCase().includes(lowercaseQuery) ||
        product.description.toLowerCase().includes(lowercaseQuery) ||
        product.categoryName.toLowerCase().includes(lowercaseQuery)
      );
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  // Update product stock
  static async updateStock(id: string, stockChange: number): Promise<void> {
    try {
      const product = await this.getById(id);
      if (product) {
        const newStock = Math.max(0, product.stock + stockChange);
        await firestoreService.update(this.COLLECTION_NAME, id, {
          stock: newStock
        });
      }
    } catch (error) {
      console.error('Error updating product stock:', error);
      throw error;
    }
  }
}

// Create default export instance
const productService = new ProductService();
export default productService;