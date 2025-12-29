import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  deity: string;
  image: string;
  variant: {
    label: string;
    price: number;
    sku: string;
    discount: number;
  };
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getDiscount: () => number;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  freezeCartForPayment: () => void;
  unfreezeCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(
          (i) => i.productId === item.productId && i.variant.label === item.variant.label
        );

        if (existingItem) {
          const updatedItems = currentItems.map((i) =>
            i.productId === item.productId && i.variant.label === item.variant.label
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
          set({ items: updatedItems });
        } else {
          const newItems = [...currentItems, { ...item, id: Date.now().toString(), quantity: 1, variantId: item.variant.label }];
          set({ items: newItems });
        }
        
        // Note: Removed automatic cart opening to prevent race conditions
        // Cart should be opened explicitly by the calling component
      },

      removeItem: (id) => {
        const currentItems = get().items;
        const newItems = currentItems.filter((item) => item.id !== id);
        set({ items: newItems });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
        } else {
          const currentItems = get().items;
          const updatedItems = currentItems.map((item) =>
            item.id === id ? { ...item, quantity } : item
          );
          set({ items: updatedItems });
        }
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const price = item.variant.price - (item.variant.price * item.variant.discount) / 100;
          return total + price * item.quantity;
        }, 0);
      },

      getDiscount: () => {
        return get().items.reduce((total, item) => {
          const discountAmount = (item.variant.price * item.variant.discount) / 100;
          return total + discountAmount * item.quantity;
        }, 0);
      },

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    openCart: () => set({ isOpen: true }),
    closeCart: () => set({ isOpen: false }),
      freezeCartForPayment: () => {
        // This function is used to prevent cart modifications during payment
        // In a real implementation, you might want to add a flag or lock the cart
      },
      unfreezeCart: () => {
        // This function is used to allow cart modifications after payment process
      },
    }),
    {
    name: 'cart-storage',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ 
      items: state.items,
    }),
  }
  )
);