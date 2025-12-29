import { firestoreService } from '@/lib/firebase';

export interface IBanner {
  id?: string;
  title: string;
  description: string;
  imageUrl: string;
  categoryLink?: string;
  altText: string;
  isActive: boolean;
  order: number;
  createdAt?: any;
  updatedAt?: any;
}

class BannerService {
  private collection = 'banners';

  // Create a new banner
  async createBanner(bannerData: Omit<IBanner, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('BannerService: Creating banner:', bannerData.title);
      
      const bannerToCreate = {
        ...bannerData,
        createdAt: new Date().toISOString()
      };

      const bannerId = await firestoreService.create(this.collection, bannerToCreate);
      console.log('BannerService: Banner created with ID:', bannerId);
      return bannerId;
    } catch (error) {
      console.error('BannerService: Error creating banner:', error);
      throw new Error(`Failed to create banner: ${(error as any).message || 'Unknown error'}`);
    }
  }

  // Get all banners
  async getAllBanners(): Promise<IBanner[]> {
    try {
      const banners = await firestoreService.getAll(this.collection, {
        orderBy: { field: 'order', direction: 'asc' }
      });
      return banners;
    } catch (error) {
      console.error('Error getting all banners:', error);
      throw error;
    }
  }

  // Get active banners (for homepage)
  async getActiveBanners(): Promise<IBanner[]> {
    try {
      const banners = await firestoreService.getAll(this.collection, {
        where: { field: 'isActive', operator: '==', value: true },
        orderBy: { field: 'order', direction: 'asc' }
      });
      return banners;
    } catch (error) {
      console.error('Error getting active banners:', error);
      throw error;
    }
  }

  // Get banner by ID
  async getBannerById(id: string): Promise<IBanner | null> {
    try {
      return await firestoreService.getById(this.collection, id);
    } catch (error) {
      console.error('Error getting banner:', error);
      throw error;
    }
  }

  // Update banner
  async updateBanner(id: string, updateData: Partial<IBanner>): Promise<void> {
    try {
      await firestoreService.update(this.collection, id, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating banner:', error);
      throw error;
    }
  }

  // Delete banner
  async deleteBanner(id: string): Promise<void> {
    try {
      await firestoreService.delete(this.collection, id);
    } catch (error) {
      console.error('Error deleting banner:', error);
      throw error;
    }
  }

  // Reorder banners
  async reorderBanners(bannerUpdates: Array<{ id: string; order: number }>): Promise<void> {
    try {
      await Promise.all(
        bannerUpdates.map(({ id, order }) =>
          this.updateBanner(id, { order })
        )
      );
    } catch (error) {
      console.error('Error reordering banners:', error);
      throw error;
    }
  }

  // Toggle banner active status
  async toggleBannerStatus(id: string, isActive: boolean): Promise<void> {
    try {
      await this.updateBanner(id, { isActive });
    } catch (error) {
      console.error('Error toggling banner status:', error);
      throw error;
    }
  }
}

export const bannerService = new BannerService();
export default bannerService;