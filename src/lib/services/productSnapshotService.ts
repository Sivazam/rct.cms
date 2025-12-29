import { IProduct } from './productService';

export interface IProductSnapshot {
  id: string;
  productId: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  spiritualMeaning: string;
  deity: string;
  images: string[];
  metadata: {
    origin: string;
    material: string;
  };
  price: number;
  originalPrice?: number;
  status: 'active' | 'inactive';
  snapshotTimestamp: number;
  expiresAt?: number; // For payment freeze
}

class ProductSnapshotService {
  private snapshots = new Map<string, IProductSnapshot>();
  private paymentFreezeActive = false;

  // Create a snapshot of a product
  createProductSnapshot(product: IProduct, price: number, originalPrice?: number): IProductSnapshot {
    const snapshot: IProductSnapshot = {
      id: `snapshot-${product.id}-${Date.now()}`,
      productId: product.id || '',
      name: product.name,
      slug: product.slug,
      category: product.category,
      description: product.description,
      spiritualMeaning: product.spiritualMeaning,
      deity: product.deity,
      images: [...product.images],
      metadata: { ...product.metadata },
      price,
      originalPrice,
      status: product.status,
      snapshotTimestamp: Date.now()
    };

    this.snapshots.set(snapshot.id, snapshot);
    console.log(`Product snapshot created: ${snapshot.id} for product: ${product.name}`);
    return snapshot;
  }

  // Get a snapshot by ID
  getSnapshot(snapshotId: string): IProductSnapshot | null {
    return this.snapshots.get(snapshotId) || null;
  }

  // Get all active snapshots
  getAllSnapshots(): IProductSnapshot[] {
    return Array.from(this.snapshots.values());
  }

  // Update snapshot price (only allowed if not in payment freeze)
  updateSnapshotPrice(snapshotId: string, newPrice: number): boolean {
    if (this.paymentFreezeActive) {
      console.log('Cannot update snapshot price: Payment freeze is active');
      return false;
    }

    const snapshot = this.snapshots.get(snapshotId);
    if (snapshot) {
      snapshot.price = newPrice;
      snapshot.snapshotTimestamp = Date.now();
      console.log(`Snapshot price updated: ${snapshotId} to ${newPrice}`);
      return true;
    }
    return false;
  }

  // Remove a snapshot
  removeSnapshot(snapshotId: string): boolean {
    return this.snapshots.delete(snapshotId);
  }

  // Clear all snapshots
  clearAllSnapshots(): void {
    this.snapshots.clear();
    console.log('All product snapshots cleared');
  }

  // Activate payment freeze (stops all price updates)
  activatePaymentFreeze(duration: number = 5 * 60 * 1000): void {
    this.paymentFreezeActive = true;
    const expiresAt = Date.now() + duration;
    
    console.log(`Payment freeze activated for ${duration / 1000 / 60} minutes`);
    
    // Auto-deactivate after duration
    setTimeout(() => {
      this.deactivatePaymentFreeze();
    }, duration);
  }

  // Deactivate payment freeze
  deactivatePaymentFreeze(): void {
    this.paymentFreezeActive = false;
    console.log('Payment freeze deactivated');
  }

  // Check if payment freeze is active
  isPaymentFreezeActive(): boolean {
    return this.paymentFreezeActive;
  }

  // Clean up expired snapshots (older than 24 hours)
  cleanupExpiredSnapshots(): void {
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    for (const [id, snapshot] of this.snapshots.entries()) {
      if (now - snapshot.snapshotTimestamp > twentyFourHours) {
        this.snapshots.delete(id);
        console.log(`Expired snapshot removed: ${id}`);
      }
    }
  }

  // Get snapshot info for logging/debugging
  getSnapshotInfo(): { total: number; paymentFreeze: boolean; snapshots: Array<{ id: string; productId: string; age: number }> } {
    const now = Date.now();
    const snapshotInfo = Array.from(this.snapshots.values()).map(snapshot => ({
      id: snapshot.id,
      productId: snapshot.productId,
      age: now - snapshot.snapshotTimestamp
    }));

    return {
      total: this.snapshots.size,
      paymentFreeze: this.paymentFreezeActive,
      snapshots: snapshotInfo
    };
  }
}

// Export singleton instance
export const productSnapshotService = new ProductSnapshotService();
export default productSnapshotService;