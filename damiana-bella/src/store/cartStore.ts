import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '../types/product';

export type UnitVariants = { [key: string]: string };

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CheckoutItem {
  product: Product;
  quantity: number;
  unitVariants: UnitVariants[];
  unitPrice: number;
  totalPrice: number;
}

interface CartState {
  items: CartItem[];
  item: CheckoutItem | null;
  addItem: (product: Product, qty?: number) => void;
  removeItem: (productId: string | number) => void;
  updateQuantity: (productId: string | number, delta: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  setItem: (item: CheckoutItem | null) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      item: null,

      setItem: (item) => set({ item }),

      addItem: (product, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: i.quantity + qty }
                  : i
              ),
            };
          }
          return { items: [...state.items, { product, quantity: qty }] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        })),

      updateQuantity: (productId, delta) =>
        set((state) => {
          const updated = state.items
            .map((i) =>
              i.product.id === productId
                ? { ...i, quantity: i.quantity + delta }
                : i
            )
            .filter((i) => i.quantity > 0);
          return { items: updated };
        }),

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'damiana-bella-cart' }
  )
);
