import { firestoreService, storageService } from '@/lib/firebase';

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  productCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  order?: number;
}

export class CategoryService {
  private static readonly COLLECTION_NAME = 'categories';

  // Get all categories
  static async getAll(): Promise<Category[]> {
    try {
      const categories = await firestoreService.getAll(this.COLLECTION_NAME);
      // Add default order field if it doesn't exist and sort by it
      const categoriesWithOrder = categories.map((cat: any, index) => ({
        ...cat,
        order: cat.order || index + 1
      }));
      // Sort by order field
      return categoriesWithOrder.sort((a, b) => a.order - b.order) as Category[];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // Get category by ID
  static async getById(id: string): Promise<Category | null> {
    try {
      const category = await firestoreService.getById(this.COLLECTION_NAME, id);
      return category as Category;
    } catch (error) {
      console.error('Error fetching category:', error);
      return null;
    }
  }

  // Create new category
  static async create(categoryData: Omit<Category, 'id' | 'createdAt' | 'productCount' | 'order'>, imageFile?: File): Promise<string> {
    try {
      let imageUrl = categoryData.image;
      
      // Upload image to Firebase Storage if provided
      if (imageFile) {
        const fileExtension = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_category.${fileExtension}`;
        imageUrl = await storageService.uploadFile(imageFile, `categories/${fileName}`);
      }

      // Get current categories count to set default order
      const currentCategories = await this.getAll();
      const defaultOrder = currentCategories.length > 0 ? Math.max(...currentCategories.map(c => c.order)) + 1 : 1;

      const categoryToCreate = {
        ...categoryData,
        image: imageUrl,
        productCount: 0,
        order: defaultOrder
      };

      const categoryId = await firestoreService.create(this.COLLECTION_NAME, categoryToCreate);
      return categoryId;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  // Update category
  static async update(id: string, categoryData: Partial<Category>, imageFile?: File): Promise<void> {
    try {
      let imageUrl = categoryData.image;
      
      // Upload new image to Firebase Storage if provided
      if (imageFile) {
        const fileExtension = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_category.${fileExtension}`;
        imageUrl = await storageService.uploadFile(imageFile, `categories/${fileName}`);
      }

      const categoryToUpdate = {
        ...categoryData,
        ...(imageUrl && { image: imageUrl })
      };

      await firestoreService.update(this.COLLECTION_NAME, id, categoryToUpdate);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  // Delete category
  static async delete(id: string): Promise<void> {
    try {
      // Get category to check for image deletion
      const category = await this.getById(id);
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

      await firestoreService.delete(this.COLLECTION_NAME, id);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // Update product count for category
  static async updateProductCount(categoryId: string, increment: number): Promise<void> {
    try {
      const category = await this.getById(categoryId);
      if (category) {
        const newProductCount = Math.max(0, category.productCount + increment);
        await firestoreService.update(this.COLLECTION_NAME, categoryId, {
          productCount: newProductCount
        });
      }
    } catch (error) {
      console.error('Error updating category product count:', error);
      throw error;
    }
  }

  // Get active categories only
  static async getActive(): Promise<Category[]> {
    try {
      const categories = await firestoreService.getAll(this.COLLECTION_NAME, {
        where: { field: 'status', operator: '==', value: 'active' }
      });
      // Add default order field if it doesn't exist and sort by it
      const categoriesWithOrder = categories.map((cat: any, index) => ({
        ...cat,
        order: cat.order || index + 1
      }));
      // Sort by order field
      return categoriesWithOrder.sort((a, b) => a.order - b.order) as Category[];
    } catch (error) {
      console.error('Error fetching active categories:', error);
      return [];
    }
  }

  // Update category order
  static async updateOrder(categoryId: string, newOrder: number): Promise<void> {
    try {
      await firestoreService.update(this.COLLECTION_NAME, categoryId, {
        order: newOrder
      });
    } catch (error) {
      console.error('Error updating category order:', error);
      throw error;
    }
  }

  // Reorder categories (update multiple categories at once)
  static async reorderCategories(categoryOrders: { id: string; order: number }[]): Promise<void> {
    try {
      // Update each category's order
      const updatePromises = categoryOrders.map(({ id, order }) =>
        this.updateOrder(id, order)
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error reordering categories:', error);
      throw error;
    }
  }
}

// Create default export instance
const categoryService = new CategoryService();
export default categoryService;