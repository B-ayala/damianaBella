import { create } from 'zustand';
import type { Product } from '../types/product';

export interface UnitVariants {
  [variantName: string]: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitVariants: UnitVariants[]; // one entry per unit, length === quantity
  unitPrice: number;            // price after discount
  totalPrice: number;           // unitPrice * quantity
}

interface CartStore {
  item: CartItem | null;
  setItem: (item: CartItem) => void;
  clearItem: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  item: null,
  setItem: (item) => set({ item }),
  clearItem: () => set({ item: null }),
}));
