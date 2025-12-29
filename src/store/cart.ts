import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { productSnapshotService } from '@/lib/services/productSnapshotService';

interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  snapshotId: string; // Reference to the product snapshot
  name: string;
  variantLabel: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  sku: string;
  isFrozen?: boolean; // Indicates if this item is frozen during payment
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id' | 'snapshotId'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  freezeCartForPayment: () => void; // Freeze all items in cart for payment
  unfreezeCart: () => void; // Unfreeze cart after payment
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getOriginalTotalPrice: () => number;
  getDiscount: () => number;
  isCartFrozen: () => boolean;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find(
            (i) => i.productId === item.productId && i.variantId === item.variantId
          );

          if (existingItem) {
            // Update existing item quantity
            const updatedItems = state.items.map((i) =>
              i.productId === item.productId && i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            );
            return { items: updatedItems };
          } else {
            // Create new item with snapshot
            const snapshot = productSnapshotService.createProductSnapshot(
              {
                id: item.productId,
                name: item.name,
                slug: '', // Will be filled by actual product data
                category: '',
                description: '',
                spiritualMeaning: '',
                deity: '',
                images: [item.image],
                metadata: { origin: '', material: '' },
                status: 'active'
              },
              item.price,
              item.originalPrice
            );

            const newItem: CartItem = {
              ...item,
              id: `${item.productId}-${item.variantId}`,
              snapshotId: snapshot.id,
              isFrozen: false
            };

            return {
              items: [...state.items, newItem],
            };
          }
        });
      },

      removeItem: (id) => {
        set((state) => {
          const itemToRemove = state.items.find(item => item.id === id);
          if (itemToRemove) {
            // Remove the associated snapshot
            productSnapshotService.removeSnapshot(itemToRemove.snapshotId);
          }
          
          return {
            items: state.items.filter((item) => item.id !== id),
          };
        });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => {
        // Clear all associated snapshots
        const snapshotIds = get().items.map(item => item.snapshotId);
        snapshotIds.forEach(snapshotId => {
          productSnapshotService.removeSnapshot(snapshotId);
        });
        
        set({ items: [] });
      },

      freezeCartForPayment: () => {
        // Activate payment freeze in snapshot service
        productSnapshotService.activatePaymentFreeze();
        
        // Mark all cart items as frozen
        set((state) => ({
          items: state.items.map((item) => ({
            ...item,
            isFrozen: true
          })),
        }));
        
        console.log('Cart frozen for payment');
      },

      unfreezeCart: () => {
        // Deactivate payment freeze
        productSnapshotService.deactivatePaymentFreeze();
        
        // Unmark all cart items as frozen
        set((state) => ({
          items: state.items.map((item) => ({
            ...item,
            isFrozen: false
          })),
        }));
        
        console.log('Cart unfrozen after payment');
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          // Use frozen price if available, otherwise use current price
          const price = item.isFrozen ? item.price : item.price;
          return total + price * item.quantity;
        }, 0);
      },

      getOriginalTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const originalPrice = item.originalPrice || item.price;
          return total + originalPrice * item.quantity;
        }, 0);
      },

      getDiscount: () => {
        const originalTotal = get().getOriginalTotalPrice();
        const currentTotal = get().getTotalPrice();
        return originalTotal - currentTotal;
      },

      isCartFrozen: () => {
        return get().items.some(item => item.isFrozen) || productSnapshotService.isPaymentFreezeActive();
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);