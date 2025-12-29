import { firestoreService } from '@/lib/firebase';

export interface IDiscount {
  id?: string;
  code: string;
  type: 'percentage' | 'fixed';
  amount: number;
  expiry: Date;
  usageLimit: number;
  usedCount: number;
  createdAt?: any;
  updatedAt?: any;
}

class DiscountService {
  private collection = 'discounts';

  // Create a new discount
  async createDiscount(discountData: Omit<IDiscount, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const dataToCreate = {
        ...discountData,
        expiry: discountData.expiry.toISOString(),
        code: discountData.code.toUpperCase()
      };
      
      return await firestoreService.create(this.collection, dataToCreate);
    } catch (error) {
      console.error('Error creating discount:', error);
      throw error;
    }
  }

  // Get discount by ID
  async getDiscountById(id: string): Promise<IDiscount | null> {
    try {
      const discount = await firestoreService.getById(this.collection, id);
      if (discount) {
        return {
          ...discount,
          expiry: new Date(discount.expiry)
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting discount:', error);
      throw error;
    }
  }

  // Get discount by code
  async getDiscountByCode(code: string): Promise<IDiscount | null> {
    try {
      const discounts = await firestoreService.getAll(this.collection, {
        where: { field: 'code', operator: '==', value: code.toUpperCase() }
      });
      
      if (discounts.length > 0) {
        const discount = discounts[0];
        return {
          ...discount,
          expiry: new Date(discount.expiry)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting discount by code:', error);
      throw error;
    }
  }

  // Get all discounts
  async getAllDiscounts(): Promise<IDiscount[]> {
    try {
      const discounts = await firestoreService.getAll(this.collection, {
        orderBy: { field: 'createdAt', direction: 'desc' }
      });
      
      return discounts.map(discount => ({
        ...discount,
        expiry: new Date(discount.expiry)
      }));
    } catch (error) {
      console.error('Error getting all discounts:', error);
      throw error;
    }
  }

  // Get active discounts
  async getActiveDiscounts(): Promise<IDiscount[]> {
    try {
      const now = new Date().toISOString();
      const discounts = await firestoreService.getAll(this.collection, {
        where: { field: 'expiry', operator: '>', value: now }
      });
      
      return discounts
        .filter(discount => discount.usedCount < discount.usageLimit)
        .map(discount => ({
          ...discount,
          expiry: new Date(discount.expiry)
        }));
    } catch (error) {
      console.error('Error getting active discounts:', error);
      throw error;
    }
  }

  // Update discount
  async updateDiscount(id: string, updateData: Partial<IDiscount>): Promise<void> {
    try {
      const dataToUpdate = { ...updateData };
      if (updateData.expiry) {
        dataToUpdate.expiry = updateData.expiry.toISOString();
      }
      if (updateData.code) {
        dataToUpdate.code = updateData.code.toUpperCase();
      }
      
      await firestoreService.update(this.collection, id, dataToUpdate);
    } catch (error) {
      console.error('Error updating discount:', error);
      throw error;
    }
  }

  // Delete discount
  async deleteDiscount(id: string): Promise<void> {
    try {
      await firestoreService.delete(this.collection, id);
    } catch (error) {
      console.error('Error deleting discount:', error);
      throw error;
    }
  }

  // Validate discount code
  async validateDiscountCode(code: string): Promise<{
    valid: boolean;
    discount?: IDiscount;
    error?: string;
  }> {
    try {
      const discount = await this.getDiscountByCode(code);
      
      if (!discount) {
        return { valid: false, error: 'Discount code not found' };
      }
      
      const now = new Date();
      if (discount.expiry < now) {
        return { valid: false, error: 'Discount code has expired' };
      }
      
      if (discount.usedCount >= discount.usageLimit) {
        return { valid: false, error: 'Discount code usage limit reached' };
      }
      
      return { valid: true, discount };
    } catch (error) {
      console.error('Error validating discount code:', error);
      return { valid: false, error: 'Failed to validate discount code' };
    }
  }

  // Use discount code (increment usage count)
  async useDiscountCode(code: string): Promise<void> {
    try {
      const discount = await this.getDiscountByCode(code);
      if (!discount) {
        throw new Error('Discount code not found');
      }
      
      if (discount.usedCount >= discount.usageLimit) {
        throw new Error('Discount code usage limit reached');
      }
      
      await this.updateDiscount(discount.id!, { usedCount: discount.usedCount + 1 });
    } catch (error) {
      console.error('Error using discount code:', error);
      throw error;
    }
  }

  // Calculate discount amount
  async calculateDiscountAmount(code: string, subtotal: number): Promise<{
    discountAmount: number;
    finalAmount: number;
    valid: boolean;
    error?: string;
  }> {
    try {
      const validation = await this.validateDiscountCode(code);
      
      if (!validation.valid) {
        return {
          discountAmount: 0,
          finalAmount: subtotal,
          valid: false,
          error: validation.error
        };
      }
      
      const discount = validation.discount!;
      let discountAmount = 0;
      
      if (discount.type === 'percentage') {
        discountAmount = (subtotal * discount.amount) / 100;
      } else {
        discountAmount = Math.min(discount.amount, subtotal);
      }
      
      const finalAmount = Math.max(0, subtotal - discountAmount);
      
      return {
        discountAmount,
        finalAmount,
        valid: true
      };
    } catch (error) {
      console.error('Error calculating discount amount:', error);
      return {
        discountAmount: 0,
        finalAmount: subtotal,
        valid: false,
        error: 'Failed to calculate discount'
      };
    }
  }
}

export const discountService = new DiscountService();
export default discountService;