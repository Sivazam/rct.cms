import { firestoreService } from '@/lib/firebase';

export interface IVariant {
  id?: string;
  productId: string;
  label: 'Regular' | 'Medium' | 'Ultra' | 'Rare';
  price: number;
  sku: string;
  inventory: number;
  discount: number;
  isDefault: boolean;
  createdAt?: any;
  updatedAt?: any;
}

class VariantService {
  private collection = 'variants';

  // Create a new variant
  async createVariant(variantData: Omit<IVariant, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      return await firestoreService.create(this.collection, variantData);
    } catch (error) {
      console.error('Error creating variant:', error);
      throw error;
    }
  }

  // Get variant by ID
  async getVariantById(id: string): Promise<IVariant | null> {
    try {
      return await firestoreService.getById(this.collection, id);
    } catch (error) {
      console.error('Error getting variant:', error);
      throw error;
    }
  }

  // Get variants by product ID
  async getVariantsByProductId(productId: string): Promise<IVariant[]> {
    try {
      return await firestoreService.getAll(this.collection, {
        where: { field: 'productId', operator: '==', value: productId }
        // Removed orderBy to avoid index requirement
      });
    } catch (error) {
      console.error('Error getting variants by product:', error);
      throw error;
    }
  }

  // Get default variant for product
  async getDefaultVariant(productId: string): Promise<IVariant | null> {
    try {
      // First get all variants for the product
      const variants = await firestoreService.getAll(this.collection, {
        where: { field: 'productId', operator: '==', value: productId }
      });
      
      // Then filter for default variant
      const defaultVariant = variants.find(v => v.isDefault);
      return defaultVariant || null;
    } catch (error) {
      console.error('Error getting default variant:', error);
      throw error;
    }
  }

  // Get all variants
  async getAllVariants(): Promise<IVariant[]> {
    try {
      return await firestoreService.getAll(this.collection);
    } catch (error) {
      console.error('Error getting all variants:', error);
      throw error;
    }
  }

  // Update variant
  async updateVariant(id: string, updateData: Partial<IVariant>): Promise<void> {
    try {
      await firestoreService.update(this.collection, id, updateData);
    } catch (error) {
      console.error('Error updating variant:', error);
      throw error;
    }
  }

  // Delete variant
  async deleteVariant(id: string): Promise<void> {
    try {
      await firestoreService.delete(this.collection, id);
    } catch (error) {
      console.error('Error deleting variant:', error);
      throw error;
    }
  }

  // Update inventory
  async updateInventory(id: string, quantity: number): Promise<void> {
    try {
      await this.updateVariant(id, { inventory: quantity });
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  }

  // Check if SKU exists
  async skuExists(sku: string, excludeId?: string): Promise<boolean> {
    try {
      const variants = await firestoreService.getAll(this.collection, {
        where: { field: 'sku', operator: '==', value: sku }
      });
      
      if (excludeId) {
        return variants.some(variant => variant.id !== excludeId);
      }
      
      return variants.length > 0;
    } catch (error) {
      console.error('Error checking SKU existence:', error);
      throw error;
    }
  }

  // Get variants with low inventory
  async getLowInventoryVariants(threshold: number = 10): Promise<IVariant[]> {
    try {
      const variants = await this.getAllVariants();
      return variants.filter(variant => variant.inventory <= threshold);
    } catch (error) {
      console.error('Error getting low inventory variants:', error);
      throw error;
    }
  }
}

export const variantService = new VariantService();
export default variantService;
export { VariantService };