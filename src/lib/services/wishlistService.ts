import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { db as firestoreDb } from '@/lib/firebase';
import { firestoreService } from '@/lib/firebase';
import { isUserAuthenticated, getCurrentUser } from '@/lib/auth';

export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  deity: string;
  categoryName: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  hasVariants?: boolean;
  variants?: Array<{
    id: string;
    name?: string;
    label?: string;
    price: number;
    originalPrice?: number;
    discount: number;
    stock: number;
    sku: string;
  }>;
  addedAt: string;
}

class WishlistService {
  private readonly LOCAL_STORAGE_KEY = 'sanathan-wishlist';

  // Get user document ID (now just returns the phone number)
  private async getUserDocumentId(): Promise<string | null> {
    try {
      const user = getCurrentUser();
      if (!user) return null;
      
      // Return the phone number directly since it's now the document ID
      return user.phoneNumber;
    } catch (error) {
      console.error('Error getting user document ID:', error);
      return null;
    }
  }

  // Get wishlist for current user
  async getWishlist(): Promise<WishlistItem[]> {
    if (isUserAuthenticated()) {
      return this.getFirestoreWishlist();
    } else {
      return this.getLocalWishlist();
    }
  }

  // Get wishlist from Firestore for authenticated users
  private async getFirestoreWishlist(): Promise<WishlistItem[]> {
    try {
      const user = getCurrentUser();
      if (!user) return [];

      // Get the user document using phone number as document ID
      const userDocId = user.phoneNumber;
      if (!userDocId) return [];

      const userDoc = await getDoc(doc(firestoreDb, 'users', userDocId));
      if (!userDoc.exists()) return [];

      const userData = userDoc.data();
      return userData.wishlist || [];
    } catch (error) {
      console.error('Error getting Firestore wishlist:', error);
      return [];
    }
  }

  // Get wishlist from localStorage for guests
  private getLocalWishlist(): WishlistItem[] {
    try {
      // Check if we're on the server side
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        console.log('localStorage not available on server side, returning empty wishlist');
        return [];
      }
      
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting local wishlist:', error);
      return [];
    }
  }

  // Add item to wishlist
  async addToWishlist(item: Omit<WishlistItem, 'id' | 'addedAt'>): Promise<void> {
    // Check if item already exists in wishlist to prevent duplicates
    const existingWishlist = await this.getWishlist();
    const alreadyExists = existingWishlist.some(wishlistItem => wishlistItem.productId === item.productId);
    
    if (alreadyExists) {
      console.log('Item already exists in wishlist, skipping duplicate addition');
      return; // Don't add duplicates
    }
    
    const wishlistItem: WishlistItem = {
      ...item,
      id: this.generateId(),
      addedAt: new Date().toISOString(),
    };

    if (isUserAuthenticated()) {
      await this.addToFirestoreWishlist(wishlistItem);
    } else {
      this.addToLocalWishlist(wishlistItem);
    }

    // Trigger wishlist change event
    this.triggerWishlistChangeEvent();
  }

  // Add item to Firestore wishlist
  private async addToFirestoreWishlist(item: WishlistItem): Promise<void> {
    try {
      const user = getCurrentUser();
      if (!user) return;

      // Get the user document using phone number as document ID
      const userDocId = user.phoneNumber;
      if (!userDocId) {
        console.error('User phone number not found');
        return;
      }

      // Clean the item by removing undefined values that Firebase doesn't accept
      const cleanItem = {
        id: item.id,
        productId: item.productId,
        name: item.name,
        deity: item.deity,
        categoryName: item.categoryName,
        price: item.price,
        image: item.image,
        addedAt: item.addedAt,
        // Only include optional fields if they have values
        ...(item.originalPrice !== undefined && { originalPrice: item.originalPrice }),
        ...(item.badge !== undefined && { badge: item.badge }),
        ...(item.hasVariants !== undefined && { hasVariants: item.hasVariants }),
        ...(item.variants !== undefined && { variants: item.variants }),
      };

      const userRef = doc(firestoreDb, 'users', userDocId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // This should not happen since user should be logged in, but handle it
        console.error('User document does not exist:', userDocId);
        return;
      } else {
        // Update existing document
        await updateDoc(userRef, {
          wishlist: arrayUnion(cleanItem),
        });
      }
    } catch (error) {
      console.error('Error adding to Firestore wishlist:', error);
      throw error;
    }
  }

  // Add item to localStorage wishlist
  private addToLocalWishlist(item: WishlistItem): void {
    try {
      // Check if we're on the server side
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        console.log('localStorage not available on server side, skipping local wishlist addition');
        return;
      }
      
      const wishlist = this.getLocalWishlist();
      wishlist.push(item);
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (error) {
      console.error('Error adding to local wishlist:', error);
      throw error;
    }
  }

  // Remove item from wishlist by product ID
  async removeFromWishlistByProductId(productId: string): Promise<void> {
    if (isUserAuthenticated()) {
      await this.removeFromFirestoreWishlistByProductId(productId);
    } else {
      await this.removeFromLocalWishlistByProductId(productId);
    }

    // Trigger wishlist change event
    this.triggerWishlistChangeEvent();
  }

  // Remove item from Firestore wishlist by product ID
  private async removeFromFirestoreWishlistByProductId(productId: string): Promise<void> {
    try {
      const user = getCurrentUser();
      if (!user) return;

      // Get the user document using phone number as document ID
      const userDocId = user.phoneNumber;
      if (!userDocId) {
        console.error('User phone number not found');
        return;
      }

      const wishlist = await this.getFirestoreWishlist();
      const itemToRemove = wishlist.find(item => item.productId === productId);
      
      if (itemToRemove) {
        // Clean the item by removing undefined values that Firebase doesn't accept
        const cleanItem = {
          id: itemToRemove.id,
          productId: itemToRemove.productId,
          name: itemToRemove.name,
          deity: itemToRemove.deity,
          categoryName: itemToRemove.categoryName,
          price: itemToRemove.price,
          image: itemToRemove.image,
          addedAt: itemToRemove.addedAt,
          // Only include optional fields if they have values
          ...(itemToRemove.originalPrice !== undefined && { originalPrice: itemToRemove.originalPrice }),
          ...(itemToRemove.badge !== undefined && { badge: itemToRemove.badge }),
          ...(itemToRemove.hasVariants !== undefined && { hasVariants: itemToRemove.hasVariants }),
          ...(itemToRemove.variants !== undefined && { variants: itemToRemove.variants }),
        };
        
        const userRef = doc(firestoreDb, 'users', userDocId);
        await updateDoc(userRef, {
          wishlist: arrayRemove(cleanItem),
        });
      }
    } catch (error) {
      console.error('Error removing from Firestore wishlist by product ID:', error);
      throw error;
    }
  }

  // Remove item from localStorage wishlist by product ID
  private async removeFromLocalWishlistByProductId(productId: string): Promise<void> {
    try {
      // Check if we're on the server side
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        console.log('localStorage not available on server side, skipping local wishlist removal');
        return;
      }
      
      const wishlist = this.getLocalWishlist();
      const updatedWishlist = wishlist.filter(item => item.productId !== productId);
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(updatedWishlist));
    } catch (error) {
      console.error('Error removing from local wishlist by product ID:', error);
      throw error;
    }
  }

  // Remove item from Firestore wishlist
  private async removeFromFirestoreWishlist(itemId: string): Promise<void> {
    try {
      const user = getCurrentUser();
      if (!user) return;

      // Get the user document using phone number as document ID
      const userDocId = user.phoneNumber;
      if (!userDocId) {
        console.error('User phone number not found');
        return;
      }

      const wishlist = await this.getFirestoreWishlist();
      const itemToRemove = wishlist.find(item => item.id === itemId);
      
      if (itemToRemove) {
        // Clean the item by removing undefined values that Firebase doesn't accept
        const cleanItem = {
          id: itemToRemove.id,
          productId: itemToRemove.productId,
          name: itemToRemove.name,
          deity: itemToRemove.deity,
          categoryName: itemToRemove.categoryName,
          price: itemToRemove.price,
          image: itemToRemove.image,
          addedAt: itemToRemove.addedAt,
          // Only include optional fields if they have values
          ...(itemToRemove.originalPrice !== undefined && { originalPrice: itemToRemove.originalPrice }),
          ...(itemToRemove.badge !== undefined && { badge: itemToRemove.badge }),
          ...(itemToRemove.hasVariants !== undefined && { hasVariants: itemToRemove.hasVariants }),
          ...(itemToRemove.variants !== undefined && { variants: itemToRemove.variants }),
        };
        
        const userRef = doc(firestoreDb, 'users', userDocId);
        await updateDoc(userRef, {
          wishlist: arrayRemove(cleanItem),
        });
      }
    } catch (error) {
      console.error('Error removing from Firestore wishlist:', error);
      throw error;
    }
  }

  // Remove item from localStorage wishlist
  private removeFromLocalWishlist(itemId: string): void {
    try {
      // Check if we're on the server side
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        console.log('localStorage not available on server side, skipping local wishlist removal');
        return;
      }
      
      const wishlist = this.getLocalWishlist();
      const updatedWishlist = wishlist.filter(item => item.id !== itemId);
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(updatedWishlist));
    } catch (error) {
      console.error('Error removing from local wishlist:', error);
      throw error;
    }
  }

  // Check if item is in wishlist
  async isInWishlist(productId: string): Promise<boolean> {
    const wishlist = await this.getWishlist();
    return wishlist.some(item => item.productId === productId);
  }

  // Get wishlist count
  async getWishlistCount(): Promise<number> {
    const wishlist = await this.getWishlist();
    return wishlist.length;
  }

  // Clear wishlist
  async clearWishlist(): Promise<void> {
    if (isUserAuthenticated()) {
      await this.clearFirestoreWishlist();
    } else {
      this.clearLocalWishlist();
    }
  }

  // Clear Firestore wishlist
  private async clearFirestoreWishlist(): Promise<void> {
    try {
      const user = getCurrentUser();
      if (!user) return;

      // Get the user document using phone number as document ID
      const userDocId = user.phoneNumber;
      if (!userDocId) {
        console.error('User phone number not found');
        return;
      }

      const userRef = doc(firestoreDb, 'users', userDocId);
      await updateDoc(userRef, {
        wishlist: [],
      });
    } catch (error) {
      console.error('Error clearing Firestore wishlist:', error);
      throw error;
    }
  }

  // Clear localStorage wishlist
  private clearLocalWishlist(): void {
    try {
      // Check if we're on the server side
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        console.log('localStorage not available on server side, skipping local wishlist clearing');
        return;
      }
      
      localStorage.removeItem(this.LOCAL_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing local wishlist:', error);
      throw error;
    }
  }

  // Merge local wishlist with Firestore when user logs in
  async mergeLocalWishlist(): Promise<void> {
    if (!isUserAuthenticated()) return;

    try {
      const localWishlist = this.getLocalWishlist();
      if (localWishlist.length === 0) return;

      const user = getCurrentUser();
      if (!user) return;

      // Get the user document using phone number as document ID
      const userDocId = user.phoneNumber;
      if (!userDocId) {
        console.error('User phone number not found');
        return;
      }

      const userRef = doc(firestoreDb, 'users', userDocId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // This should not happen since user should be logged in, but handle it
        console.error('User document does not exist:', userDocId);
        return;
      } else {
        // Merge with existing wishlist
        const existingWishlist = userDoc.data().wishlist || [];
        const mergedWishlist = [...existingWishlist];
        
        // Add items that don't already exist (based on productId)
        for (const localItem of localWishlist) {
          if (!mergedWishlist.some(item => item.productId === localItem.productId)) {
            mergedWishlist.push(localItem);
          }
        }

        await updateDoc(userRef, {
          wishlist: mergedWishlist,
        });
      }

      // Clear local wishlist after successful merge
      this.clearLocalWishlist();
    } catch (error) {
      console.error('Error merging local wishlist:', error);
      throw error;
    }
  }

  // Subscribe to wishlist changes (for real-time updates)
  subscribeToWishlist(callback: (wishlist: WishlistItem[]) => void): () => void {
    if (!isUserAuthenticated()) {
      // For guests, we can't subscribe to real-time changes
      // Return a dummy unsubscribe function
      return () => {};
    }

    try {
      const user = getCurrentUser();
      if (!user) return () => {};

      // Get the user document using phone number as document ID
      const userDocId = user.phoneNumber;
      if (!userDocId) {
        console.error('User phone number not found');
        return () => {};
      }

      const userRef = doc(firestoreDb, 'users', userDocId);
      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const wishlist = doc.data().wishlist || [];
          callback(wishlist);
        } else {
          callback([]);
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to wishlist:', error);
      return () => {};
    }
  }

  // Generate unique ID for wishlist items
  private generateId(): string {
    return `wishlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Trigger wishlist change event for real-time updates
  private triggerWishlistChangeEvent(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('wishlist-changed'));
    }
  }
}

export const wishlistService = new WishlistService();